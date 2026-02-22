import { openai } from '@/lib/openai'

interface GoogleShoppingProduct {
    id: string
    title: string
    description: string
    link: string
    imageLink: string
    price: string
    availability?: string
    brand?: string
    gtin?: string
    mpn?: string
    condition?: string
    category?: string
}

/**
 * Parse Google Shopping XML feed
 */
export function parseGoogleShoppingXml(xmlContent: string): GoogleShoppingProduct[] {
    const products: GoogleShoppingProduct[] = []

    // Extract each item from the feed
    const itemMatches = xmlContent.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []

    for (const itemXml of itemMatches) {
        try {
            const product: GoogleShoppingProduct = {
                id: extractTag(itemXml, 'g:id') || extractTag(itemXml, 'id') || '',
                title: extractTag(itemXml, 'g:title') || extractTag(itemXml, 'title') || '',
                description: extractTag(itemXml, 'g:description') || extractTag(itemXml, 'description') || '',
                link: extractTag(itemXml, 'g:link') || extractTag(itemXml, 'link') || '',
                imageLink: extractTag(itemXml, 'g:image_link') || extractTag(itemXml, 'image_link') || '',
                price: extractTag(itemXml, 'g:price') || extractTag(itemXml, 'price') || '',
                availability: extractTag(itemXml, 'g:availability') || undefined,
                brand: extractTag(itemXml, 'g:brand') || undefined,
                gtin: extractTag(itemXml, 'g:gtin') || undefined,
                mpn: extractTag(itemXml, 'g:mpn') || undefined,
                condition: extractTag(itemXml, 'g:condition') || undefined,
                category: extractTag(itemXml, 'g:google_product_category') || extractTag(itemXml, 'g:product_type') || undefined,
            }

            // Only include products with required fields
            if (product.id && product.title && product.imageLink) {
                products.push(product)
            }
        } catch (error) {
            console.error('Error parsing product:', error)
        }
    }

    return products
}

/**
 * Extract tag content from XML string
 */
function extractTag(xml: string, tagName: string): string {
    // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
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

/**
 * Generate image description using Vision API
 */
export async function generateImageDescription(imageUrl: string): Promise<string> {
    try {
        const response = await openai().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'תאר את המוצר בתמונה בקצרה (עד 50 מילים). התמקד בצבע, סוג, צורה ומאפיינים בולטים. אל תאמר "התמונה מציגה" - פשוט תאר את המוצר עצמו.',
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl },
                        },
                    ],
                },
            ],
            max_tokens: 150,
        })

        return response.choices[0]?.message?.content || ''
    } catch (error) {
        console.error('Error generating image description:', error)
        return ''
    }
}

/**
 * Format product for storage as training content
 */
export function formatProductForTraining(product: GoogleShoppingProduct, imageDescription: string): string {
    const lines = [
        `🛍️ מוצר: ${product.title}`,
        `💰 מחיר: ${product.price}`,
        `🔗 לינק: ${product.link}`,
    ]

    if (product.brand) {
        lines.push(`🏷️ מותג: ${product.brand}`)
    }

    if (product.category) {
        lines.push(`📁 קטגוריה: ${product.category}`)
    }

    if (product.description) {
        lines.push(`📝 תיאור: ${product.description.slice(0, 200)}${product.description.length > 200 ? '...' : ''}`)
    }

    if (imageDescription) {
        lines.push(`📷 מראה המוצר: ${imageDescription}`)
    }

    lines.push(`🖼️ תמונה: ${product.imageLink}`)

    return lines.join('\n')
}
