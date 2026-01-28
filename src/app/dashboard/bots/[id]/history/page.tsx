import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { History, MessageSquare, ArrowRight, User, Bot, Zap } from 'lucide-react'
import ConversationSummary from './ConversationSummary'

interface HistoryPageProps {
    params: Promise<{ id: string }>
}

export default async function BotHistoryPage({ params }: HistoryPageProps) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const { id } = await params

    // Get bot and verify ownership
    const bot = await prisma.bot.findFirst({
        where: { id, userId: session.user.id },
    })

    if (!bot) notFound()

    // Get conversations for this bot
    const conversations = await prisma.conversation.findMany({
        where: { botId: id },
        orderBy: { startedAt: 'desc' },
        select: {
            id: true,
            visitorId: true,
            visitorName: true,
            visitorEmail: true,
            status: true,
            startedAt: true,
            pageUrl: true,
            creditsUsed: true,
            summary: true,
            sentiment: true,
            messages: {
                take: 2,
                orderBy: { createdAt: 'asc' },
            },
            _count: { select: { messages: true } },
        },
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Link href={`/dashboard/bots/${id}`} className="text-purple-600 hover:underline text-sm mb-2 inline-flex items-center gap-1">
                    <ArrowRight size={16} />
                    חזרה להגדרות הבוט
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="text-purple-600" />
                    היסטוריית שיחות - {bot.name}
                </h1>
                <p className="text-slate-500">{conversations.length} שיחות</p>
            </div>

            {conversations.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">אין שיחות עדיין</h3>
                    <p className="text-slate-500">כשמבקרים ידברו עם הבוט, השיחות יופיעו כאן</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {conversations.map((conv) => (
                        <div key={conv.id} className="bg-white rounded-xl border border-slate-200 p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <User className="text-slate-500" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {conv.visitorName || 'מבקר אנונימי'}
                                        </p>
                                        {conv.visitorEmail && (
                                            <p className="text-sm text-slate-500">{conv.visitorEmail}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className={`text-xs px-2 py-1 rounded-full ${conv.status === 'active' ? 'bg-green-100 text-green-700' :
                                        conv.status === 'human_takeover' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {conv.status === 'active' ? 'פעיל' :
                                            conv.status === 'human_takeover' ? 'אנושי' : 'סגור'}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(conv.startedAt).toLocaleString('he-IL')}
                                    </p>
                                </div>
                            </div>

                            {/* Messages Preview */}
                            <div className="space-y-2 mb-4">
                                {conv.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2 ${msg.role === 'user' ? '' : 'flex-row-reverse'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${msg.role === 'user'
                                            ? 'bg-slate-200 text-slate-600'
                                            : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                        </div>
                                        <div className={`text-sm py-2 px-3 rounded-lg max-w-md ${msg.role === 'user'
                                            ? 'bg-slate-100 text-slate-800'
                                            : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AI Summary */}
                            <ConversationSummary
                                conversationId={conv.id}
                                currentSummary={conv.summary}
                                currentSentiment={conv.sentiment}
                            />

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span>{conv._count.messages} הודעות</span>
                                    {conv.creditsUsed > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Zap size={14} />
                                            {conv.creditsUsed} קרדיטים
                                        </span>
                                    )}
                                </div>
                                {conv.pageUrl && (
                                    <span className="text-xs text-slate-400 truncate max-w-xs">
                                        {conv.pageUrl}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

