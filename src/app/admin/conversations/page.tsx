import { prisma } from '@/lib/db'
import { MessageSquare, Bot, Clock } from 'lucide-react'

export default async function AdminConversationsPage() {
    const conversations = await prisma.conversation.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50,
        include: {
            bot: {
                select: { name: true, user: { select: { name: true, email: true } } },
            },
            _count: { select: { messages: true } },
        },
    })

    const totalConversations = await prisma.conversation.count()
    const totalMessages = await prisma.message.count()
    const activeConversations = await prisma.conversation.count({
        where: { status: 'active' },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">כל השיחות</h1>
                <p className="text-slate-400">צפייה בשיחות מכל הבוטים במערכת</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="text-blue-400" size={24} />
                        <span className="text-slate-400">סה״כ שיחות</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalConversations}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-green-400" size={24} />
                        <span className="text-slate-400">שיחות פעילות</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{activeConversations}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="text-purple-400" size={24} />
                        <span className="text-slate-400">סה״כ הודעות</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalMessages}</p>
                </div>
            </div>

            {/* Conversations List */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">בוט</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">בעלים</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">הודעות</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">סטטוס</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">תאריך</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {conversations.map((conv) => (
                                <tr key={conv.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Bot className="text-purple-400" size={18} />
                                            <span className="text-white">{conv.bot.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {conv.bot.user.email}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {conv._count.messages}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${conv.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                conv.status === 'human_takeover' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-slate-600 text-slate-400'
                                            }`}>
                                            {conv.status === 'active' ? 'פעיל' :
                                                conv.status === 'human_takeover' ? 'אנושי' : 'סגור'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(conv.startedAt).toLocaleDateString('he-IL')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {conversations.length === 0 && (
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">אין שיחות עדיין</p>
                    </div>
                )}
            </div>
        </div>
    )
}
