'use client'

import { useState } from 'react'
import { Sparkles, ThumbsUp, ThumbsDown, Minus, RefreshCw } from 'lucide-react'

interface SummaryButtonProps {
    conversationId: string
    currentSummary?: string | null
    currentSentiment?: string | null
}

export default function ConversationSummary({
    conversationId,
    currentSummary,
    currentSentiment
}: SummaryButtonProps) {
    const [summary, setSummary] = useState(currentSummary || '')
    const [sentiment, setSentiment] = useState(currentSentiment || '')
    const [topics, setTopics] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(!!currentSummary)

    const generateSummary = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/conversations/${conversationId}/summary`, {
                method: 'POST',
            })
            if (res.ok) {
                const data = await res.json()
                setSummary(data.summary || '')
                setSentiment(data.sentiment || '')
                setTopics(data.topics || [])
                setExpanded(true)
            } else {
                const error = await res.json()
                alert(error.error || 'שגיאה ביצירת הסיכום')
            }
        } catch (error) {
            console.error('Summary error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSentimentIcon = () => {
        switch (sentiment) {
            case 'positive': return <ThumbsUp size={14} className="text-green-600" />
            case 'negative': return <ThumbsDown size={14} className="text-red-600" />
            default: return <Minus size={14} className="text-slate-400" />
        }
    }

    const getSentimentLabel = () => {
        switch (sentiment) {
            case 'positive': return 'חיובי'
            case 'negative': return 'שלילי'
            default: return 'ניטרלי'
        }
    }

    if (!expanded && !summary) {
        return (
            <button
                onClick={generateSummary}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition disabled:opacity-50"
            >
                {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : (
                    <Sparkles size={14} />
                )}
                {loading ? 'מנתח...' : 'נתח שיחה עם AI'}
            </button>
        )
    }

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mt-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-purple-800 flex items-center gap-2">
                    <Sparkles size={14} />
                    ניתוח AI
                </h4>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full">
                        {getSentimentIcon()}
                        {getSentimentLabel()}
                    </span>
                    <button
                        onClick={generateSummary}
                        disabled={loading}
                        className="text-purple-600 hover:text-purple-700"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-700 mb-3">{summary}</p>

            {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-slate-600">
                            {topic}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
