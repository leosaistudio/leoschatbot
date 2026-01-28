'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Bot, Sparkles } from 'lucide-react'

export default function NewBotPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        websiteUrl: '',
        welcomeMessage: 'שלום! 👋 איך אפשר לעזור לך היום?',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'שגיאה ביצירת הבוט')
                return
            }

            // Redirect to bot settings
            router.push(`/dashboard/bots/${data.id}/training`)
        } catch {
            setError('שגיאה ביצירת הבוט')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back Link */}
            <Link
                href="/dashboard/bots"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
            >
                <ArrowRight size={20} />
                חזרה לבוטים
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="text-purple-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">צור צ'אטבוט חדש</h1>
                <p className="text-slate-500">הגדר בוט שילמד את תוכן האתר שלך ויענה לגולשים</p>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {s}
                        </div>
                        <span className={step >= s ? 'text-slate-800' : 'text-slate-400'}>
                            {s === 1 ? 'פרטי הבוט' : 'הגדרות בסיסיות'}
                        </span>
                        {s === 1 && <div className="w-16 h-0.5 bg-slate-200 mx-2"></div>}
                    </div>
                ))}
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                שם הבוט *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="לדוגמה: עוזר שירות לקוחות"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                תיאור (אופציונלי)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="תאר את מטרת הבוט..."
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                כתובת האתר
                            </label>
                            <input
                                type="url"
                                name="websiteUrl"
                                value={formData.websiteUrl}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                dir="ltr"
                            />
                            <p className="text-sm text-slate-500 mt-1">
                                הבוט ילמד את תוכן האתר כדי לענות על שאלות
                            </p>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.name}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            המשך
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-slate-700 font-medium mb-2">
                                הודעת פתיחה
                            </label>
                            <textarea
                                name="welcomeMessage"
                                value={formData.welcomeMessage}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            />
                            <p className="text-sm text-slate-500 mt-1">
                                ההודעה שהגולש יראה כשהוא פותח את הצ'אט
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="text-purple-600 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium text-purple-800">טיפ!</p>
                                    <p className="text-sm text-purple-700">
                                        אחרי יצירת הבוט תוכל להוסיף קישורים לתוכן, לכוונן את ה-AI ולהתאים את העיצוב.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition"
                            >
                                חזור
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                            >
                                {loading ? 'יוצר בוט...' : 'צור בוט'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
