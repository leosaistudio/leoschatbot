import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET current user's plan info
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get user with bot count
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { bots: true },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Try to get plan details if user has a plan assigned
        const userPlanSlug = (user as Record<string, unknown>).plan as string | undefined
        let planDetails = null

        if (userPlanSlug) {
            planDetails = await prisma.pricingPlan.findFirst({
                where: { slug: userPlanSlug },
            })
        }

        // Get message count for this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const messagesThisMonth = await prisma.message.count({
            where: {
                conversation: {
                    bot: { userId },
                },
                createdAt: { gte: startOfMonth },
                role: 'assistant',
            },
        })

        // Default free plan limits if no plan found
        const defaultPlan = {
            slug: 'free',
            name: 'Free',
            nameHe: 'חינם',
            price: 0,
            maxBots: 1,
            maxMessages: 500,
            maxCharacters: 1000000,
            maxCrawlPages: 50,
            maxTeamMembers: 1,
        }

        const plan = planDetails || defaultPlan

        return NextResponse.json({
            slug: plan.slug,
            name: plan.name,
            nameHe: plan.nameHe,
            price: plan.price,
            maxBots: plan.maxBots,
            maxMessages: plan.maxMessages,
            usedMessages: messagesThisMonth,
            usedBots: user._count.bots,
            features: [],
        })
    } catch (error) {
        console.error('Error fetching user plan:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

