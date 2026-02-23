'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Profile fields
    const [name, setName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [phone, setPhone] = useState('')
    const [whatsappNumber, setWhatsappNumber] = useState('')

    // Notification fields
    const [notifyEmail, setNotifyEmail] = useState(true)
    const [webhookUrl, setWebhookUrl] = useState('')

    // Security fields
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Load user settings
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setName(data.name || '')
                    setCompanyName(data.companyName || '')
                    setPhone(data.phone || '')
                    setWhatsappNumber(data.whatsappNumber || '')
                    setNotifyEmail(data.notifyEmail ?? true)
                    setWebhookUrl(data.webhookUrl || '')
                }
            })
            .catch(err => console.error('Failed to load settings:', err))
            .finally(() => setLoading(false))
    }, [])

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 4000)
    }

    const saveProfile = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tab: 'profile', name, companyName, phone, whatsappNumber }),
            })
            const data = await res.json()
            if (res.ok) {
                showMessage('success', 'הפרופיל עודכן בהצלחה!')
            } else {
                showMessage('error', data.error || 'שגיאה בעדכון')
            }
        } catch {
            showMessage('error', 'שגיאה בחיבור לשרת')
        } finally {
            setSaving(false)
        }
    }

    const saveNotifications = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tab: 'notifications', notifyEmail, webhookUrl }),
            })
            const data = await res.json()
            if (res.ok) {
                showMessage('success', 'הגדרות ההתראות עודכנו!')
            } else {
                showMessage('error', data.error || 'שגיאה בעדכון')
            }
        } catch {
            showMessage('error', 'שגיאה בחיבור לשרת')
        } finally {
            setSaving(false)
        }
    }

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('error', 'נא למלא את כל השדות')
            return
        }
        if (newPassword !== confirmPassword) {
            showMessage('error', 'הסיסמאות לא תואמות')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tab: 'security', currentPassword, newPassword, confirmPassword }),
            })
            const data = await res.json()
            if (res.ok) {
                showMessage('success', 'הסיסמה עודכנה בהצלחה!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                showMessage('error', data.error || 'שגיאה בעדכון')
            }
        } catch {
            showMessage('error', 'שגיאה בחיבור לשרת')
        } finally {
            setSaving(false)
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
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">הגדרות</h1>

            {/* Status message */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-slate-200 flex">
                    <TabButton
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        icon={<User size={18} />}
                        label="פרופיל"
                    />
                    <TabButton
                        active={activeTab === 'notifications'}
                        onClick={() => setActiveTab('notifications')}
                        icon={<Bell size={18} />}
                        label="התראות"
                    />
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                        icon={<Shield size={18} />}
                        label="אבטחה"
                    />
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    שם מלא
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="השם שלך"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    שם החברה
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="שם החברה"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    טלפון
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="050-1234567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    📱 מספר וואטסאפ לקבלת התראות
                                </label>
                                <input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="972501234567"
                                    dir="ltr"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    הכנס את המספר בפורמט בינלאומי (למשל: 972501234567)
                                </p>
                            </div>

                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                            >
                                {saving ? 'שומר...' : 'שמור שינויים'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-800">📧 התראות מייל</p>
                                    <p className="text-sm text-slate-500">קבל אימייל כשמישהו פותח שיחה עם הבוט</p>
                                </div>
                                <button
                                    onClick={() => setNotifyEmail(!notifyEmail)}
                                    className={`w-12 h-7 rounded-full transition ${notifyEmail ? 'bg-purple-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${notifyEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Webhook section */}
                            <div className="pt-6 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    🔗 Webhook להתראות (N8N / Make / Zapier)
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    הכנס כתובת Webhook כדי לקבל התראות לשירותים חיצוניים.
                                    תוכל להגדיר שם שליחת הודעה לוואטסאפ או כל ערוץ אחר.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        כתובת Webhook
                                    </label>
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                                        placeholder="https://your-n8n.com/webhook/..."
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        דוגמה: https://n8n.example.com/webhook/abc123
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={saveNotifications}
                                disabled={saving}
                                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                            >
                                {saving ? 'שומר...' : 'שמור הגדרות התראות'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    סיסמה נוכחית
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    סיסמה חדשה
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    אישור סיסמה חדשה
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={changePassword}
                                disabled={saving}
                                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                            >
                                {saving ? 'מעדכן...' : 'עדכן סיסמה'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TabButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${active
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}
