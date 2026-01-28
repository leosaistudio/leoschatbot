import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

/**
 * Check if current user is an admin
 * Use in server components
 */
export async function requireAdmin() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, status: true },
    })

    if (!user || user.role !== 'admin') {
        redirect('/dashboard')
    }

    if (user.status !== 'active') {
        redirect('/login')
    }

    return session.user
}

/**
 * Check if user is admin (for API routes)
 * Returns user or null
 */
export async function isAdmin() {
    const session = await auth()

    if (!session?.user?.id) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, status: true },
    })

    if (!user || user.role !== 'admin' || user.status !== 'active') {
        return null
    }

    return user
}
