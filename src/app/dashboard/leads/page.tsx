import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Users, Mail, Phone, Globe, Calendar } from 'lucide-react'

export default async function LeadsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    // Get all leads for user's bots
    const leads = await prisma.lead.findMany({
        where: {
            bot: { userId: session.user.id },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            bot: { select: { name: true } },
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">לידים</h1>
                    <p className="text-slate-500">רשימת כל הלידים שנאספו מהבוטים שלך</p>
                </div>
                <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
                    {leads.length} לידים
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">
                        אין לידים עדיין
                    </h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        כשמבקרים ישאירו את פרטיהם דרך הבוט, הם יופיעו כאן
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">שם</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">אימייל</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">טלפון</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">בוט</th>
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
                                    <td className="px-6 py-4 text-slate-600">
                                        {lead.bot.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(lead.createdAt).toLocaleDateString('he-IL')}
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
