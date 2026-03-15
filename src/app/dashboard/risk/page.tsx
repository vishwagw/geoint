'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THREAT_COLORS, TREND_COLOR, TREND_ICON, getRiskLabel } from '@/lib/utils'
import type { CountryRisk } from '@/types/database'

export default function RiskPage() {
  const supabase = createClient()
  const [risks, setRisks] = useState<CountryRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CountryRisk | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('country_risk')
      .select('*')
      .order('overall_score', { ascending: false })
      .then(({ data }) => {
        if (data) setRisks(data)
        setLoading(false)
      })
  }, [])

  const filtered = risks.filter(r =>
    r.country_name.toLowerCase().includes(search.toLowerCase()) ||
    r.country_code.toLowerCase().includes(search.toLowerCase())
  )

  const scoreBar = (score: number | null, label: string) => {
    if (score == null) return null
    const level = getRiskLabel(score)
    const color = THREAT_COLORS[level]
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="font-mono text-xs text-slate-500 tracking-wider">{label}</span>
          <span className="font-mono text-xs font-bold" style={{ color }}>{score}</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-amber-400/10 flex-shrink-0 space-y-3">
          <h1 className="font-display text-sm font-bold text-white tracking-widest">COUNTRY RISK INDEX</h1>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH COUNTRY..."
            className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400/50 placeholder-slate-600 tracking-wider"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface-1 border-b border-amber-400/10">
              <tr>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-left p-3 pl-4">#</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-left p-3">COUNTRY</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-center p-3">RISK</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-center p-3 hidden sm:table-cell">POLITICAL</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-center p-3 hidden md:table-cell">SECURITY</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-center p-3 hidden lg:table-cell">ECONOMIC</th>
                <th className="font-mono text-xs text-slate-600 tracking-widest text-center p-3">TREND</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-3">
                    <td colSpan={7} className="p-3">
                      <div className="h-4 bg-surface-2 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.map((country, idx) => {
                const level = getRiskLabel(country.overall_score)
                const color = THREAT_COLORS[level]
                const isSelected = selected?.id === country.id

                return (
                  <tr
                    key={country.id}
                    onClick={() => setSelected(country)}
                    className={`border-b border-surface-3/50 cursor-pointer transition-all hover:bg-surface-2 ${isSelected ? 'bg-amber-400/5' : ''}`}
                  >
                    <td className="p-3 pl-4 font-mono text-xs text-slate-600">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-600 w-7">{country.country_code}</span>
                        <span className="font-body text-sm text-slate-200">{country.country_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                        <span className="font-mono text-sm font-bold" style={{ color }}>{country.overall_score}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-400">{country.political_score ?? '—'}</span>
                    </td>
                    <td className="p-3 text-center hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{country.security_score ?? '—'}</span>
                    </td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-400">{country.economic_score ?? '—'}</span>
                    </td>
                    <td className="p-3 text-center">
                      {country.trend && (
                        <span className={`font-mono text-sm font-bold ${TREND_COLOR[country.trend]}`}>
                          {TREND_ICON[country.trend]}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 border-l border-amber-400/10 flex flex-col bg-surface-1 overflow-hidden">
          <div className="p-4 border-b border-amber-400/10 flex justify-between items-center">
            <span className="font-display text-xs font-bold text-amber-400 tracking-widest">COUNTRY BRIEF</span>
            <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <div className="font-mono text-xs text-slate-600 tracking-wider mb-1">{selected.country_code}</div>
              <h2 className="font-display text-xl font-bold text-white tracking-wide">{selected.country_name}</h2>
            </div>

            {/* Overall score donut-style */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2535" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={THREAT_COLORS[getRiskLabel(selected.overall_score)]}
                    strokeWidth="3"
                    strokeDasharray={`${selected.overall_score} ${100 - selected.overall_score}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-xl font-black text-white leading-none">{selected.overall_score}</span>
                  <span className="font-mono text-xs text-slate-500">/100</span>
                </div>
              </div>
              <div>
                <div className={`font-display text-sm font-bold uppercase tracking-widest`} style={{ color: THREAT_COLORS[getRiskLabel(selected.overall_score)] }}>
                  {getRiskLabel(selected.overall_score)} RISK
                </div>
                {selected.trend && (
                  <div className={`font-mono text-xs mt-1 ${TREND_COLOR[selected.trend]}`}>
                    {TREND_ICON[selected.trend]} {selected.trend.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <div className="font-mono text-xs text-slate-600 tracking-wider mb-3">RISK BREAKDOWN</div>
              {scoreBar(selected.political_score, 'POLITICAL')}
              {scoreBar(selected.security_score, 'SECURITY')}
              {scoreBar(selected.economic_score, 'ECONOMIC')}
              {scoreBar(selected.social_score, 'SOCIAL')}
            </div>

            {selected.notes && (
              <div>
                <div className="font-mono text-xs text-slate-600 tracking-wider mb-2">ANALYST NOTES</div>
                <p className="font-body text-xs text-slate-400 leading-relaxed">{selected.notes}</p>
              </div>
            )}

            <div className="font-mono text-xs text-slate-700 tracking-wider border-t border-surface-3 pt-3">
              UPDATED: {new Date(selected.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
