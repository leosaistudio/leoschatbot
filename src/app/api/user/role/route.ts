import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET - Return the current user's role
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ role: 'guest' })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    return NextResponse.json({ role: user?.role || 'user' })
}
