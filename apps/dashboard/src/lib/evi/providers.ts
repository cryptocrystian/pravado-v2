/**
 * EVI Operating System - Data Providers
 *
 * Provider stubs that map real app data to EVI inputs.
 * Each provider is responsible for collecting and normalizing
 * data from its respective pillar.
 *
 * @see /docs/canon/EVI_SPEC.md
 */

import type { EVIComponentMetric, EVIInputSnapshot, TopMover, EVIAttributionEvent } from './types';

// ============================================
// PR PROVIDER - Visibility & Authority inputs
// ============================================

export interface PRInputData {
  citations: {
    platform: string;
    count: number;
    quality_score: number;
  }[];
  press_mentions: {
    tier: 'T1' | 'T2' | 'T3';
    count: number;
    outlet: string;
  }[];
  journalist_matches: {
    journalist_id: string;
    match_score: number;
    coverage_count: number;
  }[];
}

/**
 * Transform PR data into EVI Visibility components
 */
export function prToVisibilityComponents(data: PRInputData | null): EVIComponentMetric[] {
  if (!data) {
    return getDefaultVisibilityComponents();
  }

  // AI Answer Presence (from citations)
  const totalCitations = data.citations.reduce((sum, c) => sum + c.count, 0);
  const aiPresence = Math.min(totalCitations * 2, 100); // Scale: 50 citations = 100%

  // Press Mention Coverage (weighted by tier)
  const pressScore = data.press_mentions.reduce((sum, m) => {
    const weight = m.tier === 'T1' ? 3 : m.tier === 'T2' ? 2 : 1;
    return sum + m.count * weight;
  }, 0);
  const pressCoverage = Math.min(pressScore * 2, 100); // Scale: 50 weighted mentions = 100

  return [
    {
      id: 'm_ai_presence',
      label: 'AI Answer Presence',
      value: Math.round(aiPresence),
      max_value: 100,
      weight: 0.35,
      source: 'pr',
    },
    {
      id: 'm_press_coverage',
      label: 'Press Mention Coverage',
      value: Math.round(pressCoverage),
      max_value: 100,
      weight: 0.25,
      source: 'pr',
    },
  ];
}

/**
 * Transform PR data into EVI Authority components
 */
export function prToAuthorityComponents(data: PRInputData | null): EVIComponentMetric[] {
  if (!data) {
    return getDefaultAuthorityComponents();
  }

  // Citation Quality Score (avg of citation quality)
  const avgCitationQuality = data.citations.length > 0
    ? data.citations.reduce((sum, c) => sum + c.quality_score, 0) / data.citations.length
    : 50;

  // Journalist Match Strength
  const avgMatchScore = data.journalist_matches.length > 0
    ? data.journalist_matches.reduce((sum, j) => sum + j.match_score, 0) / data.journalist_matches.length
    : 50;

  return [
    {
      id: 'm_citation_quality',
      label: 'Citation Quality Score',
      value: Math.round(avgCitationQuality),
      max_value: 100,
      weight: 0.30,
      source: 'pr',
    },
    {
      id: 'm_journalist_match',
      label: 'Journalist Match Strength',
      value: Math.round(avgMatchScore),
      max_value: 100,
      weight: 0.20,
      source: 'pr',
    },
  ];
}

// ============================================
// SEO PROVIDER - Visibility & Authority inputs
// ============================================

export interface SEOInputData {
  serp_coverage: {
    keyword: string;
    position: number;
    has_featured_snippet: boolean;
  }[];
  domain_authority: number;
  structured_data_coverage: number; // 0-100%
  backlinks: {
    domain: string;
    authority: number;
  }[];
  technical_issues: {
    fixed: number;
    total: number;
  };
}

/**
 * Transform SEO data into EVI Visibility components
 */
export function seoToVisibilityComponents(data: SEOInputData | null): EVIComponentMetric[] {
  if (!data) {
    return [
      { id: 'm_serp_coverage', label: 'Topic SERP Coverage', value: 45, max_value: 100, weight: 0.25, source: 'seo' },
      { id: 'm_featured_snippets', label: 'Featured Snippets', value: 12, max_value: 50, weight: 0.15, source: 'seo' },
    ];
  }

  // Topic SERP Coverage (% of keywords in top 10)
  const top10Keywords = data.serp_coverage.filter(k => k.position <= 10).length;
  const serpCoverage = data.serp_coverage.length > 0
    ? (top10Keywords / data.serp_coverage.length) * 100
    : 0;

  // Featured Snippets count
  const snippetCount = data.serp_coverage.filter(k => k.has_featured_snippet).length;

  return [
    {
      id: 'm_serp_coverage',
      label: 'Topic SERP Coverage',
      value: Math.round(serpCoverage),
      max_value: 100,
      weight: 0.25,
      source: 'seo',
    },
    {
      id: 'm_featured_snippets',
      label: 'Featured Snippets',
      value: snippetCount,
      max_value: 50,
      weight: 0.15,
      source: 'seo',
    },
  ];
}

/**
 * Transform SEO data into EVI Authority components
 */
export function seoToAuthorityComponents(data: SEOInputData | null): EVIComponentMetric[] {
  if (!data) {
    return [
      { id: 'm_domain_authority', label: 'Referring Domain Authority', value: 58, max_value: 100, weight: 0.25, source: 'seo' },
      { id: 'm_structured_data', label: 'Structured Data Coverage', value: 48, max_value: 100, weight: 0.15, source: 'seo' },
    ];
  }

  // Weighted average backlink authority
  const avgBacklinkAuthority = data.backlinks.length > 0
    ? data.backlinks.reduce((sum, b) => sum + b.authority, 0) / data.backlinks.length
    : data.domain_authority;

  return [
    {
      id: 'm_domain_authority',
      label: 'Referring Domain Authority',
      value: Math.round(avgBacklinkAuthority),
      max_value: 100,
      weight: 0.25,
      source: 'seo',
    },
    {
      id: 'm_structured_data',
      label: 'Structured Data Coverage',
      value: Math.round(data.structured_data_coverage),
      max_value: 100,
      weight: 0.15,
      source: 'seo',
    },
  ];
}

// ============================================
// CONTENT PROVIDER - Momentum inputs
// ============================================

export interface ContentInputData {
  content_velocity: {
    brand_pieces_per_week: number;
    competitor_avg_per_week: number;
  };
  topic_coverage: {
    topic: string;
    growth_rate: number; // % growth in coverage
  }[];
  freshness: {
    updated_within_30d: number;
    total_pieces: number;
  };
}

/**
 * Transform Content data into EVI Momentum components
 */
export function contentToMomentumComponents(data: ContentInputData | null): EVIComponentMetric[] {
  if (!data) {
    return getDefaultMomentumComponents();
  }

  // Content Velocity vs Competitors
  const velocityRatio = data.content_velocity.competitor_avg_per_week > 0
    ? data.content_velocity.brand_pieces_per_week / data.content_velocity.competitor_avg_per_week
    : 1;

  // Topic Growth Rate (avg across topics)
  const avgTopicGrowth = data.topic_coverage.length > 0
    ? data.topic_coverage.reduce((sum, t) => sum + t.growth_rate, 0) / data.topic_coverage.length
    : 0;

  return [
    {
      id: 'm_content_velocity',
      label: 'Content Velocity vs Competitors',
      value: Math.round(velocityRatio * 100) / 100,
      max_value: 2,
      weight: 0.20,
      source: 'content',
    },
    {
      id: 'm_topic_growth',
      label: 'Topic Growth Rate',
      value: Math.round(avgTopicGrowth),
      max_value: 100,
      weight: 0.15,
      source: 'content',
    },
  ];
}

// ============================================
// DEFAULT/MOCK DATA GENERATORS
// ============================================

function getDefaultVisibilityComponents(): EVIComponentMetric[] {
  return [
    { id: 'm_ai_presence', label: 'AI Answer Presence', value: 24, max_value: 100, weight: 0.35, source: 'pr' },
    { id: 'm_press_coverage', label: 'Press Mention Coverage', value: 78, max_value: 100, weight: 0.25, source: 'pr' },
    { id: 'm_serp_coverage', label: 'Topic SERP Coverage', value: 45, max_value: 100, weight: 0.25, source: 'seo' },
    { id: 'm_featured_snippets', label: 'Featured Snippets', value: 12, max_value: 50, weight: 0.15, source: 'seo' },
  ];
}

function getDefaultAuthorityComponents(): EVIComponentMetric[] {
  return [
    { id: 'm_citation_quality', label: 'Citation Quality Score', value: 71, max_value: 100, weight: 0.30, source: 'pr' },
    { id: 'm_domain_authority', label: 'Referring Domain Authority', value: 58, max_value: 100, weight: 0.25, source: 'seo' },
    { id: 'm_journalist_match', label: 'Journalist Match Strength', value: 82, max_value: 100, weight: 0.20, source: 'pr' },
    { id: 'm_structured_data', label: 'Structured Data Coverage', value: 48, max_value: 100, weight: 0.15, source: 'seo' },
  ];
}

function getDefaultMomentumComponents(): EVIComponentMetric[] {
  return [
    { id: 'm_citation_velocity', label: 'Citation Velocity (WoW)', value: 17, max_value: 100, weight: 0.30, source: 'pr' },
    { id: 'm_sov_change', label: 'Share of Voice Change', value: -2, max_value: 100, weight: 0.25, source: 'pr' },
    { id: 'm_content_velocity', label: 'Content Velocity vs Competitors', value: 0.8, max_value: 2, weight: 0.20, source: 'content' },
    { id: 'm_topic_growth', label: 'Topic Growth Rate', value: 34, max_value: 100, weight: 0.15, source: 'content' },
  ];
}

/**
 * Compute driver score from components
 */
function computeDriverScore(components: EVIComponentMetric[]): number {
  let score = 0;
  for (const component of components) {
    const normalized = (component.value / component.max_value) * 100;
    score += normalized * component.weight;
  }
  return Math.round(score * 10) / 10;
}

/**
 * Generate mock EVI input snapshot
 * Used when real data is unavailable (feature flag fallback)
 */
export function generateMockEVISnapshot(orgId: string): EVIInputSnapshot {
  const visibilityComponents = getDefaultVisibilityComponents();
  const authorityComponents = getDefaultAuthorityComponents();
  const momentumComponents = getDefaultMomentumComponents();

  const now = new Date();

  return {
    generated_at: now.toISOString(),
    org_id: orgId,
    visibility: {
      type: 'visibility',
      score: computeDriverScore(visibilityComponents),
      confidence: 0.85,
      components: visibilityComponents,
      delta_7d: 5.2,
      delta_30d: 12.1,
      updated_at: now.toISOString(),
    },
    authority: {
      type: 'authority',
      score: computeDriverScore(authorityComponents),
      confidence: 0.82,
      components: authorityComponents,
      delta_7d: 2.1,
      delta_30d: 6.4,
      updated_at: now.toISOString(),
    },
    momentum: {
      type: 'momentum',
      score: computeDriverScore(momentumComponents),
      confidence: 0.78,
      components: momentumComponents,
      delta_7d: 4.8,
      delta_30d: 8.9,
      updated_at: now.toISOString(),
    },
    historical_scores: [
      { date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), score: 54.2 },
      { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), score: 56.8 },
      { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), score: 59.1 },
      { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), score: 61.2 },
      { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), score: 63.3 },
      { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), score: 65.1 },
      { date: now.toISOString(), score: 67.4 },
    ],
  };
}

/**
 * Generate mock Top Movers for Strategy Panel
 */
export function generateMockTopMovers(): TopMover[] {
  return [
    {
      id: 'mover_techcrunch_citation',
      driver: 'visibility',
      delta_points: 2.4,
      reason: 'TechCrunch AI coverage mention drove +17% AI citations',
      evidence_type: 'citation',
      deep_link: {
        label: 'View in PR Coverage',
        href: '/app/pr/coverage?source=techcrunch',
      },
      action_id: 'act_01H8X9Y2Z3A4B5C6D7E8F9G0',
      pillar: 'pr',
      trend: 'up',
    },
    {
      id: 'mover_schema_fix',
      driver: 'authority',
      delta_points: 1.2,
      reason: 'Schema markup deployed on 12 product pages',
      evidence_type: 'diff',
      deep_link: {
        label: 'View in SEO Command',
        href: '/app/seo/technical?filter=schema',
      },
      pillar: 'seo',
      trend: 'up',
    },
    {
      id: 'mover_content_velocity',
      driver: 'momentum',
      delta_points: 1.8,
      reason: 'Published 6 pieces this week vs competitor avg of 4',
      evidence_type: 'metric',
      deep_link: {
        label: 'View in Content Hub',
        href: '/app/content/calendar?period=7d',
      },
      pillar: 'content',
      trend: 'up',
    },
    {
      id: 'mover_sov_pressure',
      driver: 'momentum',
      delta_points: -0.8,
      reason: 'HubSpot increased PR activity, SOV declined 2%',
      evidence_type: 'metric',
      deep_link: {
        label: 'View Competitor Intel',
        href: '/app/intelligence/competitors?focus=hubspot',
      },
      pillar: 'pr',
      trend: 'down',
    },
  ];
}

/**
 * Generate mock Attribution Events
 */
export function generateMockAttributionEvents(): EVIAttributionEvent[] {
  const now = new Date();

  return [
    {
      id: 'attr_techcrunch_cite',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      driver: 'visibility',
      pillar: 'pr',
      delta_points: 2.4,
      reason: 'TechCrunch article mentioned EVI methodology, triggering AI model citations',
      evidence: [
        { type: 'citation', label: 'TechCrunch article', value: 'AI Marketing Tools Are Finally Delivering', url: 'https://techcrunch.com/ai-marketing-tools' },
        { type: 'metric', label: 'AI citation increase', value: '+17% in Claude/Perplexity' },
      ],
      deep_link: {
        label: 'View Coverage',
        href: '/app/pr/coverage?source=techcrunch',
      },
      action_id: 'act_01H8X9Y2Z3A4B5C6D7E8F9G0',
      confidence: 0.89,
    },
    {
      id: 'attr_schema_deploy',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      driver: 'authority',
      pillar: 'seo',
      delta_points: 1.2,
      reason: 'Deployed structured data on 12 product pages, improving AI comprehension',
      evidence: [
        { type: 'diff', label: 'Schema changes', value: '+12 pages with FAQ schema' },
        { type: 'metric', label: 'Validation status', value: '100% valid per Google' },
      ],
      deep_link: {
        label: 'View Technical',
        href: '/app/seo/technical?filter=schema',
      },
      confidence: 0.92,
    },
  ];
}
