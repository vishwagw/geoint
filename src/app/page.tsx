'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [mode, setMode] = useState<'landing' | 'signin' | 'signup'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account.')
    setLoading(false)
  }

  if (mode !== 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="font-display text-amber-400 text-2xl font-bold tracking-widest mb-1">GEOINT</div>
            <div className="font-mono text-xs text-slate-500 tracking-wider">CLASSIFIED INTELLIGENCE PLATFORM</div>
          </div>

          <div className="glass rounded-lg p-8 amber-glow">
            <div className="flex gap-2 mb-8">
              {(['signin', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setMessage('') }}
                  className={`flex-1 py-2 text-xs font-mono tracking-widest uppercase transition-all ${
                    mode === m
                      ? 'bg-amber-400/10 border border-amber-400/40 text-amber-400'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 tracking-wider">FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400/50 transition-colors"
                    placeholder="John Smith"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 tracking-wider">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400/50 transition-colors"
                  placeholder="analyst@org.gov"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 tracking-wider">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-2 border border-slate-700 rounded px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400/50 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  ⚠ {error}
                </div>
              )}
              {message && (
                <div className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                  ✓ {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-400 text-surface font-display text-xs font-bold tracking-widest uppercase hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {loading ? 'AUTHENTICATING...' : mode === 'signin' ? 'ACCESS PLATFORM' : 'REQUEST ACCESS'}
              </button>
            </form>

            <button
              onClick={() => setMode('landing')}
              className="mt-4 w-full text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors text-center"
            >
              ← Back to overview
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-amber-400/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 pulse-dot" style={{ color: 'rgba(251,191,36,0.4)' }} />
          <span className="font-display text-amber-400 font-bold tracking-widest text-sm">GEOINT</span>
          <span className="font-mono text-xs text-slate-600 tracking-widest hidden sm:block">// LIVE INTELLIGENCE</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMode('signin')} className="font-mono text-xs text-slate-400 hover:text-amber-400 transition-colors tracking-wider">
            SIGN IN
          </button>
          <button onClick={() => setMode('signup')} className="font-mono text-xs px-4 py-2 border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-all tracking-wider">
            GET ACCESS
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400/70 bg-amber-400/5 border border-amber-400/20 px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE — {new Date().toUTCString().replace('GMT', 'UTC')}
        </div>

        <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tight mb-6 leading-none">
          <span className="gradient-text">GLOBAL</span>
          <br />
          <span className="text-white">INTELLIGENCE</span>
          <br />
          <span className="text-slate-600 text-3xl sm:text-4xl font-light tracking-widest mt-2 block">REAL-TIME</span>
        </h1>

        <p className="text-slate-400 font-body text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Monitor geopolitical events as they unfold. AI-powered threat analysis, live risk scoring, 
          and customizable watchlists for analysts, security teams, and researchers.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => setMode('signup')} className="font-display text-xs font-bold tracking-widest px-8 py-4 bg-amber-400 text-surface hover:bg-amber-500 transition-colors uppercase">
            START FREE TRIAL
          </button>
          <button onClick={() => setMode('signin')} className="font-display text-xs font-bold tracking-widest px-8 py-4 border border-slate-700 text-slate-300 hover:border-amber-400/40 hover:text-amber-400 transition-all uppercase">
            SIGN IN →
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-amber-400/10 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-amber-400/10">
          {[
            { value: '180+', label: 'Countries Monitored' },
            { value: '<5min', label: 'Event Detection Lag' },
            { value: '24/7', label: 'Live Coverage' },
            { value: 'GPT-4', label: 'AI Analysis Engine' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center py-4 px-6">
              <div className="font-display text-2xl font-bold text-amber-400 mb-1">{value}</div>
              <div className="font-mono text-xs text-slate-500 tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="font-mono text-xs text-amber-400/60 tracking-widest mb-3">// CAPABILITIES</div>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight">Intelligence-Grade Features</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: '🌍',
              title: 'Live Event Feed',
              desc: 'Real-time ingestion of geopolitical events from 500+ verified sources with Supabase Realtime subscriptions.',
            },
            {
              icon: '🗺️',
              title: 'Interactive Threat Map',
              desc: 'Geolocated event markers with risk overlays. Drill into any region for detailed intelligence.',
            },
            {
              icon: '🤖',
              title: 'AI Analysis',
              desc: 'Claude-powered analysis generates structured threat assessments and geopolitical forecasts on demand.',
            },
            {
              icon: '🔔',
              title: 'Smart Watchlists',
              desc: 'Define monitoring rules by country, category, threat level, or keywords. Get instant alerts.',
            },
            {
              icon: '📊',
              title: 'Risk Scoring',
              desc: 'Dynamic country-level risk scores across political, security, economic, and social dimensions.',
            },
            {
              icon: '📋',
              title: 'Intelligence Reports',
              desc: 'Generate and export professional briefing documents with AI-synthesized insights.',
            },
          ].map(f => (
            <div key={f.title} className="glass glass-hover rounded-lg p-6 group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display text-sm font-bold text-white mb-2 tracking-wider">{f.title}</h3>
              <p className="font-body text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-amber-400/10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="font-mono text-xs text-amber-400/60 tracking-widest mb-3">// CLEARANCE LEVELS</div>
            <h2 className="font-display text-3xl font-bold text-white">Choose Your Access</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                plan: 'FREE',
                price: '$0',
                period: 'forever',
                features: ['24h delayed feed', '10 events/day', 'Basic map view', '1 watchlist'],
                cta: 'Start Free',
              },
              {
                plan: 'ANALYST',
                price: '$49',
                period: 'per month',
                featured: true,
                features: ['Live real-time feed', 'Unlimited events', 'Full map + overlays', '20 watchlists', 'AI analysis (100/mo)', 'Export reports'],
                cta: 'Go Analyst',
              },
              {
                plan: 'ENTERPRISE',
                price: 'Custom',
                period: 'contact us',
                features: ['Everything in Analyst', 'Unlimited AI analysis', 'API access', 'Custom integrations', 'Dedicated support', 'SSO / SAML'],
                cta: 'Contact Sales',
              },
            ].map(({ plan, price, period, features, cta, featured }) => (
              <div
                key={plan}
                className={`rounded-lg p-6 ${
                  featured
                    ? 'bg-amber-400/5 border-2 border-amber-400/40 amber-glow relative'
                    : 'glass'
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-xs bg-amber-400 text-surface px-3 py-1 tracking-widest">
                    RECOMMENDED
                  </div>
                )}
                <div className="font-display text-xs font-bold text-amber-400 tracking-widest mb-3">{plan}</div>
                <div className="font-display text-4xl font-black text-white mb-1">{price}</div>
                <div className="font-mono text-xs text-slate-500 mb-6 tracking-wider">{period}</div>
                <ul className="space-y-2 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm font-body text-slate-300">
                      <span className="text-amber-400 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setMode('signup')}
                  className={`w-full py-2.5 font-display text-xs font-bold tracking-widest uppercase transition-all ${
                    featured
                      ? 'bg-amber-400 text-surface hover:bg-amber-500'
                      : 'border border-slate-700 text-slate-300 hover:border-amber-400/40 hover:text-amber-400'
                  }`}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-400/10 py-8 px-6 text-center">
        <div className="font-display text-amber-400 text-sm font-bold tracking-widest mb-2">GEOINT</div>
        <div className="font-mono text-xs text-slate-600">
          © {new Date().getFullYear()} GEOINT PLATFORM. ALL RIGHTS RESERVED. — NOT FOR PUBLIC DISTRIBUTION.
        </div>
      </footer>
    </div>
  )
}
