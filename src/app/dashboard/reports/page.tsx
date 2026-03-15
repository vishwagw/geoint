'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import type { Report } from '@/types/database'

const REPORT_TYPES = [
  { value: 'briefing', label: 'DAILY BRIEFING', desc: 'Overview of key events in the last 24 hours' },
  { value: 'summary', label: 'REGIONAL SUMMARY', desc: 'Focused summary for a specific region' },
  { value: 'deep_dive', label: 'DEEP DIVE', desc: 'Detailed analysis of a specific situation' },
  { value: 'forecast', label: 'FORECAST', desc: 'Predictive assessment of geopolitical trends' },
]

export default function ReportsPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [reportType, setReportType] = useState('briefing')
  const [focus, setFocus] = useState('')

  const loadReports = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
    if (data) setReports(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  async function generateReport() {
    setGenerating(true)
    try {
      const res = await fetch('/api/analysis/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: reportType, focus }),
      })
      const data = await res.json()
      if (data.report) {
        setReports(prev => [data.report, ...prev])
        setSelected(data.report)
        setShowGenerator(false)
      }
    } catch {
      alert('Failed to generate report. Please check your API key.')
    }
    setGenerating(false)
  }

  async function deleteReport(id: string) {
    await supabase.from('reports').delete().eq('id', id)
    setReports(prev => prev.filter(r => r.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-amber-400/10 flex flex-col overflow-hidden bg-surface-1">
        <div className="p-4 border-b border-amber-400/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xs font-bold text-white tracking-widest">INTELLIGENCE REPORTS</h1>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="w-full font-display text-xs font-bold tracking-widest py-2.5 bg-amber-400 text-surface hover:bg-amber-500 transition-colors"
          >
            + GENERATE REPORT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded p-3 mb-2 animate-pulse bg-surface-2 h-16" />
            ))
          ) : reports.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-slate-600 tracking-wider">
              NO REPORTS YET
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                onClick={() => setSelected(report)}
                className={`rounded p-3 mb-1 cursor-pointer transition-all ${selected?.id === report.id ? 'bg-amber-400/10 border border-amber-400/20' : 'hover:bg-surface-2 border border-transparent'}`}
              >
                <div className="font-mono text-xs text-amber-400/60 uppercase mb-1">{report.report_type}</div>
                <div className="font-body text-xs text-slate-300 line-clamp-2 mb-1">{report.title}</div>
                <div className="font-mono text-xs text-slate-600">{formatRelativeTime(report.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {showGenerator ? (
          <div className="p-6 max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-white tracking-widest">GENERATE INTELLIGENCE REPORT</h2>
              <button onClick={() => setShowGenerator(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            <div>
              <label className="block font-mono text-xs text-slate-500 tracking-wider mb-3">REPORT TYPE</label>
              <div className="grid grid-cols-2 gap-3">
                {REPORT_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setReportType(rt.value)}
                    className={`rounded-lg p-4 text-left transition-all border ${reportType === rt.value ? 'bg-amber-400/10 border-amber-400/30' : 'glass border-slate-700 hover:border-slate-500'}`}
                  >
                    <div className="font-mono text-xs font-bold tracking-wider mb-1" style={{ color: reportType === rt.value ? '#fbbf24' : '#94a3b8' }}>
                      {rt.label}
                    </div>
                    <div className="font-body text-xs text-slate-500">{rt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs text-slate-500 tracking-wider mb-1.5">
                FOCUS / CONTEXT <span className="text-slate-700">(optional)</span>
              </label>
              <textarea
                value={focus}
                onChange={e => setFocus(e.target.value)}
                rows={3}
                placeholder="e.g. Focus on Eastern Europe and energy security implications..."
                className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2 text-sm text-white font-body focus:outline-none focus:border-amber-400/50 resize-none placeholder-slate-600"
              />
            </div>

            <button
              onClick={generateReport}
              disabled={generating}
              className="font-display text-xs font-bold tracking-widest px-8 py-3 bg-amber-400 text-surface hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'AI ENGINE ANALYZING...' : 'GENERATE REPORT'}
            </button>
          </div>
        ) : selected ? (
          <div className="p-8 max-w-3xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="font-mono text-xs text-amber-400/60 uppercase tracking-widest mb-2">{selected.report_type} REPORT</div>
                <h2 className="font-display text-xl font-bold text-white leading-tight">{selected.title}</h2>
                <div className="font-mono text-xs text-slate-500 mt-2">{formatRelativeTime(selected.created_at)}</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([selected.content], { type: 'text/plain' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                    a.download = `report-${selected.id}.txt`; a.click()
                  }}
                  className="font-mono text-xs text-slate-400 hover:text-amber-400 transition-colors tracking-wider"
                >
                  ↓ EXPORT
                </button>
                <button onClick={() => deleteReport(selected.id)} className="font-mono text-xs text-slate-600 hover:text-red-400 transition-colors">
                  DELETE
                </button>
              </div>
            </div>

            <div className="glass rounded-lg p-6 border border-amber-400/10">
              <div className="prose prose-invert prose-sm max-w-none">
                {selected.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h2 key={i} className="font-display text-base font-bold text-amber-400 tracking-widest mt-4 mb-2">{line.slice(2)}</h2>
                  if (line.startsWith('## ')) return <h3 key={i} className="font-display text-sm font-bold text-white tracking-wider mt-3 mb-2">{line.slice(3)}</h3>
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-body text-sm font-semibold text-slate-200 mt-2">{line.slice(2, -2)}</p>
                  if (line.startsWith('- ')) return <p key={i} className="font-body text-sm text-slate-400 ml-3 leading-relaxed">• {line.slice(2)}</p>
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="font-body text-sm text-slate-400 leading-relaxed">{line}</p>
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="font-mono text-xs text-slate-600 tracking-widest mb-3">SELECT A REPORT OR GENERATE NEW</div>
              <button onClick={() => setShowGenerator(true)} className="font-display text-xs font-bold tracking-widest px-6 py-3 border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 transition-all">
                + GENERATE REPORT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
