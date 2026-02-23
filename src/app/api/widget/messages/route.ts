import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Helper to add CORS headers
function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    return corsHeaders(new NextResponse(null, { status: 200 }))
}

// GET new messages for a conversation (for widget polling)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const afterTime = searchParams.get('afterTime') // Use timestamp instead of ID

    if (!conversationId) {
        return corsHeaders(NextResponse.json({ error: 'Missing conversationId' }, { status: 400 }))
    }

    // Build query
    const whereClause: {
        conversationId: string
        createdAt?: { gt: Date }
        role?: string
    } = {
        conversationId,
        role: 'assistant', // Only get bot/agent messages
    }

    if (afterTime) {
        whereClause.createdAt = { gt: new Date(parseInt(afterTime)) }
    }

    const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
        },
    })

    // Also check if conversation is in human takeover mode
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { status: true },
    })

    return corsHeaders(NextResponse.json({
        messages,
        humanTakeover: conversation?.status === 'human_takeover',
    }))
}

