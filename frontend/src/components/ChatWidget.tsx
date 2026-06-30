'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { citizenChat, mayorQuery } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  mode: 'citizen' | 'mayor'
  issueId?: string
  placeholder?: string
}

export default function ChatWidget({ mode, issueId, placeholder }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: mode === 'citizen'
        ? "Hi! I'm the CivicMind AI assistant. Ask me about your complaint status, resolution timelines, or anything about your reported issues."
        : "City Intelligence AI ready. Ask me anything about current civic issues — e.g. 'Which ward has the most critical issues?' or 'Show me unresolved potholes.'",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      let resp: string
      if (mode === 'citizen') {
        const data = await citizenChat(userMsg, issueId)
        resp = data.response
      } else {
        const data = await mayorQuery(userMsg)
        resp = data.response
      }
      setMessages(prev => [...prev, { role: 'assistant', text: resp }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not reach the AI right now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#111827] border border-[#1E2D45] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1E2D45] flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span className="text-sm font-medium text-[#F1F5F9]">
          {mode === 'citizen' ? 'CivicMind Assistant' : 'City Intelligence AI'}
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'assistant' ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-[#1E2D45]'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-blue-400" /> : <User className="w-3.5 h-3.5 text-[#94A3B8]" />}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-[#1A2236] border border-[#1E2D45] text-[#F1F5F9]'
                : 'bg-blue-600 text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#1A2236] border border-[#1E2D45]">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1E2D45]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={placeholder || 'Ask anything...'}
            className="flex-1 bg-[#1A2236] border border-[#1E2D45] rounded-xl px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#4B5563] focus:outline-none focus:border-blue-600/50 transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}