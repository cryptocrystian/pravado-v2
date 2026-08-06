/**
 * Semantic Brand-Mention Detector (Lane E)
 *
 * Replaces the naive substring `includes()` match in citationMonitor with real
 * semantic detection. Given an AI engine's response text, it classifies whether
 * the customer's brand is:
 *
 *   - directly named        -> mention_type: 'direct'   (brand_mentioned: true)
 *   - paraphrased/indirectly referenced (described, not named)
 *                           -> mention_type: 'indirect' (brand_mentioned: true)
 *   - absent, but a competitor is cited instead
 *                           -> mention_type: 'competitor' (brand_mentioned: false)
 *   - absent entirely       -> mention_type: null       (brand_mentioned: false)
 *
 * Canon (docs/canon/CITEMIND_SYSTEM.md §4.3):
 *   - "Direct Text Citation"  = Entity mention in AI response      -> Visibility + Authority
 *   - "Paraphrase Citation"   = Semantic match without attribution -> Visibility only
 *   - "Competitor Narrative Gain" / "Topic Misattribution"         -> Competitive alert
 *
 * The `mention_type` union is preserved as-is ('direct' | 'indirect' |
 * 'competitor' | null) so the persisted `citation_monitor_results.mention_type`
 * column and the downstream summary/signal logic keep working unchanged. Both
 * 'direct' and 'indirect' count as a brand mention; 'competitor' does not.
 *
 * ---------------------------------------------------------------------------
 * Approach: structured (JSON) LLM classification via the existing LlmRouter,
 * NOT embeddings. Rationale:
 *   1. Lower integration path — LlmRouter already wires Anthropic/OpenAI with
 *      the usage ledger, billing enforcement and stub fallback. Embeddings
 *      would require a new embeddings client, a vector store / cosine-similarity
 *      pass and threshold tuning that does not exist in this repo.
 *   2. One call resolves all three cases (direct/paraphrase/competitor) at once;
 *      an embedding-similarity score cannot tell a paraphrase of the brand apart
 *      from a competitor being described.
 *
 * Cost controls (preserve the monitor's existing caps):
 *   - Exact-name and domain-URL matches short-circuit to 'direct' WITHOUT an LLM
 *     call — the unambiguous, cheap path stays free.
 *   - The LLM is only consulted for the ambiguous remainder (possible paraphrase
 *     or competitor). Model defaults to the cheapest Haiku tier, temperature 0,
 *     <= 256 output tokens. The monitor's 20-query cap and 6-hour dedup already
 *     bound how many responses reach this detector.
 *   - Any classifier failure (missing key, stub fallback, malformed JSON, throw)
 *     degrades safely to a no-match instead of inventing a mention.
 */

import { LlmRouter } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from '../../lib/logger';

const logger = createLogger('citemind:mention-detector');

// ============================================================================
// Types
// ============================================================================

/** Preserved return shape consumed by citationMonitor. */
export interface MentionAnalysis {
  brand_mentioned: boolean;
  mention_type: 'direct' | 'indirect' | 'competitor' | null;
  citation_url: string | null;
  /** Name of the competitor cited when mention_type === 'competitor'. */
  competitor_name?: string | null;
  /** 0..1 classifier confidence (1 for deterministic direct matches). */
  confidence?: number;
}

export interface BrandMentionContext {
  orgName: string;
  orgDomain?: string;
  /** Active competitor names for this org, used to attribute competitor cites. */
  competitorNames?: string[];
}

/** What the semantic classifier returns (post-parse, post-validation). */
export interface SemanticClassification {
  /** True when the brand is referenced (named OR paraphrased). */
  brand_mentioned: boolean;
  /** Only the LLM-resolvable subset; 'direct' is decided deterministically. */
  mention_type: 'indirect' | 'competitor' | null;
  competitor_name: string | null;
  confidence: number;
}

/**
 * Injectable semantic classifier. Production uses the LlmRouter-backed
 * implementation; unit tests pass a mock so they assert the classification
 * logic, not the model.
 */
export type SemanticClassifier = (
  responseText: string,
  context: BrandMentionContext
) => Promise<SemanticClassification>;

// ============================================================================
// Deterministic helpers (pure, cheap, no LLM)
// ============================================================================

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractCitationUrl(
  responseText: string,
  orgDomain?: string
): string | null {
  if (!orgDomain) return null;
  const urlMatch = responseText.match(
    new RegExp(`https?://[^\\s]*${escapeRegExp(orgDomain)}[^\\s]*`, 'i')
  );
  return urlMatch?.[0] || null;
}

/**
 * Deterministic direct-mention check: exact brand name token or the brand's
 * domain appearing in the text. Kept as a cheap, LLM-free fast path.
 */
export function detectDirectMention(
  responseText: string,
  context: BrandMentionContext
): MentionAnalysis | null {
  const lower = responseText.toLowerCase();
  const orgLower = context.orgName.trim().toLowerCase();

  if (orgLower.length > 0 && lower.includes(orgLower)) {
    return {
      brand_mentioned: true,
      mention_type: 'direct',
      citation_url: extractCitationUrl(responseText, context.orgDomain),
      confidence: 1,
    };
  }

  if (context.orgDomain && lower.includes(context.orgDomain.toLowerCase())) {
    return {
      brand_mentioned: true,
      mention_type: 'direct',
      citation_url: extractCitationUrl(responseText, context.orgDomain),
      confidence: 1,
    };
  }

  return null;
}

// ============================================================================
// Classification prompt + parsing (pure, unit-tested)
// ============================================================================

const CLASSIFIER_SYSTEM_PROMPT =
  'You are a precise brand-mention classifier for a citation-monitoring system. ' +
  "You decide whether an AI assistant's answer references a specific brand, " +
  'either by name, by paraphrase/description without naming it, or whether it ' +
  'instead references a competitor. You reply with STRICT JSON only — no prose, ' +
  'no markdown fences.';

export function buildClassificationPrompt(
  responseText: string,
  context: BrandMentionContext
): string {
  const competitorList =
    context.competitorNames && context.competitorNames.length > 0
      ? context.competitorNames.join(', ')
      : '(none provided)';

  return [
    `Brand to detect: "${context.orgName}"`,
    context.orgDomain ? `Brand domain: ${context.orgDomain}` : '',
    `Known competitors: ${competitorList}`,
    '',
    'AI assistant answer to classify:',
    '"""',
    responseText.slice(0, 6000),
    '"""',
    '',
    'Decide ONE of the following:',
    '- "indirect": the answer describes or paraphrases THIS brand / its product ' +
      'without naming it (e.g. by its category-defining offering), OR names it in ' +
      'a way the exact-string check would miss (alias, misspelling, possessive).',
    '- "competitor": the answer does NOT reference this brand, but does reference ' +
      'one of the listed competitors (or a clear direct competitor in the same category).',
    '- "none": the brand is neither named nor paraphrased, and no competitor is referenced.',
    '',
    'Rules:',
    '- Do NOT report "indirect" for generic industry advice that fits any vendor.',
    '- If both the brand (paraphrased) and a competitor appear, prefer "indirect" (brand wins).',
    '- competitor_name must be one of the listed competitors when mention_type is "competitor", else null.',
    '',
    'Respond with JSON exactly matching:',
    '{"mention_type": "indirect" | "competitor" | "none", "competitor_name": string | null, "confidence": number between 0 and 1}',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Parse + validate a classifier completion into a SemanticClassification.
 * Robust to code fences and surrounding prose. Any parse/validation failure
 * returns a safe no-match (never a false positive).
 */
export function parseClassificationResponse(
  raw: string
): SemanticClassification {
  const safeNoMatch: SemanticClassification = {
    brand_mentioned: false,
    mention_type: null,
    competitor_name: null,
    confidence: 0,
  };

  if (!raw || typeof raw !== 'string') return safeNoMatch;

  // Extract the first JSON object, tolerating ```json fences / stray prose.
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return safeNoMatch;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return safeNoMatch;
  }

  if (!parsed || typeof parsed !== 'object') return safeNoMatch;
  const obj = parsed as Record<string, unknown>;

  const rawType = String(obj.mention_type ?? 'none').toLowerCase();
  const confidenceNum =
    typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)
      ? Math.min(1, Math.max(0, obj.confidence))
      : 0.5;
  const competitorName =
    typeof obj.competitor_name === 'string' && obj.competitor_name.trim()
      ? obj.competitor_name.trim()
      : null;

  if (rawType === 'indirect') {
    return {
      brand_mentioned: true,
      mention_type: 'indirect',
      competitor_name: null,
      confidence: confidenceNum,
    };
  }

  if (rawType === 'competitor') {
    return {
      brand_mentioned: false,
      mention_type: 'competitor',
      competitor_name: competitorName,
      confidence: confidenceNum,
    };
  }

  // 'none' or any unexpected value -> safe no-match.
  return safeNoMatch;
}

// ============================================================================
// Router-backed classifier (production)
// ============================================================================

export interface RouterClassifierDeps {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  supabase: SupabaseClient;
  orgId: string;
  /** Override for tests; defaults to the cheapest available tier. */
  anthropicModel?: string;
  openaiModel?: string;
}

/**
 * Build a production classifier bound to the LlmRouter. Prefers Anthropic Haiku
 * (cheapest), falls back to OpenAI gpt-4o-mini, and to a no-op no-match
 * classifier when no key is available so the monitor never fabricates mentions.
 */
export function createRouterClassifier(
  deps: RouterClassifierDeps
): SemanticClassifier {
  const provider: 'anthropic' | 'openai' | null = deps.anthropicApiKey
    ? 'anthropic'
    : deps.openaiApiKey
      ? 'openai'
      : null;

  if (!provider) {
    logger.warn(
      'No LLM key available for semantic mention detection — indirect/competitor detection disabled for this cycle'
    );
    return async () => ({
      brand_mentioned: false,
      mention_type: null,
      competitor_name: null,
      confidence: 0,
    });
  }

  const router = new LlmRouter({
    provider,
    anthropicApiKey: deps.anthropicApiKey,
    anthropicModel: deps.anthropicModel || 'claude-haiku-4-5-20251001',
    openaiApiKey: deps.openaiApiKey,
    openaiModel: deps.openaiModel || 'gpt-4o-mini',
    timeoutMs: 20000,
    maxTokens: 256,
    supabase: deps.supabase,
    enableLedger: true,
  });

  return async (responseText, context) => {
    const result = await router.generate({
      provider,
      systemPrompt: CLASSIFIER_SYSTEM_PROMPT,
      userPrompt: buildClassificationPrompt(responseText, context),
      temperature: 0,
      maxTokens: 256,
      orgId: deps.orgId,
    });

    // Router fell back to the deterministic stub (missing key, provider error,
    // timeout). The stub cannot classify — treat as a safe no-match.
    if (result.provider === 'stub' || result.fallback) {
      return {
        brand_mentioned: false,
        mention_type: null,
        competitor_name: null,
        confidence: 0,
      };
    }

    return parseClassificationResponse(result.completion);
  };
}

// ============================================================================
// Orchestration
// ============================================================================

/**
 * Detect a brand mention in an AI engine response.
 *
 * 1. Deterministic direct/domain match short-circuits (no LLM, confidence 1).
 * 2. Otherwise the semantic classifier resolves paraphrase vs competitor vs none.
 * 3. Any classifier error degrades to a safe no-match.
 */
export async function detectBrandMention(
  responseText: string,
  context: BrandMentionContext,
  classifier: SemanticClassifier
): Promise<MentionAnalysis> {
  const direct = detectDirectMention(responseText, context);
  if (direct) return direct;

  let classification: SemanticClassification;
  try {
    classification = await classifier(responseText, context);
  } catch (error) {
    logger.warn(
      `Semantic mention classification failed, defaulting to no-match: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return { brand_mentioned: false, mention_type: null, citation_url: null };
  }

  return {
    brand_mentioned: classification.brand_mentioned,
    mention_type: classification.mention_type,
    citation_url: classification.brand_mentioned
      ? extractCitationUrl(responseText, context.orgDomain)
      : null,
    competitor_name: classification.competitor_name ?? null,
    confidence: classification.confidence,
  };
}
