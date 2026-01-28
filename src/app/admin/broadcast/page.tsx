'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Send, Trash2, CheckCircle, AlertTriangle, Info, Users, User } from 'lucide-react'

interface Broadcast {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'update'
    targetUserId: string | null
    targetUserEmail?: string
    isActive: boolean
    createdAt: string
}

interface UserOption {
    id: string
    email: string
    name: string | null
}

export default function BroadcastPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [users, setUsers] = useState<UserOption[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [type, setType] = useState<'info' | 'warning' | 'update'>('info')
    const [targetUserId, setTargetUserId] = useState<string>('')

    useEffect(() => {
        fetchBroadcasts()
        fetchUsers()
    }, [])

    const fetchBroadcasts = async () => {
        try {
            const res = await fetch('/api/admin/broadcasts')
            const data = await res.json()
            setBroadcasts(data)
        } catch (error) {
            console.error('Error fetching broadcasts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            setUsers(data.users || data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const sendBroadcast = async () => {
        if (!title.trim() || !content.trim()) return

        setSending(true)
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    type,
                    targetUserId: targetUserId || null
                }),
            })

            if (res.ok) {
                setTitle('')
                setContent('')
                setType('info')
                setTargetUserId('')
                fetchBroadcasts()
            }
        } catch (error) {
            console.error('Error sending broadcast:', error)
        } finally {
            setSending(false)
        }
    }

    const deleteBroadcast = async (id: string) => {
        if (!confirm('האם למחוק את ההודעה?')) return

        try {
            await fetch(`/api/admin/broadcasts/${id}`, { method: 'DELETE' })
            fetchBroadcasts()
        } catch (error) {
            console.error('Error deleting broadcast:', error)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/admin/broadcasts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            })
            fetchBroadcasts()
        } catch (error) {
            console.error('Error toggling broadcast:', error)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="text-amber-400" size={20} />
            case 'update': return <CheckCircle className="text-green-400" size={20} />
            default: return <Info className="text-blue-400" size={20} />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'warning': return 'אזהרה'
            case 'update': return 'עדכון'
            default: return 'מידע'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">שליחת הודעות</h1>
                <p className="text-slate-400">שלח הודעות מערכת לכל המשתמשים או למשתמש ספציפי</p>
            </div>

            {/* New Broadcast Form */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Megaphone size={20} />
                    הודעה חדשה
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">כותרת</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="כותרת ההודעה..."
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">תוכן ההודעה</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="תוכן ההודעה..."
                            rows={4}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">סוג הודעה</label>
                            <div className="flex gap-3">
                                {(['info', 'update', 'warning'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${type === t
                                                ? 'border-purple-500 bg-purple-500/20 text-white'
                                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        {getTypeIcon(t)}
                                        {getTypeLabel(t)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">נמען</label>
                            <select
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">👥 כל המשתמשים</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        👤 {user.name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={sendBroadcast}
                        disabled={sending || !title.trim() || !content.trim()}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                        <Send size={18} />
                        {sending ? 'שולח...' : targetUserId ? 'שלח למשתמש' : 'שלח לכל המשתמשים'}
                    </button>
                </div>
            </div>

            {/* Existing Broadcasts */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">הודעות קיימות</h3>

                {loading ? (
                    <div className="text-center py-8 text-slate-400">טוען...</div>
                ) : broadcasts.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Megaphone className="mx-auto mb-3 text-slate-600" size={40} />
                        <p>אין הודעות עדיין</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {broadcasts.map((broadcast) => (
                            <div
                                key={broadcast.id}
                                className={`p-4 rounded-lg border ${broadcast.isActive
                                        ? 'bg-slate-700/50 border-slate-600'
                                        : 'bg-slate-800/50 border-slate-700 opacity-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {getTypeIcon(broadcast.type)}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-medium">{broadcast.title}</h4>
                                                {broadcast.targetUserId ? (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                                        <User size={12} />
                                                        {broadcast.targetUserEmail || 'משתמש ספציפי'}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                                                        <Users size={12} />
                                                        כולם
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm mt-1">{broadcast.content}</p>
                                            <p className="text-slate-500 text-xs mt-2">
                                                {new Date(broadcast.createdAt).toLocaleString('he-IL')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(broadcast.id, broadcast.isActive)}
                                            className={`px-3 py-1 rounded text-sm ${broadcast.isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-slate-600 text-slate-400'
                                                }`}
                                        >
                                            {broadcast.isActive ? 'פעיל' : 'לא פעיל'}
                                        </button>
                                        <button
                                            onClick={() => deleteBroadcast(broadcast.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
