'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'OVERVIEW', icon: '◈' },
  { href: '/dashboard/events', label: 'LIVE FEED', icon: '◉' },
  { href: '/dashboard/map', label: 'THREAT MAP', icon: '◎' },
  { href: '/dashboard/risk', label: 'RISK INDEX', icon: '◆' },
  { href: '/dashboard/watchlists', label: 'WATCHLISTS', icon: '◐' },
  { href: '/dashboard/alerts', label: 'ALERTS', icon: '◉' },
  { href: '/dashboard/reports', label: 'REPORTS', icon: '◧' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [time, setTime] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [userEmail, setUserEmail] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUserEmail(data.user.email || '')
    })

    // Cron-free ingestion kick: dashboard traffic triggers event ingestion.
    const triggerIngestion = async () => {
      try {
        await fetch('/api/events?source=traffic', { method: 'POST' })
      } catch {
        // Ignore transient network failures; next interval/user visit will retry.
      }
    }
    void triggerIngestion()
    const ingestInterval = setInterval(() => {
      void triggerIngestion()
    }, 5 * 60 * 1000)

    // UTC clock
    const tick = () => setTime(new Date().toUTCString().slice(0, 25) + ' UTC')
    tick()
    const interval = setInterval(tick, 1000)
    return () => {
      clearInterval(interval)
      clearInterval(ingestInterval)
    }
  }, [])

  useEffect(() => {
    // Real-time unread alerts count
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('user_id', data.user.id)
        .eq('is_read', false)
        .then(({ count }) => setUnreadAlerts(count || 0))
    })
  }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function syncNow() {
    if (syncing) return
    setSyncing(true)
    setSyncStatus('SYNCING...')

    try {
      const res = await fetch('/api/events?source=traffic&force=1', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setSyncStatus(data?.error === 'Forbidden' ? 'NOT ALLOWED' : 'SYNC FAILED')
      } else if (data?.skipped) {
        setSyncStatus('NOT DUE YET')
      } else {
        setSyncStatus('SYNC COMPLETE')
      }
    } catch {
      setSyncStatus('SYNC FAILED')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatus(''), 4000)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col border-r border-amber-400/10 bg-surface-1 transition-all duration-300 z-20',
        sidebarOpen ? 'w-56' : 'w-14'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-amber-400/10">
          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(251,191,36,0.8)' }} />
          {sidebarOpen && (
            <span className="font-display text-amber-400 font-bold tracking-widest text-sm">GEOINT</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-slate-600 hover:text-amber-400 transition-colors text-xs"
          >
            {sidebarOpen ? '◁' : '▷'}
          </button>
        </div>

        {/* Live indicator */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-amber-400/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs text-slate-500 leading-tight">{time}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={syncNow}
                disabled={syncing}
                className="font-mono text-[10px] text-amber-400 border border-amber-400/30 px-2 py-1 hover:bg-amber-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
              >
                {syncing ? 'SYNCING...' : 'SYNC NOW'}
              </button>
              {syncStatus && (
                <span className="font-mono text-[10px] text-slate-500 tracking-wider">{syncStatus}</span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            const isAlerts = href === '/dashboard/alerts'
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded transition-all text-sm font-mono tracking-wider',
                  active
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-surface-2'
                )}
              >
                <span className={cn('flex-shrink-0', active ? 'text-amber-400' : '')}>{icon}</span>
                {sidebarOpen && (
                  <span className="text-xs">{label}</span>
                )}
                {sidebarOpen && isAlerts && unreadAlerts > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-amber-400/10 p-3">
          {sidebarOpen ? (
            <div>
              <div className="font-mono text-xs text-slate-500 truncate mb-2 px-1">{userEmail}</div>
              <button
                onClick={signOut}
                className="w-full text-xs font-mono text-slate-600 hover:text-red-400 transition-colors tracking-wider py-1"
              >
                ⏻ DISCONNECT
              </button>
            </div>
          ) : (
            <button onClick={signOut} className="text-slate-600 hover:text-red-400 transition-colors text-sm px-1">
              ⏻
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
