import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET messages for a conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify user owns the bot
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

    // Filter out system messages (takeover notifications) from agent view
    const systemMessagePrefixes = ['👋 נציג אנושי', '🤖 הבוט חזר']
    const filteredMessages = conversation.messages.filter(msg =>
        !systemMessagePrefixes.some(prefix => msg.content.startsWith(prefix))
    )

    return NextResponse.json({
        conversation: {
            id: conversation.id,
            status: conversation.status,
            visitorId: conversation.visitorId,
            visitorName: conversation.visitorName,
        },
        messages: filteredMessages,
    })
}

// POST - Send a human message
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
        return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Verify user owns the bot and conversation is in human_takeover
    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            bot: { userId: session.user.id },
            status: 'human_takeover',
        },
    })

    if (!conversation) {
        return NextResponse.json({ error: 'No access or bot is still active' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.message.create({
        data: {
            conversationId: id,
            role: 'assistant', // Human messages appear as assistant to the visitor
            content: content.trim(),
        },
    })

    return NextResponse.json({ message })
}
