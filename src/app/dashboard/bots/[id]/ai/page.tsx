'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Save, RotateCcw, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function BotAIPage() {
    const params = useParams()
    const [systemPrompt, setSystemPrompt] = useState('')
    const [temperature, setTemperature] = useState(0.7)
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
                    if (bot.systemPrompt) setSystemPrompt(bot.systemPrompt)
                    if (bot.temperature !== undefined && bot.temperature !== null) setTemperature(bot.temperature)
                }
            } catch (error) {
                console.error('Error loading bot:', error)
            } finally {
                setLoading(false)
            }
        }
        loadBot()
    }, [params.id])

    const handleSave = async () => {
        setSaving(true)
        setSaveStatus('idle')
        try {
            const res = await fetch(`/api/bots/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, temperature }),
            })
            if (res.ok) {
                setSaveStatus('success')
                setTimeout(() => setSaveStatus('idle'), 3000)
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
            <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
                <div className="text-slate-500">טוען...</div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/dashboard/bots/${params.id}`} className="text-purple-600 hover:underline text-sm mb-2 block">
                        ← חזרה להגדרות הבוט
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-purple-600" />
                        כיוונון AI
                    </h1>
                    <p className="text-slate-500">התאם אישית את אופי ותגובות הבוט</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                {/* System Prompt */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        הוראות מערכת (System Prompt)
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                        הגדר את ה"אישיות" של הבוט והאופן בו הוא צריך להתנהג
                    </p>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="אתה נציג שירות לקוחות אדיב ומקצועי של חברת XYZ. תפקידך לעזור ללקוחות במענה על שאלות, פתרון בעיות וכיוון לדפים הרלוונטיים באתר..."
                    />
                </div>

                {/* Temperature */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        רמת יצירתיות (Temperature): {temperature}
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                        ערך נמוך = תשובות עקביות יותר | ערך גבוה = תשובות מגוונות יותר
                    </p>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>מדויק (0)</span>
                        <span>מאוזן (0.5)</span>
                        <span>יצירתי (1)</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition disabled:opacity-50 ${saveStatus === 'success'
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
                            <><Save size={18} /> {saving ? 'שומר...' : 'שמור שינויים'}</>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setSystemPrompt('')
                            setTemperature(0.7)
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                    >
                        <RotateCcw size={18} />
                        איפוס
                    </button>
                </div>
            </div>
        </div>
    )
}
