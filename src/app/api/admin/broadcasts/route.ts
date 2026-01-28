import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET all broadcasts
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const broadcasts = await prisma.adminBroadcast.findMany({
            orderBy: { createdAt: 'desc' },
        })

        // Get target user emails for display
        const broadcastsWithUsers = await Promise.all(
            broadcasts.map(async (b) => {
                if (b.targetUserId) {
                    const user = await prisma.user.findUnique({
                        where: { id: b.targetUserId },
                        select: { email: true },
                    })
                    return { ...b, targetUserEmail: user?.email }
                }
                return b
            })
        )

        return NextResponse.json(broadcastsWithUsers)
    } catch (error) {
        console.error('Error fetching broadcasts:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// POST create new broadcast
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, content, type, targetUserId } = await req.json()

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
        }

        const broadcast = await prisma.adminBroadcast.create({
            data: {
                title,
                content,
                type: type || 'info',
                targetUserId: targetUserId || null,
                isActive: true,
            },
        })

        return NextResponse.json(broadcast)
    } catch (error) {
        console.error('Error creating broadcast:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}


