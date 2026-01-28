/**
 * Admin Setup Script
 * Run this to create the first admin user
 * 
 * Usage:
 * npx ts-node scripts/create-admin.ts
 * 
 * Or add to package.json:
 * "create-admin": "npx ts-node scripts/create-admin.ts"
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
    // ============================================
    // הגדר כאן את פרטי האדמין שלך
    // ============================================
    const ADMIN_EMAIL = 'admin@yourdomain.com'
    const ADMIN_PASSWORD = 'your-secure-password'
    const ADMIN_NAME = 'מנהל המערכת'
    // ============================================

    console.log('Creating admin user...')

    // Check if admin exists
    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    })

    if (existing) {
        if (existing.role === 'admin') {
            console.log('Admin user already exists!')
            return
        }

        // Upgrade existing user to admin
        await prisma.user.update({
            where: { email: ADMIN_EMAIL },
            data: { role: 'admin' },
        })
        console.log('Existing user upgraded to admin!')
        return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: ADMIN_NAME,
            role: 'admin',
            status: 'active',
        },
    })

    // Give admin some credits
    await prisma.creditBalance.create({
        data: {
            userId: admin.id,
            balance: 10000,
        },
    })

    console.log('✅ Admin user created successfully!')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log('')
    console.log('🔐 Login at: http://localhost:3000/login')
    console.log('👑 Admin panel: http://localhost:3000/admin')
}

createAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
