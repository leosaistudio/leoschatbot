import { prisma } from '@/lib/db'
import { BarChart3, Users, Bot, MessageSquare, CreditCard, TrendingUp } from 'lucide-react'

export default async function AdminAnalyticsPage() {
    // Get stats
    const [
        totalUsers,
        totalBots,
        totalConversations,
        totalMessages,
        totalLeads,
    ] = await Promise.all([
        prisma.user.count({ where: { role: 'user' } }),
        prisma.bot.count(),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.lead.count(),
    ])

    // Get users by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUsers = await prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
    })

    const recentBots = await prisma.bot.count({
        where: { createdAt: { gte: sevenDaysAgo } },
    })

    const recentConversations = await prisma.conversation.count({
        where: { startedAt: { gte: sevenDaysAgo } },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">אנליטיקה</h1>
                <p className="text-slate-400">סטטיסטיקות ומגמות המערכת</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={<Users className="text-blue-400" />} label="משתמשים" value={totalUsers} />
                <StatCard icon={<Bot className="text-purple-400" />} label="בוטים" value={totalBots} />
                <StatCard icon={<MessageSquare className="text-green-400" />} label="שיחות" value={totalConversations} />
                <StatCard icon={<MessageSquare className="text-cyan-400" />} label="הודעות" value={totalMessages} />
                <StatCard icon={<Users className="text-pink-400" />} label="לידים" value={totalLeads} />
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-green-400" />
                    פעילות ב-7 ימים אחרונים
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-slate-700/50 rounded-xl">
                        <p className="text-4xl font-bold text-blue-400">{recentUsers}</p>
                        <p className="text-slate-400 mt-2">משתמשים חדשים</p>
                    </div>
                    <div className="text-center p-6 bg-slate-700/50 rounded-xl">
                        <p className="text-4xl font-bold text-purple-400">{recentBots}</p>
                        <p className="text-slate-400 mt-2">בוטים חדשים</p>
                    </div>
                    <div className="text-center p-6 bg-slate-700/50 rounded-xl">
                        <p className="text-4xl font-bold text-green-400">{recentConversations}</p>
                        <p className="text-slate-400 mt-2">שיחות חדשות</p>
                    </div>
                </div>
            </div>

            {/* Averages */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">ממוצעים</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">בוטים למשתמש</span>
                        <span className="text-xl font-bold text-white">
                            {totalUsers > 0 ? (totalBots / totalUsers).toFixed(1) : 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">שיחות לבוט</span>
                        <span className="text-xl font-bold text-white">
                            {totalBots > 0 ? (totalConversations / totalBots).toFixed(1) : 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-400">הודעות לשיחה</span>
                        <span className="text-xl font-bold text-white">
                            {totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 text-center">
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    )
}
