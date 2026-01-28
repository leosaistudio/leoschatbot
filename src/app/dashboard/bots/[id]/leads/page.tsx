import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, Mail, Phone, Calendar, ArrowRight } from 'lucide-react'

interface LeadsPageProps {
    params: Promise<{ id: string }>
}

export default async function BotLeadsPage({ params }: LeadsPageProps) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const { id } = await params

    // Get bot and verify ownership
    const bot = await prisma.bot.findFirst({
        where: { id, userId: session.user.id },
    })

    if (!bot) notFound()

    // Get leads for this bot
    const leads = await prisma.lead.findMany({
        where: { botId: id },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Link href={`/dashboard/bots/${id}`} className="text-purple-600 hover:underline text-sm mb-2 inline-flex items-center gap-1">
                    <ArrowRight size={16} />
                    חזרה להגדרות הבוט
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-purple-600" />
                    לידים - {bot.name}
                </h1>
                <p className="text-slate-500">{leads.length} לידים נאספו</p>
            </div>

            {leads.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">אין לידים עדיין</h3>
                    <p className="text-slate-500">כשמבקרים ישאירו פרטים דרך הבוט, הם יופיעו כאן</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">שם</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">אימייל</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">טלפון</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">תאריך</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                                                {lead.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {lead.name || 'ללא שם'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.email ? (
                                            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                                                <Mail size={16} />
                                                {lead.email}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.phone ? (
                                            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-green-600 hover:underline">
                                                <Phone size={16} />
                                                {lead.phone}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar size={14} />
                                            {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
