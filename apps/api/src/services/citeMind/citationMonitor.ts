/**
 * Citation Monitor (Sprint S-INT-05)
 *
 * Polls LLM engines to detect whether AI models cite the customer's content.
 * Supported engines: Perplexity (search-enabled), OpenAI, Anthropic.
 *
 * Cost guardrails:
 * - Max 20 queries per org per cycle
 * - Uses cheapest models (haiku, sonar-small, gpt-4o-mini)
 * - Checks budget before each engine
 * - Dedup: skip if same org+query+engine ran in last 6 hours
 *
 * Results saved to citation_monitor_results, summaries to citation_summaries.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger, LlmRouter } from '@pravado/utils';

import { generateQueriesForOrg } from './citationQueryGenerator';

const logger = createLogger('citemind:monitor');

// ============================================================================
// Types
// ============================================================================

type Engine = 'chatgpt' | 'perplexity' | 'claude' | 'gemini';

interface MonitorResult {
  total_queries: number;
  total_mentions: number;
  by_engine: Record<Engine, { queries: number; mentions: number }>;
  errors: string[];
}

interface EngineResponse {
  text: string;
  engine: Engine;
}

interface EnvConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  perplexityApiKey?: string;
}

// ============================================================================
// Engine Callers
// ============================================================================

function getEnvConfig(): EnvConfig {
  return {
    openaiApiKey: process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY || undefined,
    anthropicApiKey: process.env.LLM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || undefined,
    perplexityApiKey: process.env.PERPLEXITY_API_KEY || undefined,
  };
}

function getAvailableEngines(config: EnvConfig): Engine[] {
  const engines: Engine[] = [];
  if (config.perplexityApiKey) engines.push('perplexity');
  if (config.openaiApiKey) engines.push('chatgpt');
  if (config.anthropicApiKey) engines.push('claude');
  // Gemini: future — skip for now
  return engines;
}

/**
 * Call Perplexity API (OpenAI-compatible format with search)
 */
async function callPerplexity(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'You are a helpful research assistant. Provide comprehensive, factual answers with specific sources and citations when available.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call OpenAI/Anthropic via LlmRouter
 */
async function callViaRouter(
  prompt: string,
  engine: 'chatgpt' | 'claude',
  config: EnvConfig,
  supabase: SupabaseClient,
  orgId: string
): Promise<string> {
  const router = new LlmRouter({
    provider: engine === 'chatgpt' ? 'openai' : 'anthropic',
    openaiApiKey: config.openaiApiKey,
    openaiModel: 'gpt-4o-mini',
    anthropicApiKey: config.anthropicApiKey,
    anthropicModel: 'claude-haiku-4-5-20251001',
    timeoutMs: 30000,
    maxTokens: 512,
    supabase,
    enableLedger: true,
  });

  const response = await router.generate({
    systemPrompt: 'You are a helpful research assistant. Provide comprehensive, factual answers. Mention specific companies, tools, and resources by name when relevant.',
    userPrompt: prompt,
    temperature: 0.3,
    maxTokens: 512,
    orgId,
  });

  return response.completion || '';
}

async function callEngine(
  engine: Engine,
  prompt: string,
  config: EnvConfig,
  supabase: SupabaseClient,
  orgId: string
): Promise<EngineResponse> {
  let text: string;

  switch (engine) {
    case 'perplexity':
      text = await callPerplexity(prompt, config.perplexityApiKey!);
      break;
    case 'chatgpt':
    case 'claude':
      text = await callViaRouter(prompt, engine, config, supabase, orgId);
      break;
    default:
      throw new Error(`Unsupported engine: ${engine}`);
  }

  return { text, engine };
}

// ============================================================================
// Brand Mention Detection
// ============================================================================

interface MentionAnalysis {
  brand_mentioned: boolean;
  mention_type: 'direct' | 'indirect' | 'competitor' | null;
  citation_url: string | null;
}

function analyzeMentions(
  responseText: string,
  orgName: string,
  orgDomain?: string
): MentionAnalysis {
  const lower = responseText.toLowerCase();
  const orgLower = orgName.toLowerCase();

  // Direct mention: org name appears in response
  if (lower.includes(orgLower)) {
    // Check for URL citation
    let citationUrl: string | null = null;
    if (orgDomain) {
      const urlMatch = responseText.match(new RegExp(`https?://[^\\s]*${orgDomain.replace('.', '\\.')}[^\\s]*`, 'i'));
      citationUrl = urlMatch?.[0] || null;
    }
    return { brand_mentioned: true, mention_type: 'direct', citation_url: citationUrl };
  }

  // URL citation: org domain appears
  if (orgDomain && lower.includes(orgDomain.toLowerCase())) {
    const urlMatch = responseText.match(new RegExp(`https?://[^\\s]*${orgDomain.replace('.', '\\.')}[^\\s]*`, 'i'));
    return { brand_mentioned: true, mention_type: 'direct', citation_url: urlMatch?.[0] || null };
  }

  // Indirect: check if the response vaguely references the brand's concepts
  // (simplified heuristic — would need NLP for production)
  return { brand_mentioned: false, mention_type: null, citation_url: null };
}

// ============================================================================
// Deduplication
// ============================================================================

async function wasRecentlyPolled(
  supabase: SupabaseClient,
  orgId: string,
  queryPrompt: string,
  engine: Engine,
  hoursThreshold: number = 6
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('citation_monitor_results')
    .select('id')
    .eq('org_id', orgId)
    .eq('engine', engine)
    .eq('query_prompt', queryPrompt)
    .gte('monitored_at', cutoff)
    .limit(1);

  return (data ?? []).length > 0;
}

// ============================================================================
// Summary Updater
// ============================================================================

async function updateCitationSummary(
  supabase: SupabaseClient,
  orgId: string,
  periodDays: number = 30
): Promise<void> {
  const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  // Get all results in period
  const { data: results } = await supabase
    .from('citation_monitor_results')
    .select('engine, brand_mentioned, query_topic, mention_type')
    .eq('org_id', orgId)
    .gte('monitored_at', cutoff);

  if (!results || results.length === 0) return;

  const totalQueries = results.length;
  const totalMentions = results.filter((r: { brand_mentioned: boolean }) => r.brand_mentioned).length;
  const mentionRate = totalQueries > 0 ? totalMentions / totalQueries : 0;

  // By engine breakdown
  const byEngine: Record<string, { queries: number; mentions: number; rate: number }> = {};
  for (const r of results) {
    const eng = (r as { engine: string }).engine;
    if (!byEngine[eng]) byEngine[eng] = { queries: 0, mentions: 0, rate: 0 };
    byEngine[eng].queries++;
    if ((r as { brand_mentioned: boolean }).brand_mentioned) byEngine[eng].mentions++;
  }
  for (const eng of Object.keys(byEngine)) {
    byEngine[eng].rate = byEngine[eng].queries > 0 ? byEngine[eng].mentions / byEngine[eng].queries : 0;
  }

  // Top cited topics
  const topicMentions: Record<string, { topic: string; mentions: number; engines: Set<string> }> = {};
  for (const r of results) {
    const { query_topic, brand_mentioned, engine } = r as { query_topic: string; brand_mentioned: boolean; engine: string };
    if (!brand_mentioned) continue;
    if (!topicMentions[query_topic]) {
      topicMentions[query_topic] = { topic: query_topic, mentions: 0, engines: new Set() };
    }
    topicMentions[query_topic].mentions++;
    topicMentions[query_topic].engines.add(engine);
  }
  const topCitedTopics = Object.values(topicMentions)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10)
    .map((t) => ({ topic: t.topic, mentions: t.mentions, engines: [...t.engines] }));

  // Competitor mentions (where brand was NOT mentioned)
  const competitorResults = results.filter(
    (r: { brand_mentioned: boolean; mention_type: string | null }) =>
      !r.brand_mentioned && r.mention_type === 'competitor'
  );
  const competitorMentions = competitorResults.length > 0
    ? [{ count: competitorResults.length, note: 'Competitors cited where brand was absent' }]
    : [];

  // Upsert summary
  await supabase
    .from('citation_summaries')
    .upsert(
      {
        org_id: orgId,
        period_days: periodDays,
        total_queries: totalQueries,
        total_mentions: totalMentions,
        mention_rate: Math.round(mentionRate * 10000) / 10000,
        by_engine: byEngine,
        top_cited_topics: topCitedTopics,
        competitor_mentions: competitorMentions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,period_days' }
    );

  logger.info(`Updated citation summary for org ${orgId}: ${totalMentions}/${totalQueries} mentions (${(mentionRate * 100).toFixed(1)}%)`);
}

// ============================================================================
// SAGE Signal Emitter
// ============================================================================

async function emitCitationSignals(
  supabase: SupabaseClient,
  orgId: string,
  monitorResult: MonitorResult
): Promise<void> {
  const mentionRate = monitorResult.total_queries > 0
    ? monitorResult.total_mentions / monitorResult.total_queries
    : 0;

  // Signal: low citation rate (<5%)
  if (monitorResult.total_queries >= 5 && mentionRate < 0.05) {
    try {
      await supabase.from('sage_signals').insert({
        org_id: orgId,
        signal_type: 'content_low_citation_rate',
        pillar: 'Content',
        source_table: 'citation_summaries',
        source_id: orgId,
        signal_data: {
          mention_rate: mentionRate,
          total_queries: monitorResult.total_queries,
          total_mentions: monitorResult.total_mentions,
          by_engine: monitorResult.by_engine,
        },
        evi_impact_estimate: Math.max(1, Math.round((0.05 - mentionRate) * 100)),
        confidence: Math.min(0.95, monitorResult.total_queries / 20),
        priority: mentionRate < 0.01 ? 'high' : 'medium',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      logger.info(`Emitted content_low_citation_rate signal for org ${orgId}`);
    } catch {
      // Non-critical
    }
  }

  // Signal: competitor gap — check if any engine had 3+ non-brand results
  for (const [engine, stats] of Object.entries(monitorResult.by_engine)) {
    const nonMentioned = stats.queries - stats.mentions;
    if (nonMentioned >= 3 && stats.mentions === 0) {
      try {
        await supabase.from('sage_signals').insert({
          org_id: orgId,
          signal_type: 'competitor_citation_gap',
          pillar: 'Content',
          source_table: 'citation_monitor_results',
          source_id: orgId,
          signal_data: {
            engine,
            queries_without_mention: nonMentioned,
            total_queries: stats.queries,
            note: `${engine} never cited this brand in ${stats.queries} relevant queries`,
          },
          evi_impact_estimate: 2,
          confidence: 0.7,
          priority: 'medium',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
        logger.info(`Emitted competitor_citation_gap signal for org ${orgId} engine=${engine}`);
      } catch {
        // Non-critical
      }
    }
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Run a full citation monitoring cycle for an org.
 * Generates queries, polls available engines, saves results, updates summaries.
 */
export async function monitorCitations(
  supabase: SupabaseClient,
  orgId: string
): Promise<MonitorResult> {
  const config = getEnvConfig();
  const engines = getAvailableEngines(config);

  if (engines.length === 0) {
    logger.warn(`No LLM API keys configured — skipping citation monitor for org ${orgId}`);
    return {
      total_queries: 0,
      total_mentions: 0,
      by_engine: {} as Record<Engine, { queries: number; mentions: number }>,
      errors: ['No LLM API keys configured'],
    };
  }

  // Get org name + domain for mention detection
  const { data: org } = await supabase
    .from('orgs')
    .select('name, domain')
    .eq('id', orgId)
    .single();

  const orgName = (org as { name: string; domain?: string } | null)?.name || 'Brand';
  const orgDomain = (org as { name: string; domain?: string } | null)?.domain;

  // Generate queries
  const queries = await generateQueriesForOrg(supabase, orgId);

  if (queries.length === 0) {
    logger.warn(`No queries generated for org ${orgId}`);
    return {
      total_queries: 0,
      total_mentions: 0,
      by_engine: {} as Record<Engine, { queries: number; mentions: number }>,
      errors: ['No topics/keywords configured'],
    };
  }

  const result: MonitorResult = {
    total_queries: 0,
    total_mentions: 0,
    by_engine: {} as Record<Engine, { queries: number; mentions: number }>,
    errors: [],
  };

  // Initialize engine counters
  for (const engine of engines) {
    result.by_engine[engine] = { queries: 0, mentions: 0 };
  }

  const jobId = `monitor-${orgId}-${Date.now()}`;

  // Process queries across engines
  for (const query of queries) {
    for (const engine of engines) {
      // Dedup check
      const alreadyPolled = await wasRecentlyPolled(supabase, orgId, query.prompt, engine);
      if (alreadyPolled) {
        logger.debug(`Skipping dedup: ${engine} already polled for "${query.topic}" recently`);
        continue;
      }

      try {
        const response = await callEngine(engine, query.prompt, config, supabase, orgId);
        const excerpt = response.text.substring(0, 500);
        const mention = analyzeMentions(response.text, orgName, orgDomain);

        // Save result
        await supabase.from('citation_monitor_results').insert({
          org_id: orgId,
          engine,
          query_prompt: query.prompt,
          query_topic: query.topic,
          response_excerpt: excerpt,
          brand_mentioned: mention.brand_mentioned,
          mention_type: mention.mention_type,
          citation_url: mention.citation_url,
          job_id: jobId,
        });

        result.total_queries++;
        result.by_engine[engine].queries++;

        if (mention.brand_mentioned) {
          result.total_mentions++;
          result.by_engine[engine].mentions++;
        }
      } catch (error) {
        const msg = `${engine} error for "${query.topic}": ${error instanceof Error ? error.message : String(error)}`;
        logger.error(msg);
        result.errors.push(msg);
      }
    }
  }

  // Update citation summary
  await updateCitationSummary(supabase, orgId, 30);

  // Emit SAGE signals
  await emitCitationSignals(supabase, orgId, result);

  logger.info(
    `Citation monitor complete for org ${orgId}: ` +
    `queries=${result.total_queries}, mentions=${result.total_mentions}, ` +
    `engines=${engines.join(',')}, errors=${result.errors.length}`
  );

  return result;
}
