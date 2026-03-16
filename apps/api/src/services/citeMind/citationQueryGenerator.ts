/**
 * Citation Query Generator (Sprint S-INT-05)
 *
 * Generates natural prompts to poll LLM engines and detect
 * whether AI models cite the customer's brand/content.
 *
 * Query types:
 * - Informational: "What are the best strategies for [topic]?"
 * - Comparative: "How do leading companies approach [topic]?"
 * - Best-of: "What tools or resources do experts recommend for [topic]?"
 *
 * Max 20 queries per org per cycle.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('citemind:query-gen');

// ============================================================================
// Types
// ============================================================================

export interface CitationQuery {
  prompt: string;
  topic: string;
  intent: 'informational' | 'comparative' | 'best-of';
}

interface OrgContext {
  orgName: string;
  industry: string | null;
  topics: string[];
  keywords: string[];
}

const MAX_QUERIES_PER_ORG = 20;

// ============================================================================
// Query Templates
// ============================================================================

function buildInformationalQuery(topic: string, industry: string): string {
  const templates = [
    `What are the best ${industry} strategies for ${topic}?`,
    `How should a ${industry} company approach ${topic}?`,
    `What are the current best practices for ${topic} in ${industry}?`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildComparativeQuery(topic: string, industry: string): string {
  const templates = [
    `How do leading ${industry} companies approach ${topic}?`,
    `What ${industry} platforms or tools are best for ${topic}?`,
    `Compare the top approaches to ${topic} in ${industry}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildBestOfQuery(topic: string, industry: string): string {
  const templates = [
    `What tools or resources do experts recommend for ${topic}?`,
    `What are the top ${industry} solutions for ${topic}?`,
    `Which ${industry} experts or companies lead in ${topic}?`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildBrandedQuery(orgName: string, topic: string, industry: string): string {
  const templates = [
    `What do platforms like ${orgName} do for ${topic}?`,
    `How does ${orgName} compare to other ${industry} solutions for ${topic}?`,
    `Is ${orgName} a good choice for ${topic} in ${industry}?`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================================
// Org Context Loader
// ============================================================================

async function loadOrgContext(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgContext> {
  // Get org name and industry
  const { data: org } = await supabase
    .from('orgs')
    .select('name, industry')
    .eq('id', orgId)
    .single();

  const orgName = (org as { name: string; industry?: string } | null)?.name || 'Brand';
  const industry = (org as { name: string; industry?: string } | null)?.industry || 'marketing';

  // Get topic cluster names
  const { data: topicClusters } = await supabase
    .from('content_topic_clusters')
    .select('name')
    .eq('org_id', orgId)
    .limit(10);

  const topics = (topicClusters ?? []).map((t: { name: string }) => t.name);

  // Fallback: if no clusters, get content_topics
  if (topics.length === 0) {
    const { data: contentTopics } = await supabase
      .from('content_topics')
      .select('topic_name')
      .eq('org_id', orgId)
      .limit(10);

    for (const t of (contentTopics ?? [])) {
      const name = (t as { topic_name: string }).topic_name;
      if (name && !topics.includes(name)) topics.push(name);
    }
  }

  // Get top SEO keywords
  const { data: keywords } = await supabase
    .from('seo_keywords')
    .select('keyword')
    .eq('org_id', orgId)
    .order('search_volume', { ascending: false })
    .limit(10);

  const keywordList = (keywords ?? []).map((k: { keyword: string }) => k.keyword);

  return { orgName, industry, topics, keywords: keywordList };
}

// ============================================================================
// Main Generator
// ============================================================================

/**
 * Generate citation monitoring queries for an org.
 * Returns up to MAX_QUERIES_PER_ORG queries.
 */
export async function generateQueriesForOrg(
  supabase: SupabaseClient,
  orgId: string
): Promise<CitationQuery[]> {
  const ctx = await loadOrgContext(supabase, orgId);
  const queries: CitationQuery[] = [];

  // Merge topics and keywords (deduplicated)
  const allTopics = [...new Set([...ctx.topics, ...ctx.keywords])];

  if (allTopics.length === 0) {
    logger.warn(`No topics or keywords found for org ${orgId}, using org name as fallback`);
    allTopics.push(ctx.orgName);
  }

  const industry = ctx.industry || 'marketing';

  for (const topic of allTopics) {
    if (queries.length >= MAX_QUERIES_PER_ORG) break;

    // Informational query
    queries.push({
      prompt: buildInformationalQuery(topic, industry),
      topic,
      intent: 'informational',
    });

    if (queries.length >= MAX_QUERIES_PER_ORG) break;

    // Comparative query
    queries.push({
      prompt: buildComparativeQuery(topic, industry),
      topic,
      intent: 'comparative',
    });

    if (queries.length >= MAX_QUERIES_PER_ORG) break;

    // Best-of query — only for first few topics to stay under limit
    queries.push({
      prompt: buildBestOfQuery(topic, industry),
      topic,
      intent: 'best-of',
    });
  }

  // Inject brand name into ~30% of queries
  const brandedCount = Math.max(1, Math.floor(queries.length * 0.3));
  const indices = Array.from({ length: queries.length }, (_, i) => i);
  // Fisher-Yates partial shuffle for random selection
  for (let i = indices.length - 1; i > 0 && indices.length - i <= brandedCount; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const brandedIndices = new Set(indices.slice(-brandedCount));

  for (const idx of brandedIndices) {
    queries[idx].prompt = buildBrandedQuery(ctx.orgName, queries[idx].topic, industry);
  }

  logger.info(`Generated ${queries.length} citation queries for org ${orgId} (${allTopics.length} topics)`);
  return queries.slice(0, MAX_QUERIES_PER_ORG);
}
