import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ThreatLevel, RiskTrend } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  minimal: '#06b6d4',
}

export const THREAT_BG: Record<ThreatLevel, string> = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  low: 'bg-green-500/10 border-green-500/30 text-green-400',
  minimal: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
}

export const TREND_ICON: Record<RiskTrend, string> = {
  improving: '↓',
  stable: '→',
  deteriorating: '↑',
}

export const TREND_COLOR: Record<RiskTrend, string> = {
  improving: 'text-green-400',
  stable: 'text-amber-400',
  deteriorating: 'text-red-400',
}

export function getRiskLabel(score: number): ThreatLevel {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 45) return 'medium'
  if (score >= 25) return 'low'
  return 'minimal'
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export const CATEGORY_ICONS: Record<string, string> = {
  conflict: '⚔️',
  diplomacy: '🤝',
  economics: '💹',
  sanctions: '🚫',
  elections: '🗳️',
  terrorism: '💥',
  cyber: '🖥️',
  energy: '⚡',
  migration: '🌊',
  other: '📌',
}

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', RU: 'Russia', CN: 'China', UA: 'Ukraine',
  IL: 'Israel', IR: 'Iran', KP: 'North Korea', SY: 'Syria',
  SD: 'Sudan', VE: 'Venezuela', MM: 'Myanmar', AF: 'Afghanistan',
  ET: 'Ethiopia', LY: 'Libya', YE: 'Yemen', DE: 'Germany',
  GB: 'United Kingdom', FR: 'France', JP: 'Japan', IN: 'India',
  SA: 'Saudi Arabia', TR: 'Turkey', PK: 'Pakistan', MX: 'Mexico',
  BR: 'Brazil', NG: 'Nigeria', EG: 'Egypt', IQ: 'Iraq', PS: 'Palestine',
}
