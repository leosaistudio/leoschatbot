import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const leadSchema = z.object({
    botId: z.string(),
    visitorId: z.string(),
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    pageUrl: z.string().optional(),
})

// POST - Submit lead from widget
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = leadSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { botId, visitorId, name, phone, email, pageUrl } = parsed.data

        // Verify bot exists
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: { id: true },
        })

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
        }

        // Create or update lead
        const existingLead = await prisma.lead.findFirst({
            where: { botId, email: email || undefined },
        })

        if (existingLead && email) {
            // Update existing lead
            await prisma.lead.update({
                where: { id: existingLead.id },
                data: {
                    name,
                    phone: phone || existingLead.phone,
                    pageUrl: pageUrl || existingLead.pageUrl,
                },
            })
        } else {
            // Create new lead
            await prisma.lead.create({
                data: {
                    botId,
                    name,
                    phone: phone || null,
                    email: email || null,
                    pageUrl: pageUrl || null,
                },
            })
        }

        // Also update conversation visitor info if exists
        const conversation = await prisma.conversation.findFirst({
            where: { botId, visitorId },
            orderBy: { startedAt: 'desc' },
        })

        if (conversation) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    visitorName: name,
                    visitorEmail: email || null,
                },
            })
        }

        const response = NextResponse.json({ success: true })
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    } catch (error) {
        console.error('Lead API error:', error)
        return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return response
}
