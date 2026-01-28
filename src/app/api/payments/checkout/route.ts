import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import yaadpay from '@/services/yaadpay'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// POST - Create checkout session
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, planId, creditsAmount } = body

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, phone: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        let amount: number
        let description: string
        let orderId: string
        let recurring: { payments: number; frequency: 'monthly' } | undefined

        if (type === 'subscription' && planId) {
            // Plan subscription
            const plan = await prisma.pricingPlan.findUnique({
                where: { id: planId },
            })

            if (!plan) {
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
            }

            amount = plan.price
            description = `מנוי ${plan.nameHe} - חודשי`
            orderId = yaadpay.generateOrderId('SUB')
            recurring = { payments: 12, frequency: 'monthly' } // 12 חודשים

        } else if (type === 'credits' && creditsAmount) {
            // One-time credit purchase
            const creditPackages: Record<number, number> = {
                500: 49,
                2000: 149,
                5000: 299,
            }

            amount = creditPackages[creditsAmount] || Math.ceil(creditsAmount * 0.1)
            description = `רכישת ${creditsAmount} קרדיטים`
            orderId = yaadpay.generateOrderId('CRD')

        } else {
            return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
        }

        // Create pending payment record
        const payment = await prisma.payment.create({
            data: {
                userId: user.id,
                type,
                amount,
                orderId,
                description,
                planId: type === 'subscription' ? planId : null,
                creditsAmount: type === 'credits' ? creditsAmount : null,
                status: 'pending',
            },
        })

        // Generate YaadPay payment URL
        const paymentUrl = yaadpay.createPaymentUrl({
            amount,
            orderId,
            description,
            clientName: user.name || 'לקוח',
            clientEmail: user.email,
            clientPhone: user.phone || undefined,
            successUrl: `${BASE_URL}/api/payments/callback`,
            cancelUrl: `${BASE_URL}/dashboard/credits?cancelled=true`,
            recurring,
        })

        console.log('Generated YaadPay URL:', paymentUrl)

        return NextResponse.json({
            paymentUrl,
            paymentId: payment.id,
            orderId,
        })

    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
