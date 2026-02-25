import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

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
    const [loading, setLoading] = useState(false)
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
        // Poll for new notifications every 2 minutes
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
        // Optimistic update
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
        // Optimistic update
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

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return {
                    icon: <AlertTriangle className="text-amber-400 flex-shrink-0" size={16} />,
                    bg: 'bg-amber-500/10',
                }
            case 'update':
                return {
                    icon: <CheckCircle className="text-green-400 flex-shrink-0" size={16} />,
                    bg: 'bg-green-500/10',
                }
            default:
                return {
                    icon: <Info className="text-blue-400 flex-shrink-0" size={16} />,
                    bg: 'bg-blue-500/10',
                }
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition ${isOpen ? 'bg-slate-800 text-slate-200' : ''}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-left">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <h3 className="font-semibold text-white">התראות</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                                סמן הכל כנקרא
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <Bell className="mx-auto mb-3 opacity-20" size={32} />
                                <p className="text-sm">אין התראות חדשות</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {notifications.map((n) => {
                                    const styles = getTypeStyles(n.type)
                                    return (
                                        <div
                                            key={n.id}
                                            className={`px-4 py-4 hover:bg-slate-800/50 transition cursor-pointer relative group ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${styles.bg}`}>
                                                    {styles.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className={`font-medium text-sm truncate ${n.isRead ? 'text-slate-400' : 'text-white'}`}>
                                                            {n.title}
                                                        </h4>
                                                        {!n.isRead && (
                                                            <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                        {n.content}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                                                        {new Date(n.createdAt).toLocaleString('he-IL', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
