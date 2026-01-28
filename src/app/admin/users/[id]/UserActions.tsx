'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, CreditCard, Trash2 } from 'lucide-react'

interface UserActionsProps {
    user: {
        id: string
        status: string
        role: string
    }
}

export default function UserActions({ user }: UserActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showAddCredits, setShowAddCredits] = useState(false)
    const [creditsAmount, setCreditsAmount] = useState('100')

    const updateStatus = async (status: string) => {
        setLoading(true)
        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            router.refresh()
        } catch (error) {
            console.error('Error updating user:', error)
        } finally {
            setLoading(false)
        }
    }

    const addCredits = async () => {
        setLoading(true)
        try {
            await fetch(`/api/admin/users/${user.id}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(creditsAmount), type: 'bonus' }),
            })
            setShowAddCredits(false)
            router.refresh()
        } catch (error) {
            console.error('Error adding credits:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Add Credits */}
            {showAddCredits ? (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={creditsAmount}
                        onChange={(e) => setCreditsAmount(e.target.value)}
                        className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="כמות"
                    />
                    <button
                        onClick={addCredits}
                        disabled={loading}
                        className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                        הוסף
                    </button>
                    <button
                        onClick={() => setShowAddCredits(false)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg"
                    >
                        ביטול
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddCredits(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition"
                >
                    <CreditCard size={16} />
                    הוסף קרדיטים
                </button>
            )}

            {/* Toggle Status */}
            {user.status === 'active' ? (
                <button
                    onClick={() => updateStatus('suspended')}
                    disabled={loading || user.role === 'admin'}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Ban size={16} />
                    השהה
                </button>
            ) : (
                <button
                    onClick={() => updateStatus('active')}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition disabled:opacity-50"
                >
                    <CheckCircle size={16} />
                    הפעל
                </button>
            )}
        </div>
    )
}
