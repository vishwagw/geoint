export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal'
export type EventCategory =
  | 'conflict' | 'diplomacy' | 'economics' | 'sanctions'
  | 'elections' | 'terrorism' | 'cyber' | 'energy' | 'migration' | 'other'
export type Plan = 'free' | 'analyst' | 'enterprise'
export type RiskTrend = 'improving' | 'stable' | 'deteriorating'
export type ReportType = 'summary' | 'deep_dive' | 'forecast' | 'briefing'

export interface Profile {
  id: string; email: string; full_name: string | null; organization: string | null
  plan: Plan; avatar_url: string | null; created_at: string; updated_at: string
}

export interface Event {
  id: string; title: string; summary: string; body: string | null
  category: EventCategory; threat_level: ThreatLevel; country_codes: string[]
  region: string | null; lat: number | null; lng: number | null
  source_name: string | null; source_url: string | null; ai_analysis: string | null
  tags: string[]; is_verified: boolean; is_breaking: boolean
  published_at: string; created_at: string; updated_at: string
}

export interface CountryRisk {
  id: string; country_code: string; country_name: string; overall_score: number
  political_score: number | null; security_score: number | null
  economic_score: number | null; social_score: number | null
  trend: RiskTrend | null; notes: string | null; updated_at: string
}

export interface Watchlist {
  id: string; user_id: string; name: string; description: string | null
  countries: string[]; categories: string[]; threat_levels: string[]
  keywords: string[]; is_active: boolean; created_at: string; updated_at: string
}

export interface Alert {
  id: string; user_id: string; event_id: string; watchlist_id: string | null
  message: string; is_read: boolean; created_at: string; event?: Event
}

export interface Report {
  id: string; user_id: string | null; title: string; content: string
  event_ids: string[]; country_codes: string[]; report_type: ReportType | null
  is_public: boolean; created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> }
      events: {
        Row: Event
        Insert: { id?: string; title: string; summary: string; body?: string | null; category: string; threat_level?: string; country_codes?: string[]; region?: string | null; lat?: number | null; lng?: number | null; source_name?: string | null; source_url?: string | null; ai_analysis?: string | null; tags?: string[]; is_verified?: boolean; is_breaking?: boolean; published_at?: string; created_at?: string; updated_at?: string }
        Update: { title?: string; summary?: string; body?: string | null; category?: string; threat_level?: string; country_codes?: string[]; region?: string | null; lat?: number | null; lng?: number | null; source_name?: string | null; source_url?: string | null; ai_analysis?: string | null; tags?: string[]; is_verified?: boolean; is_breaking?: boolean; published_at?: string; updated_at?: string }
      }
      country_risk: { Row: CountryRisk; Insert: Partial<CountryRisk> & { country_code: string; country_name: string; overall_score: number }; Update: Partial<CountryRisk> }
      watchlists: {
        Row: Watchlist
        Insert: { id?: string; user_id: string; name: string; description?: string | null; countries?: string[]; categories?: string[]; threat_levels?: string[]; keywords?: string[]; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { name?: string; description?: string | null; countries?: string[]; categories?: string[]; threat_levels?: string[]; keywords?: string[]; is_active?: boolean; updated_at?: string }
      }
      alerts: {
        Row: Alert
        Insert: { id?: string; user_id: string; event_id: string; watchlist_id?: string | null; message: string; is_read?: boolean; created_at?: string }
        Update: { is_read?: boolean }
      }
      reports: {
        Row: Report
        Insert: { id?: string; user_id?: string | null; title: string; content: string; event_ids?: string[]; country_codes?: string[]; report_type?: string | null; is_public?: boolean; created_at?: string }
        Update: Partial<Omit<Report, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_event_stats: { Args: Record<string, never>; Returns: string }
      search_events: { Args: { query: string; limit_count?: number }; Returns: Event[] }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
