import { requireAdmin } from '@/lib/admin'
import AdminSidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/Header'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await requireAdmin()

    return (
        <div className="min-h-screen bg-slate-900" dir="rtl">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="mr-64">
                <AdminHeader user={user} />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
