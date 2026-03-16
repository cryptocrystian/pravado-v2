/**
 * EVI Signal Aggregator (Sprint S-INT-01)
 *
 * Pulls raw signals from all three pillars for a given org and period.
 * Each signal category maps to the EVI formula sub-scores:
 *   - Visibility (40%): PR pitch activity, journalist engagement
 *   - Authority (35%): Content quality scores, high-DA backlinks
 *   - Momentum (25%): Period-over-period delta on Visibility + Authority
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface VisibilitySignals {
  pitchesSent: number;
  pitchesOpened: number;
  pitchesReplied: number;
  avgJournalistDA: number;
  journalistCount: number;
  /** S-INT-05: Citation mention rate from AI engine polling (0–1) */
  citationMentionRate: number;
}

export interface AuthoritySignals {
  avgContentQuality: number;
  publishedContentCount: number;
  highDABacklinks: number;
  totalBacklinks: number;
}

export interface AggregatedSignals {
  visibility: VisibilitySignals;
  authority: AuthoritySignals;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
}

// ============================================================================
// Aggregator
// ============================================================================

/**
 * Aggregate visibility signals from the PR pillar for a given period.
 */
async function aggregateVisibilitySignals(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<VisibilitySignals> {
  // Count pitches by status in period
  const { data: pitches } = await supabase
    .from('pr_pitches')
    .select('id, status')
    .eq('org_id', orgId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const pitchesSent = pitches?.length ?? 0;
  const pitchesOpened = pitches?.filter((p: { status: string }) =>
    ['opened', 'replied', 'interested'].includes(p.status)
  ).length ?? 0;
  const pitchesReplied = pitches?.filter((p: { status: string }) =>
    ['replied', 'interested'].includes(p.status)
  ).length ?? 0;

  // Get journalist DA scores for journalists associated with this org
  const { data: journalists } = await supabase
    .from('journalist_profiles')
    .select('domain_authority')
    .eq('org_id', orgId);

  const journalistCount = journalists?.length ?? 0;
  const avgJournalistDA = journalistCount > 0
    ? (journalists!.reduce((sum: number, j: { domain_authority: number | null }) =>
        sum + (j.domain_authority ?? 0), 0) / journalistCount)
    : 0;

  // S-INT-05: Get citation mention rate from citation_summaries
  const { data: citationSummary } = await supabase
    .from('citation_summaries')
    .select('mention_rate')
    .eq('org_id', orgId)
    .eq('period_days', 30)
    .single();

  const citationMentionRate = citationSummary
    ? Number((citationSummary as { mention_rate: number | null }).mention_rate ?? 0)
    : 0;

  return {
    pitchesSent,
    pitchesOpened,
    pitchesReplied,
    avgJournalistDA,
    journalistCount,
    citationMentionRate,
  };
}

/**
 * Aggregate authority signals from Content and SEO pillars for a given period.
 */
async function aggregateAuthoritySignals(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<AuthoritySignals> {
  // Content quality scores for published content in period
  const { data: qualityScores } = await supabase
    .from('content_quality_scores')
    .select('overall_score, content_item_id')
    .eq('org_id', orgId)
    .gte('scored_at', periodStart)
    .lte('scored_at', periodEnd);

  const publishedContentCount = qualityScores?.length ?? 0;
  const avgContentQuality = publishedContentCount > 0
    ? (qualityScores!.reduce((sum: number, q: { overall_score: number | null }) =>
        sum + (q.overall_score ?? 0), 0) / publishedContentCount)
    : 0;

  // High-DA backlinks (DA > 40)
  const { count: highDABacklinks } = await supabase
    .from('seo_backlinks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gt('domain_authority', 40)
    .gte('discovered_at', periodStart)
    .lte('discovered_at', periodEnd);

  const { count: totalBacklinks } = await supabase
    .from('seo_backlinks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('discovered_at', periodStart)
    .lte('discovered_at', periodEnd);

  return {
    avgContentQuality,
    publishedContentCount,
    highDABacklinks: highDABacklinks ?? 0,
    totalBacklinks: totalBacklinks ?? 0,
  };
}

/**
 * Aggregate all signals for a given org and period.
 */
export async function aggregateSignals(
  supabase: SupabaseClient,
  orgId: string,
  periodDays: number = 30
): Promise<AggregatedSignals> {
  const periodEnd = new Date().toISOString();
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const [visibility, authority] = await Promise.all([
    aggregateVisibilitySignals(supabase, orgId, periodStart, periodEnd),
    aggregateAuthoritySignals(supabase, orgId, periodStart, periodEnd),
  ]);

  return {
    visibility,
    authority,
    periodStart,
    periodEnd,
    periodDays,
  };
}
