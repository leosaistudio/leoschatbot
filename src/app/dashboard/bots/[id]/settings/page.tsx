'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings2, Trash2, ArrowRight, AlertTriangle, Check, X } from 'lucide-react'

export default function BotSettingsAdvancedPage() {
    const params = useParams()
    const router = useRouter()
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    // Load existing bot data
    useEffect(() => {
        const loadBot = async () => {
            try {
                const res = await fetch(`/api/bots/${params.id}`)
                if (res.ok) {
                    const bot = await res.json()
                    if (bot.name) setName(bot.name)
                    if (bot.description) setDescription(bot.description)
                }
            } catch (error) {
                console.error('Error loading bot:', error)
            } finally {
                setLoading(false)
            }
        }
        loadBot()
    }, [params.id])

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await fetch(`/api/bots/${params.id}`, { method: 'DELETE' })
            router.push('/dashboard/bots')
        } catch (error) {
            console.error('Error deleting bot:', error)
            setDeleting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveStatus('idle')
        try {
            const res = await fetch(`/api/bots/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            })
            if (res.ok) {
                setSaveStatus('success')
                setTimeout(() => setSaveStatus('idle'), 3000)
                router.refresh()
            } else {
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 3000)
            }
        } catch (error) {
            console.error('Error saving:', error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
                <div className="text-slate-500">טוען...</div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link href={`/dashboard/bots/${params.id}`} className="text-purple-600 hover:underline text-sm mb-2 inline-flex items-center gap-1">
                    <ArrowRight size={16} />
                    חזרה להגדרות הבוט
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings2 className="text-purple-600" />
                    הגדרות מתקדמות
                </h1>
            </div>

            {/* Basic Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-semibold text-slate-800">פרטי הבוט</h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        שם הבוט
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="שם הבוט"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        תיאור
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="תיאור קצר של הבוט"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center gap-2 ${saveStatus === 'success'
                            ? 'bg-green-600 text-white'
                            : saveStatus === 'error'
                                ? 'bg-red-600 text-white'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                >
                    {saveStatus === 'success' ? (
                        <><Check size={18} /> נשמר בהצלחה!</>
                    ) : saveStatus === 'error' ? (
                        <><X size={18} /> שגיאה בשמירה</>
                    ) : (
                        saving ? 'שומר...' : 'שמור שינויים'
                    )}
                </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    אזור סכנה
                </h3>

                <p className="text-red-700 text-sm mb-4">
                    מחיקת הבוט תמחק את כל הנתונים הקשורים אליו כולל היסטוריית שיחות, לידים ומקורות אימון.
                    פעולה זו אינה הפיכה.
                </p>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
                >
                    <Trash2 size={18} />
                    מחק בוט
                </button>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">מחק את הבוט?</h3>
                        <p className="text-slate-600 mb-6">
                            האם אתה בטוח? כל הנתונים יימחקו לצמיתות.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {deleting ? 'מוחק...' : 'כן, מחק'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
