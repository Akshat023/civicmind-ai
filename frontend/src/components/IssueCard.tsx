'use client'
import { MapPin, Clock, Building2 } from 'lucide-react'

interface Issue {
  issue_id: string
  category: string
  severity: string
  priority_label: string
  priority_score: number
  status: string
  department: string
  address?: string
  vision_description?: string
  created_at: string
  confidence: number
}

interface Props {
  issue: Issue
  onClick?: () => void
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
}

const STATUS_STYLES: Record<string, string> = {
  Assigned: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Pending: 'bg-[#1E2D45] text-[#94A3B8] border border-[#1E2D45]',
  Duplicate: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

const CATEGORY_EMOJI: Record<string, string> = {
  Pothole: '🕳️', 'Water Leakage': '💧', Garbage: '🗑️',
  'Broken Streetlight': '💡', 'Damaged Road': '🛣️',
  Sewage: '🚰', Encroachment: '⚠️', Flooding: '🌊', Other: '📍',
}

export default function IssueCard({ issue, onClick }: Props) {
  const emoji = CATEGORY_EMOJI[issue.category] || '📍'
  const priorityClass = PRIORITY_STYLES[issue.priority_label] || 'badge-medium'
  const statusClass = STATUS_STYLES[issue.status] || STATUS_STYLES['Pending']
  const date = new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onClick={onClick}
      className="bg-[#1A2236] border border-[#1E2D45] rounded-xl p-4 hover:border-blue-600/30 hover:bg-[#1E2D45] transition-all cursor-pointer animate-slide-up"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="font-medium text-[#F1F5F9] text-sm">{issue.category}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{issue.vision_description || 'No description'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
            {issue.priority_label} · {issue.priority_score?.toFixed(0)}/100
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${statusClass}`}>
            {issue.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#6B7280]">
        {issue.department && (
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {issue.department.split(' ')[0]}
          </span>
        )}
        {issue.address && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {issue.address}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto shrink-0">
          <Clock className="w-3 h-3" /> {date}
        </span>
      </div>
    </div>
  )
}