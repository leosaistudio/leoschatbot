'use client'

import { Check, Star, Award } from 'lucide-react'
import CheckoutButton from '@/components/CheckoutButton'

interface Plan {
    id: string
    nameHe: string
    descriptionHe: string | null
    price: number
    maxBots: number
    maxMessages: number
    isPopular: boolean
    isBestValue: boolean
    hasLiveChat: boolean
    hasIntegrations: boolean
    hasPrioritySupport: boolean
    hasRemoveBranding: boolean
}

interface PlanCardProps {
    plan: Plan
    isCurrentPlan: boolean
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${num / 1000000}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
}

export default function PlanCard({ plan, isCurrentPlan }: PlanCardProps) {
    return (
        <div
            className={`relative bg-white rounded-xl border-2 p-6 ${isCurrentPlan
                ? 'border-green-500 ring-2 ring-green-500/20'
                : plan.isPopular
                    ? 'border-purple-500'
                    : plan.isBestValue
                        ? 'border-blue-500'
                        : 'border-slate-200'
                }`}
        >
            {/* Current Plan Badge */}
            {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Check size={14} />
                    המסלול שלך
                </div>
            )}
            {!isCurrentPlan && plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star size={14} />
                    הכי פופולרי
                </div>
            )}
            {!isCurrentPlan && plan.isBestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Award size={14} />
                    הכי משתלם
                </div>
            )}

            <h3 className="text-xl font-bold text-slate-800 mt-2">{plan.nameHe}</h3>
            <p className="text-slate-500 text-sm mb-4">{plan.descriptionHe}</p>

            <p className="text-4xl font-bold text-slate-800 mb-1">
                ₪{plan.price}
            </p>
            <p className="text-slate-500 mb-4">לחודש</p>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                    <span className="font-bold text-slate-800">{plan.maxBots}</span>
                    <span className="text-slate-500"> בוטים</span>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-center">
                    <span className="font-bold text-slate-800">{formatNumber(plan.maxMessages)}</span>
                    <span className="text-slate-500"> הודעות</span>
                </div>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-4 text-sm">
                {plan.hasLiveChat && (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check size={14} /> צ'אט חי
                    </div>
                )}
                {plan.hasIntegrations && (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check size={14} /> אינטגרציות
                    </div>
                )}
                {plan.hasPrioritySupport && (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check size={14} /> תמיכה מועדפת
                    </div>
                )}
                {plan.hasRemoveBranding && (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check size={14} /> הסרת לוגו
                    </div>
                )}
            </div>

            {isCurrentPlan ? (
                <button
                    className="w-full py-3 rounded-xl font-medium bg-green-100 text-green-700 cursor-default"
                    disabled
                >
                    המסלול הנוכחי
                </button>
            ) : (
                <CheckoutButton
                    type="subscription"
                    planId={plan.id}
                    className="w-full py-3 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                    בחר מסלול
                </CheckoutButton>
            )}
        </div>
    )
}
