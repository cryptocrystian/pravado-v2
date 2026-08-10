/**
 * Content Signals Read Service (W2 — Content Insights)
 *
 * READ-ONLY. Serves the org's Authority Signals FROM the persisted
 * `content_authority_signals` table (written by authoritySignalsService.ts on
 * CiteMind scoring completion, per AUTHORITY_SIGNALS_MODEL.md / D038). It does
 * NOT re-derive anything on the fly and NEVER writes.
 *
 * HONESTY CONTRACT
 * ----------------
 * - Four signals carry real persisted values: authorityContributionScore,
 *   citationEligibilityScore, aiIngestionLikelihood, crossPillarImpact.
 * - competitiveAuthorityDelta is DATA-GATED (DataForSEO not provisioned) and is
 *   ALWAYS returned null — regardless of the stored numeric(5,2) DEFAULT 0 the
 *   migration forces — so the UI renders "Not available yet", never 0.
 * - Empty org (no scored content) → all metrics null, scoredAssetCount 0.
 *
 * Every query is org-scoped via an explicit `.eq('org_id', orgId)` filter.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthoritySignalsAggregate {
  authorityContributionScore: number | null;
  citationEligibilityScore: number | null;
  aiIngestionLikelihood: number | null;
  /** EVI points (not 0–100). */
  crossPillarImpact: number | null;
  /** DATA-GATED — always null (never estimated/faked). */
  competitiveAuthorityDelta: number | null;
  /** Most recent measurement timestamp across the org's assets. */
  measuredAt: string | null;
  /** Distinct assets with at least one persisted signals row (0 = empty). */
  scoredAssetCount: number;
}

export interface AuthoritySignalTopAsset {
  id: string;
  title: string;
  status: string;
  contentType: string;
  authorityContributionScore: number | null;
  citationEligibilityScore: number | null;
  aiIngestionLikelihood: number | null;
  crossPillarImpact: number | null;
  measuredAt: string;
}

export interface ContentSignalsPayload {
  signals: AuthoritySignalsAggregate;
  topAssets: AuthoritySignalTopAsset[];
}

interface AuthoritySignalRow {
  asset_id: string;
  authority_contribution_score: number | null;
  citation_eligibility_score: number | null;
  ai_ingestion_likelihood: number | null;
  cross_pillar_impact: number | null;
  measured_at: string;
}

interface ContentItemRow {
  id: string;
  title: string;
  status: string;
  content_type: string;
}

const TOP_ASSET_LIMIT = 5;

/**
 * Read the org's aggregate Authority Signals + top assets from
 * content_authority_signals. Read-only; writes nothing.
 */
export async function readContentSignals(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignalsPayload> {
  // 1. Fetch all persisted signals rows for the org, newest first (org-scoped).
  const { data: signalRows, error: signalError } = await supabase
    .from('content_authority_signals')
    .select(
      'asset_id, authority_contribution_score, citation_eligibility_score, ai_ingestion_likelihood, cross_pillar_impact, measured_at'
    )
    .eq('org_id', orgId)
    .order('measured_at', { ascending: false });

  if (signalError) {
    throw new Error(`Failed to load authority signals: ${signalError.message}`);
  }

  const rows = (signalRows ?? []) as AuthoritySignalRow[];

  // 2. Dedupe to the latest row per asset (rows are desc by measured_at).
  const latestByAsset = new Map<string, AuthoritySignalRow>();
  for (const row of rows) {
    if (!row.asset_id) continue;
    if (!latestByAsset.has(row.asset_id)) {
      latestByAsset.set(row.asset_id, row);
    }
  }
  const latest = Array.from(latestByAsset.values());

  // 3. Empty org → honest nulls.
  if (latest.length === 0) {
    return { signals: emptySignals(), topAssets: [] };
  }

  // 4. Aggregate the four real signals (means across latest-per-asset rows).
  const measuredAt = latest.reduce<string | null>((max, r) => {
    if (!max || r.measured_at > max) return r.measured_at;
    return max;
  }, null);

  const signals: AuthoritySignalsAggregate = {
    authorityContributionScore: averageRounded(
      latest.map((r) => r.authority_contribution_score)
    ),
    citationEligibilityScore: averageRounded(
      latest.map((r) => r.citation_eligibility_score)
    ),
    aiIngestionLikelihood: averageRounded(
      latest.map((r) => r.ai_ingestion_likelihood)
    ),
    crossPillarImpact: averageRounded(
      latest.map((r) => r.cross_pillar_impact),
      2
    ),
    // DATA-GATED — never surface the stored DEFAULT 0; always null.
    competitiveAuthorityDelta: null,
    measuredAt,
    scoredAssetCount: latest.length,
  };

  // 5. Rank top assets by authority contribution, highest first.
  const ranked = latest
    .filter((r) => r.authority_contribution_score != null)
    .sort(
      (a, b) =>
        (b.authority_contribution_score ?? 0) -
        (a.authority_contribution_score ?? 0)
    )
    .slice(0, TOP_ASSET_LIMIT);

  const topAssetIds = ranked.map((r) => r.asset_id);

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
  const topAssets: AuthoritySignalTopAsset[] = ranked
    .filter((r) => itemMeta.has(r.asset_id))
    .map((r) => {
      const meta = itemMeta.get(r.asset_id) as ContentItemRow;
      return {
        id: r.asset_id,
        title: meta.title,
        status: meta.status,
        contentType: meta.content_type,
        authorityContributionScore: roundOrNull(r.authority_contribution_score),
        citationEligibilityScore: roundOrNull(r.citation_eligibility_score),
        aiIngestionLikelihood: roundOrNull(r.ai_ingestion_likelihood),
        crossPillarImpact: roundOrNull(r.cross_pillar_impact, 2),
        measuredAt: r.measured_at,
      };
    });

  return { signals, topAssets };
}

function emptySignals(): AuthoritySignalsAggregate {
  return {
    authorityContributionScore: null,
    citationEligibilityScore: null,
    aiIngestionLikelihood: null,
    crossPillarImpact: null,
    competitiveAuthorityDelta: null,
    measuredAt: null,
    scoredAssetCount: 0,
  };
}

function averageRounded(
  values: Array<number | null>,
  decimals = 0
): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const mean = nums.reduce((sum, v) => sum + v, 0) / nums.length;
  const factor = 10 ** decimals;
  return Math.round(mean * factor) / factor;
}

function roundOrNull(value: number | null, decimals = 0): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
