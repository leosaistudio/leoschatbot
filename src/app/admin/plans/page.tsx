'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Star, Award, Check, X } from 'lucide-react'

interface PricingPlan {
    id: string
    name: string
    nameHe: string
    slug: string
    description: string | null
    descriptionHe: string | null
    price: number
    yearlyPrice: number | null
    isPopular: boolean
    isBestValue: boolean
    isActive: boolean
    sortOrder: number
    maxBots: number
    maxMessages: number
    maxCharacters: number
    maxCrawlPages: number
    maxTeamMembers: number
    featuresHe: string[]
    hasLiveChat: boolean
    hasTranslation: boolean
    hasAutoRetrain: boolean
    hasIntegrations: boolean
    hasPrioritySupport: boolean
    hasRemoveBranding: boolean
}

const emptyPlan: Partial<PricingPlan> = {
    name: '',
    nameHe: '',
    slug: '',
    descriptionHe: '',
    price: 0,
    maxBots: 1,
    maxMessages: 500,
    maxCharacters: 5000000,
    maxCrawlPages: 100,
    maxTeamMembers: 1,
    featuresHe: [],
    isPopular: false,
    isBestValue: false,
    hasLiveChat: false,
    hasTranslation: false,
    hasAutoRetrain: false,
    hasIntegrations: false,
    hasPrioritySupport: false,
    hasRemoveBranding: false,
}

export default function PlansPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans')
            const data = await res.json()
            setPlans(data)
        } catch (error) {
            console.error('Error fetching plans:', error)
        } finally {
            setLoading(false)
        }
    }

    const savePlan = async () => {
        if (!editingPlan) return
        setSaving(true)

        try {
            const method = editingPlan.id ? 'PUT' : 'POST'
            const url = editingPlan.id ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan),
            })

            if (res.ok) {
                setEditingPlan(null)
                setIsCreating(false)
                fetchPlans()
            }
        } catch (error) {
            console.error('Error saving plan:', error)
        } finally {
            setSaving(false)
        }
    }

    const deletePlan = async (id: string) => {
        if (!confirm('האם למחוק את המסלול?')) return

        try {
            await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
            fetchPlans()
        } catch (error) {
            console.error('Error deleting plan:', error)
        }
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${num / 1000000}M`
        if (num >= 1000) return `${num / 1000}K`
        return num.toString()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">ניהול מסלולים</h1>
                    <p className="text-slate-400">הגדר את החבילות והמחירים</p>
                </div>
                <button
                    onClick={() => { setEditingPlan(emptyPlan); setIsCreating(true) }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                    <Plus size={18} />
                    מסלול חדש
                </button>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">טוען...</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Package className="mx-auto mb-3 text-slate-600" size={48} />
                    <p className="text-slate-400">אין מסלולים עדיין</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-slate-800/50 rounded-xl border p-6 ${plan.isPopular ? 'border-purple-500' : plan.isBestValue ? 'border-green-500' : 'border-slate-700'
                                }`}
                        >
                            {/* Badges */}
                            {plan.isPopular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs rounded-full">
                                    הכי פופולרי
                                </span>
                            )}
                            {plan.isBestValue && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                                    הכי משתלם
                                </span>
                            )}

                            {/* Header */}
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-white">{plan.nameHe}</h3>
                                <p className="text-slate-400 text-sm">{plan.descriptionHe}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-white">₪{plan.price}</span>
                                <span className="text-slate-400">/חודש</span>
                            </div>

                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                <div className="bg-slate-700/50 px-3 py-2 rounded-lg text-center">
                                    <span className="text-white font-semibold">{plan.maxBots}</span>
                                    <span className="text-slate-400"> בוטים</span>
                                </div>
                                <div className="bg-slate-700/50 px-3 py-2 rounded-lg text-center">
                                    <span className="text-white font-semibold">{formatNumber(plan.maxMessages)}</span>
                                    <span className="text-slate-400"> הודעות</span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-2 mb-4">
                                {plan.hasLiveChat && (
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <Check size={16} /> צ'אט חי
                                    </div>
                                )}
                                {plan.hasIntegrations && (
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <Check size={16} /> אינטגרציות
                                    </div>
                                )}
                                {plan.hasPrioritySupport && (
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <Check size={16} /> תמיכה מועדפת
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className={`inline-block px-2 py-1 rounded text-xs ${plan.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'
                                }`}>
                                {plan.isActive ? 'פעיל' : 'לא פעיל'}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => setEditingPlan(plan)}
                                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition"
                                >
                                    <Edit2 size={14} /> עריכה
                                </button>
                                <button
                                    onClick={() => deletePlan(plan.id)}
                                    className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingPlan && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {isCreating ? 'מסלול חדש' : 'עריכת מסלול'}
                            </h2>
                            <button onClick={() => { setEditingPlan(null); setIsCreating(false) }} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">שם (עברית)</label>
                                    <input
                                        type="text"
                                        value={editingPlan.nameHe || ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, nameHe: e.target.value, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        placeholder="עסקי"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Slug (אנגלית)</label>
                                    <input
                                        type="text"
                                        value={editingPlan.slug || ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase() })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                        placeholder="business"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">תיאור</label>
                                <input
                                    type="text"
                                    value={editingPlan.descriptionHe || ''}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, descriptionHe: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    placeholder="לעסקים שרוצים לצמוח"
                                />
                            </div>

                            {/* Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">מחיר חודשי (₪)</label>
                                    <input
                                        type="number"
                                        value={editingPlan.price || 0}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">סדר תצוגה</label>
                                    <input
                                        type="number"
                                        value={editingPlan.sortOrder || 0}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, sortOrder: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            {/* Limits */}
                            <div>
                                <h3 className="text-white font-semibold mb-3">מגבלות</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">בוטים</label>
                                        <input
                                            type="number"
                                            value={editingPlan.maxBots || 1}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, maxBots: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">הודעות/חודש</label>
                                        <input
                                            type="number"
                                            value={editingPlan.maxMessages || 500}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, maxMessages: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">דפים לסריקה</label>
                                        <input
                                            type="number"
                                            value={editingPlan.maxCrawlPages || 100}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, maxCrawlPages: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">תווים</label>
                                        <input
                                            type="number"
                                            value={editingPlan.maxCharacters || 5000000}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, maxCharacters: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">חברי צוות</label>
                                        <input
                                            type="number"
                                            value={editingPlan.maxTeamMembers || 1}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, maxTeamMembers: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h3 className="text-white font-semibold mb-3">תכונות</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'hasLiveChat', label: 'צ\'אט חי' },
                                        { key: 'hasTranslation', label: 'תרגום צ\'אט' },
                                        { key: 'hasAutoRetrain', label: 'אימון אוטומטי' },
                                        { key: 'hasIntegrations', label: 'אינטגרציות' },
                                        { key: 'hasPrioritySupport', label: 'תמיכה מועדפת' },
                                        { key: 'hasRemoveBranding', label: 'הסרת לוגו' },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(editingPlan as Record<string, boolean>)[key] || false}
                                                onChange={(e) => setEditingPlan({ ...editingPlan, [key]: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600"
                                            />
                                            <span className="text-sm text-slate-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingPlan.isPopular || false}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600"
                                    />
                                    <Star className="text-purple-400" size={16} />
                                    <span className="text-sm text-slate-300">הכי פופולרי</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingPlan.isBestValue || false}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, isBestValue: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600"
                                    />
                                    <Award className="text-green-400" size={16} />
                                    <span className="text-sm text-slate-300">הכי משתלם</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => { setEditingPlan(null); setIsCreating(false) }}
                                className="px-4 py-2 text-slate-400 hover:text-white transition"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={savePlan}
                                disabled={saving}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition"
                            >
                                {saving ? 'שומר...' : 'שמור'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
