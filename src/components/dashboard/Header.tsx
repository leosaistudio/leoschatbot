'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

interface HeaderProps {
    user: {
        name?: string | null
        email?: string | null
    }
}

export default function DashboardHeader({ user }: HeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            {/* On mobile, add left padding so the hamburger button doesn't overlap */}
            <div className="pr-10 md:pr-0">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">
                    שלום, {user.name || 'משתמש'}! 👋
                </h2>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-500 max-w-[140px] truncate">{user.email}</p>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="התנתק"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    )
}
