/**
 * AI Surface Monitor — CiteMind Engine 3 for the two AI SEARCH-SURFACE engines
 * (Google AI Overviews, Bing Copilot), sourced from DataForSEO's `ai_overview`.
 *
 * Parallel to citationMonitor.ts (which handles the chat engines). Same result
 * rows in citation_monitor_results, tagged engine='google_ai_overview' /
 * 'bing_copilot', so Share of Model (shareOfModelService) and the citation
 * summary fold them in automatically.
 *
 * Runs on a SEPARATE, configurable cadence (default daily) because each query
 * costs a real DataForSEO SERP call — see the citemind-ai-surface queue.
 *
 * HONEST-DATA: if DataForSEO creds are absent → no-op (no rows). If a query
 * returns no AI overview → a sampled row with brand_mentioned=false (counts as
 * a sampled answer, not a citation) — never fabricated.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  resolveAiOverviewProvider,
  type AiOverviewResult,
  type AiSurface,
} from './aiOverviewProvider';
import {
  createRouterClassifier,
  detectBrandMention,
  type BrandMentionContext,
} from './brandMentionDetector';
import { generateQueriesForOrg } from './citationQueryGenerator';
import { createLogger } from '../../lib/logger';

const logger = createLogger('citemind:ai-surface');

/** DB engine tag per surface (migration 117 CHECK values). */
const SURFACE_ENGINE: Record<AiSurface, string> = {
  google: 'google_ai_overview',
  bing: 'bing_copilot',
};

const SURFACES: AiSurface[] = ['google', 'bing'];

export interface AiSurfaceMonitorResult {
  total_queries: number;
  total_mentions: number;
  by_engine: Record<string, { queries: number; mentions: number }>;
  errors: string[];
}

/**
 * Flatten an AI overview into a single text blob for brand-mention detection.
 * Includes the cited sources (domain + title) so the deterministic domain match
 * fires when the brand is cited even if unnamed in the prose. Exported for tests.
 */
export function buildOverviewText(o: AiOverviewResult): string {
  const parts: string[] = [];
  if (o.summaryText) parts.push(o.summaryText);
  if (o.references.length > 0) {
    parts.push('\nSources:');
    for (const r of o.references) {
      parts.push(
        [r.title, r.domain, r.url, r.snippet].filter(Boolean).join(' — ')
      );
    }
  }
  return parts.join('\n');
}

/** Light dedup: has this org+engine+query been recorded within the window? */
async function recentlyRecorded(
  supabase: SupabaseClient,
  orgId: string,
  engine: string,
  queryPrompt: string,
  hours: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('citation_monitor_results')
    .select('id')
    .eq('org_id', orgId)
    .eq('engine', engine)
    .eq('query_prompt', queryPrompt)
    .gte('monitored_at', cutoff)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function monitorAiSurfaces(
  supabase: SupabaseClient,
  orgId: string,
  options: { dedupHours?: number } = {}
): Promise<AiSurfaceMonitorResult> {
  const result: AiSurfaceMonitorResult = {
    total_queries: 0,
    total_mentions: 0,
    by_engine: {
      google_ai_overview: { queries: 0, mentions: 0 },
      bing_copilot: { queries: 0, mentions: 0 },
    },
    errors: [],
  };

  const provider = resolveAiOverviewProvider();
  if (!provider) {
    logger.warn(
      `DataForSEO creds absent — skipping AI-surface monitor for org ${orgId}`
    );
    result.errors.push('DataForSEO credentials not configured');
    return result;
  }

  // Org identity + competitors for brand-mention detection (mirrors chat path).
  const { data: org } = await supabase
    .from('orgs')
    .select('name, domain')
    .eq('id', orgId)
    .single();
  const orgName = (org as { name?: string } | null)?.name?.trim() || 'Brand';
  const orgDomain = (org as { domain?: string } | null)?.domain ?? undefined;

  const { data: competitorRows } = await supabase
    .from('competitors')
    .select('name')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .limit(50);
  const competitorNames = (
    (competitorRows as Array<{ name?: string }> | null) ?? []
  )
    .map((c) => c.name)
    .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);

  const mentionContext: BrandMentionContext = {
    orgName,
    orgDomain,
    competitorNames,
  };
  const classifier = createRouterClassifier({
    anthropicApiKey:
      process.env.LLM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    supabase,
    orgId,
  });

  const queries = await generateQueriesForOrg(supabase, orgId);
  if (queries.length === 0) {
    result.errors.push('No topics/keywords configured');
    return result;
  }

  const dedupHours = options.dedupHours ?? 20;
  const jobId = `ai-surface-${orgId}-${Date.now()}`;

  for (const query of queries) {
    for (const surface of SURFACES) {
      const engine = SURFACE_ENGINE[surface];
      try {
        if (
          await recentlyRecorded(
            supabase,
            orgId,
            engine,
            query.prompt,
            dedupHours
          )
        ) {
          continue;
        }

        const overview = await provider.fetchAiOverview(surface, query.prompt);

        let brandMentioned = false;
        let mentionType: string | null = null;
        let citationUrl: string | null = null;
        let excerpt = '';

        if (overview.present) {
          const text = buildOverviewText(overview);
          excerpt = text.substring(0, 500);
          const mention = await detectBrandMention(
            text,
            mentionContext,
            classifier
          );
          brandMentioned = mention.brand_mentioned;
          mentionType = mention.mention_type;
          citationUrl = mention.citation_url ?? null;
        }

        await supabase.from('citation_monitor_results').insert({
          org_id: orgId,
          engine,
          query_prompt: query.prompt,
          query_topic: query.topic,
          response_excerpt: excerpt,
          brand_mentioned: brandMentioned,
          mention_type: mentionType,
          citation_url: citationUrl,
          job_id: jobId,
        });

        result.total_queries++;
        result.by_engine[engine].queries++;
        if (brandMentioned) {
          result.total_mentions++;
          result.by_engine[engine].mentions++;
        }
      } catch (error) {
        const msg = `${engine} error for "${query.topic}": ${
          error instanceof Error ? error.message : String(error)
        }`;
        logger.error(msg);
        result.errors.push(msg);
      }
    }
  }

  logger.info(
    `AI-surface monitor complete for org ${orgId}: queries=${result.total_queries}, mentions=${result.total_mentions}, errors=${result.errors.length}`
  );
  return result;
}
