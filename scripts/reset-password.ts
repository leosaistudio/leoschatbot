import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
        where: { email: 'admin@yourdomain.com' },
        data: { password: hashedPassword }
    })

    console.log('✅ Password reset successfully!')
    console.log('')
    console.log('🔐 Login details:')
    console.log('   Email: admin@yourdomain.com')
    console.log('   Password: admin123')
}

resetPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
