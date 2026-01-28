import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { QdrantClient } from '@qdrant/js-client-rest'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI()
const qdrant = new QdrantClient({ host: 'localhost', port: 6333 })

const BOT_ID = 'cmk9l5hqb000cvhpkjx87973p'
const COLLECTION_NAME = 'product_images'
const VECTOR_SIZE = 1536

interface Product {
    id: string
    title: string
    description: string
    link: string
    imageLink: string
    price: string
    category?: string
    availability?: string
}

// Decode HTML entities and fix double-encoded URLs
function decodeUrl(url: string): string {
    // Step 1: Replace HTML entities
    let decoded = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')

    // Step 2: Remove query parameters (everything after ?)
    decoded = decoded.split('?')[0]

    // Step 3: Fix double-encoded percent signs (%25 -> %)
    decoded = decoded.replace(/%25([0-9a-fA-F]{2})/g, '%$1')

    // Step 4: Decode URI multiple times until stable
    let prev = ''
    let attempts = 0
    while (prev !== decoded && attempts < 5) {
        prev = decoded
        try {
            decoded = decodeURIComponent(decoded)
        } catch {
            break
        }
        attempts++
    }

    // Step 5: Re-encode for URL but keep Hebrew readable in display
    // Return the human-readable Hebrew URL
    return decoded
}

function extractTag(xml: string, tagName: string): string {
    const patterns = [
        new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i'),
        new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'),
    ]

    for (const pattern of patterns) {
        const match = xml.match(pattern)
        if (match && match[1]) {
            return match[1].trim()
        }
    }
    return ''
}

function parseXml(xmlContent: string): Product[] {
    const products: Product[] = []
    const itemMatches = xmlContent.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        const rawLink = extractTag(itemXml, 'g:link')
        const cleanLink = decodeUrl(rawLink)

        const product: Product = {
            id: extractTag(itemXml, 'g:id') || '',
            title: extractTag(itemXml, 'g:title') || '',
            description: extractTag(itemXml, 'g:description') || '',
            link: cleanLink,
            imageLink: extractTag(itemXml, 'g:image_link') || '',
            price: extractTag(itemXml, 'g:price') || '',
            category: extractTag(itemXml, 'g:product_type') || '',
            availability: extractTag(itemXml, 'g:availability') || '',
        }

        if (product.id && product.title && product.imageLink) {
            products.push(product)
        }
    }

    return products
}

async function initCollection(): Promise<boolean> {
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
        } else {
            console.log('📦 Qdrant collection exists:', COLLECTION_NAME)
        }
        return true
    } catch (error) {
        console.error('❌ Qdrant init failed:', error)
        return false
    }
}

async function clearBotProducts(): Promise<void> {
    console.log('🗑️ Clearing old products from Qdrant...')
    try {
        await qdrant.delete(COLLECTION_NAME, {
            filter: {
                must: [{ key: 'botId', match: { value: BOT_ID } }],
            },
        })
        console.log('   Cleared!')
    } catch (error) {
        console.log('   No products to clear or error:', error)
    }
}

async function describeImage(imageUrl: string, productName: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `שם המוצר: "${productName}"

נתח את התמונה לעומק ותאר את הפריט המרכזי בצורה מפורטת ביותר.

** זיהוי צבע מדויק (קריטי!) **:
- בורדו = אדום-חום כהה, צבע יין
- אדום = אדום בהיר/טהור
- ורוד = ורוד בהיר/פסטלי
- שחור = שחור טהור
- אפור = אפור (לא לבלבל עם שחור)
- לבן/קרם/בז'/אבן = גווני לבן

** תאר את הפריטים הבאים **:
1. סוג: ג'קט/בלייזר/חולצה/מכנס/שמלה/חליפה
2. צבע עיקרי: [שם הצבע המדויק]
3. צבעים משניים: [אם יש]
4. חומר: קטיפה/טוויד/ג'ינס/כותנה/סריג/ויסקוזה
5. גזרה: צמודה/רחבה/ישרה/אוברסייז
6. פרטים: כפתורים (צבע/סוג), כיסים, רוכסנים, צווארון
7. סגנון: אלגנטי/יומיומי/ספורטיבי

** דוגמה לפלט טוב **:
"ג'קט שירט בורדו כהה, בד כותנה עבה, גזרה אוברסייז, כפתורי מתכת כסופים, שני כיסי חזה, סגנון יומיומי"

תשובה בעברית, פסקה אחת מפורטת.`,
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl },
                        },
                    ],
                },
            ],
            max_tokens: 350,
        })
        return response.choices[0]?.message?.content || ''
    } catch (error) {
        console.error('Error describing image:', error)
        return ''
    }
}

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    })
    return response.data[0].embedding
}

function hashStringToNumber(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash)
}

async function processProducts(products: Product[], limit: number = 30) {
    console.log(`🛍️ Processing ${Math.min(products.length, limit)} products for Qdrant...`)

    let processed = 0
    let failed = 0

    // Deduplicate by base product name
    const uniqueProducts = new Map<string, Product>()
    for (const p of products) {
        const baseName = p.title.replace(/\s+(S|M|L|Xl|XL|XXL)$/i, '').trim()
        if (!uniqueProducts.has(baseName)) {
            uniqueProducts.set(baseName, p)
        }
    }

    console.log(`📊 Unique products: ${uniqueProducts.size}`)
    const productList = Array.from(uniqueProducts.values()).slice(0, limit)

    for (const product of productList) {
        try {
            const cleanName = product.title.replace(/\s+(S|M|L|Xl|XL|XXL)$/i, '').trim()
            console.log(`📸 [${processed + 1}/${productList.length}] ${cleanName}`)
            console.log(`   🔗 ${product.link}`)

            // Describe image using Vision
            const imageDescription = await describeImage(product.imageLink, cleanName)
            console.log(`   🔍 ${imageDescription.slice(0, 60)}...`)

            // Generate embedding
            const embeddingInput = `${cleanName}. ${imageDescription}`
            const embedding = await generateEmbedding(embeddingInput)

            // Store in Qdrant
            const pointId = hashStringToNumber(product.id + BOT_ID)

            await qdrant.upsert(COLLECTION_NAME, {
                points: [
                    {
                        id: pointId,
                        vector: embedding,
                        payload: {
                            productId: product.id,
                            botId: BOT_ID,
                            name: cleanName,
                            price: product.price,
                            pageUrl: product.link,
                            imageUrl: product.imageLink,
                            description: imageDescription,
                            category: product.category,
                        },
                    },
                ],
            })

            // Also store in SQLite for fallback
            const existing = await prisma.productImage.findFirst({
                where: { botId: BOT_ID, productId: product.id },
            })

            const data = {
                botId: BOT_ID,
                productId: product.id,
                name: cleanName,
                price: product.price,
                imageUrl: product.imageLink,
                pageUrl: product.link,
                description: imageDescription,
                category: product.category,
                inStock: product.availability !== 'out_of_stock',
                embedding: embedding,
            }

            if (existing) {
                await prisma.productImage.update({
                    where: { id: existing.id },
                    data,
                })
            } else {
                await prisma.productImage.create({ data })
            }

            processed++
            console.log(`   ✅ Saved to Qdrant + SQLite!`)

            await new Promise(r => setTimeout(r, 1500))
        } catch (error) {
            console.error(`   ❌ Failed:`, error)
            failed++
        }
    }

    console.log(`\n🎉 Done! Processed: ${processed}, Failed: ${failed}`)
}

async function main() {
    console.log('🚀 Qdrant Product Import Script')
    console.log('================================\n')

    // Initialize Qdrant collection
    const qdrantReady = await initCollection()
    if (!qdrantReady) {
        console.error('❌ Cannot connect to Qdrant. Make sure Docker is running!')
        process.exit(1)
    }

    // Read XML file
    const xmlPath = path.join(process.cwd(), 'mimhkcdk5kew9v7srzlgy08xe7bcelgv.xml')
    console.log(`📂 Reading XML from: ${xmlPath}`)

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8')
    const products = parseXml(xmlContent)

    console.log(`📦 Found ${products.length} products in XML\n`)

    // Clear old products
    await clearBotProducts()

    // Also clear SQLite
    console.log('🗑️ Clearing old products from SQLite...')
    await prisma.productImage.deleteMany({ where: { botId: BOT_ID } })

    // Process products
    await processProducts(products, 40)

    // Show Qdrant stats
    try {
        const info = await qdrant.getCollection(COLLECTION_NAME)
        console.log(`\n📊 Qdrant Collection Stats:`)
        console.log(`   Points: ${info.points_count}`)
        console.log(`   Vectors: ${info.indexed_vectors_count || 0}`)
    } catch { }

    await prisma.$disconnect()
    console.log('\n✨ Import complete! You can test image search now.')
}

main().catch(console.error)
