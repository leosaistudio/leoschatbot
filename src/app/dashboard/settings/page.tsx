'use client'

import { useState } from 'react'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">הגדרות</h1>

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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="050-1234567"
                                />
                            </div>

                            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
                                שמור שינויים
                            </button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <NotificationToggle
                                label="התראה על שיחה חדשה"
                                description="קבל אימייל כשמישהו פותח שיחה עם הבוט"
                                defaultChecked={true}
                            />
                            <NotificationToggle
                                label="התראות על לידים חדשים"
                                description="קבל אימייל כשמישהו משאיר פרטים בבוט"
                                defaultChecked={true}
                            />
                            <NotificationToggle
                                label="סיכום יומי"
                                description="קבל סיכום יומי של פעילות הבוטים"
                                defaultChecked={false}
                            />
                            <NotificationToggle
                                label="התראות קרדיטים"
                                description="קבל התראה כשהקרדיטים עומדים להיגמר"
                                defaultChecked={true}
                            />

                            {/* Webhook section */}
                            <div className="pt-6 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    🔗 Webhook להתראות (Make / Zapier / n8n)
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    הכנס כתובת Webhook כדי לקבל התראות לשירותים חיצוניים כמו Make או Zapier.
                                    תוכל להגדיר שם שליחת הודעה לוואטסאפ או כל ערוץ אחר.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            כתובת Webhook
                                        </label>
                                        <input
                                            type="url"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                                            placeholder="https://hook.make.com/..."
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            דוגמה: https://hook.make.com/abc123 או https://hooks.zapier.com/...
                                        </p>
                                    </div>
                                    <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
                                        שמור Webhook
                                    </button>
                                </div>
                            </div>
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    סיסמה חדשה
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    אישור סיסמה חדשה
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
                                עדכן סיסמה
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

function NotificationToggle({
    label,
    description,
    defaultChecked
}: {
    label: string
    description: string
    defaultChecked: boolean
}) {
    const [checked, setChecked] = useState(defaultChecked)

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
                <p className="font-medium text-slate-800">{label}</p>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-12 h-7 rounded-full transition ${checked ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`} />
            </button>
        </div>
    )
}
