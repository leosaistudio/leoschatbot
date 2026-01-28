import { prisma } from '@/lib/db'
import { Bot, Search, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function AdminBotsPage() {
    const bots = await prisma.bot.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true, email: true },
            },
            _count: {
                select: { conversations: true, leads: true, embeddings: true },
            },
        },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">כל הבוטים</h1>
                <p className="text-slate-400">{bots.length} בוטים במערכת</p>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">בוט</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">בעלים</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">סטטוס</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">שיחות</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">לידים</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">אימון</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {bots.map((bot) => (
                                <tr key={bot.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                                <Bot className="text-purple-400" size={18} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{bot.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{bot.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white text-sm">{bot.user.name || 'ללא שם'}</p>
                                            <p className="text-xs text-slate-400">{bot.user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${bot.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                bot.status === 'training' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    bot.status === 'paused' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-slate-600 text-slate-400'
                                            }`}>
                                            {bot.status === 'active' ? 'פעיל' :
                                                bot.status === 'training' ? 'באימון' :
                                                    bot.status === 'paused' ? 'מושהה' : 'טיוטה'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {bot._count.conversations}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {bot._count.leads}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {bot._count.embeddings} קטעים
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {bots.length === 0 && (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">אין בוטים עדיין</p>
                    </div>
                )}
            </div>
        </div>
    )
}
