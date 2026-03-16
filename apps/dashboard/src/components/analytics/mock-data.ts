/**
 * Analytics V1 — Mock Data
 *
 * Requirements from ANALYTICS_CONTRACT.md:
 * - EVI time series with realistic variance (not flat) — at least one dip and recovery
 * - Driver scores that don't all move together (divergence is interesting)
 * - 3–4 topic clusters for Share of Model
 * - 4–6 coverage events on the timeline
 * - 5 top movers (mix of positive and negative)
 */

import type { EVIDataPoint, SoMCluster, CoverageEvent, TopMover } from './types';

// ============================================
// HELPERS
// ============================================

/** Generate an ISO date string N days before the reference date */
function daysAgo(n: number, ref = '2026-02-20'): string {
  const [y, m, d] = ref.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// ============================================
// EVI TIME SERIES (365 days)
//
// Story: Steady growth through Nov, dip in late Dec (holiday lull),
// recovery in Jan, strong Feb push. Drivers diverge:
// - Visibility: strong upward (PR wins + SERP gains)
// - Authority: slow steady climb (backlinks + structured data)
// - Momentum: volatile — dipped hard in Dec, recovering
// ============================================

function generateEVITimeSeries(): EVIDataPoint[] {
  const points: EVIDataPoint[] = [];

  for (let i = 365; i >= 0; i--) {
    const date = daysAgo(i);
    const dayIndex = 365 - i; // 0 = oldest, 365 = today

    // Base trajectories with different curves
    const visBase = 45 + (dayIndex / 365) * 28; // 45 → 73
    const authBase = 50 + (dayIndex / 365) * 14; // 50 → 64
    const momBase = 40 + (dayIndex / 365) * 22; // 40 → 62

    // Add a dip around day 270-300 (late Dec / early Jan)
    const dipCenter = 290;
    const dipWidth = 25;
    const dipStrength = Math.exp(-Math.pow((dayIndex - dipCenter) / dipWidth, 2));

    // Visibility: mild dip (-5), strong recovery
    const visDip = -5 * dipStrength;
    // Authority: barely affected (-2)
    const authDip = -2 * dipStrength;
    // Momentum: sharp dip (-15), slower recovery
    const momDip = -15 * dipStrength;

    // Add realistic noise
    const noise = (seed: number) => Math.sin(dayIndex * 0.3 + seed) * 2 + Math.cos(dayIndex * 0.7 + seed) * 1.5;

    const visibility = Math.max(0, Math.min(100, visBase + visDip + noise(1)));
    const authority = Math.max(0, Math.min(100, authBase + authDip + noise(2)));
    const momentum = Math.max(0, Math.min(100, momBase + momDip + noise(3)));

    const eviScore = visibility * 0.4 + authority * 0.35 + momentum * 0.25;

    points.push({
      date,
      eviScore: Math.round(eviScore * 10) / 10,
      visibility: Math.round(visibility * 10) / 10,
      authority: Math.round(authority * 10) / 10,
      momentum: Math.round(momentum * 10) / 10,
    });
  }

  return points;
}

export const MOCK_EVI_TIME_SERIES: EVIDataPoint[] = generateEVITimeSeries();

/** Current (most recent) data point */
export const MOCK_CURRENT_EVI: EVIDataPoint =
  MOCK_EVI_TIME_SERIES[MOCK_EVI_TIME_SERIES.length - 1];

/** 30 days ago data point for delta calculation */
export const MOCK_30D_AGO_EVI: EVIDataPoint =
  MOCK_EVI_TIME_SERIES[MOCK_EVI_TIME_SERIES.length - 31];

// ============================================
// SHARE OF MODEL — 4 TOPIC CLUSTERS
// ============================================

export const MOCK_SOM_CLUSTERS: SoMCluster[] = [
  {
    topicCluster: 'AI Marketing Automation',
    yourShare: 23.4,
    topCompetitor: 'HubSpot',
    competitorShare: 31.2,
    delta30d: 4.1,
  },
  {
    topicCluster: 'Content Strategy',
    yourShare: 18.7,
    topCompetitor: 'Semrush',
    competitorShare: 22.5,
    delta30d: 2.3,
  },
  {
    topicCluster: 'PR Analytics',
    yourShare: 34.8,
    topCompetitor: 'Meltwater',
    competitorShare: 28.1,
    delta30d: -1.2,
  },
  {
    topicCluster: 'SEO Intelligence',
    yourShare: 12.6,
    topCompetitor: 'Ahrefs',
    competitorShare: 38.9,
    delta30d: 1.8,
  },
];

// ============================================
// COVERAGE EVENTS — 6 PR events
// ============================================

export const MOCK_COVERAGE_EVENTS: CoverageEvent[] = [
  {
    id: 'cov-1',
    date: daysAgo(3),
    title: 'TechCrunch feature on AI visibility platform',
    tier: 'T1',
    eviImpact: 3.2,
  },
  {
    id: 'cov-2',
    date: daysAgo(8),
    title: 'VentureBeat interview: CEO on AEO strategy',
    tier: 'T2',
    eviImpact: 1.8,
  },
  {
    id: 'cov-3',
    date: daysAgo(14),
    title: 'Search Engine Journal: Pravado case study',
    tier: 'T2',
    eviImpact: 1.4,
  },
  {
    id: 'cov-4',
    date: daysAgo(21),
    title: 'Forbes mention in "AI Tools to Watch" roundup',
    tier: 'T1',
    eviImpact: 2.6,
  },
  {
    id: 'cov-5',
    date: daysAgo(28),
    title: 'Industry blog review: Share of Model methodology',
    tier: 'T3',
    eviImpact: 0.5,
  },
  {
    id: 'cov-6',
    date: daysAgo(45),
    title: 'Negative press: data privacy concerns raised',
    tier: 'T2',
    eviImpact: -2.1,
  },
];

// ============================================
// TOP MOVERS — 5 factors (mix positive + negative)
// ============================================

export const MOCK_TOP_MOVERS: TopMover[] = [
  {
    id: 'mov-1',
    description: 'TechCrunch feature drove 3x citation rate increase in AI Marketing cluster',
    pillar: 'pr',
    delta: 3.2,
    period: 'Last 7 days',
  },
  {
    id: 'mov-2',
    description: '4 new authority articles indexed with AEO scores above 75',
    pillar: 'content',
    delta: 2.1,
    period: 'Last 14 days',
  },
  {
    id: 'mov-3',
    description: 'Competitor Ahrefs published 12 articles on SEO Intelligence cluster',
    pillar: 'seo',
    delta: -1.8,
    period: 'Last 30 days',
  },
  {
    id: 'mov-4',
    description: 'Schema markup improvements increased structured data coverage to 94%',
    pillar: 'seo',
    delta: 1.4,
    period: 'Last 14 days',
  },
  {
    id: 'mov-5',
    description: 'PR outreach pause during holiday period reduced citation velocity',
    pillar: 'pr',
    delta: -2.3,
    period: 'Last 30 days',
  },
];
