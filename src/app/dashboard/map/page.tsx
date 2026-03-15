'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { THREAT_COLORS, THREAT_BG, CATEGORY_ICONS, formatRelativeTime } from '@/lib/utils'
import type { Event } from '@/types/database'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/dashboard/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-surface">
      <div className="font-mono text-xs text-amber-400/60 tracking-widest">INITIALIZING MAP SYSTEM...</div>
    </div>
  )
})

export default function MapPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Event | null>(null)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('published_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setEvents(data)
        setLoading(false)
      })

    const channel = supabase
      .channel('map-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        const e = payload.new as Event
        if (e.lat && e.lng) setEvents(prev => [e, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-400/10 flex-shrink-0">
        <div>
          <h1 className="font-display text-sm font-bold text-white tracking-widest">GLOBAL THREAT MAP</h1>
          <p className="font-mono text-xs text-slate-500 mt-0.5">
            {events.length} GEOLOCATED EVENTS ACTIVE
          </p>
        </div>
        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {(['critical', 'high', 'medium', 'low', 'minimal'] as const).map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: THREAT_COLORS[level] }} />
              <span className="font-mono text-xs text-slate-500 uppercase">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="font-mono text-xs text-amber-400/60 tracking-widest">LOADING INTELLIGENCE DATA...</div>
          </div>
        ) : (
          <MapComponent events={events} onSelectEvent={setSelected} />
        )}
      </div>

      {/* Selected event bottom panel */}
      {selected && (
        <div className="border-t border-amber-400/10 bg-surface-1 p-4 flex items-start gap-4 animate-slideUp">
          <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[selected.category]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-xs px-2 py-0.5 rounded border ${THREAT_BG[selected.threat_level]}`}>
                {selected.threat_level.toUpperCase()}
              </span>
              <span className="font-mono text-xs text-slate-500">{formatRelativeTime(selected.published_at)}</span>
            </div>
            <h3 className="font-body text-sm font-semibold text-white mb-1">{selected.title}</h3>
            <p className="font-body text-xs text-slate-400 line-clamp-2">{selected.summary}</p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-slate-600 hover:text-white transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
