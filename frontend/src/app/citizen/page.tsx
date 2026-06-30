'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, MapPin, Loader2, Brain, ArrowLeft, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { reportIssue, voteOnIssue } from '@/lib/api'
import PipelineVisualizer from '@/components/PipelineVisualizer'
import IssueCard from '@/components/IssueCard'
import ChatWidget from '@/components/ChatWidget'

type Tab = 'report' | 'track' | 'chat'

export default function CitizenPage() {
  const [tab, setTab] = useState<Tab>('report')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [pipelineStage, setPipelineStage] = useState('vision')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [myIssues, setMyIssues] = useState<any[]>([])
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!image) return
    setLoading(true)
    setError(null)
    setPipelineStage('vision')

    // Simulate pipeline stage updates
    const stages = ['vision', 'confidence', 'duplicate_check', 'priority', 'routing', 'complete']
    let stageIdx = 0
    const stageTimer = setInterval(() => {
      stageIdx++
      if (stageIdx < stages.length) setPipelineStage(stages[stageIdx])
      else clearInterval(stageTimer)
    }, 900)

    try {
      const fd = new FormData()
      fd.append('image', image)
      if (description) fd.append('user_description', description)

      const data = await reportIssue(fd)
      clearInterval(stageTimer)
      setPipelineStage('complete')
      setResult(data.issue)
      setMyIssues(prev => [data.issue, ...prev])
    } catch (err: any) {
      clearInterval(stageTimer)
      setError(err?.response?.data?.detail || 'Something went wrong. Check your API keys.')
      setPipelineStage('vision')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (issueId: string) => {
    try {
      await voteOnIssue(issueId)
      alert('Vote recorded!')
    } catch {
      alert('Could not record vote.')
    }
  }

  const PRIORITY_COLOR: Record<string, string> = {
    Critical: 'text-red-400', High: 'text-amber-400', Medium: 'text-blue-400', Low: 'text-emerald-400',
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Nav */}
      <nav className="border-b border-[#1E2D45] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-[#94A3B8] hover:text-[#F1F5F9] text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[#F1F5F9] text-sm">CivicMind · Citizen Portal</span>
        </div>

        {/* Tabs */}
        <div className="ml-auto flex bg-[#111827] border border-[#1E2D45] rounded-xl p-1 gap-1">
          {(['report', 'track', 'chat'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-blue-600 text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* REPORT TAB */}
        {tab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Upload */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-[#F1F5F9] mb-1">Report an Issue</h1>
                <p className="text-[#94A3B8] text-sm">Upload a photo — our AI agents will handle everything else.</p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
                  preview ? 'border-blue-600/40 bg-[#111827]' : 'border-[#1E2D45] hover:border-blue-600/30 bg-[#111827]'
                }`}
                style={{ minHeight: 220 }}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-64 object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-56 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#F1F5F9]">Drop image here or click to browse</p>
                      <p className="text-xs text-[#94A3B8] mt-1">JPG, PNG, WEBP supported</p>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional: describe what you see (helps the AI)"
                rows={2}
                className="w-full bg-[#111827] border border-[#1E2D45] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#4B5563] focus:outline-none focus:border-blue-600/50 resize-none transition-colors"
              />

              <button
                onClick={handleSubmit}
                disabled={!image || loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Agent Pipeline...</> : 'Analyze & Report Issue'}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Right: Pipeline + Result */}
            <div className="space-y-4">
              <PipelineVisualizer currentStage={result ? 'complete' : loading ? pipelineStage : 'vision'} loading={loading} />

              {result && (
                <div className="bg-[#111827] border border-emerald-500/20 rounded-2xl p-5 animate-fade-in space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm">Issue Registered</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Category" value={result.category} />
                    <Stat label="Severity" value={result.severity} />
                    <Stat label="Priority Score" value={`${result.priority_score?.toFixed(0)}/100`} valueClass={PRIORITY_COLOR[result.priority_label]} />
                    <Stat label="Priority" value={result.priority_label} valueClass={PRIORITY_COLOR[result.priority_label]} />
                    <Stat label="Assigned To" value={result.department?.split(' ').slice(0, 2).join(' ')} colSpan />
                    <Stat label="Confidence" value={`${(result.confidence * 100).toFixed(0)}%`} />
                    <Stat label="Status" value={result.status} />
                  </div>

                  {result.vision_description && (
                    <p className="text-xs text-[#94A3B8] bg-[#1A2236] rounded-xl p-3 leading-relaxed">
                      📋 {result.vision_description}
                    </p>
                  )}

                  {result.needs_community_validation && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-400 text-xs">
                        <Users className="w-4 h-4" />
                        Low confidence — needs {result.validation_threshold} community votes
                      </div>
                      <button
                        onClick={() => handleVote(result.issue_id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-xs font-medium text-black hover:bg-amber-400 transition-colors"
                      >
                        Confirm Issue
                      </button>
                    </div>
                  )}

                  {result.priority_breakdown && (
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-2 font-medium">Priority Score Breakdown</p>
                      <div className="space-y-1.5">
                        {Object.entries(result.priority_breakdown).map(([k, v]: [string, any]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="text-xs text-[#6B7280] w-32 capitalize">{k.replace(/_/g, ' ')}</span>
                            <div className="flex-1 h-1.5 bg-[#1E2D45] rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (v / 40) * 100)}%` }} />
                            </div>
                            <span className="text-xs text-[#94A3B8] w-6 text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRACK TAB */}
        {tab === 'track' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#F1F5F9]">My Reports</h1>
            {myIssues.length === 0 ? (
              <div className="text-center py-20 text-[#94A3B8]">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No issues reported yet</p>
                <p className="text-sm mt-1">Head to the Report tab to submit your first issue</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myIssues.map(issue => (
                  <IssueCard key={issue.issue_id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div className="h-[70vh]">
            <ChatWidget
              mode="citizen"
              issueId={myIssues[0]?.issue_id}
              placeholder="Ask about your complaint status..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, valueClass, colSpan }: { label: string; value: any; valueClass?: string; colSpan?: boolean }) {
  return (
    <div className={`${colSpan ? 'col-span-2' : ''}`}>
      <p className="text-xs text-[#6B7280] mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueClass || 'text-[#F1F5F9]'}`}>{value || '—'}</p>
    </div>
  )
}