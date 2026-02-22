import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { findRelevantContent } from './embeddings'
import { findDirectAnswer } from './directMatcher'
import { findMatchingProducts } from './imageEmbedding'
import { searchProductsByText, isQdrantAvailable } from './qdrant'

const DEFAULT_SYSTEM_PROMPT = `אתה עוזר AI ידידותי ומקצועי המייצג את האתר והעסק. 
תפקידך לעזור לגולשים לקבל מידע על השירותים, מוצרים ופעילות העסק.
ענה בעברית, בצורה ברורה ומקצועית.
אם אינך יודע תשובה, אמור זאת בכנות והצע ליצור קשר.
השתמש במידע הבא מהאתר כדי לענות:`

interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface ChatOptions {
    botId: string
    conversationId: string
    userMessage: string
    history?: ChatMessage[]
    image?: string // Base64 image data for Vision API
}

interface ChatResponse {
    message: string
    usedCredits: boolean
    source?: 'direct' | 'ai'
}

/**
 * Generate AI response using RAG (Retrieval Augmented Generation)
 * First tries to find a direct answer without using credits
 */
export async function generateChatResponse(options: ChatOptions): Promise<string> {
    const { botId, conversationId, userMessage, history = [], image } = options

    // First, try to find a direct answer (no credits used!) - but not for images
    if (!image) {
        const directAnswer = await findDirectAnswer(botId, userMessage)

        if (directAnswer.found && directAnswer.answer) {
            console.log(`Direct answer found (confidence: ${directAnswer.confidence}) - NO CREDITS USED`)

            // Store messages in database
            await prisma.message.createMany({
                data: [
                    { conversationId, role: 'user', content: userMessage },
                    { conversationId, role: 'assistant', content: directAnswer.answer },
                ],
            })

            return directAnswer.answer
        }
    }

    // No direct answer found (or has image), use AI (costs credits)
    console.log(image ? 'Image provided, using Vision AI...' : 'No direct answer, using AI...')

    // Product context from image or text
    let productContext = ''

    // If image uploaded, try to match product first
    if (image) {
        try {
            console.log('🔍 Searching for matching products...')
            const matchingProducts = await findMatchingProducts(botId, image, 3)

            if (matchingProducts.length > 0) {
                const bestMatch = matchingProducts[0]
                console.log(`✅ Found ${matchingProducts.length} matches, best: ${bestMatch.product.name} (${(bestMatch.similarity * 100).toFixed(1)}%)`)

                productContext = `

מוצרים שנמצאו התאמה לתמונה:
${matchingProducts.map((m, i) => `
${i + 1}. ${m.product.name}
   מחיר: ${m.product.price || 'לא זמין'}
   לינק: ${m.product.pageUrl}
   דמיון: ${(m.similarity * 100).toFixed(0)}%
   סוג התאמה: ${m.matchType === 'exact' ? 'מדויק' : m.matchType === 'similar' ? 'דומה' : 'לא ברור'}
`).join('')}
`
            } else {
                console.log('❌ No matching products found')
            }
        } catch (error) {
            console.error('Error matching products:', error)
        }
    } else {
        // Text query - search products by name if user asks about a product
        const productKeywords = ['קישור', 'לינק', 'מחיר', 'גינס', 'חולצה', 'בלייזר', 'מכנס', 'שמלה', 'ג\'קט', 'חליפה', 'מעיל']
        const hasProductQuery = productKeywords.some(kw => userMessage.includes(kw))

        if (hasProductQuery && await isQdrantAvailable()) {
            try {
                console.log('🔍 Searching products by text:', userMessage)
                const textMatches = await searchProductsByText(botId, userMessage, 3)

                if (textMatches.length > 0 && textMatches[0].similarity > 0.4) {
                    console.log(`✅ Found ${textMatches.length} text matches, best: ${textMatches[0].name}`)

                    productContext = `

מוצרים רלוונטיים לשאילתה:
${textMatches.map((m, i) => `
${i + 1}. ${m.name}
   מחיר: ${m.price || 'לא זמין'}
   לינק: ${m.pageUrl}
`).join('')}
`
                }
            } catch (error) {
                console.error('Error searching products by text:', error)
            }
        }
    }

    // Get bot settings
    const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: {
            systemPrompt: true,
            temperature: true,
            welcomeMessage: true,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    // Find relevant content from embeddings
    const relevantContent = await findRelevantContent(botId, userMessage, 5)
    const context = relevantContent.map(r => r.content).join('\n\n---\n\n')

    // Build system prompt with context
    const systemPrompt = `${bot.systemPrompt || DEFAULT_SYSTEM_PROMPT}

מידע רלוונטי מהאתר:
${context || 'אין מידע זמין מהאתר עדיין.'}
${productContext}
הנחיות חשובות מאוד:

שפה:
- זהה את השפה שבה הגולש כותב (עברית, אנגלית, ערבית, רוסית, או כל שפה אחרת)
- ענה תמיד באותה שפה שהגולש כתב
- אם הגולש כתב באנגלית - ענה באנגלית
- אם הגולש כתב בערבית - ענה בערבית
- אם הגולש כתב ברוסית - ענה ברוסית
- אם הגולש כתב בעברית - ענה בעברית

${image ? `תמונה:
הגולש העלה תמונה. המערכת מצאה התאמות בקטלוג.

** הוראות חובה **:
השתמש ברשימת "מוצרים שנמצאו התאמה לתמונה" שלמעלה.
הצג את המוצרים עם הלינקים המלאים!

** פורמט תשובה **:
🎯 מצאנו התאמה:
[שם המוצר]
💰 מחיר: [מחיר]
🔗 לינק: [העתק את הURL המלא מהרשימה - https://maisonfatmaa.com/product/...]

📌 מוצרים דומים:
1. [שם] - [מחיר] - [URL מלא]
2. [שם] - [מחיר] - [URL מלא]

** קריטי **:
- חובה לכלול את הלינק המלא לכל מוצר!
- הלינק חייב להיות URL פשוט: https://...
- לא Markdown, לא HTML
` : ''}

סגנון:
- היה מועיל וידידותי
- אם מתאים, הצע לגולש להשאיר פרטים ליצירת קשר

עיצוב התשובה:
- חובה להשתמש בשורות חדשות
- אחרי כל פסקה - שורה ריקה
- לפני רשימה ממוספרת - שורה ריקה
- כל פריט ברשימה בשורה נפרדת משלו
- אחרי רשימה - שורה ריקה
- לא להשתמש בסימנים: ** או # או ***`

    // Build messages array - with Vision support if image provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history,
    ]

    // Add user message - with image if provided
    if (image) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: userMessage },
                { type: 'image_url', image_url: { url: image } },
            ],
        })
    } else {
        messages.push({ role: 'user', content: userMessage })
    }

    // Call OpenAI (gpt-4o-mini supports Vision)
    const response = await openai().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: bot.temperature || 0.7,
        max_tokens: 1000,
    })

    const assistantMessage = response.choices[0]?.message?.content || 'מצטער, לא הצלחתי לייצר תשובה.'

    // Count tokens used
    const tokensUsed = response.usage?.total_tokens || 0

    // Store messages in database
    await prisma.message.createMany({
        data: [
            {
                conversationId,
                role: 'user',
                content: userMessage,
            },
            {
                conversationId,
                role: 'assistant',
                content: assistantMessage,
            },
        ],
    })

    // Update token count and credit count on conversation
    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            tokensUsed: { increment: tokensUsed },
            creditsUsed: { increment: 1 }, // 1 credit per query/response
        },
    })

    return assistantMessage
}

/**
 * Start a new conversation
 */
export async function startConversation(
    botId: string,
    visitorId: string,
    pageUrl?: string
): Promise<string> {
    const conversation = await prisma.conversation.create({
        data: {
            botId,
            visitorId,
            pageUrl,
            status: 'active',
        },
    })

    return conversation.id
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
    })

    return messages as ChatMessage[]
}
