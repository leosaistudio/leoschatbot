'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Send, User, Bot, Loader2, BookOpen, ExternalLink } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
}

interface Source {
    content: string
    sourceUrl?: string
    sourceType: string
    similarity: number
}

export default function PlaygroundPage() {
    const params = useParams()
    const botId = params.id as string

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<number | null>(null)

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const res = await fetch(`/api/bots/${botId}/playground`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            })

            const data = await res.json()

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                sources: data.sources || [],
            }])
            setSelectedMessage(messages.length + 1) // Select the new assistant message
        } catch (error) {
            console.error('Playground error:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'שגיאה בקבלת תשובה',
            }])
        } finally {
            setLoading(false)
        }
    }

    const selectedSources = selectedMessage !== null
        ? messages[selectedMessage]?.sources
        : null

    return (
        <div className="max-w-6xl mx-auto">
            <Link
                href={`/dashboard/bots/${botId}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
            >
                <ArrowRight size={20} />
                חזרה להגדרות הבוט
            </Link>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="text-indigo-600" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">אזור בדיקה</h1>
                    <p className="text-slate-500">בדוק את הבוט וראה מאיפה הוא לוקח את המידע</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Area */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                        <h3 className="font-semibold text-slate-800">💬 שיחה עם הבוט</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-20">
                                <Bot size={48} className="mx-auto mb-3 opacity-50" />
                                <p>שאל שאלה לבדיקה</p>
                                <p className="text-sm">לחץ על תשובה כדי לראות את המקורות</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                onClick={() => msg.role === 'assistant' && setSelectedMessage(index)}
                                className={`flex items-start gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse cursor-pointer'
                                    } ${selectedMessage === index ? 'ring-2 ring-indigo-500 rounded-lg p-2 -m-2' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                        ? 'bg-slate-200 text-slate-600'
                                        : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`max-w-[80%] py-3 px-4 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-slate-100 text-slate-800'
                                        : 'bg-indigo-600 text-white'
                                    }`}>
                                    {msg.content}
                                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-indigo-400/30">
                                            <span className="text-xs opacity-75">
                                                📚 {msg.sources.length} מקורות
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="animate-spin" size={16} />
                                <span>מחפש תשובה...</span>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="שאל שאלה לבדיקה..."
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sources Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                        <h3 className="font-semibold text-slate-800">📖 מקורות המידע</h3>
                        <p className="text-sm text-slate-500">לחץ על תשובה כדי לראות מאיפה הבוט לקח את המידע</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedSources || selectedSources.length === 0 ? (
                            <div className="text-center text-slate-400 mt-20">
                                <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                                <p>לחץ על תשובה של הבוט</p>
                                <p className="text-sm">כדי לראות את המקורות שמהם נלקח המידע</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedSources.map((source, index) => (
                                    <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-500 uppercase">
                                                {source.sourceType === 'url' ? '🔗 קישור' :
                                                    source.sourceType === 'text' ? '📝 טקסט' :
                                                        source.sourceType === 'qa' ? '❓ שאלה ותשובה' :
                                                            source.sourceType === 'info' ? '🏢 פרטי עסק' : source.sourceType}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                התאמה: {Math.round(source.similarity * 100)}%
                                            </span>
                                        </div>

                                        {source.sourceUrl && (
                                            <a
                                                href={source.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-2"
                                            >
                                                <ExternalLink size={12} />
                                                {source.sourceUrl}
                                            </a>
                                        )}

                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {source.content.length > 300
                                                ? source.content.slice(0, 300) + '...'
                                                : source.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
