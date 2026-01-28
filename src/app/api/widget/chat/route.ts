import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateChatResponse, startConversation, getConversationHistory } from '@/services/chat'
import { isWithinBusinessHours } from '@/lib/businessHours'
import { z } from 'zod'

const chatSchema = z.object({
    botId: z.string(),
    visitorId: z.string(),
    message: z.string().min(1),
    conversationId: z.string().optional().nullable(),
    pageUrl: z.string().optional().nullable(),
    image: z.string().optional().nullable(), // Base64 image data
})

// POST - Send a message and get AI response
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('Chat API received:', JSON.stringify(body, null, 2))

        const parsed = chatSchema.safeParse(body)

        if (!parsed.success) {
            console.log('Validation errors:', parsed.error.errors)
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { botId, visitorId, message, conversationId: existingConvId, pageUrl, image } = parsed.data

        // Verify bot exists and is active
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: {
                id: true,
                name: true,
                status: true,
                userId: true,
                welcomeMessage: true,
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

        // Check business hours
        const hoursCheck = isWithinBusinessHours({
            businessHoursEnabled: bot.businessHoursEnabled,
            businessHoursStart: bot.businessHoursStart,
            businessHoursEnd: bot.businessHoursEnd,
            workingDays: bot.workingDays as number[] | null,
            shabbatModeEnabled: bot.shabbatModeEnabled,
            offlineMessage: bot.offlineMessage,
        })

        if (!hoursCheck.isOpen) {
            return NextResponse.json({
                conversationId: existingConvId || null,
                response: hoursCheck.message,
                isNewConversation: false,
                isOffline: true,
            })
        }

        // Get or create conversation
        let conversationId = existingConvId
        let isNewConversation = false
        let isHumanTakeover = false

        if (!conversationId) {
            conversationId = await startConversation(botId, visitorId, pageUrl || undefined)
            isNewConversation = true
        } else {
            // Check if conversation is in human takeover mode
            const existingConv = await prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { status: true },
            })
            isHumanTakeover = existingConv?.status === 'human_takeover'
        }

        // If human takeover, save user message but don't generate AI response
        if (isHumanTakeover) {
            await prisma.message.create({
                data: {
                    conversationId,
                    role: 'user',
                    content: message,
                },
            })

            return NextResponse.json({
                conversationId,
                isNewConversation: false,
                response: null, // No AI response, agent will respond
                humanTakeover: true,
            })
        }

        // Get conversation history
        const history = await getConversationHistory(conversationId)

        // Generate AI response
        const response = await generateChatResponse({
            botId,
            conversationId,
            userMessage: message,
            history,
            image: image || undefined,
        })

        // Send notification for new conversation (async, don't await)
        if (isNewConversation) {
            import('@/services/notifications').then(({ notifyNewConversation }) => {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                notifyNewConversation(bot.userId, {
                    conversationId,
                    botId,
                    botName: bot.name || 'Unnamed Bot',
                    visitorId,
                    firstMessage: message,
                    pageUrl: pageUrl || undefined,
                    dashboardUrl: `${appUrl}/dashboard/live-chat?conversation=${conversationId}`,
                }).catch(err => console.error('Notification error:', err))
            })
        }

        // TODO: Deduct credits from bot owner
        // await useCreditsForMessage(bot.userId)

        return NextResponse.json({
            conversationId,
            isNewConversation,
            response,
            welcomeMessage: isNewConversation ? bot.welcomeMessage : undefined,
        })
    } catch (error) {
        console.error('Chat error:', error)
        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 }
        )
    }
}
