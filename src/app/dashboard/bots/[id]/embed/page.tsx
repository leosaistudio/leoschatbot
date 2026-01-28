import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Code } from 'lucide-react'
import CopyButton from '@/components/CopyButton'

interface EmbedPageProps {
    params: Promise<{ id: string }>
}

export default async function EmbedPage({ params }: EmbedPageProps) {
    const session = await auth()
    if (!session?.user?.id) return null

    const { id } = await params

    const bot = await prisma.bot.findFirst({
        where: { id, userId: session.user.id },
        select: { id: true, name: true, status: true },
    })

    if (!bot) notFound()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const embedCode = `<!-- ChatBot AI Widget -->
<script src="${appUrl}/widget.js" data-bot-id="${bot.id}"></script>`

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href={`/dashboard/bots/${id}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
                <ArrowRight size={20} />
                חזרה להגדרות הבוט
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">הטמעת הבוט באתר</h1>
                <p className="text-slate-500">העתק את הקוד והוסף אותו לאתר שלך</p>
            </div>

            {/* Status Warning */}
            {bot.status !== 'active' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                        ⚠️ הבוט לא פעיל כרגע. הפעל אותו כדי שהווידג'ט יעבוד באתר.
                    </p>
                    <Link
                        href={`/dashboard/bots/${id}`}
                        className="text-yellow-700 underline hover:no-underline text-sm"
                    >
                        לך להפעלת הבוט
                    </Link>
                </div>
            )}

            {/* Embed Code */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Code className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">קוד הטמעה</h3>
                            <p className="text-sm text-slate-500">הוסף את הקוד לפני &lt;/body&gt;</p>
                        </div>
                    </div>
                    <CopyButton text={embedCode} />
                </div>

                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono" dir="ltr">
                        {embedCode}
                    </pre>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">הוראות התקנה</h3>

                <ol className="space-y-4 text-slate-600">
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                        <div>
                            <p className="font-medium text-slate-800">העתק את הקוד</p>
                            <p className="text-sm">לחץ על כפתור ההעתקה למעלה</p>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                        <div>
                            <p className="font-medium text-slate-800">פתח את קבצי האתר</p>
                            <p className="text-sm">מצא את קובץ ה-HTML הראשי (index.html או תבנית הבסיס)</p>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                        <div>
                            <p className="font-medium text-slate-800">הדבק את הקוד</p>
                            <p className="text-sm">הוסף את הקוד לפני תגית <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code></p>
                        </div>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                        <div>
                            <p className="font-medium text-slate-800">שמור ובדוק</p>
                            <p className="text-sm">שמור את הקובץ ורענן את האתר - הצ'אטבוט יופיע!</p>
                        </div>
                    </li>
                </ol>
            </div>

            {/* Platforms */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">מדריכים לפלטפורמות</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['WordPress', 'Wix', 'Shopify', 'אחר'].map((platform) => (
                        <button
                            key={platform}
                            className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition"
                        >
                            <p className="font-medium text-slate-700">{platform}</p>
                            <p className="text-xs text-slate-500">צפה במדריך</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

