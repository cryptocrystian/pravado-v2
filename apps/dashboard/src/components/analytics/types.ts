/**
 * Analytics V1 — Type Definitions
 *
 * All interfaces match the eventual API shape defined in
 * docs/canon/ANALYTICS_CONTRACT.md §8.
 *
 * EVI formula: (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
 * Each driver normalized 0–100. Composite EVI 0–100.
 */

// ============================================
// EVI TIME SERIES
// ============================================

export interface EVIDataPoint {
  date: string; // ISO date YYYY-MM-DD
  eviScore: number; // 0–100
  visibility: number; // 0–100
  authority: number; // 0–100
  momentum: number; // 0–100
}

// ============================================
// SHARE OF MODEL
// ============================================

export interface SoMCluster {
  topicCluster: string;
  yourShare: number; // percentage 0–100
  topCompetitor: string;
  competitorShare: number; // percentage 0–100
  delta30d: number; // signed change in percentage points
}

// ============================================
// COVERAGE EVENTS
// ============================================

export type CoverageTier = 'T1' | 'T2' | 'T3';

export interface CoverageEvent {
  id: string;
  date: string; // ISO date
  title: string;
  tier: CoverageTier;
  eviImpact: number; // signed delta
}

// ============================================
// TOP MOVERS
// ============================================

export type AnalyticsPillar = 'pr' | 'content' | 'seo';

export interface TopMover {
  id: string;
  description: string;
  pillar: AnalyticsPillar;
  delta: number; // signed EVI points
  period: string; // e.g., "Last 30 days"
}

// ============================================
// EVI STATUS BANDS
// ============================================

export interface EVIBand {
  min: number;
  max: number;
  label: string;
  colorClass: string; // Tailwind text color class
  bgClass: string; // Tailwind bg color class (for badge)
}

export const EVI_BANDS: EVIBand[] = [
  { min: 0, max: 40, label: 'At Risk', colorClass: 'text-semantic-danger', bgClass: 'bg-semantic-danger/10' },
  { min: 41, max: 60, label: 'Emerging', colorClass: 'text-semantic-warning', bgClass: 'bg-semantic-warning/10' },
  { min: 61, max: 80, label: 'Competitive', colorClass: 'text-brand-cyan', bgClass: 'bg-brand-cyan/10' },
  { min: 81, max: 100, label: 'Dominant', colorClass: 'text-semantic-success', bgClass: 'bg-semantic-success/10' },
];

export function getEVIBand(score: number): EVIBand {
  return EVI_BANDS.find((b) => score >= b.min && score <= b.max) ?? EVI_BANDS[0];
}

// ============================================
// DRIVER CONFIG
// ============================================

export interface DriverConfig {
  key: 'visibility' | 'authority' | 'momentum';
  label: string;
  weight: string;
  description: string;
}

export const DRIVER_CONFIGS: DriverConfig[] = [
  {
    key: 'visibility',
    label: 'Visibility',
    weight: '40%',
    description: 'Where the brand appears — AI answers, press coverage, SERP coverage',
  },
  {
    key: 'authority',
    label: 'Authority',
    weight: '35%',
    description: 'Why the brand is trusted — citation quality, domain authority, E-E-A-T',
  },
  {
    key: 'momentum',
    label: 'Momentum',
    weight: '25%',
    description: 'Trajectory and velocity — citation velocity, share of voice, content output',
  },
];

// ============================================
// COVERAGE TIER CONFIG
// ============================================

export const TIER_CONFIG: Record<CoverageTier, { label: string; dotClass: string }> = {
  T1: { label: 'Tier 1', dotClass: 'bg-semantic-success' },
  T2: { label: 'Tier 2', dotClass: 'bg-brand-cyan' },
  T3: { label: 'Tier 3', dotClass: 'bg-white/40' },
};

// ============================================
// PILLAR CONFIG (for Top Movers badges)
// ============================================

export const ANALYTICS_PILLAR_CONFIG: Record<AnalyticsPillar, { label: string; badgeClass: string }> = {
  pr: {
    label: 'PR',
    badgeClass: 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/20',
  },
  content: {
    label: 'Content',
    badgeClass: 'bg-brand-iris/10 text-brand-iris border-brand-iris/20',
  },
  seo: {
    label: 'SEO',
    badgeClass: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
  },
};

// ============================================
// TIME RANGE OPTIONS
// ============================================

export type TimeRange = '30d' | '90d' | '12m';

export interface TimeRangeOption {
  key: TimeRange;
  label: string;
  days: number;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: '12m', label: '12 months', days: 365 },
];
