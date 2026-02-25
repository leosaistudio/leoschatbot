import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getOpenAI } from '@/lib/openai'
import { notifyConversationSummary } from '@/services/notifications'

// POST - Auto-close inactive conversations and send summary emails
// Call this via cron job every 30 minutes:
// curl -X POST "https://chatbot.leos.co.il/api/cron/close-inactive?secret=YOUR_SECRET"
export async function POST(request: NextRequest) {
    // Simple secret-based auth for cron
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const INACTIVE_MINUTES = 30
    const cutoff = new Date(Date.now() - INACTIVE_MINUTES * 60 * 1000)

    // Find active conversations that started more than 30 min ago (startedAt instead of updatedAt)
    const inactiveConversations = await prisma.conversation.findMany({
        where: {
            status: { in: ['active', 'human_takeover'] },
            startedAt: { lt: cutoff },
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
            bot: {
                select: { name: true, userId: true },
            },
        },
        take: 20,
    })

    let closed = 0
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    for (const conv of inactiveConversations) {
        // Skip conversations with no messages
        if (!conv.messages || conv.messages.length === 0) {
            await prisma.conversation.update({
                where: { id: conv.id },
                data: { status: 'closed' },
            })
            closed++
            continue
        }

        try {
            // Mark as closed
            await prisma.conversation.update({
                where: { id: conv.id },
                data: { status: 'closed' },
            })

            // Generate summary if enough messages
            let summary = 'שיחה קצרה.'
            if (conv.messages.length >= 2) {
                try {
                    const chatHistory = conv.messages
                        .map(m => `${m.role === 'user' ? 'מבקר' : 'בוט'}: ${m.content}`)
                        .join('\n')

                    const response = await getOpenAI().chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'סכם את השיחה הבאה ב-2-3 משפטים בעברית. ציין את הנושא העיקרי, מה הלקוח ביקש, והאם קיבל מענה.'
                            },
                            { role: 'user', content: chatHistory }
                        ],
                        temperature: 0.3,
                        max_tokens: 300,
                    })

                    summary = response.choices[0]?.message?.content || summary

                    await prisma.conversation.update({
                        where: { id: conv.id },
                        data: { summary },
                    })
                } catch (err) {
                    console.error(`Summary error for ${conv.id}:`, err)
                }
            }

            // Send summary email
            const dashboardUrl = `${appUrl}/dashboard/live-chat?conversation=${conv.id}`
            await notifyConversationSummary(
                conv.bot.userId,
                conv.id,
                summary,
                conv.bot.name || 'Unnamed Bot',
                conv.messages,
                dashboardUrl
            )

            closed++
        } catch (err) {
            console.error(`Error closing conversation ${conv.id}:`, err)
        }
    }

    return NextResponse.json({
        success: true,
        checked: inactiveConversations.length,
        closed,
    })
}
