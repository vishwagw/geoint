'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THREAT_BG, CATEGORY_ICONS, formatRelativeTime, COUNTRY_NAMES } from '@/lib/utils'
import type { Event, ThreatLevel, EventCategory } from '@/types/database'

const CATEGORIES: EventCategory[] = ['conflict', 'diplomacy', 'economics', 'sanctions', 'elections', 'terrorism', 'cyber', 'energy', 'migration', 'other']
const THREATS: ThreatLevel[] = ['critical', 'high', 'medium', 'low', 'minimal']

export default function EventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [newCount, setNewCount] = useState(0)

  const loadEvents = useCallback(async () => {
    let query = supabase.from('events').select('*').order('published_at', { ascending: false }).limit(50)
    if (threatFilter !== 'all') query = query.eq('threat_level', threatFilter)
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)
    const { data } = await query
    if (data) setEvents(data)
    setLoading(false)
  }, [threatFilter, categoryFilter])

  useEffect(() => {
    setLoading(true)
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const channel = supabase
      .channel('events-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(prev => [payload.new as Event, ...prev])
        setNewCount(c => c + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function analyzeEvent(event: Event) {
    setAnalyzing(true)
    setAnalysis('')
    setSelectedEvent(event)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, title: event.title, summary: event.summary, category: event.category, threat_level: event.threat_level, country_codes: event.country_codes }),
      })
      const data = await res.json()
      setAnalysis(data.analysis || 'Analysis unavailable.')
    } catch {
      setAnalysis('Failed to generate analysis. Please try again.')
    }
    setAnalyzing(false)
  }

  const filtered = events.filter(e =>
    search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Event list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-amber-400/10 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <h1 className="font-display text-sm font-bold text-white tracking-widest">LIVE INTELLIGENCE FEED</h1>
            </div>
            {newCount > 0 && (
              <button
                onClick={() => { setNewCount(0); window.scrollTo(0, 0) }}
                className="font-mono text-xs bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-1 animate-pulse"
              >
                ↑ {newCount} NEW
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="SEARCH EVENTS..."
              className="flex-1 min-w-48 bg-surface-2 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400/50 placeholder-slate-600 tracking-wider"
            />
            <select
              value={threatFilter}
              onChange={e => setThreatFilter(e.target.value as ThreatLevel | 'all')}
              className="bg-surface-2 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-400/50"
            >
              <option value="all">ALL THREATS</option>
              {THREATS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as EventCategory | 'all')}
              className="bg-surface-2 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-400/50"
            >
              <option value="all">ALL CATEGORIES</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded p-4 animate-pulse">
                <div className="h-4 bg-surface-3 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-3 rounded w-1/2 mb-2" />
                <div className="h-3 bg-surface-3 rounded w-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="glass rounded p-12 text-center">
              <div className="font-mono text-xs text-slate-500 tracking-wider">NO EVENTS MATCH YOUR FILTERS</div>
            </div>
          ) : (
            filtered.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`glass glass-hover rounded p-4 cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'border-amber-400/30 bg-amber-400/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{CATEGORY_ICONS[event.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {event.is_breaking && (
                        <span className="font-mono text-xs bg-red-500 text-white px-1.5 py-0.5">BREAKING</span>
                      )}
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${THREAT_BG[event.threat_level]}`}>
                        {event.threat_level.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-slate-600">{event.category.toUpperCase()}</span>
                      {event.is_verified && <span className="font-mono text-xs text-cyan-400">✓ VERIFIED</span>}
                    </div>
                    <h3 className="font-body text-sm font-semibold text-slate-200 mb-1 leading-snug">{event.title}</h3>
                    <p className="font-body text-xs text-slate-500 line-clamp-2 mb-2">{event.summary}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-slate-600">{formatRelativeTime(event.published_at)}</span>
                      {event.country_codes.slice(0, 3).map(cc => (
                        <span key={cc} className="font-mono text-xs text-slate-600">{COUNTRY_NAMES[cc] || cc}</span>
                      ))}
                      {event.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="font-mono text-xs text-amber-400/50 bg-amber-400/5 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedEvent && (
        <div className="w-96 border-l border-amber-400/10 flex flex-col overflow-hidden bg-surface-1">
          <div className="p-4 border-b border-amber-400/10 flex items-center justify-between">
            <span className="font-display text-xs font-bold text-amber-400 tracking-widest">EVENT DETAIL</span>
            <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`font-mono text-xs px-2 py-1 rounded border ${THREAT_BG[selectedEvent.threat_level]}`}>
                  {selectedEvent.threat_level.toUpperCase()}
                </span>
                <span className="font-mono text-xs text-slate-500">{selectedEvent.category.toUpperCase()}</span>
              </div>
              <h2 className="font-body text-sm font-bold text-white leading-snug mb-3">{selectedEvent.title}</h2>
              <p className="font-body text-xs text-slate-400 leading-relaxed">{selectedEvent.summary}</p>
            </div>

            {selectedEvent.body && (
              <div>
                <div className="font-mono text-xs text-slate-600 tracking-wider mb-2">FULL REPORT</div>
                <p className="font-body text-xs text-slate-400 leading-relaxed">{selectedEvent.body}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <div className="text-slate-600 mb-1 tracking-wider">COUNTRIES</div>
                <div className="text-slate-300">
                  {selectedEvent.country_codes.map(cc => COUNTRY_NAMES[cc] || cc).join(', ') || '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-600 mb-1 tracking-wider">PUBLISHED</div>
                <div className="text-slate-300">{formatRelativeTime(selectedEvent.published_at)}</div>
              </div>
              {selectedEvent.source_name && (
                <div>
                  <div className="text-slate-600 mb-1 tracking-wider">SOURCE</div>
                  {selectedEvent.source_url ? (
                    <a href={selectedEvent.source_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                      {selectedEvent.source_name}
                    </a>
                  ) : (
                    <div className="text-slate-300">{selectedEvent.source_name}</div>
                  )}
                </div>
              )}
            </div>

            {selectedEvent.tags.length > 0 && (
              <div>
                <div className="font-mono text-xs text-slate-600 tracking-wider mb-2">TAGS</div>
                <div className="flex flex-wrap gap-1">
                  {selectedEvent.tags.map(tag => (
                    <span key={tag} className="font-mono text-xs text-amber-400/60 bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            <div className="border-t border-amber-400/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xs font-bold text-amber-400 tracking-widest">AI ANALYSIS</span>
                <button
                  onClick={() => analyzeEvent(selectedEvent)}
                  disabled={analyzing}
                  className="font-mono text-xs text-amber-400 border border-amber-400/30 px-2 py-1 hover:bg-amber-400/10 transition-colors disabled:opacity-50"
                >
                  {analyzing ? 'ANALYZING...' : 'GENERATE'}
                </button>
              </div>

              {analysis ? (
                <div className="font-body text-xs text-slate-400 leading-relaxed bg-surface-2 rounded p-3 border border-amber-400/10">
                  {analysis}
                </div>
              ) : selectedEvent.ai_analysis ? (
                <div className="font-body text-xs text-slate-400 leading-relaxed bg-surface-2 rounded p-3 border border-amber-400/10">
                  {selectedEvent.ai_analysis}
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-600 text-center py-4 tracking-wider">
                  {analyzing ? 'QUERYING AI ENGINE...' : 'CLICK GENERATE FOR AI ANALYSIS'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
