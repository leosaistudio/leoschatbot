import { prisma } from '@/lib/db'
import { CreditCard, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminCreditsPage() {
    // Get all users with their credit info
    const users = await prisma.user.findMany({
        where: { role: 'user' },
        orderBy: { createdAt: 'desc' },
        include: {
            creditBalance: true,
            creditHistory: {
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
        },
    })

    // Calculate totals
    const totalCredits = users.reduce((sum, u) => sum + (u.creditBalance?.balance || 0), 0)
    const totalUsed = await prisma.creditHistory.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
    })
    const totalPurchased = await prisma.creditHistory.aggregate({
        where: { type: 'purchase' },
        _sum: { amount: true },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">ניהול קרדיטים</h1>
                <p className="text-slate-400">צפייה וניהול קרדיטים של כל המשתמשים</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="text-amber-400" size={24} />
                        <span className="text-slate-400">קרדיטים זמינים במערכת</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalCredits.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-red-400" size={24} />
                        <span className="text-slate-400">סה״כ נוצלו</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{Math.abs(totalUsed._sum.amount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Plus className="text-green-400" size={24} />
                        <span className="text-slate-400">סה״כ נרכשו</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{(totalPurchased._sum.amount || 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Users Credits Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">קרדיטים לפי משתמש</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">משתמש</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">יתרה</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">{user.name || 'ללא שם'}</p>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xl font-bold text-amber-400">
                                            {user.creditBalance?.balance || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition"
                                        >
                                            הוסף קרדיטים
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
