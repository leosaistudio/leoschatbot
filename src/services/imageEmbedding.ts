import { openai } from '@/lib/openai'

/**
 * Generate image embedding using OpenAI Vision to describe and embed.
 * This approach uses text embeddings of image descriptions for matching.
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
    try {
        // First, describe the image using Vision
        const description = await describeImage(imageUrl)

        // Then, generate text embedding of the description
        const embedding = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: description,
        })

        return embedding.data[0].embedding
    } catch (error) {
        console.error('Error generating image embedding:', error)
        throw error
    }
}

/**
 * Describe an image using Vision API
 */
async function describeImage(imageUrl: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `תאר את המוצר בתמונה בפירוט רב ככל האפשר. כלול:
- סוג המוצר (נעליים, שמלה, חולצה וכו')
- צבעים
- חומר/טקסטורה
- סגנון/עיצוב
- מאפיינים בולטים
- פרטים ייחודיים

ענה בעברית בפסקה אחת ברורה.`,
                    },
                    {
                        type: 'image_url',
                        image_url: { url: imageUrl },
                    },
                ],
            },
        ],
        max_tokens: 300,
    })

    return response.choices[0]?.message?.content || ''
}

/**
 * Describe uploaded image (base64 or URL)
 * Enhanced to identify multiple items when present
 */
export async function describeUploadedImage(imageData: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `נתח את התמונה וזהה את כל פריטי הלבוש.

עבור כל פריט שתזהה, ציין:
- סוג (בלייזר, מכנס, חולצה, שמלה וכו')
- צבע מדויק
- חומר/טקסטורה (קטיפה, ג'ינס, סריג וכו')
- סגנון (אלגנטי, ספורטיבי, קז'ואלי)

מקד את התיאור בפריט הבולט ביותר בתמונה.
אם יש מספר פריטים, פרט כל אחד בנפרד.

דוגמה: "בלייזר אפור-שחור עם כפתורי זהב מבד טוויד, מכנס קטיפה שחור ישר"

ענה בעברית, תיאור קצר וממוקד.`,
                    },
                    {
                        type: 'image_url',
                        image_url: { url: imageData },
                    },
                ],
            },
        ],
        max_tokens: 250,
    })

    return response.choices[0]?.message?.content || ''
}

/**
 * Generate embedding for uploaded image
 */
export async function generateUploadedImageEmbedding(imageData: string): Promise<number[]> {
    const description = await describeUploadedImage(imageData)
    console.log('📝 Uploaded image description:', description.slice(0, 100) + '...')

    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: description,
    })

    return embedding.data[0].embedding
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
}

/**
 * Find matching products by image embedding
 */
import { prisma } from '@/lib/db'

export async function findMatchingProducts(
    botId: string,
    uploadedImageData: string,
    limit: number = 5
): Promise<Array<{
    product: {
        id: string
        productId: string
        name: string
        price: string | null
        pageUrl: string
        imageUrl: string
    }
    similarity: number
    matchType: 'exact' | 'similar' | 'none'
}>> {
    // Try Qdrant first for faster vector search
    try {
        const { isQdrantAvailable, searchSimilarProducts, generateUploadedImageEmbeddingForQdrant } = await import('./qdrant')

        if (await isQdrantAvailable()) {
            console.log('🔍 Using Qdrant for image search...')

            // Generate embedding for uploaded image
            const embedding = await generateUploadedImageEmbeddingForQdrant(uploadedImageData)

            // Search in Qdrant
            const qdrantResults = await searchSimilarProducts(botId, embedding, limit)

            if (qdrantResults.length > 0) {
                return qdrantResults.map(r => ({
                    product: {
                        id: r.productId,
                        productId: r.productId,
                        name: r.name,
                        price: r.price,
                        pageUrl: r.pageUrl,
                        imageUrl: r.imageUrl,
                    },
                    similarity: r.similarity,
                    matchType: r.similarity > 0.80 ? 'exact' as const :
                        r.similarity > 0.55 ? 'similar' as const : 'none' as const,
                }))
            }
        }
    } catch (error) {
        console.log('⚠️ Qdrant not available, falling back to SQLite:', error)
    }

    // Fallback to SQLite-based search
    console.log('🔍 Using SQLite for image search...')

    // Generate embedding for uploaded image
    const uploadedEmbedding = await generateUploadedImageEmbedding(uploadedImageData)

    // Get all product images for this bot
    const products = await prisma.productImage.findMany({
        where: { botId },
        select: {
            id: true,
            productId: true,
            name: true,
            price: true,
            pageUrl: true,
            imageUrl: true,
            embedding: true,
        },
    })

    if (products.length === 0) {
        return []
    }

    // Calculate similarity for each product
    const results = products.map((product: { id: string; productId: string; name: string; price: string | null; pageUrl: string; imageUrl: string; embedding: unknown }) => {
        const productEmbedding = product.embedding as number[]
        const similarity = cosineSimilarity(uploadedEmbedding, productEmbedding)

        // Determine match type based on similarity threshold
        let matchType: 'exact' | 'similar' | 'none' = 'none'
        if (similarity > 0.80) {
            matchType = 'exact'
        } else if (similarity > 0.55) {
            matchType = 'similar'
        }

        return {
            product: {
                id: product.id,
                productId: product.productId,
                name: product.name,
                price: product.price,
                pageUrl: product.pageUrl,
                imageUrl: product.imageUrl,
            },
            similarity,
            matchType,
        }
    })

    // Sort by similarity and return top results
    return results
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, limit)
        .filter((r: { similarity: number }) => r.similarity > 0.40)
}

