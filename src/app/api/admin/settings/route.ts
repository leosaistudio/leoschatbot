import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/admin'
import * as fs from 'fs'
import * as path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '.admin-settings.json')

function readSettings(): Record<string, string> {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
        }
    } catch { }
    return { aiModel: 'gpt-4o-mini' }
}

function writeSettings(settings: Record<string, string>) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

// GET - Read admin settings
export async function GET() {
    const admin = await isAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const settings = readSettings()
    return NextResponse.json(settings)
}

// PUT - Update admin settings
export async function PUT(req: NextRequest) {
    const admin = await isAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const current = readSettings()
    const updated = { ...current, ...body }
    writeSettings(updated)

    return NextResponse.json({ success: true, settings: updated })
}
