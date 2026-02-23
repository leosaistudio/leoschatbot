import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - Load user settings
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            companyName: true,
            phone: true,
            whatsappNumber: true,
            notifyEmail: true,
            webhookUrl: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
}

// PUT - Update user settings
export async function PUT(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tab, ...data } = body

    try {
        if (tab === 'profile') {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    name: data.name || null,
                    companyName: data.companyName || null,
                    phone: data.phone || null,
                    whatsappNumber: data.whatsappNumber || null,
                },
            })
        } else if (tab === 'notifications') {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    notifyEmail: data.notifyEmail ?? true,
                    webhookUrl: data.webhookUrl || null,
                },
            })
        } else if (tab === 'security') {
            // Verify current password
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { password: true },
            })

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            const isValid = await bcrypt.compare(data.currentPassword, user.password)
            if (!isValid) {
                return NextResponse.json({ error: 'הסיסמה הנוכחית שגויה' }, { status: 400 })
            }

            if (data.newPassword !== data.confirmPassword) {
                return NextResponse.json({ error: 'הסיסמאות לא תואמות' }, { status: 400 })
            }

            if (data.newPassword.length < 6) {
                return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }, { status: 400 })
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 12)
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Settings update error:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
