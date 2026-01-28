'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

interface Broadcast {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'update'
    createdAt: string
}

export default function SystemNotifications() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [dismissed, setDismissed] = useState<string[]>([])

    useEffect(() => {
        // Load dismissed from localStorage
        const savedDismissed = localStorage.getItem('dismissedBroadcasts')
        if (savedDismissed) {
            setDismissed(JSON.parse(savedDismissed))
        }

        // Fetch broadcasts
        fetch('/api/broadcasts')
            .then((res) => res.json())
            .then((data) => setBroadcasts(data))
            .catch(console.error)
    }, [])

    const dismiss = (id: string) => {
        const newDismissed = [...dismissed, id]
        setDismissed(newDismissed)
        localStorage.setItem('dismissedBroadcasts', JSON.stringify(newDismissed))
    }

    const visibleBroadcasts = broadcasts.filter((b) => !dismissed.includes(b.id))

    if (visibleBroadcasts.length === 0) return null

    const getStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/30',
                    icon: <AlertTriangle className="text-amber-400" size={20} />,
                    iconBg: 'bg-amber-500/20',
                }
            case 'update':
                return {
                    bg: 'bg-green-500/10 border-green-500/30',
                    icon: <CheckCircle className="text-green-400" size={20} />,
                    iconBg: 'bg-green-500/20',
                }
            default:
                return {
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    icon: <Info className="text-blue-400" size={20} />,
                    iconBg: 'bg-blue-500/20',
                }
        }
    }

    return (
        <div className="space-y-3 mb-6">
            {visibleBroadcasts.map((broadcast) => {
                const styles = getStyles(broadcast.type)
                return (
                    <div
                        key={broadcast.id}
                        className={`p-4 rounded-xl border ${styles.bg} flex items-start gap-3`}
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.iconBg}`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{broadcast.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{broadcast.content}</p>
                        </div>
                        <button
                            onClick={() => dismiss(broadcast.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
