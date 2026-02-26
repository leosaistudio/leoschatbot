import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, Search, MoreVertical, Bot, CreditCard, Ban, CheckCircle } from 'lucide-react'

export default async function AdminUsersPage() {
    let users: any[] = []
    try {
        users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                creditBalance: true,
                _count: {
                    select: { bots: true, creditHistory: true },
                },
            },
        })
    } catch (error) {
        console.error('Error fetching admin users:', error)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">ניהול משתמשים</h1>
                    <p className="text-slate-400">{users.length} משתמשים רשומים</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">משתמש</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">סטטוס</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">בוטים</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">קרדיטים</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">תאריך הרשמה</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.name || 'ללא שם'}</p>
                                                <p className="text-sm text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                            user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {user.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                                            {user.status === 'active' ? 'פעיל' :
                                                user.status === 'suspended' ? 'מושהה' : 'חסום'}
                                        </span>
                                        {user.role === 'admin' && (
                                            <span className="mr-2 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                                Admin
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Bot size={16} className="text-slate-500" />
                                            {user._count.bots}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <CreditCard size={16} className="text-slate-500" />
                                            {user.creditBalance?.balance || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                                        >
                                            פרטים
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">אין משתמשים עדיין</p>
                    </div>
                )}
            </div>
        </div>
    )
}
