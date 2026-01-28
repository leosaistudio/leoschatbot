/**
 * Create Demo User Script
 * Creates a demo user with sample bots, conversations, and leads
 * 
 * Usage: npx ts-node scripts/create-demo-user.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDemoUser() {
    console.log('🚀 Creating demo user with sample data...\n')

    // ============================================
    // Demo User Details
    // ============================================
    const DEMO_EMAIL = 'demo@example.com'
    const DEMO_PASSWORD = '123456'
    const DEMO_NAME = 'משתמש לדוגמה'
    const DEMO_COMPANY = 'חברת הדגמה בע"מ'

    // Check if demo user exists
    const existing = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
    })

    if (existing) {
        console.log('⚠️  Demo user already exists. Deleting and recreating...')
        await prisma.user.delete({ where: { email: DEMO_EMAIL } })
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12)

    const demoUser = await prisma.user.create({
        data: {
            email: DEMO_EMAIL,
            password: hashedPassword,
            name: DEMO_NAME,
            companyName: DEMO_COMPANY,
            role: 'user',
            status: 'active',
        },
    })

    console.log(`✅ User created: ${DEMO_EMAIL}`)

    // Create credit balance
    await prisma.creditBalance.create({
        data: {
            userId: demoUser.id,
            balance: 500,
        },
    })

    // Create credit history
    await prisma.creditHistory.create({
        data: {
            userId: demoUser.id,
            amount: 100,
            type: 'bonus',
            description: 'בונוס הרשמה',
        },
    })

    await prisma.creditHistory.create({
        data: {
            userId: demoUser.id,
            amount: 500,
            type: 'purchase',
            description: 'רכישת חבילת Pro',
        },
    })

    await prisma.creditHistory.create({
        data: {
            userId: demoUser.id,
            amount: -100,
            type: 'usage',
            description: 'שימוש בצ\'אט AI',
        },
    })

    console.log('✅ Credits created: 500 balance')

    // Create demo bots
    const bot1 = await prisma.bot.create({
        data: {
            userId: demoUser.id,
            name: 'בוט שירות לקוחות',
            description: 'בוט שעוזר ללקוחות עם שאלות נפוצות',
            status: 'active',
            welcomeMessage: 'שלום! 👋 אני כאן לעזור לך. במה אוכל לסייע?',
            systemPrompt: 'אתה נציג שירות לקוחות אדיב ומקצועי. עזור ללקוחות בצורה ידידותית.',
            primaryColor: '#8B5CF6',
        },
    })

    const bot2 = await prisma.bot.create({
        data: {
            userId: demoUser.id,
            name: 'בוט מכירות',
            description: 'בוט שעוזר להמיר גולשים ללקוחות',
            status: 'active',
            welcomeMessage: 'היי! רוצה לשמוע על המבצעים שלנו? 🎉',
            primaryColor: '#EC4899',
        },
    })

    const bot3 = await prisma.bot.create({
        data: {
            userId: demoUser.id,
            name: 'בוט FAQ',
            description: 'עונה על שאלות נפוצות',
            status: 'draft',
            welcomeMessage: 'שלום! איך אפשר לעזור?',
            primaryColor: '#10B981',
        },
    })

    console.log('✅ 3 bots created')

    // Create training sources for bot1
    await prisma.trainingSource.create({
        data: {
            botId: bot1.id,
            type: 'url',
            content: 'https://example.com',
            status: 'completed',
        },
    })

    // Create conversations
    const conv1 = await prisma.conversation.create({
        data: {
            botId: bot1.id,
            visitorId: 'visitor_abc123',
            status: 'closed',
            visitorName: 'ישראל ישראלי',
            visitorEmail: 'israel@example.com',
            pageUrl: 'https://example.com/products',
        },
    })

    await prisma.message.createMany({
        data: [
            { conversationId: conv1.id, role: 'assistant', content: 'שלום! 👋 אני כאן לעזור לך. במה אוכל לסייע?' },
            { conversationId: conv1.id, role: 'user', content: 'מה שעות הפעילות שלכם?' },
            { conversationId: conv1.id, role: 'assistant', content: 'אנחנו פתוחים א\'-ה\' בין 9:00-18:00. ביום ו\' אנחנו פתוחים עד 14:00.' },
            { conversationId: conv1.id, role: 'user', content: 'תודה רבה!' },
            { conversationId: conv1.id, role: 'assistant', content: 'בשמחה! אם יש לך שאלות נוספות, אני כאן 😊' },
        ],
    })

    const conv2 = await prisma.conversation.create({
        data: {
            botId: bot1.id,
            visitorId: 'visitor_xyz789',
            status: 'active',
            pageUrl: 'https://example.com/contact',
        },
    })

    await prisma.message.createMany({
        data: [
            { conversationId: conv2.id, role: 'assistant', content: 'שלום! 👋 אני כאן לעזור לך. במה אוכל לסייע?' },
            { conversationId: conv2.id, role: 'user', content: 'אני רוצה לדעת על המוצרים שלכם' },
        ],
    })

    const conv3 = await prisma.conversation.create({
        data: {
            botId: bot2.id,
            visitorId: 'visitor_def456',
            status: 'closed',
            visitorName: 'שרה כהן',
            visitorEmail: 'sara@example.com',
        },
    })

    await prisma.message.createMany({
        data: [
            { conversationId: conv3.id, role: 'assistant', content: 'היי! רוצה לשמוע על המבצעים שלנו? 🎉' },
            { conversationId: conv3.id, role: 'user', content: 'כן בטח!' },
            { conversationId: conv3.id, role: 'assistant', content: 'יש לנו כרגע 20% הנחה על כל המוצרים! הזדמנות מעולה.' },
        ],
    })

    console.log('✅ 3 conversations with messages created')

    // Create leads
    await prisma.lead.createMany({
        data: [
            {
                botId: bot1.id,
                name: 'ישראל ישראלי',
                email: 'israel@example.com',
                phone: '050-1234567',
                pageUrl: 'https://example.com/products',
            },
            {
                botId: bot1.id,
                name: 'שרה כהן',
                email: 'sara@example.com',
                phone: '052-7654321',
                pageUrl: 'https://example.com/pricing',
            },
            {
                botId: bot2.id,
                name: 'דוד לוי',
                email: 'david@example.com',
                pageUrl: 'https://example.com/contact',
            },
            {
                botId: bot2.id,
                name: 'רחל גולן',
                email: 'rachel@example.com',
                phone: '054-9876543',
            },
        ],
    })

    console.log('✅ 4 leads created')

    // Summary
    console.log('\n========================================')
    console.log('🎉 Demo user created successfully!')
    console.log('========================================')
    console.log(`📧 Email: ${DEMO_EMAIL}`)
    console.log(`🔑 Password: ${DEMO_PASSWORD}`)
    console.log('----------------------------------------')
    console.log('📊 Data created:')
    console.log('   - 3 bots (2 active, 1 draft)')
    console.log('   - 3 conversations with messages')
    console.log('   - 4 leads')
    console.log('   - 500 credits')
    console.log('========================================')
    console.log('')
    console.log('🔗 Login at: http://localhost:3000/login')
    console.log('👤 Dashboard: http://localhost:3000/dashboard')
    console.log('')
}

createDemoUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
