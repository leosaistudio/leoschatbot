'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, Save, Eye, Image, User, Upload, X, Check } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const COLORS = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
]

export default function BotAppearancePage() {
    const params = useParams()
    const [primaryColor, setPrimaryColor] = useState('#8B5CF6')
    const [position, setPosition] = useState('bottom-right')
    const [welcomeMessage, setWelcomeMessage] = useState('שלום! במה אוכל לעזור?')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load existing bot data
    useEffect(() => {
        const loadBot = async () => {
            try {
                const res = await fetch(`/api/bots/${params.id}`)
                if (res.ok) {
                    const bot = await res.json()
                    if (bot.primaryColor) setPrimaryColor(bot.primaryColor)
                    if (bot.position) setPosition(bot.position)
                    if (bot.welcomeMessage) setWelcomeMessage(bot.welcomeMessage)
                    if (bot.avatarUrl) setAvatarUrl(bot.avatarUrl)
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
                body: JSON.stringify({ primaryColor, position, welcomeMessage, avatarUrl: avatarUrl || null }),
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                setAvatarUrl(data.url)
            } else {
                const error = await res.json()
                alert(error.error || 'שגיאה בהעלאת הקובץ')
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('שגיאה בהעלאת הקובץ')
        } finally {
            setUploading(false)
        }
    }

    const clearAvatar = () => {
        setAvatarUrl('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
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
            <div>
                <Link href={`/dashboard/bots/${params.id}`} className="text-purple-600 hover:underline text-sm mb-2 block">
                    ← חזרה להגדרות הבוט
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Palette className="text-purple-600" />
                    עיצוב הבוט
                </h1>
                <p className="text-slate-500">התאם את הצבעים, התמונה והמיקום של הווידג'ט</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">

                    {/* Avatar / Logo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <span className="flex items-center gap-2">
                                <Image size={16} />
                                תמונת הבוט (לוגו או תמונת נציג)
                            </span>
                        </label>
                        <div className="flex items-start gap-4">
                            {/* Preview */}
                            <div className="relative">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl overflow-hidden flex-shrink-0 border-2 border-slate-200"
                                    style={{ backgroundColor: avatarUrl ? 'transparent' : primaryColor }}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <User size={36} />
                                    )}
                                </div>
                                {avatarUrl && (
                                    <button
                                        onClick={clearAvatar}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                {/* File Upload */}
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
                                    >
                                        <Upload size={16} />
                                        {uploading ? 'מעלה...' : 'העלה תמונה'}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-1">
                                        JPEG, PNG, GIF או WebP עד 2MB
                                    </p>
                                </div>

                                {/* Or URL */}
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">או הזן URL:</p>
                                    <input
                                        type="url"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            צבע ראשי
                        </label>
                        <div className="flex gap-3 flex-wrap">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`w-10 h-10 rounded-full transition-transform ${primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            מיקום הווידג'ט
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPosition('bottom-right')}
                                className={`flex-1 p-4 border-2 rounded-xl transition ${position === 'bottom-right'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-slate-200'
                                    }`}
                            >
                                <div className="w-full h-16 bg-slate-100 rounded relative">
                                    <div
                                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                </div>
                                <p className="text-sm text-center mt-2">ימין למטה</p>
                            </button>
                            <button
                                onClick={() => setPosition('bottom-left')}
                                className={`flex-1 p-4 border-2 rounded-xl transition ${position === 'bottom-left'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-slate-200'
                                    }`}
                            >
                                <div className="w-full h-16 bg-slate-100 rounded relative">
                                    <div
                                        className="absolute bottom-1 left-1 w-4 h-4 rounded-full"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                </div>
                                <p className="text-sm text-center mt-2">שמאל למטה</p>
                            </button>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            הודעת פתיחה
                        </label>
                        <textarea
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="שלום! במה אוכל לעזור?"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl transition disabled:opacity-50 ${saveStatus === 'success'
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
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                        <Eye size={18} />
                        תצוגה מקדימה
                    </h3>
                    <div className="bg-slate-100 rounded-xl h-96 relative overflow-hidden">
                        {/* Preview widget */}
                        <div
                            className={`absolute ${position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'}`}
                        >
                            <div
                                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl cursor-pointer hover:scale-110 transition overflow-hidden"
                                style={{ backgroundColor: avatarUrl ? 'transparent' : primaryColor }}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    '💬'
                                )}
                            </div>
                        </div>

                        {/* Chat window preview */}
                        <div
                            className={`absolute bottom-20 ${position === 'bottom-right' ? 'right-4' : 'left-4'} w-72 bg-white rounded-2xl shadow-xl overflow-hidden`}
                        >
                            <div
                                className="p-4 text-white flex items-center gap-3"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        🤖
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">עוזר וירטואלי</p>
                                    <p className="text-xs opacity-80">מחובר</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-600">
                                    {welcomeMessage}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
