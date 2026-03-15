import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// This endpoint is called by a cron job (e.g. Vercel Cron) to ingest live news
// Protected by a secret token

const DEFAULT_INGEST_INTERVAL_MINUTES = 15

const SAMPLE_EVENTS = [
  {
    title: 'Security Council Convenes Emergency Session on Regional Tensions',
    summary: 'The UN Security Council held an emergency session following escalating military movements near disputed borders, with member states calling for immediate de-escalation measures.',
    category: 'diplomacy',
    threat_level: 'high',
    country_codes: ['US', 'RU', 'CN'],
    region: 'Global',
    lat: 40.7489,
    lng: -73.9680,
    source_name: 'Reuters',
    tags: ['UN', 'security-council', 'diplomacy'],
    is_breaking: false,
    is_verified: true,
  },
  {
    title: 'Cyber Infrastructure Attack Detected on Critical Energy Systems',
    summary: 'State-sponsored cyber actors have been attributed to a coordinated attack targeting power grid infrastructure. Authorities are investigating the full scope of the intrusion.',
    category: 'cyber',
    threat_level: 'critical',
    country_codes: ['UA'],
    region: 'Eastern Europe',
    lat: 50.4501,
    lng: 30.5234,
    source_name: 'AP',
    tags: ['cyber', 'infrastructure', 'energy'],
    is_breaking: true,
    is_verified: false,
  },
  {
    title: 'New Sanctions Package Announced Targeting Energy Exports',
    summary: 'A coalition of Western nations announced a comprehensive new sanctions package targeting energy sector exports, expected to significantly impact regional economic stability.',
    category: 'sanctions',
    threat_level: 'medium',
    country_codes: ['RU', 'DE', 'FR'],
    region: 'Europe',
    lat: 52.5200,
    lng: 13.4050,
    source_name: 'BBC',
    tags: ['sanctions', 'energy', 'economics'],
    is_breaking: false,
    is_verified: true,
  },
]

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source')
  const force = searchParams.get('force') === '1'
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET || 'dev-secret'
  const isAuthorized = authHeader === `Bearer ${expectedToken}`

  // Traffic mode lets normal dashboard visits trigger ingestion without exposing secrets.
  const isTrafficMode = source === 'traffic'
  if (!isAuthorized && !isTrafficMode) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (isTrafficMode && !isAuthorized && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (force) {
      if (!user && !isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)

      if (adminEmails.length > 0 && !isAuthorized) {
        const userEmail = user?.email?.toLowerCase() || ''
        if (!adminEmails.includes(userEmail)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    const supabase = await createServiceClient()

    const configuredInterval = Number.parseInt(process.env.INGEST_INTERVAL_MINUTES || '', 10)
    const intervalMinutes = Number.isFinite(configuredInterval) && configuredInterval > 0
      ? configuredInterval
      : DEFAULT_INGEST_INTERVAL_MINUTES

    if (!isAuthorized && !force) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: latestEvent } = await (supabase.from('events') as any)
        .select('published_at')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: { published_at: string } | null }

      if (latestEvent?.published_at) {
        const lastIngestMs = new Date(latestEvent.published_at).getTime()
        const intervalMs = intervalMinutes * 60 * 1000
        const elapsed = Date.now() - lastIngestMs

        if (elapsed < intervalMs) {
          const retryAfterSeconds = Math.max(1, Math.ceil((intervalMs - elapsed) / 1000))
          return NextResponse.json(
            {
              success: true,
              skipped: true,
              reason: 'Ingestion is not due yet',
              retry_after_seconds: retryAfterSeconds,
            },
            {
              status: 200,
              headers: {
                'Retry-After': String(retryAfterSeconds),
              },
            }
          )
        }
      }
    }

    // In production, replace this with actual news API fetching:
    // const newsRes = await fetch(`https://newsapi.org/v2/top-headlines?category=general&apiKey=${process.env.NEWS_API_KEY}`)
    // const newsData = await newsRes.json()
    // Process and insert real articles here

    // For now, insert a sample event to demonstrate real-time functionality
    const randomEvent = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('events') as any).insert({
      ...randomEvent,
      published_at: new Date().toISOString(),
    }).select().single() as { data: { id: string; category: string; threat_level: string; country_codes: string[]; title: string; summary: string } | null; error: unknown }

    if (error) throw error

    // Check watchlists and create alerts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: watchlists } = await (supabase.from('watchlists') as any)
      .select('*')
      .eq('is_active', true) as { data: Array<{ id: string; user_id: string; name: string; categories: string[]; threat_levels: string[]; countries: string[]; keywords: string[] }> | null }

    if (watchlists && data) {
      for (const wl of watchlists) {
        const matches =
          (wl.categories.length === 0 || wl.categories.includes(data.category)) &&
          (wl.threat_levels.length === 0 || wl.threat_levels.includes(data.threat_level)) &&
          (wl.countries.length === 0 || wl.countries.some((c: string) => data.country_codes.includes(c))) &&
          (wl.keywords.length === 0 || wl.keywords.some((k: string) =>
            data.title.toLowerCase().includes(k) || data.summary.toLowerCase().includes(k)
          ))

        if (matches) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('alerts') as any).insert({
            user_id: wl.user_id,
            event_id: data.id,
            watchlist_id: wl.id,
            message: `Watchlist "${wl.name}" matched: ${data.title}`,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: data,
      source: isTrafficMode ? 'traffic' : 'authorized',
      forced: force,
    })
  } catch (error) {
    console.error('Event ingestion error:', error)
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const source = searchParams.get('source')

  if (source === 'traffic') {
    return NextResponse.json({
      message: 'Traffic-trigger endpoint. Use POST /api/events?source=traffic',
      throttling: `Runs at most once every ${process.env.INGEST_INTERVAL_MINUTES || DEFAULT_INGEST_INTERVAL_MINUTES} minutes unless authorized`,
    })
  }

  if (token !== (process.env.CRON_SECRET || 'dev-secret')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Redirect to POST handler logic
  return NextResponse.json({
    message: 'Event ingestion endpoint. Use POST with Authorization header.',
    usage: 'POST /api/events with Authorization: Bearer <CRON_SECRET>'
  })
}
