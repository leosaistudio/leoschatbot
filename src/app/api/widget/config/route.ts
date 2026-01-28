import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get bot configuration for widget
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const botId = searchParams.get('botId')

        if (!botId) {
            return NextResponse.json({ error: 'Bot ID required' }, { status: 400 })
        }

        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: {
                id: true,
                name: true,
                status: true,
                welcomeMessage: true,
                primaryColor: true,
                position: true,
                avatarUrl: true,
                chatIconUrl: true,
                leadFormEnabled: true,
                leadFormFields: true,
                suggestedQuestions: true,
                // Business hours
                businessHoursEnabled: true,
                businessHoursStart: true,
                businessHoursEnd: true,
                workingDays: true,
                shabbatModeEnabled: true,
                offlineMessage: true,
            },
        })

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
        }

        if (bot.status !== 'active') {
            return NextResponse.json({ error: 'Bot is not active' }, { status: 400 })
        }

        // Add CORS headers for widget embedding
        const response = NextResponse.json(bot)
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')

        return response
    } catch (error) {
        console.error('Error fetching bot config:', error)
        return NextResponse.json({ error: 'Failed to load bot' }, { status: 500 })
    }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
}
