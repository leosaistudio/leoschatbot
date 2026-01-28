'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BotControlButtonProps {
    botId: string
    currentStatus: string
}

export default function BotControlButton({ botId, currentStatus }: BotControlButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleActivate = async () => {
        setLoading(true)
        try {
            await fetch(`/api/bots/${botId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' }),
            })
            router.refresh()
        } catch (error) {
            console.error('Error activating bot:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePause = async () => {
        setLoading(true)
        try {
            await fetch(`/api/bots/${botId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paused' }),
            })
            router.refresh()
        } catch (error) {
            console.error('Error pausing bot:', error)
        } finally {
            setLoading(false)
        }
    }

    if (currentStatus === 'draft' || currentStatus === 'paused') {
        return (
            <button
                onClick={handleActivate}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
            >
                {loading ? 'מפעיל...' : 'הפעל בוט'}
            </button>
        )
    }

    if (currentStatus === 'active') {
        return (
            <button
                onClick={handlePause}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition disabled:opacity-50"
            >
                {loading ? 'משהה...' : 'השהה'}
            </button>
        )
    }

    return null
}
