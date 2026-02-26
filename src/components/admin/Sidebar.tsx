'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Bot,
    MessageSquare,
    CreditCard,
    Settings,
    Shield,
    BarChart3,
    Package,
    Megaphone
} from 'lucide-react'

const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'סקירה כללית' },
    { href: '/admin/users', icon: Users, label: 'משתמשים' },
    { href: '/admin/customers', icon: Users, label: 'ניהול לקוחות' },
    { href: '/admin/plans', icon: Package, label: 'מסלולים' },
    { href: '/admin/broadcast', icon: Megaphone, label: 'הודעות' },
    { href: '/admin/bots', icon: Bot, label: 'כל הבוטים' },
    { href: '/admin/conversations', icon: MessageSquare, label: 'שיחות' },
    { href: '/admin/credits', icon: CreditCard, label: 'קרדיטים' },
    { href: '/admin/analytics', icon: BarChart3, label: 'אנליטיקה' },
    { href: '/admin/settings', icon: Settings, label: 'הגדרות' },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed right-0 top-0 h-full w-64 bg-slate-950 text-white shadow-xl z-50 border-l border-slate-800">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <Shield size={20} />
                    </div>
                    <div>
                        <span className="text-lg font-bold">Admin Panel</span>
                        <p className="text-xs text-slate-400">ניהול מערכת</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Back to Dashboard */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition"
                >
                    <LayoutDashboard size={20} />
                    <span>חזרה לדשבורד</span>
                </Link>
            </div>
        </aside>
    )
}
