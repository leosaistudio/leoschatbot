import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import yaadpay from '@/services/yaadpay'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// GET - Handle YaadPay callback after payment
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const callbackData = yaadpay.parseCallback(searchParams)

        console.log('YaadPay callback received:', callbackData)

        const orderId = callbackData.Order

        if (!orderId) {
            return NextResponse.redirect(`${BASE_URL}/dashboard/credits?error=missing_order`)
        }

        // Find the payment record
        const payment = await prisma.payment.findUnique({
            where: { orderId },
        })

        if (!payment) {
            console.error('Payment not found for order:', orderId)
            return NextResponse.redirect(`${BASE_URL}/dashboard/credits?error=payment_not_found`)
        }

        // Check if payment was successful
        if (yaadpay.isPaymentSuccessful(callbackData)) {
            // Update payment record
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'completed',
                    yaadTransId: callbackData.Id,
                    yaadAsmachta: callbackData.ACode,
                    yaadToken: callbackData.Token || null,
                },
            })

            // Handle based on payment type
            if (payment.type === 'subscription' && payment.planId) {
                await handleSubscriptionPayment(payment, callbackData)
            } else if (payment.type === 'credits' && payment.creditsAmount) {
                await handleCreditsPayment(payment)
            }

            // Redirect to success page
            return NextResponse.redirect(`${BASE_URL}/dashboard/credits?success=true&orderId=${orderId}`)

        } else {
            // Payment failed
            const errorMessage = yaadpay.getErrorMessage(callbackData)

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    errorMessage,
                },
            })

            return NextResponse.redirect(
                `${BASE_URL}/dashboard/credits?error=payment_failed&message=${encodeURIComponent(errorMessage)}`
            )
        }

    } catch (error) {
        console.error('Callback processing error:', error)
        return NextResponse.redirect(`${BASE_URL}/dashboard/credits?error=processing_error`)
    }
}

/**
 * Handle successful subscription payment
 */
async function handleSubscriptionPayment(
    payment: { id: string; userId: string; planId: string | null; amount: number },
    callbackData: { hkId?: string; Token?: string }
) {
    if (!payment.planId) return

    const plan = await prisma.pricingPlan.findUnique({
        where: { id: payment.planId },
    })

    if (!plan) return

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // Create or update subscription
    await prisma.subscription.upsert({
        where: { userId: payment.userId },
        create: {
            userId: payment.userId,
            planId: payment.planId,
            yaadHkId: callbackData.hkId || null,
            yaadToken: callbackData.Token || null,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextBillingDate: periodEnd,
            lastPaymentId: payment.id,
            lastPaymentDate: now,
        },
        update: {
            planId: payment.planId,
            yaadHkId: callbackData.hkId || null,
            yaadToken: callbackData.Token || null,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextBillingDate: periodEnd,
            lastPaymentId: payment.id,
            lastPaymentDate: now,
            failedAttempts: 0,
        },
    })

    // Update user's plan
    await prisma.user.update({
        where: { id: payment.userId },
        data: {
            plan: plan.slug,
            monthlyPayment: plan.price,
        },
    })

    console.log(`Subscription activated for user ${payment.userId}, plan: ${plan.slug}`)
}

/**
 * Handle successful credits purchase
 */
async function handleCreditsPayment(
    payment: { id: string; userId: string; creditsAmount: number | null; description: string | null }
) {
    if (!payment.creditsAmount) return

    // Add credits to user's balance
    await prisma.creditBalance.upsert({
        where: { userId: payment.userId },
        create: {
            userId: payment.userId,
            balance: payment.creditsAmount,
        },
        update: {
            balance: {
                increment: payment.creditsAmount,
            },
        },
    })

    // Add to credit history
    await prisma.creditHistory.create({
        data: {
            userId: payment.userId,
            amount: payment.creditsAmount,
            type: 'purchase',
            description: payment.description || `רכישת ${payment.creditsAmount} קרדיטים`,
        },
    })

    console.log(`Added ${payment.creditsAmount} credits to user ${payment.userId}`)
}
