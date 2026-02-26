'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, CreditCard, Trash2, UserX, UserCheck } from 'lucide-react'

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
        const statusLabels: Record<string, string> = {
            active: 'להפעיל',
            suspended: 'להשהות',
            banned: 'לחסום',
        }
        if (!confirm(`האם אתה בטוח שברצונך ${statusLabels[status]} את המשתמש?`)) return

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

    const deleteUser = async () => {
        if (!confirm('⚠️ האם אתה בטוח שברצונך למחוק את המשתמש?\nפעולה זו לא ניתנת לביטול!')) return
        if (!confirm('אישור סופי - מחיקת המשתמש תמחק גם את כל הבוטים, השיחות והלידים שלו. להמשיך?')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/admin/users')
            } else {
                const data = await res.json()
                alert(data.error || 'שגיאה במחיקת המשתמש')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
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
        <div className="flex flex-wrap items-center gap-2">
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

            {/* Status Actions */}
            {user.status === 'active' ? (
                <>
                    <button
                        onClick={() => updateStatus('suspended')}
                        disabled={loading || user.role === 'admin'}
                        className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="השהה משתמש"
                    >
                        <Ban size={16} />
                        השהה
                    </button>
                    <button
                        onClick={() => updateStatus('banned')}
                        disabled={loading || user.role === 'admin'}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="חסום משתמש"
                    >
                        <UserX size={16} />
                        חסום
                    </button>
                </>
            ) : (
                <button
                    onClick={() => updateStatus('active')}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition disabled:opacity-50"
                    title="הפעל משתמש"
                >
                    <UserCheck size={16} />
                    הפעל מחדש
                </button>
            )}

            {/* Delete */}
            {user.role !== 'admin' && (
                <button
                    onClick={deleteUser}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition disabled:opacity-50"
                    title="מחק משתמש לצמיתות"
                >
                    <Trash2 size={16} />
                    מחק
                </button>
            )}
        </div>
    )
}
