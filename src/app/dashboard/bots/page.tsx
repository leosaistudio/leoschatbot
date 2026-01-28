import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Bot, Plus, Settings, BarChart2, ArrowLeft } from 'lucide-react'

export default async function BotsPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    const bots = await prisma.bot.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { conversations: true, leads: true },
            },
        },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">הבוטים שלי</h1>
                    <p className="text-slate-500">נהל את הצ'אטבוטים שלך</p>
                </div>
                <Link
                    href="/dashboard/bots/new"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                    <Plus size={20} />
                    צור בוט חדש
                </Link>
            </div>

            {/* Bots Grid */}
            {bots.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">אין בוטים עדיין</h3>
                    <p className="text-slate-500 mb-6">צור את הצ'אטבוט הראשון שלך ותתחיל לאסוף לידים!</p>
                    <Link
                        href="/dashboard/bots/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                    >
                        <Plus size={20} />
                        צור בוט ראשון
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map((bot) => (
                        <div
                            key={bot.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
                        >
                            {/* Bot Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <Bot className="text-purple-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{bot.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${bot.status === 'active' ? 'bg-green-100 text-green-700' :
                                                bot.status === 'training' ? 'bg-yellow-100 text-yellow-700' :
                                                    bot.status === 'paused' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                            }`}>
                                            {bot.status === 'active' ? 'פעיל' :
                                                bot.status === 'training' ? 'באימון' :
                                                    bot.status === 'paused' ? 'מושהה' : 'טיוטה'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-slate-100">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">{bot._count.conversations}</p>
                                    <p className="text-xs text-slate-500">שיחות</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">{bot._count.leads}</p>
                                    <p className="text-xs text-slate-500">לידים</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/dashboard/bots/${bot.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition text-sm"
                                >
                                    <Settings size={16} />
                                    הגדרות
                                </Link>
                                <Link
                                    href={`/dashboard/bots/${bot.id}/analytics`}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm"
                                >
                                    <BarChart2 size={16} />
                                    סטטיסטיקות
                                </Link>
                            </div>
                        </div>
                    ))}

                    {/* Add New Bot Card */}
                    <Link
                        href="/dashboard/bots/new"
                        className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-purple-50 transition min-h-[250px]"
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                            <Plus className="text-purple-600" size={24} />
                        </div>
                        <p className="font-medium text-slate-700">צור בוט חדש</p>
                        <p className="text-sm text-slate-500">הוסף צ'אטבוט לאתר נוסף</p>
                    </Link>
                </div>
            )}
        </div>
    )
}
