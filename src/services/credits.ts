import { prisma } from '@/lib/db'

const CREDITS_PER_MESSAGE = 1
const CREDITS_PER_PAGE_CRAWL = 0.5

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await prisma.creditBalance.findUnique({
        where: { userId },
    })

    return balance ? balance.balance >= amount : false
}

/**
 * Deduct credits from user balance
 */
export async function deductCredits(
    userId: string,
    amount: number,
    description: string
): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            // Get current balance
            const balance = await tx.creditBalance.findUnique({
                where: { userId },
            })

            if (!balance || balance.balance < amount) {
                throw new Error('Insufficient credits')
            }

            // Update balance
            await tx.creditBalance.update({
                where: { userId },
                data: { balance: { decrement: amount } },
            })

            // Record transaction
            await tx.creditHistory.create({
                data: {
                    userId,
                    amount: -amount,
                    type: 'usage',
                    description,
                },
            })
        })

        return true
    } catch {
        return false
    }
}

/**
 * Add credits to user balance
 */
export async function addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'bonus',
    description?: string
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        // Upsert balance
        await tx.creditBalance.upsert({
            where: { userId },
            create: { userId, balance: amount },
            update: { balance: { increment: amount } },
        })

        // Record transaction
        await tx.creditHistory.create({
            data: {
                userId,
                amount,
                type,
                description: description || `${type === 'purchase' ? 'רכישת' : 'בונוס'} ${amount} קרדיטים`,
            },
        })
    })
}

/**
 * Get user credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
    const balance = await prisma.creditBalance.findUnique({
        where: { userId },
    })

    return balance?.balance || 0
}

/**
 * Use credits for sending a message
 */
export async function useCreditsForMessage(userId: string): Promise<boolean> {
    return deductCredits(userId, CREDITS_PER_MESSAGE, 'הודעת AI')
}

/**
 * Use credits for crawling a page
 */
export async function useCreditsForCrawl(userId: string): Promise<boolean> {
    return deductCredits(userId, CREDITS_PER_PAGE_CRAWL, 'סריקת עמוד')
}
