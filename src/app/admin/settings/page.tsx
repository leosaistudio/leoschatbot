import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">הגדרות מערכת</h1>
                <p className="text-slate-400">הגדרות כלליות של הפלטפורמה</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center gap-4 text-slate-400">
                    <Settings size={48} className="opacity-50" />
                    <div>
                        <p className="text-lg text-white">הגדרות מתקדמות</p>
                        <p className="text-sm">עמוד זה יכיל בעתיד הגדרות מערכת כמו:</p>
                        <ul className="text-sm mt-2 list-disc list-inside">
                            <li>הגדרות ברירת מחדל לבוטים חדשים</li>
                            <li>ניהול חבילות מחירים</li>
                            <li>הגדרות התראות</li>
                            <li>מפתחות API</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
