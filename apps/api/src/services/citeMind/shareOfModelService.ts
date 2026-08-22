/**
 * Share of Model — CiteMind Engine 3 metric (SEO_AEO_PILLAR_CANON §4).
 *
 * Canon definition:
 *   Share of Model = (Brand AI Citations) / (Total AI Citations in Topic Domain) × 100
 *   Topic Share of Model = Brand / (Brand + Competitors)
 *
 * The "AI equivalent of Share of Voice" — the % of a topic's AI-answer citations
 * that go to the brand rather than its competitors, across monitored AI engines
 * (ChatGPT / Perplexity / Claude / Gemini).
 *
 * HONEST DATA: computed purely from real `citation_monitor_results` rows written
 * by the CiteMind citation monitor (Engine 3). There is NO fabricated fallback —
 * when the monitor has not yet sampled an org's topic queries, `available` is
 * false and `shareOfModel` is null. This is the code half of DECISIONS_LOG scope
 * item B5 ("Share-of-Model not existing in code"); it does NOT invent numbers.
 *
 * mention_type semantics (migration 83): a result row is a BRAND citation when
 * `brand_mentioned = true`; a COMPETITOR citation when `!brand_mentioned &&
 * mention_type = 'competitor'`. Rows that are neither (brand absent, no competitor
 * detected) are sampled-but-uncited and count only toward the query sample size.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** One monitored AI-answer result (subset of citation_monitor_results). */
export interface CitationResultRow {
  brand_mentioned: boolean;
  mention_type: string | null;
  query_topic: string | null;
}

export interface ShareOfModelTopic {
  topic: string;
  /** Brand / (Brand + Competitors) × 100 for this topic. */
  shareOfModel: number;
  brandCitations: number;
  competitorCitations: number;
}

export interface ShareOfModel {
  /** False when the monitor has produced no results for the org/period yet. */
  available: boolean;
  /** Overall Brand / (Brand + Competitors) × 100; null when no citations exist. */
  shareOfModel: number | null;
  /** Percentage-point change vs the previous period of equal length; null when unknown. */
  trendDelta: number | null;
  periodDays: number;
  brandCitations: number;
  competitorCitations: number;
  /** Total monitored answers sampled in the period (the query-sample size). */
  sampledQueries: number;
  /** Per-topic breakdown, highest brand share first. */
  topics: ShareOfModelTopic[];
}

function isBrand(r: CitationResultRow): boolean {
  return r.brand_mentioned === true;
}

function isCompetitor(r: CitationResultRow): boolean {
  return r.brand_mentioned !== true && r.mention_type === 'competitor';
}

/** Round to one decimal place (percentages are displayed to 0.1%). */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Overall Share of Model from a set of rows, or null when there are zero
 * brand+competitor citations (no basis to compute a share — do NOT return 0,
 * which would falsely imply "measured, and you have none").
 */
function overallShare(rows: CitationResultRow[]): number | null {
  let brand = 0;
  let competitor = 0;
  for (const r of rows) {
    if (isBrand(r)) brand++;
    else if (isCompetitor(r)) competitor++;
  }
  const denom = brand + competitor;
  if (denom === 0) return null;
  return round1((brand / denom) * 100);
}

/**
 * Pure computation — exported for testing. `current` and `previous` are the raw
 * result rows for the period and the immediately-preceding period of equal length.
 */
export function computeShareOfModel(
  current: CitationResultRow[],
  previous: CitationResultRow[],
  periodDays: number
): ShareOfModel {
  if (current.length === 0) {
    return {
      available: false,
      shareOfModel: null,
      trendDelta: null,
      periodDays,
      brandCitations: 0,
      competitorCitations: 0,
      sampledQueries: 0,
      topics: [],
    };
  }

  let brandCitations = 0;
  let competitorCitations = 0;
  const byTopic = new Map<string, { brand: number; competitor: number }>();

  for (const r of current) {
    const brand = isBrand(r);
    const competitor = isCompetitor(r);
    if (brand) brandCitations++;
    else if (competitor) competitorCitations++;

    const topic = (r.query_topic ?? '').trim();
    if (topic && (brand || competitor)) {
      const bucket = byTopic.get(topic) ?? { brand: 0, competitor: 0 };
      if (brand) bucket.brand++;
      else bucket.competitor++;
      byTopic.set(topic, bucket);
    }
  }

  const shareOfModel = overallShare(current);

  const prevShare = previous.length > 0 ? overallShare(previous) : null;
  const trendDelta =
    shareOfModel !== null && prevShare !== null
      ? round1(shareOfModel - prevShare)
      : null;

  const topics: ShareOfModelTopic[] = [...byTopic.entries()]
    .map(([topic, c]) => ({
      topic,
      brandCitations: c.brand,
      competitorCitations: c.competitor,
      shareOfModel: round1((c.brand / (c.brand + c.competitor)) * 100),
    }))
    .sort((a, b) => b.shareOfModel - a.shareOfModel);

  return {
    available: true,
    shareOfModel,
    trendDelta,
    periodDays,
    brandCitations,
    competitorCitations,
    sampledQueries: current.length,
    topics,
  };
}

/**
 * Read the org's monitored citations for the current + previous period and
 * compute Share of Model. Reads only real rows; returns the honest-empty shape
 * when the monitor has produced nothing.
 */
export async function getShareOfModel(
  supabase: SupabaseClient,
  orgId: string,
  periodDays = 30
): Promise<ShareOfModel> {
  const now = Date.now();
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const currentCutoff = new Date(now - periodMs).toISOString();
  const prevCutoff = new Date(now - 2 * periodMs).toISOString();

  const { data, error } = await supabase
    .from('citation_monitor_results')
    .select('brand_mentioned, mention_type, query_topic, monitored_at')
    .eq('org_id', orgId)
    .gte('monitored_at', prevCutoff)
    .order('monitored_at', { ascending: false });

  if (error || !data) {
    // Fail honest-empty rather than fabricating; the caller surfaces "no data".
    return computeShareOfModel([], [], periodDays);
  }

  const current: CitationResultRow[] = [];
  const previous: CitationResultRow[] = [];
  for (const row of data as (CitationResultRow & { monitored_at: string })[]) {
    if (row.monitored_at >= currentCutoff) current.push(row);
    else previous.push(row);
  }

  return computeShareOfModel(current, previous, periodDays);
}
