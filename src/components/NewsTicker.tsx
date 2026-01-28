'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Broadcast {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'update'
}

export default function NewsTicker() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const tickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetch('/api/broadcasts')
            .then((res) => res.json())
            .then((data) => setBroadcasts(data))
            .catch(console.error)
    }, [])

    useEffect(() => {
        if (broadcasts.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % broadcasts.length)
        }, 5000) // Change every 5 seconds

        return () => clearInterval(interval)
    }, [broadcasts.length])

    if (broadcasts.length === 0) return null

    const getStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
                    border: 'border-amber-500/30',
                    icon: <AlertTriangle className="text-amber-400 flex-shrink-0" size={18} />,
                    text: 'text-amber-200',
                }
            case 'update':
                return {
                    bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
                    border: 'border-green-500/30',
                    icon: <CheckCircle className="text-green-400 flex-shrink-0" size={18} />,
                    text: 'text-green-200',
                }
            default:
                return {
                    bg: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20',
                    border: 'border-blue-500/30',
                    icon: <Info className="text-blue-400 flex-shrink-0" size={18} />,
                    text: 'text-blue-200',
                }
        }
    }

    const current = broadcasts[currentIndex]
    const styles = getStyles(current.type)

    return (
        <div className={`mb-6 rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
            <div className="relative">
                {/* Ticker content */}
                <div
                    ref={tickerRef}
                    className="flex items-center gap-3 px-4 py-3"
                >
                    {styles.icon}
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{current.title}</span>
                            <span className="text-slate-400">•</span>
                            <span className={`text-sm ${styles.text}`}>{current.content}</span>
                        </div>
                    </div>

                    {/* Indicator dots */}
                    {broadcasts.length > 1 && (
                        <div className="flex gap-1.5">
                            {broadcasts.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 rounded-full transition ${index === currentIndex
                                            ? 'bg-white'
                                            : 'bg-white/30 hover:bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Animated progress bar */}
                {broadcasts.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                        <div
                            className="h-full bg-white/40 transition-all duration-[5000ms] ease-linear"
                            style={{ width: '100%' }}
                            key={currentIndex}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
