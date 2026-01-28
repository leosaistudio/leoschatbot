import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Take over or return to bot
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    if (!['active', 'human_takeover'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify user owns the bot
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            bot: { userId: session.user.id },
        },
        select: { id: true, status: true },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Only add message if status is actually changing
    if (conversation.status !== status) {
        // Add system message about takeover
        const systemMessage = status === 'human_takeover'
            ? '👋 נציג אנושי הצטרף לשיחה ויענה לך עכשיו.'
            : '🤖 הבוט חזר לענות לך. איך אפשר לעזור?'

        await prisma.message.create({
            data: {
                conversationId: id,
                role: 'assistant',
                content: systemMessage,
            },
        })

        // Update status
        await prisma.conversation.update({
            where: { id },
            data: { status },
        })
    }

    return NextResponse.json({ success: true, status })
}

