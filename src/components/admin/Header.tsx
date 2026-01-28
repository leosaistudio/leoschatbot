'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Shield } from 'lucide-react'

interface HeaderProps {
    user: {
        name?: string | null
        email?: string | null
    }
}

export default function AdminHeader({ user }: HeaderProps) {
    return (
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Shield className="text-purple-500" size={20} />
                <h2 className="text-lg font-semibold text-white">
                    פאנל ניהול מרכזי
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Admin Badge */}
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-full">
                    Admin
                </span>

                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="text-left">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                        title="התנתק"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    )
}
