import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import LowCreditsAlert from '@/components/dashboard/LowCreditsAlert'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50" dir="rtl">
            {/* Sidebar */}
            <DashboardSidebar />

            {/* Main Content - full width on mobile, offset by sidebar on desktop */}
            <div className="md:mr-64 flex flex-col min-h-screen">
                <DashboardHeader user={session.user} />
                <LowCreditsAlert />
                <main className="p-4 md:p-6 flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
