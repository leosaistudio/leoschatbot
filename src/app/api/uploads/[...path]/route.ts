import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const filename = path.join('/')

        // Security: prevent path traversal
        if (filename.includes('..') || filename.includes('~')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
        }

        const filepath = join(process.cwd(), 'public', 'uploads', filename)

        if (!existsSync(filepath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const buffer = await readFile(filepath)
        const ext = filename.split('.').pop()?.toLowerCase() || ''
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Error serving upload:', error)
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
    }
}
