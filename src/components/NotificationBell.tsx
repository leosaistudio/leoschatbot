'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'update' | string
    isRead: boolean
    createdAt: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 120000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            })
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="text-amber-500" size={16} />
            case 'update':
                return <CheckCircle className="text-green-500" size={16} />
            default:
                return <Info className="text-blue-500" size={16} />
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">התראות</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-purple-600 hover:text-purple-700 transition font-medium"
                                >
                                    סמן הכל כנקרא
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications - show max 5 */}
                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <Bell className="mx-auto mb-2 opacity-30" size={28} />
                                <p className="text-sm">אין התראות</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.slice(0, 5).map((n) => (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 hover:bg-slate-50 transition cursor-pointer ${!n.isRead ? 'bg-purple-50/50' : ''}`}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex-shrink-0">{getTypeIcon(n.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`text-sm font-medium ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>
                                                        {n.title}
                                                    </h4>
                                                    {!n.isRead && <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                                    {n.content}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(n.createdAt).toLocaleString('he-IL', {
                                                        day: '2-digit', month: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer - Link to full notifications page */}
                    {notifications.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50">
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="block text-center py-3 text-sm text-purple-600 hover:text-purple-700 font-medium transition"
                            >
                                הצג את כל ההתראות →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
