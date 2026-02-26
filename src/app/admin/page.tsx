import { prisma } from '@/lib/db'
import { Users, Bot, MessageSquare, CreditCard, TrendingUp, TrendingDown, DollarSign, AlertTriangle, UserX, Megaphone } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    // Default values for robustness
    let stats = {
        totalUsers: 0, activeUsers: 0, frozenUsers: 0, blockedUsers: 0,
        totalBots: 0, activeBots: 0, totalConversations: 0, totalMessages: 0,
        totalLeads: 0, totalCredits: 0, monthlyRevenue: 0,
        totalTokens: 0, estimatedCostIls: 0,
        recentUsers: [] as any[],
        broadcasts: [] as any[]
    }

    try {
        const [
            totalUsersCount,
            activeUsersCount,
            frozenUsersCount,
            blockedUsersCount,
            totalBotsCount,
            activeBotsCount,
            totalConversationsCount,
            totalMessagesCount,
            totalLeadsCount,
            recentUsersList,
            broadcastsList,
        ] = await Promise.all([
            prisma.user.count().catch(e => { console.error('Error totalUsers:', e); return 0 }),
            prisma.user.count({ where: { status: 'active' } }).catch(e => { console.error('Error activeUsers:', e); return 0 }),
            prisma.user.count({ where: { status: 'frozen' } }).catch(e => { console.error('Error frozenUsers:', e); return 0 }),
            prisma.user.count({ where: { status: 'blocked' } }).catch(e => { console.error('Error blockedUsers:', e); return 0 }),
            prisma.bot.count().catch(e => { console.error('Error totalBots:', e); return 0 }),
            prisma.bot.count({ where: { status: 'active' } }).catch(e => { console.error('Error activeBots:', e); return 0 }),
            prisma.conversation.count().catch(e => { console.error('Error totalConversations:', e); return 0 }),
            prisma.message.count().catch(e => { console.error('Error totalMessages:', e); return 0 }),
            prisma.lead.count().catch(e => { console.error('Error totalLeads:', e); return 0 }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    plan: true,
                    status: true,
                    createdAt: true,
                    _count: { select: { bots: true } },
                },
            }).catch(e => { console.error('Error recentUsers:', e); return [] }),
            prisma.adminBroadcast.findMany({
                take: 3,
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            }).catch(e => { console.error('Error broadcasts:', e); return [] }),
        ])

        // Get total credits and revenue
        const creditsData = await prisma.creditBalance.aggregate({
            _sum: { balance: true },
        }).catch(e => { console.error('Error creditBalance aggregate:', e); return { _sum: { balance: 0 } } })

        const revenueData = await prisma.user.aggregate({
            _sum: { monthlyPayment: true },
            where: { status: 'active' },
        }).catch(e => { console.error('Error revenue aggregate:', e); return { _sum: { monthlyPayment: 0 } } })

        // AI cost estimation
        const tokenUsage = await prisma.conversation.aggregate({
            _sum: { tokensUsed: true },
        }).catch(e => { console.error('Error tokenUsage aggregate:', e); return { _sum: { tokensUsed: 0 } } })

        const totalTokensVal = tokenUsage?._sum?.tokensUsed || 0
        const estimatedCostUsd = (totalTokensVal / 1_000_000) * 0.3
        const estimatedCostIlsVal = estimatedCostUsd * 3.7

        stats = {
            totalUsers: totalUsersCount,
            activeUsers: activeUsersCount,
            frozenUsers: frozenUsersCount,
            blockedUsers: blockedUsersCount,
            totalBots: totalBotsCount,
            activeBots: activeBotsCount,
            totalConversations: totalConversationsCount,
            totalMessages: totalMessagesCount,
            totalLeads: totalLeadsCount,
            totalCredits: creditsData?._sum?.balance || 0,
            monthlyRevenue: revenueData?._sum?.monthlyPayment || 0,
            totalTokens: totalTokensVal,
            estimatedCostIls: estimatedCostIlsVal,
            recentUsers: recentUsersList,
            broadcasts: broadcastsList
        }
    } catch (error) {
        console.error('CRITICAL Error in AdminDashboard:', error)
    }

    const {
        totalUsers, activeUsers, frozenUsers, blockedUsers,
        totalBots, activeBots, totalConversations, totalMessages,
        totalLeads, totalCredits, monthlyRevenue,
        totalTokens, estimatedCostIls,
        recentUsers, broadcasts
    } = stats

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">סקירה כללית</h1>
                    <p className="text-slate-400">סטטיסטיקות המערכת בזמן אמת</p>
                </div>
                <Link href="/admin/broadcast" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition">
                    <Megaphone size={18} />
                    שלח הודעה
                </Link>
            </div>

            {/* Stats Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="text-blue-400" size={24} />}
                    label="משתמשים רשומים"
                    value={totalUsers}
                    subtitle={`${activeUsers} פעילים`}
                />
                <StatCard
                    icon={<DollarSign className="text-green-400" size={24} />}
                    label="הכנסות חודשיות"
                    value={`₪${monthlyRevenue.toLocaleString()}`}
                />
                <StatCard
                    icon={<Bot className="text-purple-400" size={24} />}
                    label="בוטים פעילים"
                    value={activeBots}
                    subtitle={`מתוך ${totalBots} סה"כ`}
                />
                <StatCard
                    icon={<CreditCard className="text-amber-400" size={24} />}
                    label="קרדיטים במערכת"
                    value={totalCredits}
                />
            </div>

            {/* Stats Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    icon={<MessageSquare className="text-cyan-400" size={24} />}
                    label="שיחות"
                    value={totalConversations}
                    subtitle={`${totalMessages.toLocaleString()} הודעות`}
                />
                <StatCard
                    icon={<DollarSign className="text-green-400" size={24} />}
                    label="עלות AI מוערכת"
                    value={`₪${estimatedCostIls.toFixed(2)}`}
                    subtitle={`${totalTokens.toLocaleString()} טוקנים`}
                />
                <StatCard
                    icon={<Users className="text-indigo-400" size={24} />}
                    label="סה״כ לידים"
                    value={totalLeads}
                />
                <StatCard
                    icon={<UserX className="text-orange-400" size={24} />}
                    label="חשבונות מוקפאים"
                    value={frozenUsers}
                    subtitle={frozenUsers > 0 ? 'דורש תשומת לב' : ''}
                />
                <StatCard
                    icon={<AlertTriangle className="text-red-400" size={24} />}
                    label="חשבונות חסומים"
                    value={blockedUsers}
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">משתמשים אחרונים</h3>
                    <div className="space-y-3">
                        {recentUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user.name || 'ללא שם'}</p>
                                        <p className="text-sm text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-slate-300">{user._count.bots} בוטים</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">סיכום מהיר</h3>
                    <div className="space-y-4">
                        <QuickStat label="סה״כ לידים" value={totalLeads} />
                        <QuickStat label="בוטים בטיוטה" value={totalBots - activeBots} />
                        <QuickStat label="ממוצע בוטים למשתמש" value={(totalBots / Math.max(totalUsers, 1)).toFixed(1)} />
                        <QuickStat label="ממוצע הודעות לשיחה" value={(totalMessages / Math.max(totalConversations, 1)).toFixed(1)} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    icon,
    label,
    value,
    subtitle,
    trend,
    trendUp
}: {
    icon: React.ReactNode
    label: string
    value: number | string
    subtitle?: string
    trend?: string
    trendUp?: boolean
}) {
    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <span className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                        {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold text-white">
                {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
            </p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
            {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
    )
}

function QuickStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
            <span className="text-slate-400">{label}</span>
            <span className="text-white font-semibold">
                {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
            </span>
        </div>
    )
}
