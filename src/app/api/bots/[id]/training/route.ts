import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const addSourceSchema = z.object({
    type: z.enum(['url', 'text', 'qa', 'info']),
    content: z.string().min(1),
})

// POST - Add training source
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params
        const body = await request.json()
        const parsed = addSourceSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        const { type, content } = parsed.data

        // Create training source
        const source = await prisma.trainingSource.create({
            data: {
                botId,
                type,
                content,
                status: 'pending',
            },
        })

        // Trigger background job to process
        processTrainingSource(source.id, botId)

        return NextResponse.json(source, { status: 201 })
    } catch (error) {
        console.error('Error adding training source:', error)
        return NextResponse.json({ error: 'שגיאה בהוספת המקור' }, { status: 500 })
    }
}

// Background processing (simplified - in production use a job queue)
async function processTrainingSource(sourceId: string, botId: string) {
    try {
        // Update status to processing
        await prisma.trainingSource.update({
            where: { id: sourceId },
            data: { status: 'processing' },
        })

        const source = await prisma.trainingSource.findUnique({
            where: { id: sourceId },
        })

        if (!source) return

        // Import services dynamically to avoid circular deps
        const { crawlUrl } = await import('@/services/crawler')
        const { storeEmbeddings } = await import('@/services/embeddings')

        if (source.type === 'url') {
            // Crawl the URL
            const result = await crawlUrl(source.content)
            // Generate and store embeddings
            await storeEmbeddings(botId, sourceId, result.content)
        } else if (source.type === 'text' || source.type === 'qa' || source.type === 'info') {
            // Store text/qa/info embeddings directly
            await storeEmbeddings(botId, sourceId, source.content)
        }

        // Update status to completed
        await prisma.trainingSource.update({
            where: { id: sourceId },
            data: { status: 'completed' },
        })

    } catch (error) {
        console.error('Error processing training source:', error)

        // Update status to failed
        await prisma.trainingSource.update({
            where: { id: sourceId },
            data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        })
    }
}

