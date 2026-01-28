import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Upload and process a document file (TXT/DOCX)
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const botId = formData.get('botId') as string | null

        if (!file || !botId) {
            return NextResponse.json({ error: 'File and botId required' }, { status: 400 })
        }

        // Verify user owns the bot
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
        }

        // Validate file type
        const allowedTypes = [
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only TXT and DOCX are allowed.' }, { status: 400 })
        }

        // Max 5MB
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
        }

        let textContent = ''
        const fileName = file.name

        if (file.type === 'text/plain') {
            // Read TXT file directly
            textContent = await file.text()
        } else {
            // For DOCX, extract text (basic extraction)
            // In production, you'd use mammoth.js or similar
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)

            // Simple DOCX text extraction - look for text between XML tags
            // This is a simplified version - for production use mammoth.js
            const textDecoder = new TextDecoder('utf-8', { fatal: false })
            const rawText = textDecoder.decode(uint8Array)

            // Try to extract readable text from DOCX XML
            const textMatches = rawText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
            if (textMatches) {
                textContent = textMatches
                    .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1'))
                    .join(' ')
            } else {
                // Fallback: just extract visible ASCII text
                textContent = rawText.replace(/[^\x20-\x7E\u0590-\u05FF\u0600-\u06FF]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
            }
        }

        if (!textContent.trim()) {
            return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
        }

        // Create training source
        const source = await prisma.trainingSource.create({
            data: {
                botId,
                type: 'file',
                content: `[קובץ: ${fileName}]\n\n${textContent.slice(0, 50000)}`, // Limit to 50k chars
                status: 'pending',
            },
        })

        return NextResponse.json({ source })
    } catch (error) {
        console.error('Document upload error:', error)
        return NextResponse.json({ error: 'Failed to process document' }, { status: 500 })
    }
}
