/**
 * SAGE Content Signal Ingestor (Sprint S-INT-02)
 *
 * Scans Content pillar data for actionable signals:
 * 1. Draft content items stale > 14 days (not progressing)
 * 2. Published content with low quality scores (needs improvement)
 * 3. Content topics with no associated published content (coverage gaps)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('sage:content-ingestor');

export interface ContentSignal {
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
 * Ingest all Content signals for a given org.
 */
export async function ingestContentSignals(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignal[]> {
  const signals: ContentSignal[] = [];

  const [staleDrafts, lowQuality, coverageGaps] = await Promise.all([
    findStaleDrafts(supabase, orgId),
    findLowQualityPublished(supabase, orgId),
    findContentCoverageGaps(supabase, orgId),
  ]);

  signals.push(...staleDrafts, ...lowQuality, ...coverageGaps);
  logger.info(`Content ingestor found ${signals.length} signals for org ${orgId}`);
  return signals;
}

/**
 * Signal 1: Draft content items stale > 14 days.
 * Content items stuck in 'draft' status with no recent updates.
 */
async function findStaleDrafts(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignal[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleDrafts } = await supabase
    .from('content_items')
    .select('id, title, status, updated_at, created_at')
    .eq('org_id', orgId)
    .eq('status', 'draft')
    .lt('updated_at', fourteenDaysAgo);

  if (!staleDrafts?.length) return [];

  return staleDrafts.map((item) => ({
    signal_type: 'content_stale_draft',
    source_table: 'content_items',
    source_id: item.id,
    signal_data: {
      title: item.title,
      status: item.status,
      last_updated: item.updated_at,
      created_at: item.created_at,
      days_stale: Math.floor(
        (Date.now() - new Date(item.updated_at).getTime()) / (24 * 60 * 60 * 1000)
      ),
    },
    evi_impact_estimate: 1.5,
    confidence: 0.85,
    priority: 'medium' as const,
    expires_at: null,
  }));
}

/**
 * Signal 2: Published content with low quality scores.
 * content_quality_scores with score < 50 on published content.
 */
async function findLowQualityPublished(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignal[]> {
  // Get published content items
  const { data: publishedItems } = await supabase
    .from('content_items')
    .select('id, title')
    .eq('org_id', orgId)
    .eq('status', 'published');

  if (!publishedItems?.length) return [];

  const publishedIds = publishedItems.map((i) => i.id);
  const publishedMap = new Map(publishedItems.map((i) => [i.id, i.title]));

  // Get quality scores for published content
  const { data: qualityScores } = await supabase
    .from('content_quality_scores')
    .select('id, content_item_id, score, updated_at')
    .in('content_item_id', publishedIds)
    .lt('score', 50);

  if (!qualityScores?.length) return [];

  return qualityScores.map((qs) => ({
    signal_type: 'content_low_quality',
    source_table: 'content_quality_scores',
    source_id: qs.id,
    signal_data: {
      content_item_id: qs.content_item_id,
      title: publishedMap.get(qs.content_item_id) ?? 'Unknown',
      quality_score: qs.score,
      scored_at: qs.updated_at,
    },
    evi_impact_estimate: 3.0,
    confidence: 0.8,
    priority: 'high' as const,
    expires_at: null,
  }));
}

/**
 * Signal 3: Content topics with no published content.
 * Topics that exist but have no published content_items associated.
 */
async function findContentCoverageGaps(
  supabase: SupabaseClient,
  orgId: string
): Promise<ContentSignal[]> {
  // Get all content topics for this org
  const { data: topics } = await supabase
    .from('content_topics')
    .select(`
      id,
      name,
      content_item_id,
      content_items!inner (id, org_id, status)
    `)
    .eq('content_items.org_id', orgId);

  if (!topics?.length) return [];

  // Find topics where the linked content is not published
  const unpublishedTopics = topics.filter((t) => {
    const item = t.content_items as unknown as { status: string } | null;
    return item && item.status !== 'published';
  });

  // Deduplicate by topic name
  const seenTopics = new Set<string>();
  const signals: ContentSignal[] = [];

  for (const topic of unpublishedTopics) {
    if (seenTopics.has(topic.name)) continue;
    seenTopics.add(topic.name);

    signals.push({
      signal_type: 'content_coverage_gap',
      source_table: 'content_topics',
      source_id: topic.id,
      signal_data: {
        topic_name: topic.name,
        content_item_id: topic.content_item_id,
      },
      evi_impact_estimate: 2.0,
      confidence: 0.5,
      priority: 'low',
      expires_at: null,
    });
  }

  return signals;
}
