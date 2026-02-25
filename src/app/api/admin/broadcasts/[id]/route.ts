import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// PATCH - Update broadcast (toggle active)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await req.json()
        const { isActive } = data

        const broadcast = await prisma.adminBroadcast.update({
            where: { id: params.id },
            data: { isActive },
        })

        return NextResponse.json(broadcast)
    } catch (error) {
        console.error('Error updating broadcast:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// DELETE - Remove broadcast
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.adminBroadcast.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting broadcast:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
