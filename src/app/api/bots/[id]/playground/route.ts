import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateEmbedding } from '@/services/embeddings'
import { getOpenAI } from '@/lib/openai'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Test bot with source display
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params
        const { message } = await request.json()

        if (!message?.trim()) {
            return NextResponse.json({ error: 'הודעה ריקה' }, { status: 400 })
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        // Generate embedding for the question
        const queryEmbedding = await generateEmbedding(message)

        // Search for relevant content with full details
        const relevantContent = await searchRelevantContentWithDetails(botId, queryEmbedding, 5)

        // Build context from relevant content
        const context = relevantContent
            .map(item => item.content)
            .join('\n\n---\n\n')

        // Build system prompt
        const systemPrompt = bot.systemPrompt ||
            'אתה עוזר וירטואלי מועיל. ענה על שאלות בהתבסס על המידע שסופק לך.'

        const fullSystemPrompt = `${systemPrompt}

הנה מידע רלוונטי שיכול לעזור לך לענות:

${context || 'אין מידע ספציפי זמין.'}

הנחיות עיצוב חשובות מאוד:
- ענה בצורה מועילה וידידותית
- אם אין לך מספיק מידע, אמור זאת בכנות
- חובה להשתמש בשורות חדשות:
  * אחרי כל פסקה - שורה ריקה
  * לפני רשימה ממוספרת - שורה ריקה
  * כל פריט ברשימה בשורה נפרדת משלו
  * אחרי רשימה - שורה ריקה
- לא להשתמש בסימנים: ** או # או ***
- דוגמה לעיצוב נכון:

פסקה ראשונה.

הרשימה:
1. פריט ראשון
2. פריט שני
3. פריט שלישי

פסקה סיכום.`

        // Call OpenAI
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: fullSystemPrompt },
                { role: 'user', content: message },
            ],
            temperature: bot.temperature || 0.7,
            max_tokens: 1000,
        })

        const assistantMessage = response.choices[0]?.message?.content || 'מצטער, לא הצלחתי לייצר תשובה.'

        // Format sources for response
        const sources = relevantContent.map(item => ({
            content: item.content,
            sourceUrl: item.sourceUrl,
            sourceType: item.sourceType,
            similarity: item.similarity,
        }))

        return NextResponse.json({
            response: assistantMessage,
            sources,
        })
    } catch (error) {
        console.error('Playground error:', error)
        return NextResponse.json({ error: 'שגיאה בבדיקה' }, { status: 500 })
    }
}

// Search with full source details
async function searchRelevantContentWithDetails(
    botId: string,
    queryEmbedding: number[],
    limit: number = 5
) {
    // Get all embeddings for this bot with source info
    const embeddings = await prisma.embedding.findMany({
        where: { botId },
        include: {
            source: {
                select: {
                    type: true,
                    content: true,
                },
            },
        },
    })

    if (embeddings.length === 0) {
        return []
    }

    // Calculate similarities
    const results = embeddings.map(emb => {
        const embVector = emb.embedding as number[]
        const similarity = cosineSimilarity(queryEmbedding, embVector)
        return {
            content: emb.content,
            sourceType: emb.source?.type || 'unknown',
            sourceUrl: emb.source?.type === 'url' ? emb.source.content : undefined,
            similarity,
        }
    })

    // Sort by similarity and take top results
    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .filter(r => r.similarity > 0.3) // Only return if similarity is decent
}

function cosineSimilarity(a: number[], b: number[]): number {
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
