import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { AlertTriangle, Zap } from 'lucide-react'

export default async function LowCreditsAlert() {
    const session = await auth()
    if (!session?.user?.id) return null

    // Get user's credit balance and plan
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            plan: true,
            creditBalance: {
                select: { balance: true }
            }
        }
    })

    if (!user) return null

    const currentBalance = user.creditBalance?.balance || 0

    // Get plan details to know the limit
    // If the plan is 'free', 'pro' etc., we look for the plan in the PricingPlan table
    const planDetails = await prisma.pricingPlan.findFirst({
        where: { slug: user.plan }
    })

    if (!planDetails) return null

    const maxCredits = planDetails.maxMessages || 500
    const threshold = maxCredits * 0.2 // 20% limit

    if (currentBalance > threshold) return null

    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle size={16} />
                <span>שים לב! יתרת הקרדיטים שלך נמוכה ({currentBalance} מתוך {maxCredits}). הבוט עלול להפסיק לעבוד בקרוב.</span>
            </div>
            <Link
                href="/dashboard/credits"
                className="bg-white text-amber-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-amber-50 transition flex items-center gap-1"
            >
                <Zap size={12} />
                טען קרדיטים עכשיו
            </Link>
        </div>
    )
}
