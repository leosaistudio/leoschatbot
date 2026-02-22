import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Check, Star, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
    const plans = await prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    })

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${num / 1000000}M`
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
        return num.toString()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
            {/* Header */}
            <header className="container mx-auto px-6 py-8">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-white">
                        ChatBot AI 🤖
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-slate-300 hover:text-white transition">
                            התחברות
                        </Link>
                        <Link href="/register" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                            הרשמה חינם
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        בחר את המסלול המתאים לך
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        התחל בחינם ושדרג בכל עת. כל המסלולים כוללים גישה לכל הפיצ&apos;רים הבסיסיים.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 p-8 transition-all hover:scale-105 ${plan.isPopular
                                ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                                : plan.isBestValue
                                    ? 'border-green-500 shadow-xl shadow-green-500/20'
                                    : 'border-slate-700 hover:border-slate-500'
                                }`}
                        >
                            {/* Badge */}
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                                    <Star size={14} />
                                    הכי פופולרי
                                </div>
                            )}
                            {plan.isBestValue && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                                    <Award size={14} />
                                    הכי משתלם
                                </div>
                            )}

                            {/* Plan Info */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.nameHe}</h3>
                                <p className="text-slate-400">{plan.descriptionHe}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-5xl font-bold text-white">₪{plan.price}</span>
                                <span className="text-slate-400 text-lg">/חודש</span>
                            </div>

                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-700/50 px-4 py-3 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{plan.maxBots}</p>
                                    <p className="text-sm text-slate-400">בוטים</p>
                                </div>
                                <div className="bg-slate-700/50 px-4 py-3 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{formatNumber(plan.maxMessages)}</p>
                                    <p className="text-sm text-slate-400">הודעות/חודש</p>
                                </div>
                                <div className="bg-slate-700/50 px-4 py-3 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{formatNumber(plan.maxCharacters)}</p>
                                    <p className="text-sm text-slate-400">תווים</p>
                                </div>
                                <div className="bg-slate-700/50 px-4 py-3 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{formatNumber(plan.maxCrawlPages)}</p>
                                    <p className="text-sm text-slate-400">דפים לסריקה</p>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-3 mb-8">
                                {plan.hasLiveChat && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>צ&apos;אט חי עם נציג</span>
                                    </div>
                                )}
                                {plan.hasTranslation && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>תרגום צ&apos;אט</span>
                                    </div>
                                )}
                                {plan.hasAutoRetrain && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>אימון אוטומטי</span>
                                    </div>
                                )}
                                {plan.hasIntegrations && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>אינטגרציות (Zapier, API)</span>
                                    </div>
                                )}
                                {plan.hasPrioritySupport && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>תמיכה מועדפת</span>
                                    </div>
                                )}
                                {plan.hasRemoveBranding && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Check size={18} />
                                        <span>הסרת &quot;Powered by&quot;</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-green-400">
                                    <Check size={18} />
                                    <span>{plan.maxTeamMembers} חברי צוות</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link
                                href={`/register?plan=${plan.slug}`}
                                className={`block w-full py-4 text-center rounded-xl font-semibold transition ${plan.isPopular
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : plan.isBestValue
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                                    }`}
                            >
                                בחר ב{plan.nameHe}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Free Plan Notice */}
                <div className="text-center mt-12">
                    <p className="text-slate-400">
                        רוצה לנסות קודם?{' '}
                        <Link href="/register" className="text-purple-400 hover:text-purple-300 underline">
                            התחל בחינם
                        </Link>
                        {' '}עם 500 הודעות לחודש
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-6 py-12 border-t border-slate-800 mt-12">
                <div className="text-center text-slate-500">
                    <p>© 2024 ChatBot AI. כל הזכויות שמורות.</p>
                </div>
            </footer>
        </div>
    )
}
