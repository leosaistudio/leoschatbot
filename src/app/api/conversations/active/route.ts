import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET active conversations for current user's bots
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json(conversations)
}
