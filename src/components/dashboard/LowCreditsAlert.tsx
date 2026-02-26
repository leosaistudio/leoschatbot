import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { AlertTriangle, Zap } from 'lucide-react'

export default async function LowCreditsAlert() {
    const session = await auth()
    if (!session?.user?.id) return null

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

    const planDetails = await prisma.pricingPlan.findFirst({
        where: { slug: user.plan }
    })

    const maxCredits = planDetails?.maxMessages || 500
    const threshold = maxCredits * 0.2

    if (currentBalance > threshold) return null

    return (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-sm font-medium">
                <AlertTriangle size={18} className="flex-shrink-0 animate-pulse" />
                <span>⚠️ יתרת הקרדיטים שלך נמוכה! ({currentBalance} מתוך {maxCredits}) — הבוט עלול להפסיק לעבוד בקרוב.</span>
            </div>
            <Link
                href="/dashboard/credits"
                className="bg-white text-red-600 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-red-50 transition flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
            >
                <Zap size={14} />
                טען קרדיטים
            </Link>
        </div>
    )
}
