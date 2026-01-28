import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE - Delete a training source
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: botId, sourceId } = await params

        // Verify bot ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
        }

        // Delete the training source and its embeddings
        await prisma.trainingSource.delete({
            where: { id: sourceId, botId },
        })

        return NextResponse.json({ message: 'Training source deleted' })
    } catch (error) {
        console.error('Error deleting training source:', error)
        return NextResponse.json(
            { error: 'Failed to delete training source' },
            { status: 500 }
        )
    }
}
