import { QdrantClient } from '@qdrant/js-client-rest'
import { openai } from '@/lib/openai'

// Qdrant client - connects to local instance
const qdrant = new QdrantClient({
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT || '6333')
})

const COLLECTION_NAME = 'product_images'
const VECTOR_SIZE = 1536 // OpenAI text-embedding-3-small dimension

/**
 * Initialize the Qdrant collection for product images
 */
export async function initQdrantCollection(): Promise<boolean> {
    try {
        const collections = await qdrant.getCollections()
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME)

        if (!exists) {
            await qdrant.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine',
                },
            })
            console.log('✅ Qdrant collection created:', COLLECTION_NAME)
        }

        return true
    } catch (error) {
        console.error('❌ Qdrant initialization failed:', error)
        return false
    }
}

/**
 * Check if Qdrant is available
 */
export async function isQdrantAvailable(): Promise<boolean> {
    try {
        await qdrant.getCollections()
        return true
    } catch {
        return false
    }
}

/**
 * Store a product image embedding in Qdrant
 */
export async function storeProductEmbedding(
    productId: string,
    botId: string,
    embedding: number[],
    metadata: {
        name: string
        price: string | null
        pageUrl: string
        imageUrl: string
        description?: string
    }
): Promise<void> {
    try {
        // Use a hash of productId + botId as point ID (Qdrant needs BigInt or UUID)
        const pointId = hashStringToNumber(productId + botId)

        await qdrant.upsert(COLLECTION_NAME, {
            points: [
                {
                    id: pointId,
                    vector: embedding,
                    payload: {
                        productId,
                        botId,
                        name: metadata.name,
                        price: metadata.price,
                        pageUrl: metadata.pageUrl,
                        imageUrl: metadata.imageUrl,
                        description: metadata.description || '',
                    },
                },
            ],
        })
    } catch (error) {
        console.error('Error storing in Qdrant:', error)
        throw error
    }
}

/**
 * Search products by text query (for text-based product lookups)
 */
export async function searchProductsByText(
    botId: string,
    query: string,
    limit: number = 3
): Promise<Array<{
    productId: string
    name: string
    price: string | null
    pageUrl: string
    imageUrl: string
    similarity: number
}>> {
    try {
        // Generate embedding for the text query
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        })
        const queryEmbedding = embeddingResponse.data[0].embedding

        // Search in Qdrant
        const results = await qdrant.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit,
            filter: {
                must: [
                    {
                        key: 'botId',
                        match: { value: botId },
                    },
                ],
            },
            with_payload: true,
        })

        return results.map(point => ({
            productId: point.payload?.productId as string,
            name: point.payload?.name as string,
            price: point.payload?.price as string | null,
            pageUrl: point.payload?.pageUrl as string,
            imageUrl: point.payload?.imageUrl as string,
            similarity: point.score,
        }))
    } catch (error) {
        console.error('Error searching products by text:', error)
        return []
    }
}

/**
 * Search for similar products in Qdrant
 */
export async function searchSimilarProducts(
    botId: string,
    queryEmbedding: number[],
    limit: number = 5
): Promise<Array<{
    productId: string
    name: string
    price: string | null
    pageUrl: string
    imageUrl: string
    similarity: number
}>> {
    try {
        const results = await qdrant.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit,
            filter: {
                must: [
                    {
                        key: 'botId',
                        match: { value: botId },
                    },
                ],
            },
            with_payload: true,
        })

        return results.map(point => ({
            productId: point.payload?.productId as string,
            name: point.payload?.name as string,
            price: point.payload?.price as string | null,
            pageUrl: point.payload?.pageUrl as string,
            imageUrl: point.payload?.imageUrl as string,
            similarity: point.score,
        }))
    } catch (error) {
        console.error('Error searching Qdrant:', error)
        return []
    }
}

/**
 * Delete all products for a bot from Qdrant
 */
export async function deleteProductsByBot(botId: string): Promise<void> {
    try {
        await qdrant.delete(COLLECTION_NAME, {
            filter: {
                must: [
                    {
                        key: 'botId',
                        match: { value: botId },
                    },
                ],
            },
        })
    } catch (error) {
        console.error('Error deleting from Qdrant:', error)
    }
}

/**
 * Generate embedding for an image using Vision + text embedding
 */
export async function generateImageEmbeddingForQdrant(
    imageUrl: string,
    productName: string
): Promise<number[]> {
    // Describe image using Vision
    const description = await describeImageForQdrant(imageUrl, productName)

    // Generate text embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${productName}. ${description}`,
    })

    return embeddingResponse.data[0].embedding
}

/**
 * Describe image using Vision API with product context
 */
async function describeImageForQdrant(imageUrl: string, productName: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `המוצר: "${productName}"
תאר את המוצר בתמונה בפירוט:
- סוג הפריט
- צבע מדויק
- חומר/טקסטורה
- סגנון וגזרה
- פרטים ייחודיים

תשובה קצרה בעברית.`,
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl },
                        },
                    ],
                },
            ],
            max_tokens: 200,
        })

        return response.choices[0]?.message?.content || ''
    } catch {
        return ''
    }
}

/**
 * Generate embedding for uploaded image (base64)
 */
export async function generateUploadedImageEmbeddingForQdrant(imageData: string): Promise<number[]> {
    // Describe the uploaded image
    const description = await describeUploadedImageForQdrant(imageData)

    console.log('📝 Qdrant: Uploaded image description:', description.slice(0, 80) + '...')

    // Generate text embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: description,
    })

    return embeddingResponse.data[0].embedding
}

/**
 * Describe uploaded image for search
 */
async function describeUploadedImageForQdrant(imageData: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `נתח את התמונה לעומק וזהה את הפריט המרכזי.

** זיהוי צבע מדויק (קריטי!) **:
- בורדו = אדום-חום כהה, צבע יין
- אדום = אדום בהיר/טהור
- ורוד = ורוד בהיר/פסטלי
- שחור = שחור טהור
- אפור = אפור (לא לבלבל עם שחור)

** תאר בפירוט **:
1. סוג: ג'קט/בלייזר/חולצה/מכנס/שמלה/חליפה
2. צבע עיקרי: [שם הצבע המדויק]
3. חומר: קטיפה/טוויד/ג'ינס/כותנה/סריג
4. גזרה: צמודה/רחבה/ישרה/אוברסייז
5. פרטים בולטים: כפתורים, כיסים, צווארון

אם יש מספר פריטים, תאר את הבולט ביותר.
תשובה בעברית, פסקה אחת מפורטת.`,
                    },
                    {
                        type: 'image_url',
                        image_url: { url: imageData },
                    },
                ],
            },
        ],
        max_tokens: 350,
    })

    return response.choices[0]?.message?.content || ''
}

/**
 * Simple hash function to convert string to number for Qdrant point ID
 */
function hashStringToNumber(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
}
