import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowRight,
    Bot,
    BookOpen,
    Palette,
    Brain,
    Users,
    MessageSquare,
    Code,
    Settings2,
    Clock,
    Beaker
} from 'lucide-react'
import BotControlButton from '@/components/BotControlButton'

interface BotPageProps {
    params: Promise<{ id: string }>
}

export default async function BotSettingsPage({ params }: BotPageProps) {
    const session = await auth()
    if (!session?.user?.id) return null

    const { id } = await params

    const bot = await prisma.bot.findFirst({
        where: { id, userId: session.user.id },
        include: {
            _count: {
                select: { trainingSources: true, embeddings: true, conversations: true, leads: true },
            },
        },
    })

    if (!bot) notFound()

    const menuItems = [
        { href: `/dashboard/bots/${id}/training`, icon: BookOpen, label: 'אימון', desc: 'הוסף תוכן לאימון הבוט' },
        { href: `/dashboard/bots/${id}/playground`, icon: Beaker, label: 'אזור בדיקה', desc: 'בדוק את הבוט וראה מקורות' },
        { href: `/dashboard/bots/${id}/appearance`, icon: Palette, label: 'עיצוב', desc: 'התאם צבעים ומיקום' },
        { href: `/dashboard/bots/${id}/ai`, icon: Brain, label: 'כיוון AI', desc: 'פרומפט וטמפרטורה' },
        { href: `/dashboard/bots/${id}/hours`, icon: Clock, label: 'שעות עבודה', desc: 'הגדר שעות פעילות' },
        { href: `/dashboard/bots/${id}/leads`, icon: Users, label: 'לידים', desc: 'הגדרות טופס לידים' },
        { href: `/dashboard/bots/${id}/history`, icon: MessageSquare, label: 'היסטוריית שיחות', desc: 'צפה בשיחות קודמות' },
        { href: `/dashboard/bots/${id}/embed`, icon: Code, label: 'הטמעה', desc: 'קבל קוד להטמעה' },
        { href: `/dashboard/bots/${id}/settings`, icon: Settings2, label: 'הגדרות', desc: 'הגדרות מתקדמות' },
    ]

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/bots"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
                <ArrowRight size={20} />
                חזרה לבוטים
            </Link>

            {/* Bot Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Bot className="text-purple-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{bot.name}</h1>
                            <div className="flex items-center gap-4 mt-1">
                                <span className={`text-sm px-3 py-1 rounded-full ${bot.status === 'active' ? 'bg-green-100 text-green-700' :
                                    bot.status === 'training' ? 'bg-yellow-100 text-yellow-700' :
                                        bot.status === 'paused' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {bot.status === 'active' ? '🟢 פעיל' :
                                        bot.status === 'training' ? '🟡 באימון' :
                                            bot.status === 'paused' ? '🔴 מושהה' : '⚪ טיוטה'}
                                </span>
                                {bot.description && (
                                    <span className="text-slate-500 text-sm">{bot.description}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <BotControlButton botId={bot.id} currentStatus={bot.status} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{bot._count.trainingSources}</p>
                        <p className="text-sm text-slate-500">מקורות אימון</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{bot._count.embeddings}</p>
                        <p className="text-sm text-slate-500">קטעי תוכן</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{bot._count.conversations}</p>
                        <p className="text-sm text-slate-500">שיחות</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{bot._count.leads}</p>
                        <p className="text-sm text-slate-500">לידים</p>
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center transition">
                                <item.icon className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 group-hover:text-purple-700 transition">
                                    {item.label}
                                </h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
