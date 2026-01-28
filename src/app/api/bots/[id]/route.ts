import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateBotSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'training', 'active', 'paused']).optional(),
    systemPrompt: z.string().optional(),
    welcomeMessage: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    primaryColor: z.string().optional(),
    position: z.enum(['bottom-right', 'bottom-left']).optional(),
    avatarUrl: z.string().nullable().optional(),
    leadFormEnabled: z.boolean().optional(),
    suggestedQuestions: z.array(z.string()).optional(),
    // Business hours
    businessHoursEnabled: z.boolean().optional(),
    businessHoursStart: z.string().optional(),
    businessHoursEnd: z.string().optional(),
    workingDays: z.array(z.number()).optional(),
    shabbatModeEnabled: z.boolean().optional(),
    offlineMessage: z.string().nullable().optional(),
})

// GET - Get single bot
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id } = await params

        const bot = await prisma.bot.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                trainingSources: {
                    select: { id: true, type: true, content: true, status: true },
                },
                _count: {
                    select: { conversations: true, leads: true, embeddings: true },
                },
            },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        return NextResponse.json(bot)
    } catch (error) {
        console.error('Error fetching bot:', error)
        return NextResponse.json({ error: 'שגיאה בטעינת הבוט' }, { status: 500 })
    }
}

// PATCH - Update bot
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const parsed = updateBotSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        // Verify ownership
        const existing = await prisma.bot.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existing) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        const updated = await prisma.bot.update({
            where: { id },
            data: parsed.data,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating bot:', error)
        return NextResponse.json({ error: 'שגיאה בעדכון הבוט' }, { status: 500 })
    }
}

// DELETE - Delete bot
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existing = await prisma.bot.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existing) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        await prisma.bot.delete({ where: { id } })

        return NextResponse.json({ message: 'הבוט נמחק בהצלחה' })
    } catch (error) {
        console.error('Error deleting bot:', error)
        return NextResponse.json({ error: 'שגיאה במחיקת הבוט' }, { status: 500 })
    }
}
