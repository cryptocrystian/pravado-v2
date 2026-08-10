/**
 * Content Signals Derivation Service (W2 — Content Insights)
 *
 * READ-ONLY. Derives aggregate + per-asset authority signals ON-THE-FLY from
 * the CiteMind scorer output that is genuinely populated (`citemind_scores`,
 * written by services/citeMind/citeMindQualityScorer.ts).
 *
 * HONESTY CONTRACT
 * ----------------
 * Migration 105 created `content_authority_signals`, but nothing writes it —
 * it is empty. This service NEVER reads or writes that table, and NEVER writes
 * anything at all. It only aggregates real scorer columns.
 *
 * Of the five Insights metrics, only two have a faithful producer:
 *   - citationEligibilityScore ← mean(citemind_scores.overall_score)
 *       The CiteMind scorer's documented purpose is to "predict whether AI
 *       engines will cite it"; overall_score IS the citation-eligibility score.
 *   - aiIngestionLikelihood    ← mean(citemind_scores.schema_markup_score)
 *       Schema markup (JSON-LD structured data) is the mechanism by which AI
 *       engines ingest and understand content; schema_markup_score is the one
 *       factor whose semantic domain is machine-ingestibility.
 *
 * The remaining three have NO faithful source column and are returned as
 * `null` (rendered as "Not available yet" — never 0, never a fabricated value):
 *   - authorityContributionScore  (no producer)
 *   - crossPillarImpact           (no producer)
 *   - competitiveAuthorityDelta   (no producer; the fabricated +2.1 was removed)
 *
 * Every query is org-scoped via an explicit `.eq('org_id', orgId)` filter.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DerivedAuthoritySignals {
  authorityContributionScore: number | null;
  citationEligibilityScore: number | null;
  aiIngestionLikelihood: number | null;
  crossPillarImpact: number | null;
  competitiveAuthorityDelta: number | null;
  measuredAt: string;
  scoredAssetCount: number;
}

export interface DerivedTopAsset {
  id: string;
  title: string;
  status: string;
  contentType: string;
  citationEligibilityScore: number | null;
  aiIngestionLikelihood: number | null;
  scoredAt: string;
}

export interface ContentSignalsPayload {
  signals: DerivedAuthoritySignals;
  topAssets: DerivedTopAsset[];
}

interface CiteMindScoreRow {
  content_item_id: string;
  overall_score: number | null;
  schema_markup_score: number | null;
  gate_status: string | null;
  scored_at: string;
}

interface ContentItemRow {
  id: string;
  title: string;
  status: string;
  content_type: string;
}

const TOP_ASSET_LIMIT = 5;

/**
 * Derive the org's aggregate authority signals + top assets from CiteMind
 * scores. Read-only; writes nothing.
 */
export async function deriveContentSignals(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignalsPayload> {
  const measuredAt = new Date().toISOString();

  // 1. Fetch all CiteMind scores for the org, newest first (org-scoped).
  const { data: scoreRows, error: scoreError } = await supabase
    .from('citemind_scores')
    .select(
      'content_item_id, overall_score, schema_markup_score, gate_status, scored_at'
    )
    .eq('org_id', orgId)
    .order('scored_at', { ascending: false });

  if (scoreError) {
    throw new Error(`Failed to load CiteMind scores: ${scoreError.message}`);
  }

  const rows = (scoreRows ?? []) as CiteMindScoreRow[];

  // 2. Dedupe to the latest score per content item (rows are desc by scored_at).
  const latestByItem = new Map<string, CiteMindScoreRow>();
  for (const row of rows) {
    if (!row.content_item_id) continue;
    if (!latestByItem.has(row.content_item_id)) {
      latestByItem.set(row.content_item_id, row);
    }
  }
  const latest = Array.from(latestByItem.values());

  // 3. Empty org (no scored content) → honest nulls, empty topAssets.
  if (latest.length === 0) {
    return {
      signals: emptySignals(measuredAt),
      topAssets: [],
    };
  }

  // 4. Aggregate the two honestly-derivable metrics.
  const citationEligibilityScore = averageRounded(
    latest.map((r) => r.overall_score)
  );
  const aiIngestionLikelihood = averageRounded(
    latest.map((r) => r.schema_markup_score)
  );

  // 5. Rank top assets by citation eligibility (overall_score), highest first.
  const ranked = latest
    .filter((r) => r.overall_score != null)
    .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
    .slice(0, TOP_ASSET_LIMIT);

  const topAssetIds = ranked.map((r) => r.content_item_id);

  // 6. Join to content_items for honest titles/status (org-scoped).
  const itemMeta = new Map<string, ContentItemRow>();
  if (topAssetIds.length > 0) {
    const { data: itemRows, error: itemError } = await supabase
      .from('content_items')
      .select('id, title, status, content_type')
      .eq('org_id', orgId)
      .in('id', topAssetIds);

    if (itemError) {
      throw new Error(`Failed to load content items: ${itemError.message}`);
    }

    for (const item of (itemRows ?? []) as ContentItemRow[]) {
      itemMeta.set(item.id, item);
    }
  }

  // Only surface assets we can honestly name (present + org-scoped).
  const topAssets: DerivedTopAsset[] = ranked
    .filter((r) => itemMeta.has(r.content_item_id))
    .map((r) => {
      const meta = itemMeta.get(r.content_item_id) as ContentItemRow;
      return {
        id: r.content_item_id,
        title: meta.title,
        status: meta.status,
        contentType: meta.content_type,
        citationEligibilityScore: roundOrNull(r.overall_score),
        aiIngestionLikelihood: roundOrNull(r.schema_markup_score),
        scoredAt: r.scored_at,
      };
    });

  return {
    signals: {
      authorityContributionScore: null, // no faithful producer
      citationEligibilityScore,
      aiIngestionLikelihood,
      crossPillarImpact: null, // no producer
      competitiveAuthorityDelta: null, // no producer (fabricated +2.1 removed)
      measuredAt,
      scoredAssetCount: latest.length,
    },
    topAssets,
  };
}

function emptySignals(measuredAt: string): DerivedAuthoritySignals {
  return {
    authorityContributionScore: null,
    citationEligibilityScore: null,
    aiIngestionLikelihood: null,
    crossPillarImpact: null,
    competitiveAuthorityDelta: null,
    measuredAt,
    scoredAssetCount: 0,
  };
}

function averageRounded(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const mean = nums.reduce((sum, v) => sum + v, 0) / nums.length;
  return Math.round(mean);
}

function roundOrNull(value: number | null): number | null {
  return value != null && !Number.isNaN(value) ? Math.round(value) : null;
}
