'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, User, Bot, Send, ArrowRight, Phone, RefreshCw, Zap, ArrowLeft } from 'lucide-react'

interface Message {
    id: string
    role: string
    content: string
    createdAt: string
}

interface Conversation {
    id: string
    visitorId: string
    visitorName: string | null
    visitorEmail: string | null
    status: string
    startedAt: Date | string
    pageUrl: string | null
    creditsUsed: number
    bot: { id: string; name: string }
    messages: { content: string }[]
    _count: { messages: number }
}

interface Props {
    initialConversations: Conversation[]
}

export default function LiveChatClient({ initialConversations }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    // Mobile: show list or chat panel
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-refresh conversations every 10 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/conversations/active')
                if (res.ok) {
                    const data = await res.json()
                    setConversations(data)
                }
            } catch (error) {
                console.error('Failed to refresh conversations:', error)
            }
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    // Load messages when conversation selected
    useEffect(() => {
        if (selectedId) {
            loadMessages(selectedId)
        }
    }, [selectedId])

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!selectedId) return
        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/conversations/${selectedId}/messages`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages)
                }
            } catch (error) {
                console.error('Failed to poll messages:', error)
            }
        }, 3000)
        return () => clearInterval(pollInterval)
    }, [selectedId])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function loadMessages(conversationId: string) {
        setLoading(true)
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages)
            }
        } catch (error) {
            console.error('Failed to load messages:', error)
        } finally {
            setLoading(false)
        }
    }

    function selectConversation(id: string) {
        setSelectedId(id)
        setMobileView('chat')
    }

    function goBackToList() {
        setMobileView('list')
    }

    async function handleTakeover() {
        if (!selectedId || sending) return
        setSending(true)
        try {
            await fetch(`/api/conversations/${selectedId}/takeover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'human_takeover' }),
            })
            setConversations(prev => prev.map(c =>
                c.id === selectedId ? { ...c, status: 'human_takeover' } : c
            ))
        } catch (error) {
            console.error('Takeover failed:', error)
        } finally {
            setSending(false)
        }
    }

    async function handleReturnToBot() {
        if (!selectedId) return
        try {
            await fetch(`/api/conversations/${selectedId}/takeover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' }),
            })
            setConversations(prev => prev.map(c =>
                c.id === selectedId ? { ...c, status: 'active' } : c
            ))
        } catch (error) {
            console.error('Return to bot failed:', error)
        }
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedId || !newMessage.trim() || sending) return
        setSending(true)
        try {
            const res = await fetch(`/api/conversations/${selectedId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const selectedConversation = conversations.find(c => c.id === selectedId)

    // ---- Conversations List Panel ----
    const listPanel = (
        <div className="flex flex-col h-full bg-white border-l border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-lg text-slate-800">צ'אט חי</h2>
                <p className="text-sm text-slate-500">{conversations.length} שיחות פעילות</p>
            </div>

            {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex-1">
                    <MessageSquare className="mx-auto mb-4 text-slate-300" size={40} />
                    <p>אין שיחות פעילות כרגע</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={`w-full p-4 text-right hover:bg-slate-50 transition ${selectedId === conv.id ? 'bg-purple-50 border-r-4 border-purple-500' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${conv.status === 'human_takeover' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {conv.status === 'human_takeover' ? <Phone size={18} /> : <User size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-slate-800 truncate text-sm">
                                            {conv.visitorName || `מבקר ${conv.visitorId.slice(-4)}`}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${conv.status === 'human_takeover' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {conv.status === 'human_takeover' ? 'אנושי' : 'בוט'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                        {conv.messages[0]?.content || 'ללא הודעות'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                                        <span>{conv.bot.name}</span>
                                        <span>•</span>
                                        <span>{conv._count.messages} הודעות</span>
                                        {conv.creditsUsed > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Zap size={12} />
                                                {conv.creditsUsed}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    // ---- Chat Area Panel ----
    const chatPanel = (
        <div className="flex flex-col h-full bg-slate-50">
            {!selectedId ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <MessageSquare size={60} className="mx-auto mb-4 text-slate-300" />
                        <p>בחר שיחה מהרשימה</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="bg-white border-b border-slate-200 p-3 md:p-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            {/* Back button - mobile only */}
                            <button
                                onClick={goBackToList}
                                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg flex-shrink-0"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="text-purple-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-medium text-slate-800 text-sm truncate">
                                    {selectedConversation?.visitorName || `מבקר ${selectedConversation?.visitorId.slice(-4)}`}
                                </h3>
                                {selectedConversation?.pageUrl && (
                                    <p className="text-xs text-slate-500 truncate max-w-[150px] md:max-w-xs">
                                        {selectedConversation.pageUrl}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            {selectedConversation?.status === 'human_takeover' ? (
                                <button
                                    onClick={handleReturnToBot}
                                    className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm"
                                >
                                    <Bot size={16} />
                                    <span className="hidden md:inline">החזר לבוט</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleTakeover}
                                    className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                                >
                                    <Phone size={16} />
                                    <span className="hidden md:inline">השתלט</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <RefreshCw className="animate-spin text-slate-400" size={30} />
                            </div>
                        ) : (
                            <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2 md:gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}
                                    >
                                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`max-w-[75%] md:max-w-md py-2 px-3 md:py-3 md:px-4 rounded-2xl text-sm md:text-base ${msg.role === 'user' ? 'bg-white border border-slate-200 text-slate-800' : 'bg-purple-600 text-white'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input - Only show if human takeover */}
                    {selectedConversation?.status === 'human_takeover' && (
                        <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 p-3 md:p-4">
                            <div className="flex gap-2 md:gap-3 max-w-2xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="הקלד תשובה..."
                                    className="flex-1 px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="px-4 py-2 md:px-6 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    <span className="hidden md:inline">שלח</span>
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    )

    return (
        <>
            {/* Desktop: side-by-side layout */}
            <div className="hidden md:flex h-[calc(100vh-100px)]">
                <div className="w-80 flex-shrink-0">{listPanel}</div>
                <div className="flex-1">{chatPanel}</div>
            </div>

            {/* Mobile: toggle between list and chat */}
            <div className="md:hidden h-[calc(100vh-80px)]">
                {mobileView === 'list' ? listPanel : chatPanel}
            </div>
        </>
    )
}
