import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET all users for admin
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            where: { role: 'user' }, // Only regular users, not admins
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
                plan: true,
                createdAt: true,
                _count: {
                    select: { bots: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
