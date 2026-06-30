'use client'

const STAGES = [
  { id: 'vision', label: 'Vision Agent', sub: 'Gemini analyzes image' },
  { id: 'confidence', label: 'Confidence Gate', sub: '≥70% to proceed' },
  { id: 'duplicate_check', label: 'Duplicate Agent', sub: 'Geo-radius check' },
  { id: 'priority', label: 'Priority Agent', sub: 'Weighted 0–100 score' },
  { id: 'routing', label: 'Routing Agent', sub: 'Department assignment' },
  { id: 'complete', label: 'Complete', sub: 'Saved & notified' },
]

interface Props {
  currentStage: string
  loading?: boolean
}

export default function PipelineVisualizer({ currentStage, loading }: Props) {
  const currentIdx = STAGES.findIndex(s => s.id === currentStage)

  return (
    <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Agent Pipeline</p>
      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx
          const isActive = i === currentIdx
          const isPending = i > currentIdx

          return (
            <div key={stage.id} className="flex items-center gap-3">
              {/* Connector line */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-500
                  ${isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''}
                  ${isActive ? 'bg-blue-600/20 border-blue-500 text-blue-400 pipeline-active' : ''}
                  ${isPending ? 'bg-[#1A2236] border-[#1E2D45] text-[#4B5563]' : ''}
                `}>
                  {isDone ? '✓' : i + 1}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`w-px h-4 mt-1 transition-colors duration-500 ${isDone ? 'bg-emerald-500/40' : 'bg-[#1E2D45]'}`} />
                )}
              </div>

              {/* Label */}
              <div className={`transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                <p className={`text-sm font-medium ${isActive ? 'text-blue-300' : isDone ? 'text-[#F1F5F9]' : 'text-[#6B7280]'}`}>
                  {stage.label}
                  {isActive && loading && <span className="ml-2 animate-pulse text-blue-400">●</span>}
                </p>
                <p className="text-xs text-[#4B5563]">{stage.sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}