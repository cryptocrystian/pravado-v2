/**
 * CiteMind Quality Scorer (Sprint S-INT-04)
 *
 * Scores content across 6 weighted factors that predict
 * whether AI engines will cite it. All factor scoring is
 * heuristic-based (no LLM required). LLM is only used for
 * the optional recommendations array.
 *
 * Weighted formula:
 * overall = (entity × 0.20) + (claim × 0.20) + (structure × 0.15) +
 *           (authority × 0.20) + (schema × 0.10) + (citation_pattern × 0.15)
 *
 * Gate status:
 * - overall >= 75: passed (green)
 * - overall >= 55: warning (yellow)
 * - overall <  55: blocked (red)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';
import { LlmRouter } from '@pravado/utils';

const logger = createLogger('citemind:scorer');

// ============================================================================
// Types
// ============================================================================

export interface CiteMindScoreResult {
  overall_score: number;
  entity_density_score: number;
  claim_verifiability_score: number;
  structural_clarity_score: number;
  topical_authority_score: number;
  schema_markup_score: number;
  citation_pattern_score: number;
  factor_breakdown: Record<string, unknown>;
  gate_status: 'passed' | 'warning' | 'blocked';
  gate_threshold: number;
  recommendations: string[];
  word_count: number;
  scorer_version: string;
}

interface ContentItemData {
  id: string;
  org_id: string;
  title: string;
  body: string | null;
  content_type: string;
  metadata: Record<string, unknown> | null;
  primary_topic_id: string | null;
}

// ============================================================================
// Factor weights
// ============================================================================

const WEIGHTS = {
  entity_density: 0.20,
  claim_verifiability: 0.20,
  structural_clarity: 0.15,
  topical_authority: 0.20,
  schema_markup: 0.10,
  citation_pattern: 0.15,
} as const;

const GATE_THRESHOLD = 65.0;
const SCORER_VERSION = '1.0';

// ============================================================================
// Main scoring function
// ============================================================================

/**
 * Score a content item across 6 factors.
 * Returns full breakdown + gate status + recommendations.
 */
export async function scoreContentItem(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<CiteMindScoreResult> {
  // Fetch content item
  const { data: item, error } = await supabase
    .from('content_items')
    .select('id, org_id, title, body, content_type, metadata, primary_topic_id')
    .eq('id', contentItemId)
    .eq('org_id', orgId)
    .single();

  if (error || !item) {
    throw new Error(`Content item ${contentItemId} not found: ${error?.message}`);
  }

  const content = (item as ContentItemData);
  const body = content.body || '';
  const words = body.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Score each factor
  const entityDensity = scoreEntityDensity(body, wordCount);
  const claimVerifiability = scoreClaimVerifiability(body, wordCount);
  const structuralClarity = scoreStructuralClarity(body, content.title);
  const topicalAuthority = await scoreTopicalAuthority(supabase, content, orgId);
  const schemaMarkup = await scoreSchemaMarkup(supabase, contentItemId, content.metadata);
  const citationPattern = scoreCitationPattern(body, content.title);

  // Calculate overall weighted score
  const overall = Math.round(
    (entityDensity.score * WEIGHTS.entity_density +
     claimVerifiability.score * WEIGHTS.claim_verifiability +
     structuralClarity.score * WEIGHTS.structural_clarity +
     topicalAuthority.score * WEIGHTS.topical_authority +
     schemaMarkup.score * WEIGHTS.schema_markup +
     citationPattern.score * WEIGHTS.citation_pattern) * 100
  ) / 100;

  // Determine gate status
  const gateStatus: 'passed' | 'warning' | 'blocked' =
    overall >= 75 ? 'passed' :
    overall >= 55 ? 'warning' :
    'blocked';

  // Generate recommendations from lowest-scoring factors
  const recommendations = generateTemplateRecommendations({
    entity_density: entityDensity.score,
    claim_verifiability: claimVerifiability.score,
    structural_clarity: structuralClarity.score,
    topical_authority: topicalAuthority.score,
    schema_markup: schemaMarkup.score,
    citation_pattern: citationPattern.score,
  });

  const factorBreakdown = {
    entity_density: entityDensity,
    claim_verifiability: claimVerifiability,
    structural_clarity: structuralClarity,
    topical_authority: topicalAuthority,
    schema_markup: schemaMarkup,
    citation_pattern: citationPattern,
    weights: WEIGHTS,
  };

  return {
    overall_score: overall,
    entity_density_score: entityDensity.score,
    claim_verifiability_score: claimVerifiability.score,
    structural_clarity_score: structuralClarity.score,
    topical_authority_score: topicalAuthority.score,
    schema_markup_score: schemaMarkup.score,
    citation_pattern_score: citationPattern.score,
    factor_breakdown: factorBreakdown,
    gate_status: gateStatus,
    gate_threshold: GATE_THRESHOLD,
    recommendations,
    word_count: wordCount,
    scorer_version: SCORER_VERSION,
  };
}

/**
 * Score and persist to citemind_scores table.
 */
export async function scoreAndPersist(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<CiteMindScoreResult> {
  const result = await scoreContentItem(supabase, contentItemId, orgId);

  const { error } = await supabase.from('citemind_scores').insert({
    org_id: orgId,
    content_item_id: contentItemId,
    overall_score: result.overall_score,
    entity_density_score: result.entity_density_score,
    claim_verifiability_score: result.claim_verifiability_score,
    structural_clarity_score: result.structural_clarity_score,
    topical_authority_score: result.topical_authority_score,
    schema_markup_score: result.schema_markup_score,
    citation_pattern_score: result.citation_pattern_score,
    factor_breakdown: result.factor_breakdown,
    gate_status: result.gate_status,
    gate_threshold: result.gate_threshold,
    recommendations: result.recommendations,
    word_count: result.word_count,
    scorer_version: result.scorer_version,
  });

  if (error) {
    logger.error(`Failed to persist CiteMind score: ${error.message}`);
    throw new Error(`Failed to persist score: ${error.message}`);
  }

  logger.info(
    `Scored content ${contentItemId}: ${result.overall_score} (${result.gate_status})`
  );

  return result;
}

/**
 * Optionally enhance recommendations using LLM if budget allows.
 */
export async function generateLLMRecommendations(
  supabase: SupabaseClient,
  orgId: string,
  scoreResult: CiteMindScoreResult,
  contentTitle: string
): Promise<string[]> {
  // Check LLM budget
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { data } = await supabase
    .from('llm_usage_ledger')
    .select('tokens_total')
    .eq('org_id', orgId)
    .gte('created_at', monthStart);

  const totalTokens = (data ?? []).reduce(
    (sum: number, row: { tokens_total: number }) => sum + (row.tokens_total || 0),
    0
  );

  if (totalTokens >= 500_000) {
    logger.info(`Org ${orgId} exceeded LLM budget, using template recommendations`);
    return scoreResult.recommendations;
  }

  try {
    const router = new LlmRouter({
      provider: 'anthropic',
      anthropicApiKey: process.env.LLM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      anthropicModel: 'claude-sonnet-4-20250514',
      openaiApiKey: process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      openaiModel: 'gpt-4o-mini',
      supabase,
      enableLedger: true,
      maxTokens: 300,
      timeoutMs: 10000,
    });

    const result = await router.generate({
      provider: 'anthropic',
      systemPrompt: `You are CiteMind, the AI citation intelligence engine. Generate 2-3 specific, actionable improvement suggestions for content that will increase its likelihood of being cited by AI systems (ChatGPT, Perplexity, Claude). Respond with a JSON array of strings.`,
      userPrompt: `Content: "${contentTitle}"
Scores: Entity Density ${scoreResult.entity_density_score}/100, Claim Verifiability ${scoreResult.claim_verifiability_score}/100, Structural Clarity ${scoreResult.structural_clarity_score}/100, Topical Authority ${scoreResult.topical_authority_score}/100, Schema Markup ${scoreResult.schema_markup_score}/100, Citation Pattern ${scoreResult.citation_pattern_score}/100.
Overall: ${scoreResult.overall_score}/100 (${scoreResult.gate_status}).
Generate 2-3 specific recommendations as a JSON array of strings.`,
      orgId,
      maxTokens: 300,
    });

    const parsed = JSON.parse(result.completion.match(/\[[\s\S]*\]/)?.[0] || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String).slice(0, 3);
    }
  } catch (err) {
    logger.warn(`LLM recommendations failed, using templates: ${err}`);
  }

  return scoreResult.recommendations;
}

// ============================================================================
// Factor 1: Entity Density (weight: 0.20)
// ============================================================================

function scoreEntityDensity(body: string, wordCount: number): { score: number; details: Record<string, unknown> } {
  if (wordCount === 0) return { score: 0, details: { entities: 0, density: 0, reason: 'empty content' } };

  // Count named entities using heuristics
  const entities = new Set<string>();

  // Capitalized phrases (2+ words starting with capitals, not at sentence start)
  const capitalizedPhrases = body.match(/(?<=[.!?]\s+\w+\s+|,\s+)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  capitalizedPhrases.forEach(p => entities.add(p));

  // Standalone capitalized words in mid-sentence
  const midSentenceCaps = body.match(/(?<=\s)[A-Z][a-z]{2,}(?=\s[a-z])/g) || [];
  midSentenceCaps.forEach(w => entities.add(w));

  // Numbers with units (e.g., "73%", "$5.2 million", "2024")
  const numbersWithUnits = body.match(/\$?\d[\d,.]*\s*(%|million|billion|trillion|percent|users|customers|companies|employees)/gi) || [];
  numbersWithUnits.forEach(n => entities.add(n.trim()));

  // Year patterns
  const years = body.match(/\b(19|20)\d{2}\b/g) || [];
  years.forEach(y => entities.add(y));

  // Quoted statistics
  const quotedStats = body.match(/"[^"]*\d+[^"]*"/g) || [];
  quotedStats.forEach(q => entities.add(q));

  const entityCount = entities.size;
  const densityPer1000 = wordCount > 0 ? (entityCount / wordCount) * 1000 : 0;

  let score: number;
  if (entityCount < 3) {
    score = 0;
  } else if (densityPer1000 < 8) {
    score = Math.min(100, ((densityPer1000 - 3) / 5) * 100);
  } else if (densityPer1000 <= 15) {
    score = 100;
  } else if (densityPer1000 <= 20) {
    score = 100 - ((densityPer1000 - 15) / 5) * 30;
  } else {
    score = 70 - Math.min(30, (densityPer1000 - 20) * 3);
  }

  score = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

  return {
    score,
    details: {
      entity_count: entityCount,
      density_per_1000: Math.round(densityPer1000 * 100) / 100,
      sample_entities: Array.from(entities).slice(0, 5),
    },
  };
}

// ============================================================================
// Factor 2: Claim Verifiability (weight: 0.20)
// ============================================================================

function scoreClaimVerifiability(body: string, wordCount: number): { score: number; details: Record<string, unknown> } {
  if (wordCount === 0) return { score: 0, details: { claims: 0, reason: 'empty content' } };

  let claimCount = 0;
  const claimTypes: string[] = [];

  // Percentages: "73% of..."
  const percentages = body.match(/\d+(\.\d+)?%/g) || [];
  claimCount += percentages.length;
  if (percentages.length > 0) claimTypes.push('percentages');

  // Year references: "In 2024...", "since 2020"
  const yearRefs = body.match(/\b(in|since|during|by|before|after|from)\s+(19|20)\d{2}\b/gi) || [];
  claimCount += yearRefs.length;
  if (yearRefs.length > 0) claimTypes.push('date_references');

  // Attribution: "according to", "research shows", "study found"
  const attributions = body.match(/\b(according to|research (shows|found|suggests|indicates)|study (found|shows|reveals)|data (shows|suggests|indicates)|report (by|from)|survey (of|by|found))\b/gi) || [];
  claimCount += attributions.length;
  if (attributions.length > 0) claimTypes.push('attributions');

  // Quoted text (attributed quotes)
  const quotes = body.match(/"[^"]{10,}"/g) || [];
  claimCount += Math.min(quotes.length, 5); // Cap at 5
  if (quotes.length > 0) claimTypes.push('quoted_text');

  // Specific numbers with context: "X million", "$X"
  const specificNumbers = body.match(/\b\d[\d,.]+\s*(million|billion|trillion|thousand|users|customers|downloads|visits)\b/gi) || [];
  claimCount += specificNumbers.length;
  if (specificNumbers.length > 0) claimTypes.push('specific_numbers');

  // Target: 1 verifiable claim per 200 words
  const targetClaims = wordCount / 200;
  const claimDensity = targetClaims > 0 ? claimCount / targetClaims : 0;
  const score = Math.max(0, Math.min(100, Math.round(claimDensity * 100)));

  return {
    score,
    details: {
      claim_count: claimCount,
      target_claims: Math.round(targetClaims),
      claim_density: Math.round(claimDensity * 100) / 100,
      claim_types: claimTypes,
    },
  };
}

// ============================================================================
// Factor 3: Structural Clarity (weight: 0.15)
// ============================================================================

function scoreStructuralClarity(body: string, _title: string): { score: number; details: Record<string, unknown> } {
  if (!body || body.length === 0) return { score: 0, details: { reason: 'empty content' } };

  let points = 0;
  const criteria: Record<string, boolean> = {};

  // Criterion 1: Heading hierarchy present (H1/H2/H3 or markdown ##/###)
  const hasHeadings =
    /#{2,3}\s+\S/m.test(body) || // markdown
    /<h[1-3][^>]*>/i.test(body); // HTML
  criteria.headings = hasHeadings;
  if (hasHeadings) points += 25;

  // Criterion 2: Short paragraphs (avg < 150 words per paragraph)
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const avgParagraphWords = paragraphs.length > 0
    ? paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length
    : 0;
  criteria.short_paragraphs = avgParagraphWords < 150 && avgParagraphWords > 0;
  if (criteria.short_paragraphs) points += 25;

  // Criterion 3: Lists present (bullet or numbered)
  const hasLists =
    /^[\s]*[-*•]\s+\S/m.test(body) || // markdown bullets
    /^[\s]*\d+[.)]\s+\S/m.test(body) || // numbered lists
    /<[ou]l>/i.test(body); // HTML lists
  criteria.lists = hasLists;
  if (hasLists) points += 25;

  // Criterion 4: Answer-first structure (direct answer in first 100 words)
  const first100Words = body.split(/\s+/).slice(0, 100).join(' ');
  const hasAnswerFirst =
    /\bis\b|\bare\b|\bcan\b|\bshould\b|\bmeans\b|\brefers to\b|\bdefined as\b/i.test(first100Words) &&
    first100Words.length > 50;
  criteria.answer_first = hasAnswerFirst;
  if (hasAnswerFirst) points += 25;

  return {
    score: points,
    details: {
      criteria,
      paragraph_count: paragraphs.length,
      avg_paragraph_words: Math.round(avgParagraphWords),
    },
  };
}

// ============================================================================
// Factor 4: Topical Authority (weight: 0.20)
// ============================================================================

async function scoreTopicalAuthority(
  supabase: SupabaseClient,
  content: ContentItemData,
  orgId: string
): Promise<{ score: number; details: Record<string, unknown> }> {
  if (!content.primary_topic_id) {
    return { score: 50, details: { reason: 'no_topic_assigned', note: 'Neutral score — no topic cluster linked' } };
  }

  // Get the topic and its cluster
  const { data: topic } = await supabase
    .from('content_topics')
    .select('id, topic_name, cluster_id')
    .eq('id', content.primary_topic_id)
    .single();

  if (!topic) {
    return { score: 50, details: { reason: 'topic_not_found' } };
  }

  // Get all topics in the same cluster
  if (!topic.cluster_id) {
    // No cluster — check if content mentions the topic name
    const body = (content.body || '').toLowerCase();
    const topicInContent = body.includes((topic.topic_name || '').toLowerCase());
    return {
      score: topicInContent ? 70 : 40,
      details: { reason: 'no_cluster', topic_name: topic.topic_name, topic_in_content: topicInContent },
    };
  }

  const { data: clusterTopics } = await supabase
    .from('content_topics')
    .select('topic_name')
    .eq('org_id', orgId)
    .eq('cluster_id', topic.cluster_id);

  if (!clusterTopics || clusterTopics.length === 0) {
    return { score: 50, details: { reason: 'empty_cluster' } };
  }

  // Calculate keyword overlap
  const body = (content.body || '').toLowerCase();
  const matchingTopics = clusterTopics.filter(
    (t: { topic_name: string }) => body.includes(t.topic_name.toLowerCase())
  );

  const coverage = (matchingTopics.length / clusterTopics.length) * 100;

  return {
    score: Math.round(Math.min(100, coverage)),
    details: {
      cluster_topics_total: clusterTopics.length,
      matching_topics: matchingTopics.length,
      coverage_pct: Math.round(coverage),
      sample_matched: matchingTopics.slice(0, 5).map((t: { topic_name: string }) => t.topic_name),
    },
  };
}

// ============================================================================
// Factor 5: Schema Markup (weight: 0.10)
// ============================================================================

async function scoreSchemaMarkup(
  supabase: SupabaseClient,
  contentItemId: string,
  metadata: Record<string, unknown> | null
): Promise<{ score: number; details: Record<string, unknown> }> {
  // Check citemind_schemas table
  const { data: schemas } = await supabase
    .from('citemind_schemas')
    .select('id, schema_type')
    .eq('content_item_id', contentItemId)
    .limit(1);

  const hasDbSchema = schemas && schemas.length > 0;

  // Check metadata for JSON-LD
  const hasMetadataSchema = metadata &&
    (metadata['json_ld'] || metadata['jsonLd'] || metadata['structured_data'] || metadata['schema']);

  if (hasDbSchema) {
    return {
      score: 100,
      details: { source: 'citemind_schemas', schema_type: schemas[0].schema_type },
    };
  }

  if (hasMetadataSchema) {
    return {
      score: 50,
      details: { source: 'metadata_partial', note: 'Schema exists in metadata but not validated by CiteMind' },
    };
  }

  return {
    score: 0,
    details: { source: 'none', note: 'No structured data found' },
  };
}

// ============================================================================
// Factor 6: Citation Pattern (weight: 0.15)
// ============================================================================

function scoreCitationPattern(body: string, title: string): { score: number; details: Record<string, unknown> } {
  if (!body || body.length === 0) return { score: 0, details: { reason: 'empty content' } };

  let points = 0;
  const patterns: Record<string, boolean> = {};

  // Pattern 1: Question-answer structure
  const hasQA =
    /\?[\s\n]/m.test(body) && // has questions
    (
      /#{2,3}\s+.*\?/m.test(body) || // question in heading
      /\bwhat\s+is\b|\bhow\s+to\b|\bwhy\s+(do|does|is|are)\b|\bwhen\s+(should|to|do)\b/i.test(title) // question in title
    );
  patterns.question_answer = hasQA;
  if (hasQA) points += 25;

  // Pattern 2: Summary/takeaway section
  const hasSummary =
    /\b(key takeaway|summary|conclusion|in summary|bottom line|tl;?dr|main points)\b/i.test(body) ||
    /#{2,3}\s*(summary|conclusion|key takeaway|final thoughts)/im.test(body);
  patterns.summary_section = hasSummary;
  if (hasSummary) points += 25;

  // Pattern 3: Numbered steps/processes
  const hasNumberedSteps =
    /^[\s]*\d+[.)]\s+\S/m.test(body) || // "1. Step" or "1) Step"
    /\b(step\s+\d|first,?\s|second,?\s|third,?\s)/i.test(body);
  patterns.numbered_steps = hasNumberedSteps;
  if (hasNumberedSteps) points += 25;

  // Pattern 4: Original data/unique finding
  const hasOriginalData =
    /\b(our (research|data|study|analysis|survey|findings)|we (found|discovered|analyzed|surveyed|measured))\b/i.test(body) ||
    /\b(original (research|data)|proprietary|exclusive|first-of-its-kind)\b/i.test(body);
  patterns.original_data = hasOriginalData;
  if (hasOriginalData) points += 25;

  return {
    score: points,
    details: { patterns },
  };
}

// ============================================================================
// Template recommendations (no LLM needed)
// ============================================================================

function generateTemplateRecommendations(scores: Record<string, number>): string[] {
  const recs: Array<{ score: number; rec: string }> = [];

  if (scores.entity_density < 60) {
    recs.push({ score: scores.entity_density, rec: 'Add more named entities (people, companies, products, dates, statistics) to increase AI citability. Target 8-15 entities per 1000 words.' });
  }
  if (scores.claim_verifiability < 60) {
    recs.push({ score: scores.claim_verifiability, rec: 'Include more verifiable claims: statistics with sources, specific dates, named studies, or attributed quotes. Target 1 verifiable claim per 200 words.' });
  }
  if (scores.structural_clarity < 60) {
    recs.push({ score: scores.structural_clarity, rec: 'Improve structure: add headings (H2/H3), use bullet/numbered lists, keep paragraphs under 150 words, and lead with a direct answer.' });
  }
  if (scores.topical_authority < 60) {
    recs.push({ score: scores.topical_authority, rec: 'Broaden topical coverage: reference more keywords from your topic cluster to demonstrate comprehensive authority on this subject.' });
  }
  if (scores.schema_markup < 60) {
    recs.push({ score: scores.schema_markup, rec: 'Generate JSON-LD structured data for this content to help AI engines understand and cite it properly.' });
  }
  if (scores.citation_pattern < 60) {
    recs.push({ score: scores.citation_pattern, rec: 'Structure content for AI citation: add Q&A sections, include a summary/key takeaways section, use numbered steps for processes, or present original data.' });
  }

  // Sort by lowest score first, return top 3
  recs.sort((a, b) => a.score - b.score);
  return recs.slice(0, 3).map(r => r.rec);
}
