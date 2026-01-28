'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

interface Broadcast {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'update'
    createdAt: string
}

export default function NotificationBell() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [readIds, setReadIds] = useState<string[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Load read notifications from localStorage
        const savedRead = localStorage.getItem('readBroadcasts')
        if (savedRead) {
            setReadIds(JSON.parse(savedRead))
        }

        // Fetch broadcasts
        fetch('/api/broadcasts')
            .then((res) => res.json())
            .then((data) => setBroadcasts(data))
            .catch(console.error)
    }, [])

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = (id: string) => {
        const newReadIds = [...readIds, id]
        setReadIds(newReadIds)
        localStorage.setItem('readBroadcasts', JSON.stringify(newReadIds))
    }

    const markAllAsRead = () => {
        const allIds = broadcasts.map((b) => b.id)
        setReadIds(allIds)
        localStorage.setItem('readBroadcasts', JSON.stringify(allIds))
    }

    const unreadCount = broadcasts.filter((b) => !readIds.includes(b.id)).length

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return {
                    icon: <AlertTriangle className="text-amber-400 flex-shrink-0" size={16} />,
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                }
            case 'update':
                return {
                    icon: <CheckCircle className="text-green-400 flex-shrink-0" size={16} />,
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/20',
                }
            default:
                return {
                    icon: <Info className="text-blue-400 flex-shrink-0" size={16} />,
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                }
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                        <h3 className="font-semibold text-white">התראות</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-purple-400 hover:text-purple-300 transition"
                            >
                                סמן הכל כנקרא
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {broadcasts.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <Bell className="mx-auto mb-2 text-slate-600" size={24} />
                                <p className="text-sm">אין התראות חדשות</p>
                            </div>
                        ) : (
                            broadcasts.map((broadcast) => {
                                const isRead = readIds.includes(broadcast.id)
                                const styles = getTypeStyles(broadcast.type)

                                return (
                                    <div
                                        key={broadcast.id}
                                        className={`px-4 py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition cursor-pointer ${!isRead ? 'bg-slate-700/30' : ''
                                            }`}
                                        onClick={() => markAsRead(broadcast.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${styles.bg}`}>
                                                {styles.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-medium text-sm ${isRead ? 'text-slate-400' : 'text-white'}`}>
                                                        {broadcast.title}
                                                    </h4>
                                                    {!isRead && (
                                                        <span className="w-2 h-2 bg-purple-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                    {broadcast.content}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(broadcast.createdAt).toLocaleDateString('he-IL')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
