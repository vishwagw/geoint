'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Watchlist } from '@/types/database'

const CATEGORIES = ['conflict', 'diplomacy', 'economics', 'sanctions', 'elections', 'terrorism', 'cyber', 'energy', 'migration', 'other']
const THREATS = ['critical', 'high', 'medium', 'low', 'minimal']
const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' },
  { code: 'UA', name: 'Ukraine' }, { code: 'IL', name: 'Israel' }, { code: 'IR', name: 'Iran' },
  { code: 'KP', name: 'North Korea' }, { code: 'IN', name: 'India' }, { code: 'DE', name: 'Germany' },
  { code: 'TR', name: 'Turkey' },
]

function WatchlistForm({ onSave, onCancel, initial }: { onSave: (data: Partial<Watchlist>) => void, onCancel: () => void, initial?: Watchlist }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [countries, setCountries] = useState<string[]>(initial?.countries || [])
  const [categories, setCategories] = useState<string[]>(initial?.categories || [])
  const [threatLevels, setThreatLevels] = useState<string[]>(initial?.threat_levels || [])
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords || [])
  const [kwInput, setKwInput] = useState('')

  const toggle = (arr: string[], item: string, set: (v: string[]) => void) => {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setKwInput('')
    }
  }

  return (
    <div className="glass rounded-lg p-6 border border-amber-400/20 space-y-5">
      <h3 className="font-display text-sm font-bold text-amber-400 tracking-widest">
        {initial ? 'EDIT WATCHLIST' : 'NEW WATCHLIST'}
      </h3>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-1.5">NAME *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eastern Europe Monitor"
          className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2 text-sm text-white font-body focus:outline-none focus:border-amber-400/50" />
      </div>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-1.5">DESCRIPTION</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2 text-sm text-white font-body focus:outline-none focus:border-amber-400/50 resize-none" />
      </div>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-2">COUNTRIES</label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_COUNTRIES.map(c => (
            <button key={c.code} onClick={() => toggle(countries, c.code, setCountries)}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${countries.includes(c.code) ? 'bg-amber-400/20 border border-amber-400/50 text-amber-400' : 'bg-surface-2 border border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-2">CATEGORIES</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => toggle(categories, c, setCategories)}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${categories.includes(c) ? 'bg-amber-400/20 border border-amber-400/50 text-amber-400' : 'bg-surface-2 border border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-2">THREAT LEVELS</label>
        <div className="flex flex-wrap gap-2">
          {THREATS.map(t => (
            <button key={t} onClick={() => toggle(threatLevels, t, setThreatLevels)}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${threatLevels.includes(t) ? 'bg-amber-400/20 border border-amber-400/50 text-amber-400' : 'bg-surface-2 border border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs text-slate-500 tracking-wider mb-2">KEYWORDS</label>
        <div className="flex gap-2 mb-2">
          <input value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="Type keyword + Enter"
            className="flex-1 bg-surface-2 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400/50" />
          <button onClick={addKeyword} className="font-mono text-xs px-3 py-1.5 border border-slate-700 text-slate-400 hover:border-amber-400/50 hover:text-amber-400 transition-all rounded">ADD</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map(kw => (
            <span key={kw} className="font-mono text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1.5">
              #{kw}
              <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="text-amber-400/60 hover:text-amber-400">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave({ name, description, countries, categories, threat_levels: threatLevels, keywords })}
          disabled={!name.trim()}
          className="font-display text-xs font-bold tracking-widest px-5 py-2.5 bg-amber-400 text-surface hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          SAVE WATCHLIST
        </button>
        <button onClick={onCancel} className="font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors tracking-wider">
          CANCEL
        </button>
      </div>
    </div>
  )
}

export default function WatchlistsPage() {
  const supabase = createClient()
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Watchlist | null>(null)

  const loadWatchlists = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
    if (data) setWatchlists(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadWatchlists() }, [loadWatchlists])

  async function saveWatchlist(data: Partial<Watchlist>) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('watchlists') as any).update(data).eq('id', editing.id)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('watchlists') as any).insert({ ...data, user_id: user.user.id })
    }
    setShowForm(false)
    setEditing(null)
    loadWatchlists()
  }

  async function deleteWatchlist(id: string) {
    await supabase.from('watchlists').delete().eq('id', id)
    setWatchlists(wls => wls.filter(w => w.id !== id))
  }

  async function toggleActive(wl: Watchlist) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('watchlists') as any).update({ is_active: !wl.is_active }).eq('id', wl.id)
    setWatchlists(prev => prev.map(w => w.id === wl.id ? { ...w, is_active: !w.is_active } : w))
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-sm font-bold text-white tracking-widest">WATCHLISTS</h1>
          <p className="font-mono text-xs text-slate-500 mt-1 tracking-wider">CONFIGURE MONITORING RULES FOR AUTOMATIC ALERTS</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="font-display text-xs font-bold tracking-widest px-4 py-2.5 bg-amber-400 text-surface hover:bg-amber-500 transition-colors"
        >
          + NEW WATCHLIST
        </button>
      </div>

      {(showForm || editing) && (
        <WatchlistForm
          onSave={saveWatchlist}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          initial={editing || undefined}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : watchlists.length === 0 ? (
        <div className="glass rounded-lg p-12 text-center border border-dashed border-slate-700">
          <div className="font-mono text-xs text-slate-500 tracking-widest mb-3">NO WATCHLISTS CONFIGURED</div>
          <p className="font-body text-sm text-slate-600">Create a watchlist to receive automatic alerts when matching events are detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlists.map(wl => (
            <div key={wl.id} className={`glass rounded-lg p-5 transition-all ${wl.is_active ? 'border-amber-400/10' : 'opacity-50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-sm font-bold text-white tracking-wide">{wl.name}</h3>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${wl.is_active ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-slate-500 border-slate-700'}`}>
                      {wl.is_active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  {wl.description && <p className="font-body text-xs text-slate-400 mb-3">{wl.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {wl.countries.map(c => <span key={c} className="font-mono text-xs text-slate-400 bg-surface-2 px-1.5 py-0.5 rounded">{c}</span>)}
                    {wl.categories.map(c => <span key={c} className="font-mono text-xs text-amber-400/60 bg-amber-400/5 px-1.5 py-0.5 rounded">{c}</span>)}
                    {wl.threat_levels.map(t => <span key={t} className="font-mono text-xs text-orange-400/60 bg-orange-400/5 px-1.5 py-0.5 rounded">{t}</span>)}
                    {wl.keywords.map(k => <span key={k} className="font-mono text-xs text-cyan-400/60 bg-cyan-400/5 px-1.5 py-0.5 rounded">#{k}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(wl)} className="font-mono text-xs text-slate-500 hover:text-amber-400 transition-colors tracking-wider">
                    {wl.is_active ? 'PAUSE' : 'RESUME'}
                  </button>
                  <button onClick={() => { setEditing(wl); setShowForm(false) }} className="font-mono text-xs text-slate-500 hover:text-white transition-colors">
                    EDIT
                  </button>
                  <button onClick={() => deleteWatchlist(wl.id)} className="font-mono text-xs text-slate-600 hover:text-red-400 transition-colors">
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
