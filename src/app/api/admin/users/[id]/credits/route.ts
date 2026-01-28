import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { addCredits } from '@/services/credits'
import { z } from 'zod'

const addCreditsSchema = z.object({
    amount: z.number().min(1),
    type: z.enum(['purchase', 'bonus']),
    description: z.string().optional(),
})

// POST - Add credits to user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await isAdmin()
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id: userId } = await params
        const body = await request.json()
        const parsed = addCreditsSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { amount, type, description } = parsed.data

        await addCredits(
            userId,
            amount,
            type,
            description || `${type === 'bonus' ? 'בונוס מאדמין' : 'רכישת'} ${amount} קרדיטים`
        )

        return NextResponse.json({ message: 'Credits added', amount })
    } catch (error) {
        console.error('Error adding credits:', error)
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }
}
