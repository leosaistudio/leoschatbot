'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, ArrowRight, Save, Moon, Sun } from 'lucide-react'

const DAYS = [
    { id: 0, name: 'ראשון', short: 'א' },
    { id: 1, name: 'שני', short: 'ב' },
    { id: 2, name: 'שלישי', short: 'ג' },
    { id: 3, name: 'רביעי', short: 'ד' },
    { id: 4, name: 'חמישי', short: 'ה' },
    { id: 5, name: 'שישי', short: 'ו' },
    { id: 6, name: 'שבת', short: 'ש' },
]

export default function BusinessHoursPage() {
    const params = useParams()
    const botId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Settings state
    const [enabled, setEnabled] = useState(false)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('18:00')
    const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]) // Sun-Thu default
    const [shabbatMode, setShabbatMode] = useState(false)
    const [offlineMessage, setOfflineMessage] = useState('הבוט לא פעיל כרגע. נחזור אליך בשעות הפעילות.')

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch(`/api/bots/${botId}`)
            if (res.ok) {
                const data = await res.json()
                setEnabled(data.businessHoursEnabled || false)
                setStartTime(data.businessHoursStart || '09:00')
                setEndTime(data.businessHoursEnd || '18:00')
                setWorkingDays(data.workingDays || [0, 1, 2, 3, 4])
                setShabbatMode(data.shabbatModeEnabled || false)
                setOfflineMessage(data.offlineMessage || 'הבוט לא פעיל כרגע. נחזור אליך בשעות הפעילות.')
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        setSaving(true)
        try {
            await fetch(`/api/bots/${botId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessHoursEnabled: enabled,
                    businessHoursStart: startTime,
                    businessHoursEnd: endTime,
                    workingDays,
                    shabbatModeEnabled: shabbatMode,
                    offlineMessage,
                }),
            })
            alert('ההגדרות נשמרו בהצלחה!')
        } catch (error) {
            console.error('Error saving:', error)
            alert('שגיאה בשמירת ההגדרות')
        } finally {
            setSaving(false)
        }
    }

    const toggleDay = (dayId: number) => {
        if (workingDays.includes(dayId)) {
            setWorkingDays(workingDays.filter(d => d !== dayId))
        } else {
            setWorkingDays([...workingDays, dayId].sort())
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Link
                    href={`/dashboard/bots/${botId}`}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
                >
                    <ArrowRight size={20} />
                    חזרה להגדרות הבוט
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="text-purple-600" />
                    שעות עבודה
                </h1>
                <p className="text-slate-500">הגדר מתי הבוט יהיה פעיל באתר</p>
            </div>

            {/* Main Settings Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                        <h3 className="font-medium text-slate-800">הפעל הגבלת שעות עבודה</h3>
                        <p className="text-sm text-slate-500">הבוט יעבוד רק בשעות שתגדיר</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                {enabled && (
                    <>
                        {/* Working Hours */}
                        <div>
                            <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                <Sun size={18} className="text-amber-500" />
                                שעות פעילות
                            </h3>
                            <div className="flex items-center gap-4">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">משעה</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <span className="text-slate-400 mt-6">עד</span>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-1">עד שעה</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Working Days */}
                        <div>
                            <h3 className="font-medium text-slate-800 mb-3">ימי פעילות</h3>
                            <div className="flex gap-2">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-12 h-12 rounded-full font-medium transition ${workingDays.includes(day.id)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        title={day.name}
                                    >
                                        {day.short}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                לחץ על יום כדי להפעיל/לבטל אותו
                            </p>
                        </div>

                        {/* Shabbat Mode */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                            <div className="flex items-start gap-3">
                                <Moon size={24} className="text-indigo-600 mt-1" />
                                <div>
                                    <h3 className="font-medium text-slate-800">מצב שבת</h3>
                                    <p className="text-sm text-slate-500">
                                        הבוט לא יעבוד מכניסת שבת (יום שישי) עד יציאת שבת
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={shabbatMode}
                                    onChange={(e) => setShabbatMode(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Offline Message */}
                        <div>
                            <h3 className="font-medium text-slate-800 mb-2">הודעה כשהבוט לא פעיל</h3>
                            <textarea
                                value={offlineMessage}
                                onChange={(e) => setOfflineMessage(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="הודעה שתוצג למבקרים מחוץ לשעות הפעילות"
                            />
                        </div>
                    </>
                )}

                {/* Save Button */}
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'שומר...' : 'שמור הגדרות'}
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 איך זה עובד?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• כשההגבלה מופעלת, הבוט יציג את הודעת "לא פעיל" מחוץ לשעות</li>
                    <li>• מצב שבת משתמש בזמני כניסת/יציאת שבת לפי אזור הזמן של ישראל</li>
                    <li>• גולשים עדיין יכולים להשאיר פרטים גם כשהבוט לא פעיל</li>
                </ul>
            </div>
        </div>
    )
}
