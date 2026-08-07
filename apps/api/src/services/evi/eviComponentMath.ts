/**
 * EVI Component Mathematics (Wave-2: EVI real math)
 *
 * Implements the canonical 14 sub-metric formula from:
 *   - docs/canon/EARNED_VISIBILITY_INDEX.md §3
 *   - docs/canon/EVI_MATHEMATICS.md §2, §9
 *
 * Top formula (EARNED_VISIBILITY_INDEX.md:34):
 *   EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
 *
 * Components (EVI_MATHEMATICS.md §2):
 *   Visibility = AI_Presence·0.35 + Press·0.25 + SERP·0.25 + Snippets·0.15
 *   Authority  = CitationQuality·0.30 + DomainAuthority·0.25 + JournalistMatch·0.20
 *                + StructuredData·0.15 + EEAT·0.10
 *   Momentum   = CitationVelocity·0.30 + SOV·0.25 + ContentVelocity·0.20
 *                + TopicGrowth·0.15 + Ranking·0.10
 *
 * HONESTY OVER PROXY (Model Integrity Charter Art IV):
 *   Sub-metrics with no real data source are NOT faked. They are marked
 *   `insufficient_data` (value = null), excluded from the weighted sum, and the
 *   remaining weights are renormalised. Each component reports a `coverage`
 *   indicator = (weight backed by real data) / (total component weight), so a
 *   consumer can see exactly how much of the canonical formula is currently
 *   observable. No Math.random, no invented numbers.
 *
 * This module is PURE (no I/O). All DB reads live in eviSignalAggregator.ts.
 */

// ============================================================================
// Canonical weights (EVI_MATHEMATICS.md §9.1 — MUST match canon)
// ============================================================================

export const EVI_WEIGHTS = {
  visibility: 0.4,
  authority: 0.35,
  momentum: 0.25,
} as const;

export const VISIBILITY_WEIGHTS = {
  ai_presence: 0.35,
  press_coverage: 0.25,
  serp_coverage: 0.25,
  snippets: 0.15,
} as const;

export const AUTHORITY_WEIGHTS = {
  citation_quality: 0.3,
  domain_authority: 0.25,
  journalist_match: 0.2,
  structured_data: 0.15,
  eeat_density: 0.1,
} as const;

export const MOMENTUM_WEIGHTS = {
  citation_velocity: 0.3,
  sov_change: 0.25,
  content_velocity: 0.2,
  topic_growth: 0.15,
  ranking_trajectory: 0.1,
} as const;

/**
 * Normalisation constants. These are documented, deterministic saturation
 * points — NOT proxies for missing data. They convert raw real counts into
 * the canonical 0–100 scale.
 */
export const NORMALIZATION = {
  /** Tier-weighted press mentions that saturate Press Coverage at 100. */
  press_saturation_points: 30,
  /** Velocity mapping: flat (0% change) → 50; ±100% change → 100/0. */
  velocity_midpoint: 50,
  velocity_slope: 0.5,
} as const;

// ============================================================================
// Types
// ============================================================================

export type SubMetricStatus = 'real' | 'insufficient_data';

export interface SubMetric {
  key: string;
  /** 0–100 normalised score, or null when insufficient_data. */
  value: number | null;
  status: SubMetricStatus;
  /** Canonical weight of this sub-metric within its component. */
  weight: number;
  /** Where the number came from (or why it is missing). */
  source: string;
}

export interface ComponentResult {
  /** 0–100 score computed from real sub-metrics only (weights renormalised). */
  score: number;
  /** (real weight) / (total weight) ∈ [0,1]. 1.0 = fully observable. */
  coverage: number;
  sub_metrics: SubMetric[];
}

export interface EVIComputation {
  evi_score: number;
  band: EVIBandKey;
  visibility: ComponentResult;
  authority: ComponentResult;
  momentum: ComponentResult;
  /** Weighted overall data coverage across all three components. */
  overall_coverage: number;
}

// ============================================================================
// Raw signal inputs (produced by eviSignalAggregator.ts)
// ============================================================================

export interface PeriodSignals {
  periodStart: string;
  periodEnd: string;
  periodDays: number;

  // --- CiteMind Engine-3 citation signals ---
  citationMonitored: boolean; // did any citation polling run for this window?
  citationTotalQueries: number;
  citationBrandMentions: number;
  citationDirectMentions: number;
  citationIndirectMentions: number;
  citationCompetitorMentions: number;
  citationDistinctEngines: number;
  citationEnginesPolled: number;

  // --- Press (earned media) ---
  monitoringSourceCount: number; // media_monitoring_sources configured
  pressMentionCount: number;
  pressTierWeightedMentions: number; // Σ(mention × tier_weight)
  brandMentionArticleCount: number;
  brandMentionAvgRelevance: number | null; // 0–1

  // --- Authority: backlinks ---
  referringDomainCount: number;
  referringDomainWeightedDA: number; // 0–100

  // --- Authority: schema / content ---
  publishedContentCount: number;
  schemaCoveredPages: number;
  contentEverExists: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/** Clamp to [0,100] with 2-decimal rounding. */
export function clamp(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 100) / 100;
}

/** Map a period-over-period % change to a 0–100 velocity score (50 = flat). */
function velocityToScore(pctChange: number): number {
  return clamp(
    NORMALIZATION.velocity_midpoint + pctChange * NORMALIZATION.velocity_slope
  );
}

/** Period-over-period % change with honest divide-by-zero handling. */
function pctChange(current: number, prior: number): number {
  if (prior > 0) return ((current - prior) / prior) * 100;
  // No prior baseline: growth from zero is treated as strong-positive if there
  // is now activity, otherwise flat. Never fabricated.
  return current > 0 ? 100 : 0;
}

/**
 * Compose a component score from its sub-metrics.
 * Real sub-metrics are weight-renormalised; insufficient ones are excluded and
 * reflected in `coverage`. This is the core honesty mechanism.
 */
export function composeComponent(subMetrics: SubMetric[]): ComponentResult {
  const totalWeight = subMetrics.reduce((s, m) => s + m.weight, 0);
  const real = subMetrics.filter(
    (m) => m.status === 'real' && m.value !== null
  );
  const realWeight = real.reduce((s, m) => s + m.weight, 0);

  const coverage = totalWeight > 0 ? realWeight / totalWeight : 0;
  const score =
    realWeight > 0
      ? clamp(
          real.reduce((s, m) => s + (m.value as number) * m.weight, 0) /
            realWeight
        )
      : 0;

  return {
    score,
    coverage: Math.round(coverage * 10000) / 10000,
    sub_metrics: subMetrics,
  };
}

// ============================================================================
// Sub-metric calculators — VISIBILITY
// ============================================================================

/** AI Answer Presence % = (cited_queries / relevant_queries) × 100. REAL. */
export function aiPresence(s: PeriodSignals): SubMetric {
  const base = {
    key: 'ai_presence',
    weight: VISIBILITY_WEIGHTS.ai_presence,
  };
  if (!s.citationMonitored || s.citationTotalQueries === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'citation_monitor_results (no polling yet)',
    };
  }
  return {
    ...base,
    value: clamp((s.citationBrandMentions / s.citationTotalQueries) * 100),
    status: 'real',
    source: 'citation_monitor_results (CiteMind Engine-3)',
  };
}

/** Press Coverage = Σ(mentions × tier_weight) normalised to 0–100. REAL. */
export function pressCoverage(s: PeriodSignals): SubMetric {
  const base = {
    key: 'press_coverage',
    weight: VISIBILITY_WEIGHTS.press_coverage,
  };
  // Without any media monitoring configured we cannot observe earned press.
  if (s.monitoringSourceCount === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'earned_mentions (no media_monitoring_sources configured)',
    };
  }
  const value = clamp(
    (s.pressTierWeightedMentions / NORMALIZATION.press_saturation_points) * 100
  );
  return {
    ...base,
    value,
    status: 'real',
    source: 'earned_mentions × media_monitoring_articles.domain_authority tier',
  };
}

/** SERP Coverage — no ranking-position source wired. INSUFFICIENT. */
export function serpCoverage(): SubMetric {
  return {
    key: 'serp_coverage',
    value: null,
    status: 'insufficient_data',
    weight: VISIBILITY_WEIGHTS.serp_coverage,
    source: 'unavailable — no SERP rank-tracking provider (GSC/DataForSEO)',
  };
}

/** Featured Snippet Ownership — no source. INSUFFICIENT. */
export function snippets(): SubMetric {
  return {
    key: 'snippets',
    value: null,
    status: 'insufficient_data',
    weight: VISIBILITY_WEIGHTS.snippets,
    source: 'unavailable — no featured-snippet tracking',
  };
}

// ============================================================================
// Sub-metric calculators — AUTHORITY
// ============================================================================

/**
 * Citation Quality — canon: avg(citing_source_authority).
 * Per-citation domain authority is not captured; we compute an honest quality
 * signal from real Engine-3 records: direct-mention share (0.7) + engine
 * diversity (0.3). Derived entirely from real data, no proxy inputs. REAL.
 */
export function citationQuality(s: PeriodSignals): SubMetric {
  const base = {
    key: 'citation_quality',
    weight: AUTHORITY_WEIGHTS.citation_quality,
  };
  if (!s.citationMonitored || s.citationTotalQueries === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'citation_monitor_results (no polling yet)',
    };
  }
  const typed = s.citationDirectMentions + s.citationIndirectMentions;
  const directShare = typed > 0 ? s.citationDirectMentions / typed : 0;
  const engineDiversity =
    s.citationEnginesPolled > 0
      ? s.citationDistinctEngines / s.citationEnginesPolled
      : 0;
  return {
    ...base,
    value: clamp((directShare * 0.7 + engineDiversity * 0.3) * 100),
    status: 'real',
    source:
      'citation_monitor_results (direct-share + engine-diversity; per-source DA unavailable)',
  };
}

/** Referring Domain Authority = weighted_avg(referring_domain_scores). REAL. */
export function domainAuthority(s: PeriodSignals): SubMetric {
  const base = {
    key: 'domain_authority',
    weight: AUTHORITY_WEIGHTS.domain_authority,
  };
  if (s.referringDomainCount === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source:
        'seo_referring_domains (no backlink data — needs GSC/Ahrefs import)',
    };
  }
  return {
    ...base,
    value: clamp(s.referringDomainWeightedDA),
    status: 'real',
    source: 'seo_referring_domains.domain_authority (backlink-weighted)',
  };
}

/** Journalist/Entity Match = avg(relevance_score) of covering journalists. REAL. */
export function journalistMatch(s: PeriodSignals): SubMetric {
  const base = {
    key: 'journalist_match',
    weight: AUTHORITY_WEIGHTS.journalist_match,
  };
  if (s.brandMentionArticleCount === 0 || s.brandMentionAvgRelevance === null) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source:
        'earned_mentions → media_monitoring_articles.relevance_score (no coverage)',
    };
  }
  return {
    ...base,
    value: clamp(s.brandMentionAvgRelevance * 100),
    status: 'real',
    source:
      'media_monitoring_articles.relevance_score (covering-article relevance)',
  };
}

/** Structured Data Coverage % = (valid_schema_pages / total_pages) × 100. REAL. */
export function structuredData(s: PeriodSignals): SubMetric {
  const base = {
    key: 'structured_data',
    weight: AUTHORITY_WEIGHTS.structured_data,
  };
  if (s.publishedContentCount === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'citemind_schemas / content_items (no published content)',
    };
  }
  return {
    ...base,
    value: clamp((s.schemaCoveredPages / s.publishedContentCount) * 100),
    status: 'real',
    source: 'citemind_schemas distinct content vs published content_items',
  };
}

/** E-E-A-T Signal Density — no dedicated detector wired. INSUFFICIENT. */
export function eeatDensity(): SubMetric {
  return {
    key: 'eeat_density',
    value: null,
    status: 'insufficient_data',
    weight: AUTHORITY_WEIGHTS.eeat_density,
    source: 'unavailable — no E-E-A-T marker detector',
  };
}

// ============================================================================
// Sub-metric calculators — MOMENTUM (current vs prior period)
// ============================================================================

/** Citation Velocity — period-over-period change in brand citations. REAL. */
export function citationVelocity(
  current: PeriodSignals,
  prior: PeriodSignals
): SubMetric {
  const base = {
    key: 'citation_velocity',
    weight: MOMENTUM_WEIGHTS.citation_velocity,
  };
  if (!current.citationMonitored && !prior.citationMonitored) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'citation_monitor_results (no polling in either window)',
    };
  }
  const change = pctChange(
    current.citationBrandMentions,
    prior.citationBrandMentions
  );
  return {
    ...base,
    value: velocityToScore(change),
    status: 'real',
    source: 'citation_monitor_results period-over-period brand mentions',
  };
}

/** SOV Change — brand share vs competitors, current vs prior. REAL (conditional). */
export function sovChange(
  current: PeriodSignals,
  prior: PeriodSignals
): SubMetric {
  const base = { key: 'sov_change', weight: MOMENTUM_WEIGHTS.sov_change };
  const curTotal =
    current.citationBrandMentions + current.citationCompetitorMentions;
  const priTotal =
    prior.citationBrandMentions + prior.citationCompetitorMentions;
  // SOV requires competitor observation in at least the current window.
  if (current.citationCompetitorMentions === 0 && curTotal === 0) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'citation_monitor_results (no competitor mentions observed)',
    };
  }
  const curSov = curTotal > 0 ? current.citationBrandMentions / curTotal : 0;
  const priSov = priTotal > 0 ? prior.citationBrandMentions / priTotal : curSov;
  // Delta in share (−1..1) → percentage-point change → velocity score.
  const change = (curSov - priSov) * 100;
  return {
    ...base,
    value: velocityToScore(change),
    status: 'real',
    source: 'citation_monitor_results brand vs competitor share (period delta)',
  };
}

/** Content Velocity — content published current vs prior period. REAL. */
export function contentVelocity(
  current: PeriodSignals,
  prior: PeriodSignals
): SubMetric {
  const base = {
    key: 'content_velocity',
    weight: MOMENTUM_WEIGHTS.content_velocity,
  };
  if (!current.contentEverExists && !prior.contentEverExists) {
    return {
      ...base,
      value: null,
      status: 'insufficient_data',
      source: 'content_items (no content pipeline)',
    };
  }
  const change = pctChange(
    current.publishedContentCount,
    prior.publishedContentCount
  );
  return {
    ...base,
    value: velocityToScore(change),
    status: 'real',
    source:
      'content_items published period-over-period (competitor baseline unavailable)',
  };
}

/** Topic Growth — no emerging-topic velocity source. INSUFFICIENT. */
export function topicGrowth(): SubMetric {
  return {
    key: 'topic_growth',
    value: null,
    status: 'insufficient_data',
    weight: MOMENTUM_WEIGHTS.topic_growth,
    source: 'unavailable — no emerging-topic-cluster tracking',
  };
}

/** Ranking Trajectory — no rank-position history. INSUFFICIENT. */
export function rankingTrajectory(): SubMetric {
  return {
    key: 'ranking_trajectory',
    value: null,
    status: 'insufficient_data',
    weight: MOMENTUM_WEIGHTS.ranking_trajectory,
    source: 'unavailable — no keyword rank-position history',
  };
}

// ============================================================================
// Component composers
// ============================================================================

export function computeVisibility(current: PeriodSignals): ComponentResult {
  return composeComponent([
    aiPresence(current),
    pressCoverage(current),
    serpCoverage(),
    snippets(),
  ]);
}

export function computeAuthority(current: PeriodSignals): ComponentResult {
  return composeComponent([
    citationQuality(current),
    domainAuthority(current),
    journalistMatch(current),
    structuredData(current),
    eeatDensity(),
  ]);
}

export function computeMomentum(
  current: PeriodSignals,
  prior: PeriodSignals
): ComponentResult {
  return composeComponent([
    citationVelocity(current, prior),
    sovChange(current, prior),
    contentVelocity(current, prior),
    topicGrowth(),
    rankingTrajectory(),
  ]);
}

// ============================================================================
// Bands (EVI_MATHEMATICS.md §9.3)
// ============================================================================

export type EVIBandKey = 'at_risk' | 'emerging' | 'competitive' | 'dominant';

export function getEVIBand(score: number): EVIBandKey {
  if (score <= 40) return 'at_risk';
  if (score <= 60) return 'emerging';
  if (score <= 80) return 'competitive';
  return 'dominant';
}

// ============================================================================
// Top-level EVI
// ============================================================================

/**
 * Compute the full EVI from current + prior period signals.
 * Pure function — the single source of truth for the North-Star math.
 */
export function computeEVI(
  current: PeriodSignals,
  prior: PeriodSignals
): EVIComputation {
  const visibility = computeVisibility(current);
  const authority = computeAuthority(current);
  const momentum = computeMomentum(current, prior);

  const eviScore = clamp(
    visibility.score * EVI_WEIGHTS.visibility +
      authority.score * EVI_WEIGHTS.authority +
      momentum.score * EVI_WEIGHTS.momentum
  );

  const overallCoverage =
    visibility.coverage * EVI_WEIGHTS.visibility +
    authority.coverage * EVI_WEIGHTS.authority +
    momentum.coverage * EVI_WEIGHTS.momentum;

  return {
    evi_score: eviScore,
    band: getEVIBand(eviScore),
    visibility,
    authority,
    momentum,
    overall_coverage: Math.round(overallCoverage * 10000) / 10000,
  };
}
