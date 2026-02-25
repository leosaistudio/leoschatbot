import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOpenAI } from '@/lib/openai'
import { notifyConversationSummary } from '@/services/notifications'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Close a conversation and send summary email
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get conversation with messages and bot
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            bot: { userId: session.user.id },
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
            bot: {
                select: { name: true, userId: true },
            },
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mark conversation as closed
    await prisma.conversation.update({
        where: { id },
        data: { status: 'closed' },
    })

    // Generate summary if there are enough messages
    let summary = 'שיחה קצרה ללא מספיק הודעות לסיכום.'
    if (conversation.messages.length >= 2) {
        try {
            const chatHistory = conversation.messages
                .map(m => `${m.role === 'user' ? 'מבקר' : 'בוט'}: ${m.content}`)
                .join('\n')

            const response = await getOpenAI().chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `סכם את השיחה הבאה ב-2-3 משפטים בעברית. ציין את הנושא העיקרי, מה הלקוח ביקש, והאם קיבל מענה.`
                    },
                    {
                        role: 'user',
                        content: chatHistory
                    }
                ],
                temperature: 0.3,
                max_tokens: 300,
            })

            summary = response.choices[0]?.message?.content || summary

            // Save summary to conversation
            await prisma.conversation.update({
                where: { id },
                data: { summary },
            })
        } catch (error) {
            console.error('Summary generation error:', error)
        }
    }

    // Send summary email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const dashboardUrl = `${appUrl}/dashboard/live-chat?conversation=${id}`

    await notifyConversationSummary(
        conversation.bot.userId,
        id,
        summary,
        conversation.bot.name || 'Unnamed Bot',
        conversation.messages,
        dashboardUrl
    )

    return NextResponse.json({ success: true, summary })
}
