import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { addCredits } from '@/services/credits'

const registerSchema = z.object({
    email: z.string().email('אימייל לא תקין'),
    password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
    companyName: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password, name, companyName } = parsed.data

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'משתמש עם אימייל זה כבר קיים' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                companyName,
            },
        })

        // Give initial bonus credits
        await addCredits(user.id, 100, 'bonus', 'קרדיטים התחלתיים - ברוכים הבאים!')

        return NextResponse.json(
            {
                message: 'המשתמש נוצר בהצלחה',
                userId: user.id
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'שגיאה ביצירת המשתמש' },
            { status: 500 }
        )
    }
}
