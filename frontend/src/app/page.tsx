'use client'
import Link from 'next/link'
import { MapPin, BarChart3, Shield, Zap, Users, Brain } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1E2D45] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#F1F5F9] tracking-tight">CivicMind AI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/citizen" className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
            Citizen Portal
          </Link>
          <Link href="/mayor" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
            Mayor Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-medium mb-8">
          <Zap className="w-3 h-3" />
          Multi-Agent AI Platform · Vibe2Ship 2026
        </div>

        <h1 className="text-5xl font-bold text-[#F1F5F9] tracking-tight mb-4 max-w-2xl leading-tight">
          AI that runs your city's
          <span className="text-blue-400"> civic operations</span>
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-xl mb-12 leading-relaxed">
          Seven autonomous agents detect, validate, prioritize, and route civic issues in real time —
          from a citizen's photo to a department's inbox in seconds.
        </p>

        {/* CTA cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <Link href="/citizen" className="group p-6 rounded-2xl bg-[#1A2236] border border-[#1E2D45] hover:border-blue-600/40 hover:bg-[#1E2D45] transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="font-semibold text-[#F1F5F9] mb-1">Citizen Portal</h2>
            <p className="text-sm text-[#94A3B8]">Report issues, track complaints, chat with the AI assistant</p>
          </Link>

          <Link href="/mayor" className="group p-6 rounded-2xl bg-[#1A2236] border border-[#1E2D45] hover:border-emerald-500/40 hover:bg-[#1E2D45] transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-[#F1F5F9] mb-1">Mayor Dashboard</h2>
            <p className="text-sm text-[#94A3B8]">City intelligence, hotspot map, NL queries, department analytics</p>
          </Link>
        </div>

        {/* Agent pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-12">
          {['Vision Agent', 'Duplicate Agent', 'Priority Agent', 'Routing Agent', 'Chat Agent'].map(a => (
            <span key={a} className="px-3 py-1 text-xs rounded-full bg-[#1A2236] border border-[#1E2D45] text-[#94A3B8]">
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}