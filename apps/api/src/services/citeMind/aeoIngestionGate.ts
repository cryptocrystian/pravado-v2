/**
 * AEO Ingestion-Readiness Gate — CiteMind Engine 1 (Lane D)
 *
 * Implements the non-optional Pre-Publish AEO Gate defined in
 * SEO_AEO_PILLAR_CANON.md §3E, using the AEO Score formula from §3C:
 *
 *   AEO Score = (Entity Clarity   × 0.30)
 *             + (Schema Coverage   × 0.25)
 *             + (Semantic Depth    × 0.25)
 *             + (Authority Signal  × 0.20)
 *
 * Score bands (§3C):
 *   0–40   Not Eligible          → gate BLOCKS (bypass always permitted)
 *   41–60  Partially Eligible    → gate PASSES
 *   61–80  Citation-Ready        → gate PASSES
 *   81–100 Citation-Dominant     → gate PASSES
 *
 * The gate is ADVISORY per canon §3E: "Bypass is always permitted ... The gate
 * is advisory, not a hard block. But the score and explanation must be shown."
 * This service is standalone; the Content publish path calls it (it does not
 * own the publish transition).
 *
 * All component scoring is deterministic/heuristic (no LLM) so the gate is fast,
 * free, and Autopilot-eligible per §3D.
 *
 * FUTURE (explicitly deferred Lane-D slice): the Authority Signal component
 * currently derives from in-content citation/link signals only. Wiring real
 * referring-domain authority (WHOIS_XML backlinks) and GSC-derived internal
 * link equity into Authority Signal is a later slice and is NOT built here.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

import { detectSchemaType, type SchemaType } from './citeMindSchemaGenerator';

const logger = createLogger('citemind:aeo-gate');

// ============================================================================
// Constants
// ============================================================================

/** Weights — canon SEO_AEO_PILLAR_CANON.md §3C. */
export const AEO_WEIGHTS = {
  entity_clarity: 0.3,
  schema_coverage: 0.25,
  semantic_depth: 0.25,
  authority_signal: 0.2,
} as const;

/** Below this score the gate blocks (advisory) — canon §3E ("Score < 41"). */
export const AEO_GATE_THRESHOLD = 41;

export const AEO_GATE_VERSION = '1.0';

// ============================================================================
// Types
// ============================================================================

export type AeoBand =
  | 'not_eligible'
  | 'partially_eligible'
  | 'citation_ready'
  | 'citation_dominant';

export interface AeoComponentScores {
  entity_clarity: number;
  schema_coverage: number;
  semantic_depth: number;
  authority_signal: number;
}

export interface AeoGateResult {
  content_item_id: string;
  aeo_score: number;
  band: AeoBand;
  /** true when score >= AEO_GATE_THRESHOLD. */
  passed: boolean;
  /** true when score < AEO_GATE_THRESHOLD (advisory block). */
  blocked: boolean;
  /** Always true per canon §3E — users may always publish below threshold. */
  bypass_allowed: true;
  components: AeoComponentScores;
  detected_schema_type: SchemaType;
  gaps: string[];
  explanation: string;
  gate_version: string;
  evaluated_at: string;
}

interface ContentItemForGate {
  id: string;
  org_id: string;
  title: string;
  body: string | null;
  content_type: string;
  url: string | null;
}

interface SchemaRow {
  schema_type: string;
  schema_json: Record<string, unknown> | null;
}

// ============================================================================
// Band + score helpers
// ============================================================================

export function bandForScore(score: number): AeoBand {
  if (score <= 40) return 'not_eligible';
  if (score <= 60) return 'partially_eligible';
  if (score <= 80) return 'citation_ready';
  return 'citation_dominant';
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// ============================================================================
// Component scorers (deterministic heuristics)
// ============================================================================

/**
 * Entity Clarity — how clearly the content establishes who/what/when/where for
 * AI extraction. Rewards named-entity density + presence of dates/numbers,
 * penalizes ambiguous-pronoun-heavy prose (canon "avoid ambiguous pronouns").
 */
export function scoreEntityClarity(title: string, body: string): number {
  const text = `${title}\n${body}`;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  // Proper-noun / named-entity signal: capitalized tokens not at sentence start.
  const properNouns = (text.match(/(?<=\w[.,;:]?\s)[A-Z][a-zA-Z]{2,}/g) || []).length;
  const properNounDensity = properNouns / words.length; // typical good content ~0.05–0.15

  // Explicit dates and numeric facts anchor when/what.
  const hasDate = /\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}\b/.test(
    text
  );
  const numericFacts = (text.match(/\b\d[\d,.]*%?\b/g) || []).length;

  // Ambiguous pronouns dilute entity clarity.
  const pronouns = (text.match(/\b(it|they|them|this|that|these|those)\b/gi) || []).length;
  const pronounRatio = pronouns / words.length;

  let score = 0;
  score += Math.min(55, properNounDensity * 500); // up to 55
  score += hasDate ? 15 : 0;
  score += Math.min(20, numericFacts * 2); // up to 20
  score += 10; // baseline for having titled content
  score -= Math.min(30, pronounRatio * 300); // penalty up to 30

  return clamp(Math.round(score));
}

/**
 * Semantic Depth — breadth and depth of topical coverage. Rewards length,
 * section/heading structure, and lexical richness (type-token ratio).
 */
export function scoreSemanticDepth(body: string): number {
  const words = body.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return 0;

  // Length: saturates near ~1500 words.
  const lengthScore = Math.min(40, (wordCount / 1500) * 40);

  // Structure: markdown/HTML headings indicate multi-facet coverage.
  const headings =
    (body.match(/^#{1,6}\s+/gm) || []).length + (body.match(/<h[1-6][\s>]/gi) || []).length;
  const structureScore = Math.min(30, headings * 6);

  // Lexical richness: unique-word ratio (capped sample to avoid TTR bias).
  const sample = words.slice(0, 800).map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const unique = new Set(sample.filter(Boolean)).size;
  const ttr = sample.length > 0 ? unique / sample.length : 0;
  const richnessScore = Math.min(30, ttr * 60);

  return clamp(Math.round(lengthScore + structureScore + richnessScore));
}

/**
 * Authority Signal — in-content authority proxies: outbound citations to
 * sources, presence of data/statistics, and explicit attributions.
 * (Referring-domain authority + internal link equity = FUTURE Lane-D slice.)
 */
export function scoreAuthoritySignal(body: string): number {
  // Outbound links / citations (markdown or html).
  const mdLinks = (body.match(/\]\(https?:\/\/[^)]+\)/g) || []).length;
  const htmlLinks = (body.match(/<a\s[^>]*href=["']https?:\/\//gi) || []).length;
  const outbound = mdLinks + htmlLinks;

  // Data density and attributions ("according to", "study", "report").
  const stats = (body.match(/\b\d+(\.\d+)?\s?(%|percent)\b/gi) || []).length;
  const attributions = (body.match(/\b(according to|study|research|report|survey|data from)\b/gi) || [])
    .length;

  let score = 20; // neutral baseline (no live backlink data yet)
  score += Math.min(35, outbound * 8);
  score += Math.min(25, stats * 5);
  score += Math.min(20, attributions * 5);

  return clamp(Math.round(score));
}

/**
 * Schema Coverage — percentage of applicable schema types present and valid in
 * citemind_schemas. Applicable set = detected primary type (+ FAQ/HowTo when
 * format signals are present).
 */
export function computeSchemaCoverage(
  detected: SchemaType,
  title: string,
  body: string,
  presentSchemas: SchemaRow[]
): number {
  const applicable = new Set<SchemaType>([detected]);

  // Format overlays that warrant their own schema even for an Article.
  const questionCount = (body.match(/\?[\s\n]/g) || []).length;
  if (questionCount >= 3 || /faq|frequently asked/i.test(title)) applicable.add('FAQPage');
  if (/how to|step 1/i.test(`${title}\n${body}`)) applicable.add('HowTo');

  const validPresent = new Set<string>();
  for (const row of presentSchemas) {
    const json = row.schema_json;
    const valid =
      json != null &&
      typeof json === 'object' &&
      typeof (json as Record<string, unknown>)['@type'] === 'string' &&
      Object.keys(json).length >= 3;
    if (valid) validPresent.add(String((json as Record<string, unknown>)['@type']));
  }

  let covered = 0;
  for (const t of applicable) {
    if (validPresent.has(t)) covered += 1;
  }
  return clamp(Math.round((covered / applicable.size) * 100));
}

// ============================================================================
// Gaps + explanation
// ============================================================================

function buildGaps(components: AeoComponentScores): string[] {
  const gaps: string[] = [];
  if (components.entity_clarity < 60)
    gaps.push(
      'Entity clarity is low — name the key people, organizations, dates, and figures explicitly and reduce ambiguous pronouns.'
    );
  if (components.schema_coverage < 60)
    gaps.push(
      'Schema coverage is incomplete — generate/approve the applicable JSON-LD (e.g. Article/FAQ/Organization) before publishing.'
    );
  if (components.semantic_depth < 60)
    gaps.push(
      'Semantic depth is thin — expand topical coverage, add structured sections/headings, and broaden the vocabulary.'
    );
  if (components.authority_signal < 60)
    gaps.push(
      'Authority signal is weak — cite authoritative sources, add supporting data/statistics, and attribute claims.'
    );
  return gaps;
}

// ============================================================================
// Core computation (pure — testable without persistence)
// ============================================================================

export function computeAeoScore(
  item: { title: string; body: string | null; content_type: string },
  presentSchemas: SchemaRow[]
): { score: number; components: AeoComponentScores; detected: SchemaType } {
  const title = item.title || '';
  const body = item.body || '';

  const detected = detectSchemaType(title, body, item.content_type);

  const components: AeoComponentScores = {
    entity_clarity: scoreEntityClarity(title, body),
    schema_coverage: computeSchemaCoverage(detected, title, body, presentSchemas),
    semantic_depth: scoreSemanticDepth(body),
    authority_signal: scoreAuthoritySignal(body),
  };

  const score = Math.round(
    components.entity_clarity * AEO_WEIGHTS.entity_clarity +
      components.schema_coverage * AEO_WEIGHTS.schema_coverage +
      components.semantic_depth * AEO_WEIGHTS.semantic_depth +
      components.authority_signal * AEO_WEIGHTS.authority_signal
  );

  return { score: clamp(score), components, detected };
}

// ============================================================================
// Public gate — fetches content + schemas, computes, optionally persists
// ============================================================================

/**
 * Run the Pre-Publish AEO ingestion-readiness gate for a content item.
 *
 * @param persist when true (default), records the result to aeo_gate_results.
 */
export async function runAeoGate(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string,
  opts: { persist?: boolean } = {}
): Promise<AeoGateResult> {
  const persist = opts.persist !== false;

  const { data: item, error } = await supabase
    .from('content_items')
    .select('id, org_id, title, body, content_type, url')
    .eq('id', contentItemId)
    .eq('org_id', orgId)
    .single();

  if (error || !item) {
    throw new Error(`Content item ${contentItemId} not found: ${error?.message ?? 'no row'}`);
  }
  const content = item as ContentItemForGate;

  // Fetch already-generated schemas for the schema-coverage component.
  const { data: schemaRows } = await supabase
    .from('citemind_schemas')
    .select('schema_type, schema_json')
    .eq('content_item_id', contentItemId)
    .eq('org_id', orgId);

  const presentSchemas = (schemaRows as SchemaRow[] | null) ?? [];

  const { score, components, detected } = computeAeoScore(content, presentSchemas);
  const band = bandForScore(score);
  const blocked = score < AEO_GATE_THRESHOLD;
  const gaps = buildGaps(components);

  const explanation = blocked
    ? `This content is unlikely to be cited by AI systems (AEO score ${score}/100, "${humanBand(band)}"). Address the gaps below or publish anyway to bypass.`
    : `AEO score ${score}/100 ("${humanBand(band)}"). Content is eligible for AI citation.`;

  const result: AeoGateResult = {
    content_item_id: contentItemId,
    aeo_score: score,
    band,
    passed: !blocked,
    blocked,
    bypass_allowed: true,
    components,
    detected_schema_type: detected,
    gaps,
    explanation,
    gate_version: AEO_GATE_VERSION,
    evaluated_at: new Date().toISOString(),
  };

  if (persist) {
    const { error: insertError } = await supabase.from('aeo_gate_results').insert({
      org_id: orgId,
      content_item_id: contentItemId,
      aeo_score: score,
      band,
      passed: result.passed,
      blocked: result.blocked,
      entity_clarity_score: components.entity_clarity,
      schema_coverage_score: components.schema_coverage,
      semantic_depth_score: components.semantic_depth,
      authority_signal_score: components.authority_signal,
      detected_schema_type: detected,
      gaps,
      explanation,
      gate_version: AEO_GATE_VERSION,
    });
    if (insertError) {
      // Non-fatal: never let audit persistence block the gate decision.
      logger.warn(`Failed to persist AEO gate result: ${insertError.message}`);
    }
  }

  logger.info(
    `AEO gate for ${contentItemId}: score=${score} band=${band} passed=${result.passed}`
  );

  return result;
}

function humanBand(band: AeoBand): string {
  switch (band) {
    case 'not_eligible':
      return 'Not Eligible';
    case 'partially_eligible':
      return 'Partially Eligible';
    case 'citation_ready':
      return 'Citation-Ready';
    case 'citation_dominant':
      return 'Citation-Dominant';
  }
}
