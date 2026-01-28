import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET single plan
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const plan = await prisma.pricingPlan.findUnique({
            where: { id },
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        return NextResponse.json(plan)
    } catch (error) {
        console.error('Error fetching plan:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// PUT update plan
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const data = await req.json()

        const plan = await prisma.pricingPlan.update({
            where: { id },
            data: {
                name: data.name || data.nameHe,
                nameHe: data.nameHe,
                slug: data.slug,
                description: data.description,
                descriptionHe: data.descriptionHe,
                price: data.price,
                yearlyPrice: data.yearlyPrice,
                isPopular: data.isPopular || false,
                isBestValue: data.isBestValue || false,
                isActive: data.isActive !== false,
                sortOrder: data.sortOrder || 0,
                maxBots: data.maxBots || 1,
                maxMessages: data.maxMessages || 500,
                maxCharacters: data.maxCharacters || 5000000,
                maxCrawlPages: data.maxCrawlPages || 100,
                maxTeamMembers: data.maxTeamMembers || 1,
                features: data.features || [],
                featuresHe: data.featuresHe || [],
                hasLiveChat: data.hasLiveChat || false,
                hasTranslation: data.hasTranslation || false,
                hasAutoRetrain: data.hasAutoRetrain || false,
                hasIntegrations: data.hasIntegrations || false,
                hasPrioritySupport: data.hasPrioritySupport || false,
                hasRemoveBranding: data.hasRemoveBranding || false,
            },
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error('Error updating plan:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// DELETE plan
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        await prisma.pricingPlan.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting plan:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
