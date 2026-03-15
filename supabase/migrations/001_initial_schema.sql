-- ============================================================
-- GEOINT Platform — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  organization text,
  plan text not null default 'free' check (plan in ('free', 'analyst', 'enterprise')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- EVENTS (geopolitical incidents)
-- ============================================================
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  summary text not null,
  body text,
  category text not null check (category in (
    'conflict', 'diplomacy', 'economics', 'sanctions',
    'elections', 'terrorism', 'cyber', 'energy', 'migration', 'other'
  )),
  threat_level text not null default 'low' check (threat_level in (
    'critical', 'high', 'medium', 'low', 'minimal'
  )),
  country_codes text[] not null default '{}',
  region text,
  lat double precision,
  lng double precision,
  source_name text,
  source_url text,
  ai_analysis text,
  tags text[] default '{}',
  is_verified boolean default false,
  is_breaking boolean default false,
  published_at timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events are publicly readable"
  on public.events for select using (true);

create policy "Only service role can insert events"
  on public.events for insert with check (auth.role() = 'service_role');

-- Indexes for performance
create index events_published_at_idx on public.events (published_at desc);
create index events_threat_level_idx on public.events (threat_level);
create index events_category_idx on public.events (category);
create index events_country_codes_idx on public.events using gin (country_codes);
create index events_tags_idx on public.events using gin (tags);
create index events_search_idx on public.events using gin (
  to_tsvector('english', title || ' ' || summary)
);

-- ============================================================
-- WATCHLISTS (user-defined monitoring)
-- ============================================================
create table public.watchlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  description text,
  countries text[] default '{}',
  categories text[] default '{}',
  threat_levels text[] default '{}',
  keywords text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.watchlists enable row level security;

create policy "Users can manage own watchlists"
  on public.watchlists for all using (auth.uid() = user_id);

-- ============================================================
-- ALERTS (triggered notifications)
-- ============================================================
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  event_id uuid references public.events on delete cascade not null,
  watchlist_id uuid references public.watchlists on delete set null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"
  on public.alerts for select using (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update using (auth.uid() = user_id);

create index alerts_user_id_idx on public.alerts (user_id, created_at desc);
create index alerts_unread_idx on public.alerts (user_id) where is_read = false;

-- ============================================================
-- COUNTRY RISK SCORES
-- ============================================================
create table public.country_risk (
  id uuid default uuid_generate_v4() primary key,
  country_code text not null,
  country_name text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  political_score integer check (political_score between 0 and 100),
  security_score integer check (security_score between 0 and 100),
  economic_score integer check (economic_score between 0 and 100),
  social_score integer check (social_score between 0 and 100),
  trend text check (trend in ('improving', 'stable', 'deteriorating')),
  notes text,
  updated_at timestamptz default now()
);

alter table public.country_risk enable row level security;
create policy "Country risk is publicly readable"
  on public.country_risk for select using (true);

create unique index country_risk_code_idx on public.country_risk (country_code);

-- ============================================================
-- AI ANALYSIS REPORTS
-- ============================================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  title text not null,
  content text not null,
  event_ids uuid[] default '{}',
  country_codes text[] default '{}',
  report_type text check (report_type in ('summary', 'deep_dive', 'forecast', 'briefing')),
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Users can manage own reports"
  on public.reports for all using (auth.uid() = user_id);

create policy "Public reports are readable by all"
  on public.reports for select using (is_public = true);

-- ============================================================
-- REAL-TIME: enable realtime on events and alerts
-- ============================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.alerts;

-- ============================================================
-- SEED: Initial country risk data
-- ============================================================
insert into public.country_risk (country_code, country_name, overall_score, political_score, security_score, economic_score, social_score, trend) values
  ('US', 'United States', 28, 32, 22, 18, 40, 'stable'),
  ('RU', 'Russia', 82, 88, 85, 75, 80, 'deteriorating'),
  ('CN', 'China', 58, 70, 45, 40, 75, 'stable'),
  ('UA', 'Ukraine', 79, 72, 95, 85, 60, 'deteriorating'),
  ('IL', 'Israel', 72, 68, 88, 40, 70, 'deteriorating'),
  ('IR', 'Iran', 78, 80, 72, 82, 75, 'stable'),
  ('KP', 'North Korea', 91, 95, 88, 95, 90, 'stable'),
  ('SY', 'Syria', 88, 82, 95, 92, 85, 'improving'),
  ('SD', 'Sudan', 85, 80, 92, 88, 82, 'deteriorating'),
  ('VE', 'Venezuela', 71, 78, 65, 80, 62, 'stable'),
  ('MM', 'Myanmar', 76, 80, 82, 70, 72, 'stable'),
  ('AF', 'Afghanistan', 87, 85, 92, 88, 82, 'stable'),
  ('ET', 'Ethiopia', 68, 72, 78, 65, 60, 'improving'),
  ('LY', 'Libya', 75, 72, 82, 70, 72, 'stable'),
  ('YE', 'Yemen', 86, 82, 92, 90, 80, 'stable'),
  ('DE', 'Germany', 22, 18, 15, 25, 30, 'stable'),
  ('GB', 'United Kingdom', 24, 28, 18, 25, 25, 'stable'),
  ('FR', 'France', 25, 30, 20, 22, 28, 'stable'),
  ('JP', 'Japan', 18, 20, 12, 22, 18, 'stable'),
  ('IN', 'India', 45, 48, 52, 40, 42, 'stable')
on conflict (country_code) do nothing;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Search events full-text
create or replace function search_events(query text, limit_count int default 20)
returns setof public.events as $$
  select * from public.events
  where to_tsvector('english', title || ' ' || summary) @@ plainto_tsquery('english', query)
  order by published_at desc
  limit limit_count;
$$ language sql stable;

-- Get event stats
create or replace function get_event_stats()
returns json as $$
  select json_build_object(
    'total_today', (select count(*) from public.events where published_at > now() - interval '24 hours'),
    'critical', (select count(*) from public.events where threat_level = 'critical' and published_at > now() - interval '7 days'),
    'breaking', (select count(*) from public.events where is_breaking = true and published_at > now() - interval '24 hours'),
    'by_category', (
      select json_object_agg(category, cnt) from (
        select category, count(*) as cnt
        from public.events
        where published_at > now() - interval '7 days'
        group by category
      ) t
    )
  );
$$ language sql stable security definer;
