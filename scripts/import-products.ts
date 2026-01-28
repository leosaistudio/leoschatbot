import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI()

const BOT_ID = 'cmk9l5hqb000cvhpkjx87973p'

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
    // First, decode HTML entities like &amp; -> &
    let decoded = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')

    // Fix double-encoded percent signs (%25 -> %)
    // E.g., %25d7%259e -> %d7%9e
    decoded = decoded.replace(/%25([0-9a-fA-F]{2})/g, '%$1')

    // Get base URL (before query params) and decode Hebrew
    const baseUrl = decoded.split('?')[0]

    try {
        // Decode URI to get readable Hebrew
        return decodeURIComponent(baseUrl)
    } catch {
        return baseUrl
    }
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

async function describeImage(imageUrl: string, productName: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `המוצר הזה נקרא: "${productName}"
תאר את המוצר בתמונה בפירוט רב. כלול:
- סוג הפריט (ג'ינס, חולצה, שמלה וכו')
- צבע מדויק
- סגנון וגזרה
- חומר (אם ניתן לזהות)
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

async function clearOldProducts() {
    console.log('🗑️ Clearing old products...')
    const result = await prisma.productImage.deleteMany({
        where: { botId: BOT_ID },
    })
    console.log(`   Deleted ${result.count} old products`)
}

async function processProducts(products: Product[], limit: number = 30) {
    console.log(`🛍️ Processing ${Math.min(products.length, limit)} products...`)

    let processed = 0
    let failed = 0

    // Deduplicate by base product name (remove size suffix like S, M, L, XL)
    const uniqueProducts = new Map<string, Product>()
    for (const p of products) {
        // Get base name without size
        const baseName = p.title.replace(/\s+(S|M|L|Xl|XL|XXL)$/i, '').trim()
        if (!uniqueProducts.has(baseName)) {
            uniqueProducts.set(baseName, p)
        }
    }

    console.log(`📊 Unique base products: ${uniqueProducts.size}`)

    const productList = Array.from(uniqueProducts.values()).slice(0, limit)

    for (const product of productList) {
        try {
            console.log(`📸 [${processed + 1}/${productList.length}] ${product.title}`)
            console.log(`   🔗 URL: ${product.link}`)

            // Describe image using Vision with product name context
            const imageDescription = await describeImage(product.imageLink, product.title)
            console.log(`   🔍 Description: ${imageDescription.slice(0, 60)}...`)

            // Create embedding from title + description
            const embeddingInput = `${product.title}. ${imageDescription}`
            const embedding = await generateEmbedding(embeddingInput)

            // Create new product
            await prisma.productImage.create({
                data: {
                    botId: BOT_ID,
                    productId: product.id,
                    name: product.title.replace(/\s+(S|M|L|Xl|XL|XXL)$/i, '').trim(), // Clean name
                    price: product.price,
                    imageUrl: product.imageLink,
                    pageUrl: product.link, // Now properly decoded!
                    description: imageDescription,
                    category: product.category,
                    inStock: product.availability !== 'out_of_stock',
                    embedding: embedding,
                },
            })

            processed++
            console.log(`   ✅ Saved!`)

            // Rate limit delay
            await new Promise(r => setTimeout(r, 1500))
        } catch (error) {
            console.error(`   ❌ Failed:`, error)
            failed++
        }
    }

    console.log(`\n🎉 Done! Processed: ${processed}, Failed: ${failed}`)
}

async function main() {
    const xmlPath = path.join(process.cwd(), 'mimhkcdk5kew9v7srzlgy08xe7bcelgv.xml')
    console.log(`📂 Reading XML from: ${xmlPath}`)

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8')
    const products = parseXml(xmlContent)

    console.log(`📦 Found ${products.length} products in XML`)

    // Print first product URL for verification
    if (products.length > 0) {
        console.log(`📋 Sample URL: ${products[0].link}`)
    }

    // Clear old products first
    await clearOldProducts()

    // Process 30 unique base products
    await processProducts(products, 30)

    await prisma.$disconnect()
}

main().catch(console.error)
