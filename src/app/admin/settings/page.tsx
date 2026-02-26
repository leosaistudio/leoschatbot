'use client'

import { useState, useEffect } from 'react'
import { Settings, Cpu, Save, Check } from 'lucide-react'

const AVAILABLE_MODELS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'מהיר וחסכוני - מומלץ לרוב השימושים', cost: '~$0.15/1M tokens' },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'חכם יותר, איכותי יותר - מתאים לשיחות מורכבות', cost: '~$2.50/1M tokens' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'יציב ואמין - גרסה ישנה יותר', cost: '~$10/1M tokens' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'הכי זול, פחות חכם', cost: '~$0.50/1M tokens' },
]

export default function AdminSettingsPage() {
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.aiModel) setSelectedModel(data.aiModel)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const saveSettings = async () => {
        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiModel: selectedModel })
            })
            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">הגדרות מערכת</h1>
                <p className="text-slate-400">הגדרות גלובליות עבור כל המערכת</p>
            </div>

            {/* AI Model Selection */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Cpu size={20} className="text-purple-400" />
                    מודל AI (OpenAI)
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                    בחר את המודל שישמש את כל הבוטים במערכת. מודל חכם יותר = תשובות טובות יותר אבל עלות גבוהה יותר.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_MODELS.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-4 rounded-xl border-2 text-right transition ${selectedModel === model.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white">{model.label}</span>
                                {selectedModel === model.id && (
                                    <Check size={18} className="text-purple-400" />
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mb-1">{model.description}</p>
                            <p className="text-xs text-green-400 font-mono">{model.cost}</p>
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg flex items-center gap-2 font-medium transition"
                    >
                        {saving ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : saved ? (
                            <Check size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור שינויים'}
                    </button>
                    {saved && <span className="text-green-400 text-sm">✓ ההגדרות נשמרו בהצלחה</span>}
                </div>
            </div>
        </div>
    )
}
