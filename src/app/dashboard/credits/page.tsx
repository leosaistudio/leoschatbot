import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { History, Crown, AlertCircle, CheckCircle } from 'lucide-react'
import PlanCard from '@/components/PlanCard'
import CreditPackages from '@/components/CreditPackages'

export default async function CreditsPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; cancelled?: string; error?: string; message?: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const params = await searchParams

    const [user, plans] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                creditBalance: true,
                creditHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        }),
        prisma.pricingPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        }),
    ])

    const balance = user?.creditBalance?.balance || 0
    const userPlanSlug = (user as Record<string, unknown> | null)?.plan as string | undefined || 'free'

    // Get messages used this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const messagesThisMonth = await prisma.message.count({
        where: {
            conversation: {
                bot: { userId: session.user.id },
            },
            createdAt: { gte: startOfMonth },
            role: 'assistant',
        },
    })

    const currentPlan = plans.find(p => p.slug === userPlanSlug)

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${num / 1000000}M`
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
        return num.toString()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">קרדיטים ומסלולים</h1>

            {/* Success/Error Messages */}
            {params.success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800">
                    <CheckCircle size={20} />
                    <span>התשלום התקבל בהצלחה! המסלול/קרדיטים עודכנו.</span>
                </div>
            )}
            {params.cancelled && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
                    <AlertCircle size={20} />
                    <span>התשלום בוטל.</span>
                </div>
            )}
            {params.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
                    <AlertCircle size={20} />
                    <span>{params.message || 'אירעה שגיאה בתשלום'}</span>
                </div>
            )}

            {/* Current Plan Banner */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Crown size={20} />
                            <p className="text-purple-200">המסלול הנוכחי שלך</p>
                        </div>
                        <p className="text-3xl font-bold mb-2">{currentPlan?.nameHe || 'חינם'}</p>
                        {currentPlan && (
                            <p className="text-purple-200">₪{currentPlan.price}/חודש</p>
                        )}
                    </div>
                    <div className="text-left">
                        <p className="text-purple-200 text-sm mb-1">שימוש החודש</p>
                        <p className="text-2xl font-bold">
                            {messagesThisMonth.toLocaleString()} / {currentPlan ? formatNumber(currentPlan.maxMessages) : '500'}
                        </p>
                        <p className="text-purple-200 text-sm">הודעות</p>
                    </div>
                    <div className="text-left">
                        <p className="text-purple-200 text-sm mb-1">קרדיטים זמינים</p>
                        <p className="text-2xl font-bold">{balance.toLocaleString()}</p>
                        <p className="text-purple-200 text-sm">קרדיטים</p>
                    </div>
                </div>
            </div>

            {/* Available Plans */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">בחר מסלול</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={{
                                id: plan.id,
                                nameHe: plan.nameHe,
                                descriptionHe: plan.descriptionHe,
                                price: plan.price,
                                maxBots: plan.maxBots,
                                maxMessages: plan.maxMessages,
                                isPopular: plan.isPopular,
                                isBestValue: plan.isBestValue,
                                hasLiveChat: plan.hasLiveChat,
                                hasIntegrations: plan.hasIntegrations,
                                hasPrioritySupport: plan.hasPrioritySupport,
                                hasRemoveBranding: plan.hasRemoveBranding,
                            }}
                            isCurrentPlan={plan.slug === userPlanSlug}
                        />
                    ))}
                </div>
            </div>

            {/* Credit Packages */}
            <CreditPackages />

            {/* Credits History */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <History size={20} />
                        היסטוריית קרדיטים
                    </h3>
                </div>

                {user?.creditHistory && user.creditHistory.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {user.creditHistory.map((item) => (
                            <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-800">{item.description}</p>
                                    <p className="text-sm text-slate-500">
                                        {new Date(item.createdAt).toLocaleDateString('he-IL')}
                                    </p>
                                </div>
                                <span className={`font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.amount > 0 ? '+' : ''}{item.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        אין היסטוריה עדיין
                    </div>
                )}
            </div>
        </div>
    )
}
