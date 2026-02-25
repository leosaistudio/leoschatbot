import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { notifyAdminDailySummary } from '@/services/notifications'

// POST - Send daily summary email to admin
// curl -X POST "https://chatbot.leos.co.il/api/cron/daily-admin-summary?secret=YOUR_SECRET"
export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Get stats for all users
        const users = await prisma.user.findMany({
            include: {
                creditBalance: true,
                _count: {
                    select: { bots: true }
                }
            }
        })

        // 2. Get aggregate system stats for the last 24 hours
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const [todayConvs, todayLeads, totalUsage] = await Promise.all([
            prisma.conversation.count({
                where: { startedAt: { gte: last24h } }
            }),
            prisma.lead.count({
                where: { createdAt: { gte: last24h } }
            }),
            prisma.conversation.aggregate({
                _sum: {
                    tokensUsed: true,
                    creditsUsed: true
                }
            })
        ])

        const totalTokens = totalUsage._sum.tokensUsed || 0
        const totalCreditsUsed = totalUsage._sum.creditsUsed || 0

        // Cost estimation: $0.5 per 1M tokens (gpt-4o-mini is cheaper, this is a safe upper bound for overhead)
        const estimatedCostUsd = (totalTokens / 1000000) * 0.5
        const estimatedCostIls = estimatedCostUsd * 3.7

        // 3. Format user data for the email
        const userData = users.map(u => ({
            name: u.name || 'ללא שם',
            email: u.email,
            plan: u.plan,
            bots: u._count.bots,
            balance: u.creditBalance?.balance || 0
        }))

        // 4. Send email
        const adminEmail = 'office@leos.co.il'
        await notifyAdminDailySummary(adminEmail, {
            totalUsers: users.length,
            todayConvs,
            todayLeads,
            totalCreditsUsed,
            estimatedCostIls,
            users: userData
        })

        return NextResponse.json({
            success: true,
            stats: { totalUsers: users.length, todayConvs, todayLeads, estimatedCostIls }
        })
    } catch (error) {
        console.error('Daily summary cron error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
