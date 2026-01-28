import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET active broadcasts for users to see
export async function GET() {
    try {
        const session = await auth()
        const userId = session?.user?.id

        // Get broadcasts that are either for everyone (null targetUserId) or for this specific user
        const broadcasts = await prisma.adminBroadcast.findMany({
            where: {
                isActive: true,
                OR: [
                    { targetUserId: null }, // Global broadcasts
                    { targetUserId: userId || 'none' }, // User-specific broadcasts
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                content: true,
                type: true,
                createdAt: true,
            },
        })

        return NextResponse.json(broadcasts)
    } catch (error) {
        console.error('Error fetching broadcasts:', error)
        return NextResponse.json([])
    }
}

