'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THREAT_BG, CATEGORY_ICONS, formatRelativeTime, COUNTRY_NAMES, TREND_COLOR, TREND_ICON, getRiskLabel } from '@/lib/utils'
import type { Event, CountryRisk } from '@/types/database'
import Link from 'next/link'

interface Stats {
  total_today: number
  critical: number
  breaking: number
  by_category: Record<string, number>
}

export default function DashboardPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [risks, setRisks] = useState<CountryRisk[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [eventsRes, risksRes, statsRes] = await Promise.all([
      supabase.from('events').select('*').order('published_at', { ascending: false }).limit(8),
      supabase.from('country_risk').select('*').order('overall_score', { ascending: false }).limit(10),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc('get_event_stats'),
    ])

    if (eventsRes.data) setEvents(eventsRes.data)
    if (risksRes.data) setRisks(risksRes.data)
    if (statsRes.data) {
      try { setStats(JSON.parse(statsRes.data)) } catch {}
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(prev => [payload.new as Event, ...prev.slice(0, 7)])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white tracking-widest">INTELLIGENCE OVERVIEW</h1>
          <p className="font-mono text-xs text-slate-500 mt-1 tracking-wider">REAL-TIME GEOPOLITICAL ASSESSMENT SYSTEM</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-green-400 tracking-wider">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'EVENTS TODAY', value: stats?.total_today ?? '—', color: 'text-white', border: 'border-slate-700' },
          { label: 'CRITICAL ALERTS', value: stats?.critical ?? '—', color: 'text-red-400', border: 'border-red-500/30' },
          { label: 'BREAKING NEWS', value: stats?.breaking ?? '—', color: 'text-amber-400', border: 'border-amber-400/30' },
          { label: 'COUNTRIES AT RISK', value: risks.filter(r => r.overall_score >= 65).length, color: 'text-orange-400', border: 'border-orange-500/30' },
        ].map(s => (
          <div key={s.label} className={`glass rounded-lg p-4 border ${s.border}`}>
            <div className={`font-display text-3xl font-black ${s.color} mb-1`}>
              {loading ? <div className="w-12 h-8 bg-surface-3 rounded animate-pulse" /> : s.value}
            </div>
            <div className="font-mono text-xs text-slate-500 tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-display text-xs font-bold text-white tracking-widest">LIVE EVENT FEED</h2>
            </div>
            <Link href="/dashboard/events" className="font-mono text-xs text-amber-400/60 hover:text-amber-400 transition-colors tracking-wider">
              VIEW ALL →
            </Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass rounded p-4 animate-pulse">
                  <div className="h-4 bg-surface-3 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface-3 rounded w-1/2" />
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="glass rounded p-8 text-center">
                <div className="font-mono text-xs text-slate-500">NO EVENTS FOUND — MONITORING ACTIVE</div>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="glass glass-hover rounded p-4 group cursor-pointer animate-slideUp">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{CATEGORY_ICONS[event.category] || '📌'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {event.is_breaking && (
                          <span className="font-mono text-xs bg-red-500 text-white px-1.5 py-0.5 animate-pulse">BREAKING</span>
                        )}
                        <span className={`font-mono text-xs px-2 py-0.5 rounded border ${THREAT_BG[event.threat_level]}`}>
                          {event.threat_level.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs text-slate-600 tracking-wider">{event.category.toUpperCase()}</span>
                      </div>
                      <h3 className="font-body text-sm font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-mono text-xs text-slate-500">{formatRelativeTime(event.published_at)}</span>
                        {event.country_codes.slice(0, 2).map(cc => (
                          <span key={cc} className="font-mono text-xs text-slate-600">{COUNTRY_NAMES[cc] || cc}</span>
                        ))}
                        {event.source_name && (
                          <span className="font-mono text-xs text-slate-600 ml-auto truncate">via {event.source_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Country risk sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xs font-bold text-white tracking-widest">RISK INDEX</h2>
            <Link href="/dashboard/risk" className="font-mono text-xs text-amber-400/60 hover:text-amber-400 transition-colors tracking-wider">
              FULL INDEX →
            </Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded p-3 animate-pulse">
                  <div className="h-3 bg-surface-3 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-surface-3 rounded" />
                </div>
              ))
            ) : (
              risks.map((country, idx) => {
                const label = getRiskLabel(country.overall_score)
                const barColor = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500',
                  minimal: 'bg-cyan-500',
                }[label]

                return (
                  <div key={country.id} className="glass rounded p-3 flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-600 w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-slate-300 truncate">{country.country_name}</span>
                        <div className="flex items-center gap-1.5">
                          {country.trend && (
                            <span className={`font-mono text-xs ${TREND_COLOR[country.trend]}`}>
                              {TREND_ICON[country.trend]}
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-white">{country.overall_score}</span>
                        </div>
                      </div>
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${country.overall_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
