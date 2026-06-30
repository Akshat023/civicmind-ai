'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Brain, ArrowLeft, AlertTriangle, Clock, CheckCircle, TrendingUp, BarChart3, Map } from 'lucide-react'
import { getDashboardStats } from '@/lib/api'
import IssueCard from '@/components/IssueCard'
import ChatWidget from '@/components/ChatWidget'

type Tab = 'overview' | 'map' | 'issues' | 'intelligence'

// Seed realistic mock issues for demo
const MOCK_ISSUES = [
  { issue_id: '1', category: 'Pothole', severity: 'Critical', priority_label: 'Critical', priority_score: 91, status: 'Assigned', department: 'Public Works Department (PWD)', vision_description: 'Large pothole spanning two lanes near a school entrance.', created_at: new Date(Date.now() - 3600000).toISOString(), confidence: 0.97, latitude: 28.4595, longitude: 77.0266 },
  { issue_id: '2', category: 'Water Leakage', severity: 'High', priority_label: 'High', priority_score: 74, status: 'In Progress', department: 'Water Supply Department', vision_description: 'Burst pipe causing waterlogging on main road.', created_at: new Date(Date.now() - 7200000).toISOString(), confidence: 0.88, latitude: 28.4612, longitude: 77.0301 },
  { issue_id: '3', category: 'Garbage', severity: 'Medium', priority_label: 'Medium', priority_score: 48, status: 'Pending', department: 'Municipal Corporation', vision_description: 'Overflowing garbage bin near residential block.', created_at: new Date(Date.now() - 14400000).toISOString(), confidence: 0.92, latitude: 28.4578, longitude: 77.0245 },
  { issue_id: '4', category: 'Broken Streetlight', severity: 'Low', priority_label: 'Low', priority_score: 31, status: 'Resolved', department: 'Electricity Department', vision_description: 'Streetlight non-functional on sector road.', created_at: new Date(Date.now() - 86400000).toISOString(), confidence: 0.83, latitude: 28.4630, longitude: 77.0285 },
  { issue_id: '5', category: 'Flooding', severity: 'Critical', priority_label: 'Critical', priority_score: 95, status: 'Assigned', department: 'Disaster Management Cell', vision_description: 'Severe waterlogging after rain blocking arterial road.', created_at: new Date(Date.now() - 1800000).toISOString(), confidence: 0.95, latitude: 28.4550, longitude: 77.0220 },
]

export default function MayorDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<any>(null)
  const [issues, setIssues] = useState(MOCK_ISSUES)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    getDashboardStats()
      .then(data => {
        setStats(data.stats)
        if (data.issues?.length) setIssues(prev => [...data.issues, ...prev])
      })
      .catch(() => {}) // fallback to mock data
  }, [])

  useEffect(() => {
    if (tab === 'map') initMap()
  }, [tab])

  const initMap = async () => {
    if (!mapRef.current || mapInstance.current) return
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) {
      if (mapRef.current) mapRef.current.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center gap-3">
          <div style="font-size:2.5rem">🗺️</div>
          <p style="color:#F1F5F9;font-weight:600">City Digital Twin</p>
          <p style="color:#94A3B8;font-size:0.85rem;max-width:300px">Add NEXT_PUBLIC_MAPS_API_KEY to .env to activate the live map with issue markers.</p>
          <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:0.75rem">
            <div style="background:#EF444420;border:1px solid #EF444440;color:#EF4444;padding:6px 12px;border-radius:8px">🔴 Critical</div>
            <div style="background:#F59E0B20;border:1px solid #F59E0B40;color:#F59E0B;padding:6px 12px;border-radius:8px">🟡 Active</div>
            <div style="background:#10B98120;border:1px solid #10B98140;color:#10B981;padding:6px 12px;border-radius:8px">🟢 Resolved</div>
          </div>
        </div>`
      return
    }
    // Real Google Maps init
    const { Loader } = await import('@googlemaps/js-api-loader')
    const loader = new Loader({ apiKey: key, version: 'weekly', libraries: ['visualization'] })
    const google = await loader.load()
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 28.459, lng: 77.026 },
      zoom: 14,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0A0F1E' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F1E' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E2D45' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111827' }] },
      ],
    })
    mapInstance.current = map

    const COLOR_MAP: Record<string, string> = {
      Critical: '#EF4444', High: '#F59E0B', Medium: '#3B82F6', Low: '#10B981',
    }

    issues.forEach(issue => {
      if (!issue.latitude || !issue.longitude) return
      const marker = new google.maps.Marker({
        position: { lat: issue.latitude, lng: issue.longitude },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: issue.priority_label === 'Critical' ? 12 : 8,
          fillColor: COLOR_MAP[issue.priority_label] || '#3B82F6',
          fillOpacity: 0.9,
          strokeColor: '#0A0F1E',
          strokeWeight: 2,
        },
        title: `${issue.category} — ${issue.priority_label}`,
      })
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#111;padding:4px"><b>${issue.category}</b><br>Priority: ${issue.priority_label}<br>Status: ${issue.status}</div>`,
      })
      marker.addListener('click', () => infoWindow.open(map, marker))
    })
  }

  const totalIssues = issues.length
  const critical = issues.filter(i => i.priority_label === 'Critical').length
  const resolved = issues.filter(i => i.status === 'Resolved').length
  const pending = issues.filter(i => i.status === 'Pending' || i.status === 'Assigned').length

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'map', label: 'City Map', icon: Map },
    { id: 'issues', label: 'All Issues', icon: AlertTriangle },
    { id: 'intelligence', label: 'AI Intelligence', icon: Brain },
  ]

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Nav */}
      <nav className="border-b border-[#1E2D45] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-[#94A3B8] hover:text-[#F1F5F9] text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[#F1F5F9] text-sm">CivicMind · Mayor Dashboard</span>
        </div>
        <div className="ml-auto flex bg-[#111827] border border-[#1E2D45] rounded-xl p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                tab === id ? 'bg-emerald-500 text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#F1F5F9]">City Overview</h1>
              <p className="text-[#94A3B8] text-sm mt-1">Real-time civic intelligence dashboard</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Total Issues" value={totalIssues} icon={<BarChart3 className="w-4 h-4 text-blue-400" />} color="blue" />
              <KPICard label="Critical" value={critical} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="red" />
              <KPICard label="Resolved" value={resolved} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} color="green" />
              <KPICard label="Pending" value={pending} icon={<Clock className="w-4 h-4 text-amber-400" />} color="amber" />
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5">
                <p className="text-sm font-medium text-[#94A3B8] mb-4">Issues by Category</p>
                {Object.entries(
                  issues.reduce((acc: Record<string, number>, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc }, {})
                ).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-[#94A3B8] w-28 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-[#1E2D45] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(count / totalIssues) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#94A3B8] w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5">
                <p className="text-sm font-medium text-[#94A3B8] mb-4">Issues by Status</p>
                {Object.entries(
                  issues.reduce((acc: Record<string, number>, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc }, {})
                ).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                  const colors: Record<string, string> = { Resolved: 'bg-emerald-500', 'In Progress': 'bg-amber-500', Assigned: 'bg-blue-600', Pending: 'bg-[#4B5563]', Duplicate: 'bg-purple-500' }
                  return (
                    <div key={status} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-[#94A3B8] w-28">{status}</span>
                      <div className="flex-1 h-2 bg-[#1E2D45] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colors[status] || 'bg-blue-600'}`} style={{ width: `${(count / totalIssues) * 100}%` }} />
                      </div>
                      <span className="text-xs text-[#94A3B8] w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent critical issues */}
            <div>
              <p className="text-sm font-medium text-[#94A3B8] mb-3">Critical Issues Requiring Attention</p>
              <div className="space-y-2">
                {issues.filter(i => i.priority_label === 'Critical').map(issue => (
                  <IssueCard key={issue.issue_id} issue={issue as any} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CITY MAP */}
        {tab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#F1F5F9]">City Digital Twin</h1>
                <p className="text-[#94A3B8] text-sm mt-1">Live issue map — red = critical, yellow = high, blue = medium, green = resolved</p>
              </div>
              <div className="flex gap-2">
                {[['Critical', 'bg-red-500'], ['High', 'bg-amber-500'], ['Medium', 'bg-blue-500'], ['Resolved', 'bg-emerald-500']].map(([label, cls]) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <span className={`w-2.5 h-2.5 rounded-full ${cls}`} /> {label}
                  </span>
                ))}
              </div>
            </div>
            <div
              ref={mapRef}
              className="w-full rounded-2xl border border-[#1E2D45] bg-[#111827] overflow-hidden"
              style={{ height: 540 }}
            />
          </div>
        )}

        {/* ALL ISSUES */}
        {tab === 'issues' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#F1F5F9]">All Issues</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {issues.map(issue => <IssueCard key={issue.issue_id} issue={issue as any} />)}
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE */}
        {tab === 'intelligence' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-[#F1F5F9]">City Intelligence AI</h1>
              <p className="text-[#94A3B8] text-sm mt-1">Ask anything about your city's civic data in plain English.</p>
            </div>

            {/* Example queries */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Which category has most unresolved issues?',
                'Which department is falling behind?',
                'How many critical issues today?',
                'What are top 3 problem areas?',
              ].map(q => (
                <button key={q} className="p-3 rounded-xl bg-[#1A2236] border border-[#1E2D45] hover:border-emerald-500/30 text-xs text-[#94A3B8] text-left transition-all">
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>

            <div className="h-[55vh]">
              <ChatWidget mode="mayor" placeholder='Ask: "Which ward has the most potholes?"' />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const bg: Record<string, string> = { blue: 'bg-blue-600/10 border-blue-600/20', red: 'bg-red-500/10 border-red-500/20', green: 'bg-emerald-500/10 border-emerald-500/20', amber: 'bg-amber-500/10 border-amber-500/20' }
  return (
    <div className={`p-5 rounded-2xl border ${bg[color]} bg-[#111827]`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#94A3B8]">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-[#F1F5F9]">{value}</p>
    </div>
  )
}