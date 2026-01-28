'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Bot,
    MessageSquare,
    Users,
    CreditCard,
    Settings,
    HelpCircle
} from 'lucide-react'

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'סקירה כללית' },
    { href: '/dashboard/bots', icon: Bot, label: 'הבוטים שלי' },
    { href: '/dashboard/live-chat', icon: MessageSquare, label: 'צ\'אט חי' },
    { href: '/dashboard/leads', icon: Users, label: 'לידים' },
    { href: '/dashboard/credits', icon: CreditCard, label: 'קרדיטים' },
    { href: '/dashboard/settings', icon: Settings, label: 'הגדרות' },
]

export default function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed right-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-50">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <span className="text-3xl">🤖</span>
                    <span className="text-xl font-bold">ChatBot AI</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Help */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                <Link
                    href="/dashboard/help"
                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
                >
                    <HelpCircle size={20} />
                    <span>עזרה ותמיכה</span>
                </Link>
            </div>
        </aside>
    )
}
