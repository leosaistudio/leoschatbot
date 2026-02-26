import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, Bot, MessageSquare, CreditCard, Search, ArrowLeft, Zap, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
    let usersWithStats: any[] = []
    try {
        // Get all users with their stats
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                creditBalance: true,
                bots: {
                    select: {
                        id: true,
                        _count: {
                            select: {
                                conversations: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        bots: true,
                    }
                }
            }
        })

        // Calculate total conversations and usage for each user
        usersWithStats = await Promise.all(users.map(async (user) => {
            // Aggregate tokens and credits used across all bots
            const usageStats = await prisma.conversation.aggregate({
                where: {
                    bot: { userId: user.id }
                },
                _sum: {
                    tokensUsed: true,
                    creditsUsed: true,
                },
                _count: {
                    id: true
                }
            }).catch(() => ({ _sum: { tokensUsed: 0, creditsUsed: 0 }, _count: { id: 0 } }))

            const totalConversations = usageStats._count?.id || 0
            const totalTokens = usageStats._sum?.tokensUsed || 0
            const totalCreditsUsed = usageStats._sum?.creditsUsed || 0

            // Estimated cost
            const estimatedCostUsd = (totalTokens / 1000000) * 0.5
            const estimatedCostIls = estimatedCostUsd * 3.7 // 3.7 NIS per USD

            return {
                ...user,
                stats: {
                    totalConversations,
                    totalTokens,
                    totalCreditsUsed,
                    estimatedCostIls
                }
            }
        }))
    } catch (error) {
        console.error('Error fetching admin customers stats:', error)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">ניהול לקוחות</h1>
                        <p className="text-slate-400">נתוני שימוש ויתרות קרדיטים של כל המשתמשים</p>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/80">
                                <th className="px-6 py-4 text-sm font-medium text-slate-400">לקוח</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">תוכנית</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">בוטים</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">שיחות</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">יתרת קרדיטים</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">ניצול קרדיטים</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">עלות AI מוערכת</th>
                                <th className="px-6 py-4 text-sm font-medium text-slate-400">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {usersWithStats.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{user.name || 'ללא שם'}</p>
                                                <p className="text-xs text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${user.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                                            user.plan === 'premium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {user.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-slate-300">
                                            <Bot size={14} className="text-slate-500" />
                                            {user._count.bots}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-slate-300">
                                            <MessageSquare size={14} className="text-slate-500" />
                                            {user.stats.totalConversations}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 font-bold text-white">
                                            <Zap size={14} className="text-amber-400" />
                                            {user.creditBalance?.balance || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-slate-300 font-medium">
                                            {user.stats.totalCreditsUsed}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-green-400 font-medium">
                                            <DollarSign size={14} />
                                            ₪{user.stats.estimatedCostIls.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition"
                                        >
                                            ניהול
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {usersWithStats.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p>לא נמצאו לקוחות במערכת</p>
                    </div>
                )}
            </div>
        </div>
    )
}
