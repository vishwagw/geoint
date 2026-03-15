'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { THREAT_COLORS, CATEGORY_ICONS, formatRelativeTime } from '@/lib/utils'
import type { Event } from '@/types/database'

function MapEvents({ events, onSelectEvent }: { events: Event[], onSelectEvent: (e: Event) => void }) {
  return (
    <>
      {events.map(event => {
        if (!event.lat || !event.lng) return null
        const color = THREAT_COLORS[event.threat_level]
        const radius = { critical: 14, high: 11, medium: 9, low: 7, minimal: 5 }[event.threat_level] || 7

        return (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: event.is_breaking ? 0.9 : 0.6,
              weight: event.is_breaking ? 2 : 1,
            }}
            eventHandlers={{ click: () => onSelectEvent(event) }}
          >
            <Popup>
              <div className="font-mono" style={{ background: '#0c1220', color: 'white', minWidth: '220px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {event.threat_level} — {event.category}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', fontFamily: 'sans-serif' }}>
                  {event.title}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontFamily: 'sans-serif' }}>
                  {event.summary.slice(0, 120)}...
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  {formatRelativeTime(event.published_at)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}

interface Props {
  events: Event[]
  onSelectEvent: (event: Event) => void
}

export default function MapComponent({ events, onSelectEvent }: Props) {
  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      style={{ width: '100%', height: '100%', background: '#070b14' }}
      minZoom={2}
      maxZoom={8}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapEvents events={events} onSelectEvent={onSelectEvent} />
    </MapContainer>
  )
}
