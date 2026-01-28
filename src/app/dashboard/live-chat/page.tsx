import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LiveChatClient from './LiveChatClient'

export default async function LiveChatPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    // Get all active conversations for user's bots
    const conversations = await prisma.conversation.findMany({
        where: {
            bot: { userId: session.user.id },
            status: { in: ['active', 'human_takeover'] },
        },
        orderBy: { startedAt: 'desc' },
        select: {
            id: true,
            visitorId: true,
            visitorName: true,
            visitorEmail: true,
            status: true,
            startedAt: true,
            pageUrl: true,
            creditsUsed: true,
            bot: { select: { id: true, name: true } },
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
            },
            _count: { select: { messages: true } },
        },
    })

    return <LiveChatClient initialConversations={conversations} />
}
