import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createBotSchema = z.object({
    name: z.string().min(2, 'שם הבוט חייב להכיל לפחות 2 תווים'),
    description: z.string().optional(),
    welcomeMessage: z.string().optional(),
})

// GET - List all bots for authenticated user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const bots = await prisma.bot.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        conversations: true,
                        leads: true,
                    },
                },
            },
        })

        return NextResponse.json(bots)
    } catch (error) {
        console.error('Error fetching bots:', error)
        return NextResponse.json({ error: 'שגיאה בטעינת הבוטים' }, { status: 500 })
    }
}

// POST - Create a new bot
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const body = await request.json()
        const parsed = createBotSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { name, description, welcomeMessage } = parsed.data

        const bot = await prisma.bot.create({
            data: {
                userId: session.user.id,
                name,
                description,
                welcomeMessage: welcomeMessage || 'שלום! איך אפשר לעזור לך היום?',
                status: 'draft',
            },
        })

        return NextResponse.json(bot, { status: 201 })
    } catch (error) {
        console.error('Error creating bot:', error)
        return NextResponse.json({ error: 'שגיאה ביצירת הבוט' }, { status: 500 })
    }
}
