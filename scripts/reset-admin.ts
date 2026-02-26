import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdmin() {
    const ADMIN_EMAIL = 'office@leos.co.il'
    const ADMIN_PASSWORD = '7aa69V6kR3bY'
    const ADMIN_NAME = 'Admin'

    console.log(`Resetting admin user ${ADMIN_EMAIL}...`)

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)

    const user = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        },
        create: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: ADMIN_NAME,
            role: 'admin',
            status: 'active',
        },
    })

    // Ensure they have credits
    const balance = await prisma.creditBalance.findUnique({
        where: { userId: user.id }
    })

    if (!balance) {
        await prisma.creditBalance.create({
            data: {
                userId: user.id,
                balance: 10000,
            }
        })
    }

    console.log('✅ Admin reset successfully!')
    console.log(`Email: ${ADMIN_EMAIL}`)
    console.log(`Password: ${ADMIN_PASSWORD}`)
}

resetAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
