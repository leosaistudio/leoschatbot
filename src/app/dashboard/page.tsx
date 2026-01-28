import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCreditBalance } from '@/services/credits'
import Link from 'next/link'
import { Bot, MessageSquare, Users, Zap, Plus, ArrowLeft } from 'lucide-react'
import NewsTicker from '@/components/NewsTicker'
import CurrentPlanCard from '@/components/CurrentPlanCard'

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    // Get user's stats
    const [bots, credits, totalConversations, totalLeads, creditsUsedResult] = await Promise.all([
        prisma.bot.findMany({
            where: { userId: session.user.id },
            select: { id: true, name: true, status: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
        }),
        getCreditBalance(session.user.id),
        prisma.conversation.count({
            where: { bot: { userId: session.user.id } },
        }),
        prisma.lead.count({
            where: { bot: { userId: session.user.id } },
        }),
        prisma.conversation.aggregate({
            where: { bot: { userId: session.user.id } },
            _sum: { creditsUsed: true },
        }),
    ])

    const activeBots = bots.filter(b => b.status === 'active').length
    const totalCreditsUsed = creditsUsedResult._sum.creditsUsed || 0

    return (
        <div className="space-y-6">
            {/* News Ticker */}
            <NewsTicker />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Bot className="text-purple-600" />}
                    label="בוטים פעילים"
                    value={activeBots}
                    subtext={`מתוך ${bots.length} בוטים`}
                    color="purple"
                />
                <StatCard
                    icon={<MessageSquare className="text-blue-600" />}
                    label="שיחות"
                    value={totalConversations}
                    subtext="סה״כ שיחות"
                    color="blue"
                />
                <StatCard
                    icon={<Users className="text-green-600" />}
                    label="לידים"
                    value={totalLeads}
                    subtext="לידים שנאספו"
                    color="green"
                />
                <StatCard
                    icon={<Zap className="text-amber-600" />}
                    label="קרדיטים"
                    value={credits}
                    subtext={`${totalCreditsUsed} נוצלו`}
                    color="amber"
                />
            </div>

            {/* Current Plan Card */}
            <CurrentPlanCard />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">פעולות מהירות</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/dashboard/bots/new"
                        className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
                    >
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Plus className="text-white" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">צור בוט חדש</p>
                            <p className="text-sm text-slate-500">הוסף צ'אטבוט לאתר שלך</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/live-chat"
                        className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <MessageSquare className="text-white" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">צ'אט חי</p>
                            <p className="text-sm text-slate-500">צפה בשיחות בזמן אמת</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/credits"
                        className="flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                    >
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                            <Zap className="text-white" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">הוסף קרדיטים</p>
                            <p className="text-sm text-slate-500">טען עוד קרדיטים לחשבון</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Bots */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">הבוטים שלי</h3>
                    <Link
                        href="/dashboard/bots"
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                        הצג הכל
                        <ArrowLeft size={16} />
                    </Link>
                </div>

                {bots.length === 0 ? (
                    <div className="text-center py-8">
                        <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">עוד לא יצרת בוטים</p>
                        <Link
                            href="/dashboard/bots/new"
                            className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            צור בוט ראשון
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bots.map((bot) => (
                            <Link
                                key={bot.id}
                                href={`/dashboard/bots/${bot.id}`}
                                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Bot className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{bot.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {bot.status === 'active' ? '🟢 פעיל' :
                                                bot.status === 'training' ? '🟡 באימון' :
                                                    bot.status === 'paused' ? '🔴 מושהה' : '⚪ טיוטה'}
                                        </p>
                                    </div>
                                </div>
                                <ArrowLeft className="text-slate-400" size={20} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({
    icon,
    label,
    value,
    subtext,
    color
}: {
    icon: React.ReactNode
    label: string
    value: number
    subtext: string
    color: 'purple' | 'blue' | 'green' | 'amber'
}) {
    const bgColors = {
        purple: 'bg-purple-50',
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        amber: 'bg-amber-50',
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${bgColors[color]} rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
                <span className="text-slate-500 text-sm">{label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{value.toLocaleString('he-IL')}</p>
            <p className="text-sm text-slate-400 mt-1">{subtext}</p>
        </div>
    )
}
