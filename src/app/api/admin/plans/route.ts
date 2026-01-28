import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET all plans
export async function GET() {
    try {
        const plans = await prisma.pricingPlan.findMany({
            orderBy: { sortOrder: 'asc' },
        })

        return NextResponse.json(plans)
    } catch (error) {
        console.error('Error fetching plans:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// POST create new plan
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await req.json()

        const plan = await prisma.pricingPlan.create({
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
        console.error('Error creating plan:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
