'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THREAT_BG, CATEGORY_ICONS, formatRelativeTime } from '@/lib/utils'
import type { Alert } from '@/types/database'

export default function AlertsPage() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  const loadAlerts = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    let query = supabase
      .from('alerts')
      .select('*, event:events(*)')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (filter === 'unread') query = query.eq('is_read', false)
    const { data } = await query
    if (data) setAlerts(data as Alert[])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    loadAlerts()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const channel = supabase
        .channel('alerts-page')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'alerts',
          filter: `user_id=eq.${data.user.id}`
        }, () => loadAlerts())
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  }, [loadAlerts])

  async function markRead(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('alerts') as any).update({ is_read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  async function markAllRead() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('alerts') as any).update({ is_read: true }).eq('user_id', user.user.id).eq('is_read', false)
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-sm font-bold text-white tracking-widest">ALERTS</h1>
            {unreadCount > 0 && (
              <span className="font-mono text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-slate-500 mt-1 tracking-wider">WATCHLIST-TRIGGERED NOTIFICATIONS</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-1">
            {(['unread', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`font-mono text-xs px-3 py-1.5 transition-all tracking-wider ${filter === f ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="font-mono text-xs text-slate-500 hover:text-amber-400 transition-colors tracking-wider">
              MARK ALL READ
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🔕</div>
          <div className="font-mono text-xs text-slate-500 tracking-widest mb-2">NO ALERTS</div>
          <p className="font-body text-sm text-slate-600">
            {filter === 'unread' ? 'All alerts have been read.' : 'No alerts yet. Configure watchlists to start monitoring.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`glass glass-hover rounded-lg p-4 transition-all ${!alert.is_read ? 'border-amber-400/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!alert.is_read && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse" />
                )}
                <div className="flex-1 min-w-0">
                  {alert.event && (
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-base">{CATEGORY_ICONS[alert.event.category] || '📌'}</span>
                      <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${THREAT_BG[alert.event.threat_level]}`}>
                        {alert.event.threat_level.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="font-body text-sm text-slate-200 mb-1">{alert.message}</p>
                  {alert.event && (
                    <p className="font-body text-xs text-slate-500 line-clamp-1 mb-2">{alert.event.title}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-600">{formatRelativeTime(alert.created_at)}</span>
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="font-mono text-xs text-slate-500 hover:text-amber-400 transition-colors tracking-wider"
                      >
                        MARK READ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
