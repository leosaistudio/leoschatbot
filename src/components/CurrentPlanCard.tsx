'use client'

import { useState, useEffect } from 'react'
import { Package, Check, Crown, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UserPlan {
    slug: string
    name: string
    nameHe: string
    price: number
    maxBots: number
    maxMessages: number
    usedMessages: number
    usedBots: number
    features: string[]
}

export default function CurrentPlanCard() {
    const [plan, setPlan] = useState<UserPlan | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/user/plan')
            .then((res) => res.json())
            .then((data) => setPlan(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-slate-200 rounded w-1/2"></div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Package size={24} />
                    <h3 className="text-lg font-semibold">המסלול שלך</h3>
                </div>
                <p className="text-xl font-bold mb-2">חינם</p>
                <p className="text-purple-100 text-sm mb-4">500 הודעות לחודש</p>
                <Link
                    href="/dashboard/credits"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition"
                >
                    שדרג עכשיו
                    <ArrowRight size={16} />
                </Link>
            </div>
        )
    }

    const messagesPercent = Math.min((plan.usedMessages / plan.maxMessages) * 100, 100)
    const botsPercent = Math.min((plan.usedBots / plan.maxBots) * 100, 100)

    return (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Crown size={24} />
                    <h3 className="text-lg font-semibold">המסלול שלך</h3>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    ₪{plan.price}/חודש
                </span>
            </div>

            <p className="text-2xl font-bold mb-4">{plan.nameHe}</p>

            {/* Usage Bars */}
            <div className="space-y-3 mb-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>הודעות</span>
                        <span>{plan.usedMessages.toLocaleString()} / {plan.maxMessages.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${messagesPercent > 80 ? 'bg-red-400' : 'bg-white'
                                }`}
                            style={{ width: `${messagesPercent}%` }}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>בוטים</span>
                        <span>{plan.usedBots} / {plan.maxBots}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${botsPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Upgrade Button */}
            <Link
                href="/dashboard/credits"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition"
            >
                <Zap size={16} />
                שדרג מסלול
            </Link>
        </div>
    )
}
