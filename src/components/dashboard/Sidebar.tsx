'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Bot,
    MessageSquare,
    Users,
    CreditCard,
    Settings,
    HelpCircle,
    Menu,
    X,
    Shield
} from 'lucide-react'

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'סקירה כללית' },
    { href: '/dashboard/bots', icon: Bot, label: 'הבוטים שלי' },
    { href: '/dashboard/live-chat', icon: MessageSquare, label: "צ'אט חי" },
    { href: '/dashboard/leads', icon: Users, label: 'לידים' },
    { href: '/dashboard/credits', icon: CreditCard, label: 'קרדיטים' },
    { href: '/dashboard/settings', icon: Settings, label: 'הגדרות' },
]

export default function DashboardSidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        // Check if user is admin
        fetch('/api/user/role')
            .then(res => res.json())
            .then(data => {
                if (data.role === 'admin') setIsAdmin(true)
            })
            .catch(() => { })
    }, [])

    const navContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-slate-700">
                <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                    <span className="text-3xl">🤖</span>
                    <span className="text-xl font-bold">ChatBot AI</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1 flex-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
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

            {/* Footer - Admin link + Help */}
            <div className="p-4 border-t border-slate-700 space-y-1">
                {isAdmin && (
                    <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 rounded-lg transition font-medium"
                    >
                        <Shield size={20} />
                        <span>פאנל ניהול</span>
                    </Link>
                )}
                <Link
                    href="/dashboard/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition"
                >
                    <HelpCircle size={20} />
                    <span>עזרה ותמיכה</span>
                </Link>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="fixed top-4 right-4 z-[60] p-2 bg-slate-900 text-white rounded-lg shadow-lg md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="פתח תפריט"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed right-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-[56] flex flex-col
                transition-transform duration-300
                ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
                md:translate-x-0
            `}>
                {navContent}
            </aside>
        </>
    )
}
