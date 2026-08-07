/**
 * SEO `seo.generate_schema` executor (Wave-2 — the THIRD concrete per-pillar
 * executor, completing the Content + PR + SEO set).
 *
 * Given a `seo.generate_schema` proposal carrying a `content_item_id`, this loads the
 * content item (org-scoped), runs CiteMind Engine-1's schema generator
 * (citeMindSchemaGenerator.generateSchema) to produce the appropriate JSON-LD
 * (Article / BlogPosting / NewsArticle / HowTo / FAQPage / Organization / Person),
 * and PERSISTS it to the dedicated `citemind_schemas` table (migration 82 —
 * org_id + content_item_id + schema_type + schema_json). The generator's own upsert
 * IS the persistence; no new table/column and therefore NO migration is required.
 *
 * This is the lowest-stakes executor in the set: it produces JSON-LD metadata only —
 * nothing is sent, no money moves, no legal surface is touched, and the effect is
 * fully reversible (the schema row can be regenerated/deleted).
 *
 * Governance: runs INSIDE the already-audited, human-initiated CRAFT execution
 * (see executors/types.ts) — between markExecuting and completeExecution. It does NOT
 * flip proposals, write audit rows, or bypass the mode/risk envelope; the lifecycle
 * (craftExecutionService) owns that. It only produces the pillar effect + the outcome.
 *
 * OUTCOME SEMANTICS — three distinct, honest cases (never fabricate):
 *   - Schema generated AND persisted to citemind_schemas       → `success`
 *     (VERIFIED effect: the json_ld row + its schema_type).
 *   - No `content_item_id` on the proposal, OR the referenced content item does not
 *     exist for this org                                        → `governed_complete`
 *     (neutral, carrying the reason — we never invent a content id or a fake schema).
 *   - The generator or the persist step threw                  → `failure`
 *     (the effect could not be produced).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActionExecutor, ExecutorContext, ExecutorResult } from './types';
import { generateSchema } from '../../citeMind/citeMindSchemaGenerator';

interface GenerateSchemaParams {
  content_item_id?: unknown;
  contentItemId?: unknown;
}

/** Result shape the generator returns (schema_type + persisted content_item_id). */
interface GeneratedSchema {
  schema_type: string;
  content_item_id: string;
}

/**
 * Injectable seams so the executor's three-way logic is unit-testable without a live
 * DB or the full generator. `loadContentItem` is the org-scoped existence check that
 * distinguishes the neutral "no eligible content" path from a real generator failure;
 * `generate` defaults to CiteMind Engine-1's generateSchema (which itself persists).
 */
export interface SeoGenerateSchemaDeps {
  loadContentItem?: (
    supabase: SupabaseClient,
    contentItemId: string,
    orgId: string
  ) => Promise<{ id: string } | null>;
  generate?: (
    supabase: SupabaseClient,
    contentItemId: string,
    orgId: string
  ) => Promise<GeneratedSchema>;
}

function asTrimmedString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Default org-scoped existence check. A missing row here yields the NEUTRAL
 * governed_complete (not a failure) — the action was well-formed, there is simply
 * nothing eligible to generate schema for.
 */
async function defaultLoadContentItem(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('content_items')
    .select('id')
    .eq('id', contentItemId)
    .eq('org_id', orgId)
    .maybeSingle();
  return data ? { id: data.id as string } : null;
}

/**
 * Core, dependency-injected implementation. `seoGenerateSchemaExecutor` is the thin
 * production binding; tests call this with fake load/generate seams to assert the
 * three-way outcome without a DB.
 */
export async function runSeoGenerateSchema(
  proposal: Record<string, unknown>,
  ctx: ExecutorContext,
  deps: SeoGenerateSchemaDeps = {}
): Promise<ExecutorResult> {
  const params = (proposal.action_params ?? {}) as GenerateSchemaParams;
  const contentItemId = asTrimmedString(
    params.content_item_id ?? params.contentItemId
  );

  // ---- Case 2a: no content_item_id → neutral governed completion (nothing to do).
  // The SEO signals (sageSEOSignalIngestor) carry a keyword, not a content id, so at
  // proposal time this is the common path. We NEVER fabricate a content id.
  if (!contentItemId) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'seo_schema_needs_content',
        action_type: 'seo.generate_schema',
        note: 'No content_item_id on the proposal; nothing to generate schema for (no fabricated content id).',
      },
    };
  }

  // ---- Case 2b: content_item_id present but no such org-scoped content item.
  const loadContentItem = deps.loadContentItem ?? defaultLoadContentItem;
  const existing = await loadContentItem(
    ctx.supabase,
    contentItemId,
    ctx.orgId
  );
  if (!existing) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'seo_schema_content_not_found',
        action_type: 'seo.generate_schema',
        note: 'Referenced content item not found for this org; nothing generated.',
        content_item_id: contentItemId,
      },
    };
  }

  // ---- Case 1 vs 3: run the generator (which persists to citemind_schemas).
  const generate = deps.generate ?? generateSchema;
  try {
    const generated = await generate(ctx.supabase, contentItemId, ctx.orgId);
    // A real JSON-LD row was written to citemind_schemas → VERIFIED success.
    return {
      result: 'success',
      detail: {
        kind: 'seo_schema_generated',
        action_type: 'seo.generate_schema',
        content_item_id: generated.content_item_id,
        schema_type: generated.schema_type,
        // Linkage back to the governed action that produced the effect (the
        // sage_outcomes row links the other way).
        proposal_id: ctx.proposalId,
        execution_id: ctx.executionId,
      },
    };
  } catch (err) {
    // ---- Case 3: the generator or its persist step errored → honest failure.
    const message = err instanceof Error ? err.message : String(err);
    return {
      result: 'failure',
      detail: {
        kind: 'seo_schema_generation_failed',
        action_type: 'seo.generate_schema',
        content_item_id: contentItemId,
        error: message,
      },
    };
  }
}

export const seoGenerateSchemaExecutor: ActionExecutor = (proposal, ctx) =>
  runSeoGenerateSchema(proposal, ctx);
