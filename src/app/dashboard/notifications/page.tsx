'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, Check } from 'lucide-react'

interface Notification {
    id: string
    title: string
    content: string
    type: string
    isRead: boolean
    createdAt: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => setNotifications(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        })
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true })
        })
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />
            case 'update': return <CheckCircle className="text-green-500" size={20} />
            default: return <Info className="text-blue-500" size={20} />
        }
    }

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-amber-50 border-amber-200'
            case 'update': return 'bg-green-50 border-green-200'
            default: return 'bg-blue-50 border-blue-200'
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">התראות</h1>
                    <p className="text-slate-500 text-sm">
                        {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'כל ההתראות נקראו'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition"
                    >
                        <Check size={16} />
                        סמן הכל כנקרא
                    </button>
                )}
            </div>

            {/* Notifications list */}
            {notifications.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                    <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 mb-2">אין התראות</h2>
                    <p className="text-slate-400">כשתקבל הודעות מהמערכת, הן יופיעו כאן</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`bg-white rounded-xl border p-5 transition ${!n.isRead ? 'border-purple-200 shadow-sm' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${getTypeBg(n.type)}`}>
                                    {getTypeIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {n.title}
                                            </h3>
                                            {!n.isRead && <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(n.createdAt).toLocaleString('he-IL', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {n.content}
                                    </p>
                                    {!n.isRead && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium transition"
                                        >
                                            סמן כנקרא ✓
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
