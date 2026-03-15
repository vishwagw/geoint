# 🌍 GEOINT — Real-Time Geopolitical Intelligence Platform

A production-ready SaaS for live geopolitical intelligence monitoring, powered by **Next.js 15**, **Supabase**, and **Claude AI**. Deploy in minutes on **Vercel + Supabase**.

---

## ✦ Features

| Feature | Description |
|---|---|
| **Live Event Feed** | Real-time geopolitical events with Supabase Realtime |
| **Threat Map** | Interactive Leaflet map with geolocated event markers |
| **Country Risk Index** | Scored risk profiles across 20+ countries |
| **AI Analysis** | Claude-powered threat assessments per event |
| **Intelligence Reports** | AI-generated briefings, summaries & forecasts |
| **Watchlists** | Custom monitoring rules with automatic alert triggers |
| **Alerts Center** | Real-time notifications for watchlist matches |
| **Authentication** | Supabase Auth (email/password, extensible to OAuth) |

---

## 🚀 Deployment: Vercel + Supabase

### Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon key** (Settings → API)
3. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
4. Enable **Realtime** for `events` and `alerts` tables (Table Editor → Realtime toggle)

### Step 2 — Deploy to Vercel

```bash
# 1. Push this repo to GitHub
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/YOUR_ORG/geoint.git
git push -u origin main

# 2. Import on Vercel: vercel.com/new → Import from GitHub
```

### Step 3 — Environment Variables (Vercel Dashboard → Settings → Environment Variables)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=your-random-secret-here
NEWS_API_KEY=your-newsapi-key (optional)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
ADMIN_EMAILS=admin1@company.com,admin2@company.com (optional, comma-separated)
```

### Step 4 — Configure Ingestion Mode (No Cron Required)

This project can run without Vercel Cron on Hobby plans.

- Dashboard traffic calls `POST /api/events?source=traffic`
- The API is throttled server-side and only ingests when due (default: every 15 minutes)
- You can tune cadence with `INGEST_INTERVAL_MINUTES`

Optional: keep `CRON_SECRET` only if you want to manually trigger authorized ingestion.

Manual trigger:
- Dashboard sidebar has a `SYNC NOW` button.
- It calls `POST /api/events?source=traffic&force=1`.
- If `ADMIN_EMAILS` is set, only listed users can force ingestion.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Copy env example
cp .env.example .env.local
# Fill in your Supabase and Anthropic keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Architecture

```
geoint/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing + auth page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Sidebar navigation
│   │   │   ├── page.tsx              # Overview dashboard
│   │   │   ├── events/page.tsx       # Live event feed
│   │   │   ├── map/page.tsx          # Threat map (Leaflet)
│   │   │   ├── risk/page.tsx         # Country risk index
│   │   │   ├── watchlists/page.tsx   # Watchlist manager
│   │   │   ├── alerts/page.tsx       # Alerts center
│   │   │   └── reports/page.tsx      # AI reports
│   │   └── api/
│   │       ├── events/route.ts       # Event ingestion + alert matching
│   │       └── analysis/
│   │           ├── route.ts          # Per-event AI analysis
│   │           └── report/route.ts   # Full intelligence report generation
│   ├── components/
│   │   └── dashboard/MapComponent.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   └── server.ts             # Server Supabase client + service role
│   │   └── utils.ts                  # Helpers, colors, formatters
│   └── types/database.ts             # Full TypeScript types
├── supabase/
│   └── migrations/001_initial_schema.sql
├── vercel.json                        # Cron config
└── .env.example
```

---

## 📡 Real-Time Architecture

```
External Sources (NewsAPI / Custom)
    → /api/events?source=traffic (triggered by dashboard traffic, throttled)
    → Supabase INSERT (events table)
    → Supabase Realtime broadcast
    → Dashboard + Map auto-update (no refresh needed)
    → Watchlist matching → Alert INSERT
    → Alert badge updates in sidebar
```

---

## 🔑 Supabase RLS Summary

| Table | Read | Write |
|---|---|---|
| `events` | Public | Service role only |
| `country_risk` | Public | Service role only |
| `profiles` | Own user | Own user |
| `watchlists` | Own user | Own user |
| `alerts` | Own user | Own user |
| `reports` | Own user (+ public if flagged) | Own user |

---

## 🔌 Integrations & Extensions

### Connect Real News Sources
In `/api/events/route.ts`, replace the sample events with:
```typescript
// NewsAPI
const res = await fetch(`https://newsapi.org/v2/everything?q=geopolitics+conflict+sanctions&apiKey=${process.env.NEWS_API_KEY}&sortBy=publishedAt`)

// GDELT (free)
const res = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=conflict&mode=artlist&maxrecords=10&format=json')
```

### Add OAuth Providers (Supabase Dashboard → Auth → Providers)
- Google, GitHub, Azure AD — all supported out of the box

### Stripe Billing (for paid plans)
Add `stripe` package and create `/api/billing/checkout` route.

---

## 📊 Monitoring
- Vercel Analytics: add `@vercel/analytics` package
- Supabase Dashboard: query performance, realtime connections, auth stats

---

## 📄 License
MIT — Free to use, modify, and deploy.
