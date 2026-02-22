import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOpenAI } from '@/lib/openai'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Generate AI summary for a conversation
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get conversation with messages
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            bot: { userId: session.user.id },
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.messages.length < 2) {
        return NextResponse.json({ error: 'Not enough messages to summarize' }, { status: 400 })
    }

    // Format messages for summary
    const chatHistory = conversation.messages
        .map(m => `${m.role === 'user' ? 'מבקר' : 'בוט'}: ${m.content}`)
        .join('\n')

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `אתה מנתח שיחות. נתח את השיחה הבאה וספק:
1. סיכום קצר (2-3 משפטים) של השיחה
2. סנטימנט: positive / negative / neutral
3. נושאים עיקריים
4. האם הלקוח קיבל מענה מספק

ענה בפורמט JSON:
{
  "summary": "סיכום השיחה",
  "sentiment": "positive/negative/neutral",
  "topics": ["נושא 1", "נושא 2"],
  "resolved": true/false
}`
                },
                {
                    role: 'user',
                    content: chatHistory
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        })

        const analysisText = response.choices[0]?.message?.content || '{}'
        const analysis = JSON.parse(analysisText)

        // Update conversation with summary
        await prisma.conversation.update({
            where: { id },
            data: {
                summary: analysis.summary,
                sentiment: analysis.sentiment,
            },
        })

        return NextResponse.json(analysis)
    } catch (error) {
        console.error('Summary generation error:', error)
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }
}
