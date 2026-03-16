/**
 * SAGE SEO Signal Ingestor (Sprint S-INT-02)
 *
 * Scans SEO pillar data for actionable signals:
 * 1. Keywords with significant position drops (current_position rose > 5 spots)
 * 2. High-volume keywords where org ranks poorly (opportunity keywords)
 * 3. Keywords with no associated content (content gap)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('sage:seo-ingestor');

export interface SEOSignal {
  signal_type: string;
  source_table: string;
  source_id: string | null;
  signal_data: Record<string, unknown>;
  evi_impact_estimate: number;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expires_at: string | null;
}

/**
 * Ingest all SEO signals for a given org.
 */
export async function ingestSEOSignals(
  supabase: SupabaseClient,
  orgId: string
): Promise<SEOSignal[]> {
  const signals: SEOSignal[] = [];

  const [positionDrops, opportunityKeywords, contentGaps] = await Promise.all([
    findPositionDrops(supabase, orgId),
    findOpportunityKeywords(supabase, orgId),
    findKeywordContentGaps(supabase, orgId),
  ]);

  signals.push(...positionDrops, ...opportunityKeywords, ...contentGaps);
  logger.info(`SEO ingestor found ${signals.length} signals for org ${orgId}`);
  return signals;
}

/**
 * Signal 1: Keywords with significant position drops.
 * Where current_position > target_position by 5+ spots, indicating regression.
 */
async function findPositionDrops(
  supabase: SupabaseClient,
  orgId: string
): Promise<SEOSignal[]> {
  const { data: keywords } = await supabase
    .from('seo_keywords')
    .select('id, keyword, current_position, target_position, updated_at')
    .eq('org_id', orgId)
    .not('current_position', 'is', null)
    .not('target_position', 'is', null);

  if (!keywords?.length) return [];

  const signals: SEOSignal[] = [];
  for (const kw of keywords) {
    const drop = (kw.current_position ?? 0) - (kw.target_position ?? 0);
    if (drop > 5) {
      signals.push({
        signal_type: 'seo_position_drop',
        source_table: 'seo_keywords',
        source_id: kw.id,
        signal_data: {
          keyword: kw.keyword,
          current_position: kw.current_position,
          target_position: kw.target_position,
          position_gap: drop,
          last_checked: kw.updated_at,
        },
        evi_impact_estimate: 3.5,
        confidence: 0.75,
        priority: drop > 20 ? 'critical' : 'high',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return signals;
}

/**
 * Signal 2: High-volume keywords where the org ranks poorly.
 * Keywords with high search_volume in seo_keyword_metrics but current_position > 20.
 */
async function findOpportunityKeywords(
  supabase: SupabaseClient,
  orgId: string
): Promise<SEOSignal[]> {
  // Get keywords with poor positions
  const { data: poorKeywords } = await supabase
    .from('seo_keywords')
    .select('id, keyword, current_position')
    .eq('org_id', orgId)
    .gt('current_position', 20);

  if (!poorKeywords?.length) return [];

  const keywordIds = poorKeywords.map((k) => k.id);

  // Get metrics for these keywords — find high volume ones
  const { data: metrics } = await supabase
    .from('seo_keyword_metrics')
    .select('keyword_id, search_volume, difficulty, click_through_rate')
    .in('keyword_id', keywordIds)
    .gt('search_volume', 1000);

  if (!metrics?.length) return [];

  const keywordMap = new Map(poorKeywords.map((k) => [k.id, k]));

  return metrics.map((m) => {
    const kw = keywordMap.get(m.keyword_id);
    return {
      signal_type: 'seo_opportunity_keyword',
      source_table: 'seo_keyword_metrics',
      source_id: m.keyword_id,
      signal_data: {
        keyword: kw?.keyword ?? 'Unknown',
        current_position: kw?.current_position,
        search_volume: m.search_volume,
        difficulty: m.difficulty,
        click_through_rate: m.click_through_rate,
      },
      evi_impact_estimate: 4.5,
      confidence: 0.6,
      priority: (m.search_volume > 5000 ? 'high' : 'medium') as 'high' | 'medium',
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}

/**
 * Signal 3: Keywords with no associated content.
 * seo_keywords that have no linked content_item (content gap).
 */
async function findKeywordContentGaps(
  supabase: SupabaseClient,
  orgId: string
): Promise<SEOSignal[]> {
  // seo_keywords without a content_item link
  // The seo_keywords table doesn't have content_item_id,
  // so we check via content_topics for keyword matches
  const { data: keywords } = await supabase
    .from('seo_keywords')
    .select('id, keyword, current_position, target_position')
    .eq('org_id', orgId)
    .not('target_position', 'is', null)
    .lt('target_position', 10);

  if (!keywords?.length) return [];

  // Get all content topic names for this org
  const { data: topics } = await supabase
    .from('content_topics')
    .select(`
      name,
      content_items!inner (org_id)
    `)
    .eq('content_items.org_id', orgId);

  const topicNames = new Set(
    (topics ?? []).map((t) => (t.name ?? '').toLowerCase())
  );

  // Keywords with targets but no matching topic
  const signals: SEOSignal[] = [];
  for (const kw of keywords) {
    if (!topicNames.has((kw.keyword ?? '').toLowerCase())) {
      signals.push({
        signal_type: 'seo_content_gap',
        source_table: 'seo_keywords',
        source_id: kw.id,
        signal_data: {
          keyword: kw.keyword,
          current_position: kw.current_position,
          target_position: kw.target_position,
        },
        evi_impact_estimate: 3.0,
        confidence: 0.55,
        priority: 'medium',
        expires_at: null,
      });
    }
  }

  return signals;
}
