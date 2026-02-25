import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET - List all broadcasts
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const broadcasts = await prisma.adminBroadcast.findMany({
            orderBy: { createdAt: 'desc' },
        })

        // Fetch emails for target users if any
        const userIds = broadcasts.filter(b => b.targetUserId).map(b => b.targetUserId as string)
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true }
        })

        const broadcastsWithEmails = broadcasts.map(b => ({
            ...b,
            targetUserEmail: users.find(u => u.id === b.targetUserId)?.email
        }))

        return NextResponse.json(broadcastsWithEmails)
    } catch (error) {
        console.error('Error fetching broadcasts:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// POST - Create new broadcast
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await req.json()
        const { title, content, type, targetUserId } = data

        const broadcast = await prisma.adminBroadcast.create({
            data: {
                title,
                content,
                type: type || 'info',
                targetUserId: targetUserId || null,
                isActive: true
            },
        })

        // Also create actual Notification records for users to see in their bell
        if (targetUserId) {
            // Unicast
            await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    title,
                    content,
                    type: type || 'info',
                }
            })
        } else {
            // Broadcast - We could create for all users, but that's heavy.
            // Better to show global broadcasts in the bell by querying AdminBroadcast where targetUserId is null
            // and comparing with a "lastReadGlobalBroadcastAt" or creating on demand.
            // For now, let's create notifications for all ACTIVE users so they have them in their history.
            // If the user count is very large, this should be done in a background job or deferred.
            const users = await prisma.user.findMany({
                where: { status: 'active' },
                select: { id: true }
            })

            await prisma.notification.createMany({
                data: users.map(u => ({
                    userId: u.id,
                    title,
                    content,
                    type: type || 'info',
                }))
            })
        }

        return NextResponse.json(broadcast)
    } catch (error) {
        console.error('Error creating broadcast:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
