/**
 * EVI Signal Aggregator (Wave-2: EVI real math)
 *
 * Reads the REAL data sources for one period and produces a `PeriodSignals`
 * object consumed by the pure math in eviComponentMath.ts. No scoring logic
 * lives here — this file only extracts observable facts from the database.
 *
 * Source mapping (honest — see eviComponentMath.ts for insufficient_data rules):
 *   AI Presence / Citation Quality / Citation Velocity / SOV
 *        → citation_monitor_results  (CiteMind Engine-3)
 *   Press Coverage
 *        → earned_mentions × media_monitoring_articles.domain_authority (tier)
 *   Journalist Match
 *        → earned_mentions → media_monitoring_articles.relevance_score
 *   Domain Authority
 *        → seo_backlinks → seo_referring_domains.domain_authority
 *   Structured Data
 *        → citemind_schemas vs published content_items
 *   Content Velocity
 *        → content_items (published)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { PeriodSignals } from './eviComponentMath';

// ============================================================================
// Press tier weighting (EVI_MATHEMATICS.md §2.1: T1=3.0, T2=2.0, T3=1.0)
// Outlet tier is derived from the covering article's domain authority, the only
// real per-article authority signal available (media_monitoring_articles.domain_authority).
// ============================================================================

function tierWeightForDA(da: number | null | undefined): number {
  const v = Number(da ?? 0);
  if (v >= 70) return 3.0; // T1
  if (v >= 40) return 2.0; // T2
  return 1.0; // T3
}

const CITATION_ENGINES = ['chatgpt', 'perplexity', 'claude', 'gemini'] as const;

// ============================================================================
// Per-source aggregators
// ============================================================================

interface CitationAgg {
  citationMonitored: boolean;
  citationTotalQueries: number;
  citationBrandMentions: number;
  citationDirectMentions: number;
  citationIndirectMentions: number;
  citationCompetitorMentions: number;
  citationDistinctEngines: number;
  citationEnginesPolled: number;
}

async function aggregateCitations(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<CitationAgg> {
  const { data } = await supabase
    .from('citation_monitor_results')
    .select('engine, brand_mentioned, mention_type')
    .eq('org_id', orgId)
    .gte('monitored_at', periodStart)
    .lte('monitored_at', periodEnd);

  const rows = (data ?? []) as Array<{
    engine: string;
    brand_mentioned: boolean;
    mention_type: string | null;
  }>;

  const enginesPolled = new Set<string>();
  const enginesCiting = new Set<string>();
  let brand = 0;
  let direct = 0;
  let indirect = 0;
  let competitor = 0;

  for (const r of rows) {
    enginesPolled.add(r.engine);
    if (r.mention_type === 'competitor') {
      competitor += 1;
      continue;
    }
    if (r.brand_mentioned) {
      brand += 1;
      enginesCiting.add(r.engine);
      if (r.mention_type === 'direct') direct += 1;
      else if (r.mention_type === 'indirect') indirect += 1;
    }
  }

  return {
    citationMonitored: rows.length > 0,
    citationTotalQueries: rows.length,
    citationBrandMentions: brand,
    citationDirectMentions: direct,
    citationIndirectMentions: indirect,
    citationCompetitorMentions: competitor,
    citationDistinctEngines: enginesCiting.size,
    citationEnginesPolled: Math.max(
      enginesPolled.size,
      CITATION_ENGINES.length
    ),
  };
}

interface PressAgg {
  monitoringSourceCount: number;
  pressMentionCount: number;
  pressTierWeightedMentions: number;
  brandMentionArticleCount: number;
  brandMentionAvgRelevance: number | null;
}

async function aggregatePress(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<PressAgg> {
  const { count: monitoringSourceCount } = await supabase
    .from('media_monitoring_sources')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  // Brand earned mentions in period, joined to their article for DA + relevance.
  const { data } = await supabase
    .from('earned_mentions')
    .select(
      'id, entity_type, created_at, media_monitoring_articles(domain_authority, relevance_score)'
    )
    .eq('org_id', orgId)
    .eq('entity_type', 'brand')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const rows = (data ?? []) as Array<{
    media_monitoring_articles:
      | { domain_authority: number | null; relevance_score: number | null }
      | { domain_authority: number | null; relevance_score: number | null }[]
      | null;
  }>;

  let tierWeighted = 0;
  let relevanceSum = 0;
  let relevanceCount = 0;

  for (const r of rows) {
    // Supabase may return the joined row as object or single-element array.
    const article = Array.isArray(r.media_monitoring_articles)
      ? r.media_monitoring_articles[0]
      : r.media_monitoring_articles;
    tierWeighted += tierWeightForDA(article?.domain_authority);
    if (
      article &&
      article.relevance_score !== null &&
      article.relevance_score !== undefined
    ) {
      relevanceSum += Number(article.relevance_score);
      relevanceCount += 1;
    }
  }

  return {
    monitoringSourceCount: monitoringSourceCount ?? 0,
    pressMentionCount: rows.length,
    pressTierWeightedMentions: tierWeighted,
    brandMentionArticleCount: rows.length,
    brandMentionAvgRelevance:
      relevanceCount > 0 ? relevanceSum / relevanceCount : null,
  };
}

interface BacklinkAgg {
  referringDomainCount: number;
  referringDomainWeightedDA: number;
}

async function aggregateBacklinks(
  supabase: SupabaseClient,
  orgId: string
): Promise<BacklinkAgg> {
  // Referring-domain authority is a slow-moving profile, not period-bound.
  const { data } = await supabase
    .from('seo_referring_domains')
    .select('domain_authority, total_backlinks')
    .eq('org_id', orgId);

  const rows = (data ?? []) as Array<{
    domain_authority: number | null;
    total_backlinks: number | null;
  }>;

  if (rows.length === 0) {
    return { referringDomainCount: 0, referringDomainWeightedDA: 0 };
  }

  let weightSum = 0;
  let weightedDA = 0;
  for (const r of rows) {
    const weight = Math.max(Number(r.total_backlinks ?? 0), 1);
    weightSum += weight;
    weightedDA += Number(r.domain_authority ?? 0) * weight;
  }

  return {
    referringDomainCount: rows.length,
    referringDomainWeightedDA: weightSum > 0 ? weightedDA / weightSum : 0,
  };
}

interface ContentAgg {
  publishedContentCount: number;
  schemaCoveredPages: number;
  contentEverExists: boolean;
}

async function aggregateContent(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<ContentAgg> {
  // Published content in period (numerator base for schema coverage + velocity).
  const { data: published } = await supabase
    .from('content_items')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'published')
    .gte('published_at', periodStart)
    .lte('published_at', periodEnd);

  const publishedIds = new Set(
    (published ?? []).map((c: { id: string }) => c.id)
  );

  // Schema coverage: distinct published content items that have a schema.
  let schemaCoveredPages = 0;
  if (publishedIds.size > 0) {
    const { data: schemas } = await supabase
      .from('citemind_schemas')
      .select('content_item_id')
      .eq('org_id', orgId)
      .in('content_item_id', Array.from(publishedIds));
    const covered = new Set(
      (schemas ?? []).map((s: { content_item_id: string }) => s.content_item_id)
    );
    schemaCoveredPages = covered.size;
  }

  // Does the org have any content at all (for momentum insufficient_data gate)?
  const { count: anyContent } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  return {
    publishedContentCount: publishedIds.size,
    schemaCoveredPages,
    contentEverExists: (anyContent ?? 0) > 0,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Aggregate all real signals for a single [periodStart, periodEnd] window.
 */
export async function aggregatePeriodSignals(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<PeriodSignals> {
  const [citation, press, backlinks, content] = await Promise.all([
    aggregateCitations(supabase, orgId, periodStart, periodEnd),
    aggregatePress(supabase, orgId, periodStart, periodEnd),
    aggregateBacklinks(supabase, orgId),
    aggregateContent(supabase, orgId, periodStart, periodEnd),
  ]);

  const periodDays = Math.max(
    1,
    Math.round(
      (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  return {
    periodStart,
    periodEnd,
    periodDays,
    ...citation,
    ...press,
    ...backlinks,
    ...content,
  };
}
