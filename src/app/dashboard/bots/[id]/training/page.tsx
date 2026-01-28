'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Globe, FileText, Plus, Loader2, CheckCircle, XCircle, Trash2, Upload, HelpCircle, Building2, Map, ShoppingBag } from 'lucide-react'

interface TrainingSource {
    id: string
    type: string
    content: string
    status: string
}

interface QAPair {
    question: string
    answer: string
}

interface BusinessInfo {
    businessName: string
    phone: string
    mobile: string
    email: string
    address: string
    city: string
    workingHours: string
    website: string
    about: string
}

export default function TrainingPage() {
    const params = useParams()
    const botId = params.id as string
    const [sources, setSources] = useState<TrainingSource[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file' | 'qa' | 'info' | 'sitemap' | 'products' | null>(null)

    // URL form
    const [newUrl, setNewUrl] = useState('')

    // Text form
    const [freeText, setFreeText] = useState('')
    const [textTitle, setTextTitle] = useState('')

    // File upload
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    // Q&A
    const [qaPairs, setQaPairs] = useState<QAPair[]>([{ question: '', answer: '' }])

    // Business Info
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
        businessName: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        city: '',
        workingHours: '',
        website: '',
        about: '',
    })

    const [submitting, setSubmitting] = useState(false)

    // Sitemap
    const [sitemapUrl, setSitemapUrl] = useState('')
    const [crawlStatus, setCrawlStatus] = useState<{
        status: string
        totalUrls: number
        processedUrls: number
        failedUrls: number
    } | null>(null)
    const [crawling, setCrawling] = useState(false)

    // Products (Google Shopping)
    const [importingProducts, setImportingProducts] = useState(false)
    const [productsMessage, setProductsMessage] = useState('')

    useEffect(() => {
        fetchSources()
    }, [])

    const fetchSources = async () => {
        try {
            const res = await fetch(`/api/bots/${botId}`)
            const data = await res.json()
            setSources(data.trainingSources || [])
        } catch (error) {
            console.error('Error fetching sources:', error)
        } finally {
            setLoading(false)
        }
    }

    const addSource = async (type: string, content: string) => {
        setSubmitting(true)
        try {
            const res = await fetch(`/api/bots/${botId}/training`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, content }),
            })

            if (res.ok) {
                setActiveTab(null)
                setNewUrl('')
                setFreeText('')
                setTextTitle('')
                setQaPairs([{ question: '', answer: '' }])
                fetchSources()
            }
        } catch (error) {
            console.error('Error adding source:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file type
        const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
            alert('סוג קובץ לא נתמך. אנא העלה קובץ TXT או DOCX.')
            return
        }

        setUploading(true)
        try {
            // For TXT files, read directly
            if (file.type === 'text/plain') {
                const text = await file.text()
                await addSource('text', `[קובץ: ${file.name}]\n\n${text}`)
            } else {
                // For DOCX, we need to send to server
                const formData = new FormData()
                formData.append('file', file)
                formData.append('botId', botId)

                const res = await fetch('/api/bots/upload-doc', {
                    method: 'POST',
                    body: formData,
                })

                if (res.ok) {
                    fetchSources()
                } else {
                    const error = await res.json()
                    alert(error.error || 'שגיאה בהעלאת הקובץ')
                }
            }
        } catch (error) {
            console.error('File upload error:', error)
            alert('שגיאה בהעלאת הקובץ')
        } finally {
            setUploading(false)
            setActiveTab(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleQASubmit = async () => {
        const validPairs = qaPairs.filter(p => p.question.trim() && p.answer.trim())
        if (validPairs.length === 0) {
            alert('אנא הזן לפחות שאלה ותשובה אחת')
            return
        }

        const qaContent = validPairs
            .map(p => `שאלה: ${p.question}\nתשובה: ${p.answer}`)
            .join('\n\n---\n\n')

        await addSource('qa', `[שאלות ותשובות]\n\n${qaContent}`)
    }

    const handleBusinessInfoSubmit = async () => {
        // Build structured content for direct matching
        const lines: string[] = ['[פרטי עסק]', '']

        if (businessInfo.businessName) lines.push(`שם העסק: ${businessInfo.businessName}`)
        if (businessInfo.phone) lines.push(`טלפון: ${businessInfo.phone}`)
        if (businessInfo.mobile) lines.push(`נייד: ${businessInfo.mobile}`)
        if (businessInfo.email) lines.push(`אימייל: ${businessInfo.email}`, `מייל: ${businessInfo.email}`)
        if (businessInfo.address && businessInfo.city) {
            lines.push(`כתובת: ${businessInfo.address}, ${businessInfo.city}`)
            lines.push(`מיקום: ${businessInfo.address}, ${businessInfo.city}`)
        } else if (businessInfo.address) {
            lines.push(`כתובת: ${businessInfo.address}`)
        }
        if (businessInfo.workingHours) {
            lines.push(`שעות פעילות: ${businessInfo.workingHours}`)
            lines.push(`שעות עבודה: ${businessInfo.workingHours}`)
        }
        if (businessInfo.website) lines.push(`אתר: ${businessInfo.website}`)
        if (businessInfo.about) lines.push(`\nאודות:\n${businessInfo.about}`)

        if (lines.length <= 2) {
            alert('אנא מלא לפחות שדה אחד')
            return
        }

        await addSource('info', lines.join('\n'))
        setBusinessInfo({
            businessName: '',
            phone: '',
            mobile: '',
            email: '',
            address: '',
            city: '',
            workingHours: '',
            website: '',
            about: '',
        })
    }

    const addQAPair = () => {
        setQaPairs([...qaPairs, { question: '', answer: '' }])
    }

    const updateQAPair = (index: number, field: 'question' | 'answer', value: string) => {
        const updated = [...qaPairs]
        updated[index][field] = value
        setQaPairs(updated)
    }

    const removeQAPair = (index: number) => {
        if (qaPairs.length > 1) {
            setQaPairs(qaPairs.filter((_, i) => i !== index))
        }
    }

    const deleteSource = async (sourceId: string) => {
        try {
            await fetch(`/api/bots/${botId}/training/${sourceId}`, { method: 'DELETE' })
            fetchSources()
        } catch (error) {
            console.error('Error deleting source:', error)
        }
    }

    const deleteAllSources = async () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את כל המקורות? פעולה זו אינה ניתנת לביטול.')) {
            return
        }

        try {
            // Delete all sources one by one
            for (const source of sources) {
                await fetch(`/api/bots/${botId}/training/${source.id}`, { method: 'DELETE' })
            }
            fetchSources()
        } catch (error) {
            console.error('Error deleting all sources:', error)
        }
    }

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'url': return <Globe size={16} className="text-purple-600" />
            case 'text': return <FileText size={16} className="text-blue-600" />
            case 'qa': return <HelpCircle size={16} className="text-green-600" />
            case 'info': return <Building2 size={16} className="text-cyan-600" />
            default: return <FileText size={16} className="text-slate-600" />
        }
    }

    const getSourceLabel = (type: string) => {
        switch (type) {
            case 'url': return 'קישור'
            case 'text': return 'טקסט'
            case 'qa': return 'שו"ת'
            case 'info': return 'פרטי עסק'
            default: return type
        }
    }

    // Sitemap crawl handlers
    const handleSitemapCrawl = async () => {
        if (!sitemapUrl.trim()) return

        setCrawling(true)
        setCrawlStatus(null)

        try {
            const res = await fetch(`/api/bots/${botId}/sitemap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sitemapUrl: sitemapUrl.trim() }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Start polling for status
            pollCrawlStatus()
        } catch (error) {
            console.error('Sitemap crawl error:', error)
            alert(error instanceof Error ? error.message : 'שגיאה בסריקה')
            setCrawling(false)
        }
    }

    const pollCrawlStatus = async () => {
        try {
            const res = await fetch(`/api/bots/${botId}/sitemap`)
            const data = await res.json()

            if (data.crawl) {
                setCrawlStatus(data.crawl)

                if (data.crawl.status === 'processing') {
                    // Continue polling
                    setTimeout(pollCrawlStatus, 2000)
                } else {
                    // Done or failed
                    setCrawling(false)
                    if (data.crawl.status === 'completed') {
                        fetchSources() // Refresh sources list
                    }
                }
            }
        } catch (error) {
            console.error('Error polling status:', error)
            setCrawling(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href={`/dashboard/bots/${botId}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
                <ArrowRight size={20} />
                חזרה להגדרות הבוט
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">אימון הבוט</h1>
                <p className="text-slate-500">הוסף תוכן שהבוט ילמד ממנו כדי לענות על שאלות</p>
            </div>

            {/* Add Source Options */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">הוסף מקור תוכן</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setActiveTab('url')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'url' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Globe className="text-purple-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">קישור</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('text')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'text' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">טקסט חופשי</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('file')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'file' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Upload className="text-orange-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">קובץ</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('qa')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'qa' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <HelpCircle className="text-green-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">שאלות ותשובות</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'info' ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300 hover:bg-cyan-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Building2 className="text-cyan-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">פרטי עסק</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('sitemap')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'sitemap' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                            <Map className="text-rose-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">מפת אתר</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${activeTab === 'products' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                    >
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="text-amber-600" size={24} />
                        </div>
                        <span className="font-medium text-slate-800">מוצרים</span>
                    </button>
                </div>

                {/* URL Input */}
                {activeTab === 'url' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            הזן כתובת URL לסריקה
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                dir="ltr"
                            />
                            <button
                                onClick={() => addSource('url', newUrl)}
                                disabled={submitting || !newUrl}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                הוסף
                            </button>
                        </div>
                    </div>
                )}

                {/* Free Text Input */}
                {activeTab === 'text' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                כותרת (אופציונלי)
                            </label>
                            <input
                                type="text"
                                value={textTitle}
                                onChange={(e) => setTextTitle(e.target.value)}
                                placeholder="לדוגמה: מידע על החברה"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                תוכן הטקסט
                            </label>
                            <textarea
                                value={freeText}
                                onChange={(e) => setFreeText(e.target.value)}
                                placeholder="הזן כאן מידע שהבוט צריך לדעת..."
                                rows={6}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <button
                            onClick={() => addSource('text', textTitle ? `[${textTitle}]\n\n${freeText}` : freeText)}
                            disabled={submitting || !freeText.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            הוסף טקסט
                        </button>
                    </div>
                )}

                {/* File Upload */}
                {activeTab === 'file' && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.docx"
                            className="hidden"
                        />
                        <div className="text-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                {uploading ? 'מעלה...' : 'בחר קובץ'}
                            </button>
                            <p className="text-sm text-slate-500 mt-2">
                                קבצי TXT או DOCX עד 5MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Q&A Section */}
                {activeTab === 'qa' && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-4">
                            הוסף שאלות נפוצות ותשובות שהבוט צריך לדעת לענות עליהן
                        </p>

                        <div className="space-y-4">
                            {qaPairs.map((pair, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600">שאלה {index + 1}</span>
                                        {qaPairs.length > 1 && (
                                            <button
                                                onClick={() => removeQAPair(index)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={pair.question}
                                        onChange={(e) => updateQAPair(index, 'question', e.target.value)}
                                        placeholder="לדוגמה: מה שעות הפעילות שלכם?"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                                    />
                                    <textarea
                                        value={pair.answer}
                                        onChange={(e) => updateQAPair(index, 'answer', e.target.value)}
                                        placeholder="התשובה..."
                                        rows={2}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={addQAPair}
                                className="px-4 py-2 border border-green-500 text-green-700 hover:bg-green-100 rounded-lg flex items-center gap-2"
                            >
                                <Plus size={16} />
                                הוסף שאלה
                            </button>
                            <button
                                onClick={handleQASubmit}
                                disabled={submitting}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                שמור שאלות ותשובות
                            </button>
                        </div>
                    </div>
                )}

                {/* Business Info Form */}
                {activeTab === 'info' && (
                    <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-4">
                            הזן פרטים בסיסיים על העסק שלך - הבוט ישתמש בהם לתשובות מהירות
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">שם העסק</label>
                                <input
                                    type="text"
                                    value={businessInfo.businessName}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                                    placeholder="שם העסק"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">טלפון</label>
                                <input
                                    type="tel"
                                    value={businessInfo.phone}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                    placeholder="03-1234567"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">נייד</label>
                                <input
                                    type="tel"
                                    value={businessInfo.mobile}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, mobile: e.target.value })}
                                    placeholder="050-1234567"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    value={businessInfo.email}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                    placeholder="info@example.com"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">כתובת</label>
                                <input
                                    type="text"
                                    value={businessInfo.address}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                    placeholder="רחוב ומספר"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">עיר</label>
                                <input
                                    type="text"
                                    value={businessInfo.city}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                                    placeholder="תל אביב"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">שעות פעילות</label>
                                <input
                                    type="text"
                                    value={businessInfo.workingHours}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, workingHours: e.target.value })}
                                    placeholder="א'-ה' 09:00-18:00, ו' 09:00-13:00"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">אתר אינטרנט</label>
                                <input
                                    type="url"
                                    value={businessInfo.website}
                                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                                    placeholder="https://www.example.com"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור קצר על העסק</label>
                            <textarea
                                value={businessInfo.about}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, about: e.target.value })}
                                placeholder="ספר בקצרה על העסק, מה הוא מציע, למי הוא מיועד..."
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleBusinessInfoSubmit}
                            disabled={submitting}
                            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            שמור פרטי עסק
                        </button>
                    </div>
                )}

                {/* Sitemap Crawl */}
                {activeTab === 'sitemap' && (
                    <div className="mt-6 p-4 bg-rose-50 rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            הזן URL של מפת אתר (sitemap.xml)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={sitemapUrl}
                                onChange={(e) => setSitemapUrl(e.target.value)}
                                placeholder="https://example.com/sitemap.xml"
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                disabled={crawling}
                            />
                            <button
                                onClick={handleSitemapCrawl}
                                disabled={!sitemapUrl.trim() || crawling}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {crawling ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Map size={16} />
                                )}
                                {crawling ? 'סורק...' : 'התחל סריקה'}
                            </button>
                        </div>

                        {/* Or divider */}
                        <div className="flex items-center gap-4 my-4">
                            <div className="flex-1 h-px bg-slate-300" />
                            <span className="text-sm text-slate-500">או</span>
                            <div className="flex-1 h-px bg-slate-300" />
                        </div>

                        {/* File upload */}
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            העלה קובץ sitemap.xml
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept=".xml"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    setCrawling(true)
                                    try {
                                        const content = await file.text()
                                        const res = await fetch(`/api/bots/${botId}/sitemap`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ xmlContent: content }),
                                        })
                                        const data = await res.json()
                                        if (!res.ok) throw new Error(data.error)
                                        pollCrawlStatus()
                                    } catch (error) {
                                        console.error('XML upload error:', error)
                                        alert(error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ')
                                        setCrawling(false)
                                    }
                                }}
                                disabled={crawling}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        {crawlStatus && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-rose-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-slate-700">
                                        {crawlStatus.status === 'processing' ? '⏳ סורק...' :
                                            crawlStatus.status === 'completed' ? '✅ הושלם!' :
                                                crawlStatus.status === 'failed' ? '❌ נכשל' : 'ממתין...'}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        {crawlStatus.processedUrls} / {crawlStatus.totalUrls} עמודים
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${crawlStatus.status === 'completed' ? 'bg-green-500' :
                                            crawlStatus.status === 'failed' ? 'bg-red-500' : 'bg-rose-500'
                                            }`}
                                        style={{
                                            width: `${crawlStatus.totalUrls > 0
                                                ? (crawlStatus.processedUrls / crawlStatus.totalUrls) * 100
                                                : 0}%`
                                        }}
                                    />
                                </div>

                                {crawlStatus.failedUrls > 0 && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        ⚠️ {crawlStatus.failedUrls} עמודים נכשלו
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-sm text-slate-500 mt-3">
                            💡 מפת האתר תסרק את כל העמודים והבוט ילמד מהם אוטומטית
                        </p>
                    </div>
                )}

                {/* Products (Google Shopping) Input */}
                {activeTab === 'products' && (
                    <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            העלה קובץ XML של Google Shopping
                        </label>
                        <p className="text-sm text-slate-500 mb-3">
                            הקובץ צריך להיות בפורמט Google Shopping Merchant Center
                        </p>
                        <input
                            type="file"
                            accept=".xml,application/xml,text/xml"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                setImportingProducts(true)
                                setProductsMessage('')

                                try {
                                    const content = await file.text()
                                    const res = await fetch(`/api/bots/${botId}/products`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ xmlContent: content }),
                                    })

                                    const data = await res.json()

                                    if (!res.ok) {
                                        throw new Error(data.error || 'שגיאה בייבוא')
                                    }

                                    setProductsMessage(data.message)
                                } catch (error) {
                                    console.error('Products import error:', error)
                                    alert(error instanceof Error ? error.message : 'שגיאה בייבוא המוצרים')
                                } finally {
                                    setImportingProducts(false)
                                }
                            }}
                            disabled={importingProducts}
                            className="block w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />

                        {importingProducts && (
                            <div className="mt-4 flex items-center gap-2 text-amber-600">
                                <Loader2 className="animate-spin" size={20} />
                                <span>מעבד מוצרים... (נמשך עד דקה לכל מוצר)</span>
                            </div>
                        )}

                        {productsMessage && (
                            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                                <CheckCircle size={20} />
                                <span>{productsMessage}</span>
                            </div>
                        )}

                        <p className="text-sm text-slate-500 mt-3">
                            💡 כל מוצר ינותח עם Vision AI כדי לאפשר זיהוי לפי תמונה
                        </p>
                    </div>
                )}
            </div>

            {/* Sources List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">
                        מקורות תוכן ({sources.length})
                    </h3>
                    {sources.length > 0 && (
                        <button
                            onClick={deleteAllSources}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                            <Trash2 size={16} />
                            מחק הכל
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin mx-auto text-slate-400" size={32} />
                    </div>
                ) : sources.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>אין מקורות תוכן עדיין</p>
                        <p className="text-sm">הוסף תוכן כדי שהבוט ילמד ממנו</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    {source.status === 'completed' ? (
                                        <CheckCircle className="text-green-500" size={20} />
                                    ) : source.status === 'failed' ? (
                                        <XCircle className="text-red-500" size={20} />
                                    ) : (
                                        <Loader2 className="text-yellow-500 animate-spin" size={20} />
                                    )}
                                    <div className="flex items-center gap-2">
                                        {getSourceIcon(source.type)}
                                        <span className="text-xs px-2 py-0.5 bg-slate-200 rounded-full">
                                            {getSourceLabel(source.type)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-slate-800 text-sm font-medium truncate max-w-md" dir="ltr">
                                            {source.content.length > 60 ? source.content.slice(0, 60) + '...' : source.content}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {source.status === 'completed' ? 'הושלם' :
                                                source.status === 'processing' ? 'מעבד...' :
                                                    source.status === 'failed' ? 'נכשל' : 'ממתין'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteSource(source.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
