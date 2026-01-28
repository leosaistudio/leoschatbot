import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Bot, CreditCard, MessageSquare, Users, Ban, CheckCircle, Plus } from 'lucide-react'
import UserActions from './UserActions'

interface UserPageProps {
    params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: UserPageProps) {
    const { id } = await params

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            creditBalance: true,
            creditHistory: {
                take: 10,
                orderBy: { createdAt: 'desc' },
            },
            bots: {
                include: {
                    _count: { select: { conversations: true, leads: true } },
                },
            },
        },
    })

    if (!user) notFound()

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
                <ArrowRight size={20} />
                חזרה למשתמשים
            </Link>

            {/* User Header */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{user.name || 'ללא שם'}</h1>
                            <p className="text-slate-400">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                        user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                    }`}>
                                    {user.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                    {user.status === 'active' ? 'פעיל' :
                                        user.status === 'suspended' ? 'מושהה' : 'חסום'}
                                </span>
                                {user.role === 'admin' && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                        Admin
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <UserActions user={user} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{user.bots.length}</p>
                        <p className="text-sm text-slate-400">בוטים</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{user.creditBalance?.balance || 0}</p>
                        <p className="text-sm text-slate-400">קרדיטים</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                            {user.bots.reduce((sum, bot) => sum + bot._count.conversations, 0)}
                        </p>
                        <p className="text-sm text-slate-400">שיחות</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                            {user.bots.reduce((sum, bot) => sum + bot._count.leads, 0)}
                        </p>
                        <p className="text-sm text-slate-400">לידים</p>
                    </div>
                </div>
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User's Bots */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Bot size={20} className="text-purple-400" />
                        הבוטים של המשתמש
                    </h3>

                    {user.bots.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">אין בוטים</p>
                    ) : (
                        <div className="space-y-3">
                            {user.bots.map((bot) => (
                                <div key={bot.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                            <Bot className="text-purple-400" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{bot.name}</p>
                                            <p className="text-xs text-slate-400">
                                                {bot._count.conversations} שיחות • {bot._count.leads} לידים
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${bot.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                            'bg-slate-600 text-slate-400'
                                        }`}>
                                        {bot.status === 'active' ? 'פעיל' : bot.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Credit History */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-amber-400" />
                        היסטוריית קרדיטים
                    </h3>

                    {user.creditHistory.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">אין היסטוריה</p>
                    ) : (
                        <div className="space-y-3">
                            {user.creditHistory.map((history) => (
                                <div key={history.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="text-white text-sm">{history.description}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(history.createdAt).toLocaleDateString('he-IL')}
                                        </p>
                                    </div>
                                    <span className={`font-medium ${history.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {history.amount > 0 ? '+' : ''}{history.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
