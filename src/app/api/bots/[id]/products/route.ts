import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseGoogleShoppingXml } from '@/services/googleShoppingParser'
import { generateImageEmbedding } from '@/services/imageEmbedding'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Import Google Shopping XML
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params
        const { xmlContent } = await request.json()

        if (!xmlContent) {
            return NextResponse.json({ error: 'נא לספק תוכן XML' }, { status: 400 })
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        // Parse XML
        const products = parseGoogleShoppingXml(xmlContent)

        if (products.length === 0) {
            return NextResponse.json({ error: 'לא נמצאו מוצרים בקובץ' }, { status: 400 })
        }

        // Process products in background
        processProductsInBackground(botId, products)

        return NextResponse.json({
            message: `מתחיל לעבד ${products.length} מוצרים עם ניתוח תמונות...`,
            totalProducts: products.length,
        })
    } catch (error) {
        console.error('Google Shopping import error:', error)
        return NextResponse.json({ error: 'שגיאה בייבוא' }, { status: 500 })
    }
}

// GET - Get product count
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params

        const count = await prisma.productImage.count({
            where: { botId },
        })

        return NextResponse.json({ count })
    } catch (error) {
        console.error('Get products error:', error)
        return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
    }
}

// Background processing with image embeddings
async function processProductsInBackground(botId: string, products: Array<{
    id: string
    title: string
    description: string
    link: string
    imageLink: string
    price: string
    availability?: string
    brand?: string
    category?: string
}>) {
    const BATCH_SIZE = 3 // Smaller batch for image processing
    let processed = 0
    let failed = 0

    console.log(`🛍️ Starting to process ${products.length} products with image embeddings for bot ${botId}`)

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (product) => {
            try {
                console.log(`📸 Processing: ${product.title}`)

                // Generate image embedding using Vision + text embedding
                const embedding = await generateImageEmbedding(product.imageLink)

                // Check if product already exists
                const existing = await prisma.productImage.findFirst({
                    where: { botId, productId: product.id },
                })

                if (existing) {
                    // Update existing product
                    await prisma.productImage.update({
                        where: { id: existing.id },
                        data: {
                            name: product.title,
                            price: product.price,
                            imageUrl: product.imageLink,
                            pageUrl: product.link,
                            description: product.description,
                            brand: product.brand,
                            category: product.category,
                            inStock: product.availability !== 'out of stock',
                            embedding: embedding,
                        },
                    })
                } else {
                    // Create new product
                    await prisma.productImage.create({
                        data: {
                            botId,
                            productId: product.id,
                            name: product.title,
                            price: product.price,
                            imageUrl: product.imageLink,
                            pageUrl: product.link,
                            description: product.description,
                            brand: product.brand,
                            category: product.category,
                            inStock: product.availability !== 'out of stock',
                            embedding: embedding,
                        },
                    })
                }

                processed++
                console.log(`✅ Processed ${processed}/${products.length}: ${product.title}`)
            } catch (error) {
                console.error(`❌ Failed to process product ${product.title}:`, error)
                failed++
            }
        }))

        // Delay between batches to avoid rate limits
        if (i + BATCH_SIZE < products.length) {
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }

    console.log(`🎉 Finished processing. Processed: ${processed}, Failed: ${failed}`)
}
