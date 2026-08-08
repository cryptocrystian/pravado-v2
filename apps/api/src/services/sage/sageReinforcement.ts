/**
 * SAGE Cross-Pillar Reinforcement (Wave-2 — SAGE mesh: cross-pillar REINFORCEMENT).
 *
 * "Outputs become inputs across dimensions." SAGE is a causal engine, not a linear
 * scorer: an action completing in one pillar strengthens the SIGNALS of the other
 * pillars. Canon SAGE_OPERATING_MODEL §3 (Cross-Pillar Reinforcement Matrix):
 *
 *   §3.1 (L169): "Every action in one pillar reinforces outcomes in other pillars.
 *   This is not metaphorical—it is causal and measurable."
 *
 * The reinforcement COEFFICIENTS are canon-verbatim from §3.3 "Reinforcement
 * Coefficients" (lines 189-195):
 *
 *   | Source → Recipient | Coefficient |  (SAGE_OPERATING_MODEL §3.3 L190-195)
 *   | ------------------ | ----------- |
 *   | PR → Content       | 0.50        |
 *   | PR → SEO           | 0.35        |
 *   | Content → PR       | 0.45        |
 *   | Content → SEO      | 0.70        |
 *   | SEO → PR           | 0.25        |
 *   | SEO → Content      | 0.35        |
 *
 * NO WEIGHT IS INVENTED. The CiteMind-enhanced coefficients (§8.7, e.g. PR→SEO 0.50)
 * are a LATER slice — this base-mesh slice uses ONLY the §3.3 base coefficients.
 *
 * Persistence: reinforcement events are written to `sage_signal_reinforcements`
 * (migration 109), org-scoped and additive ("Accumulation: Authority compounds",
 * §2.2 L99). The opportunity scorer sums a signal's recipient-pillar reinforcements
 * and adds them to the (decayed) signal strength.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from '../../lib/logger';

const logger = createLogger('sage:reinforcement');

export type Pillar = 'PR' | 'Content' | 'SEO';

/**
 * Canon reinforcement matrix: source pillar → { recipient pillar → coefficient }.
 * Values are canon §3.3 (L190-195). A source never reinforces itself (that is
 * "Direct impact (1.0)" in §3.2, handled by the primary scorer, not cross-pillar).
 */
export const REINFORCEMENT_MATRIX: Record<
  Pillar,
  Partial<Record<Pillar, number>>
> = {
  PR: { Content: 0.5, SEO: 0.35 }, // §3.3 L190-191
  Content: { PR: 0.45, SEO: 0.7 }, // §3.3 L192-193
  SEO: { PR: 0.25, Content: 0.35 }, // §3.3 L194-195
};

export interface PropagateReinforcementArgs {
  orgId: string;
  /** Pillar of the action that just completed (the SOURCE). */
  sourcePillar: string;
  sourceSignalType: string;
  /** Provenance: the sage_outcomes row this reinforcement flowed from (audit). */
  sourceOutcomeId: string;
  /**
   * Magnitude of the completed action's impact (EVI points). Reinforcement delta =
   * coefficient × sourceImpact. When the outcome carries no EVI estimate this is 0,
   * yielding a 0 delta — we never substitute an invented base magnitude.
   */
  sourceImpact: number;
}

export interface ReinforcementRow {
  org_id: string;
  source_outcome_id: string;
  source_pillar: Pillar;
  source_signal_type: string;
  recipient_pillar: Pillar;
  coefficient: number;
  strength_delta: number;
}

/**
 * Build the reinforcement rows a completed action emits — one per canon recipient
 * pillar of the source. Pure (no I/O) so the matrix math is unit-testable.
 */
export function buildReinforcementRows(
  args: PropagateReinforcementArgs
): ReinforcementRow[] {
  const source = args.sourcePillar as Pillar;
  const targets = REINFORCEMENT_MATRIX[source];
  if (!targets) return [];

  const impact = Number.isFinite(args.sourceImpact) ? args.sourceImpact : 0;
  const rows: ReinforcementRow[] = [];

  for (const [recipient, coefficient] of Object.entries(targets)) {
    rows.push({
      org_id: args.orgId,
      source_outcome_id: args.sourceOutcomeId,
      source_pillar: source,
      source_signal_type: args.sourceSignalType,
      recipient_pillar: recipient as Pillar,
      coefficient,
      // Additive boost to recipient-pillar signal strength (canon coefficient ×
      // source impact). Rounded to keep the persisted value deterministic.
      strength_delta: Math.round(coefficient * impact * 10000) / 10000,
    });
  }
  return rows;
}

/**
 * Persist cross-pillar reinforcement for a completed action. Writes one
 * `sage_signal_reinforcements` row per canon recipient pillar. Best-effort: a
 * reinforcement write failure must NOT fail the execution outcome (the loop closure
 * already succeeded), so we log and continue.
 */
export async function propagateReinforcement(
  supabase: SupabaseClient,
  args: PropagateReinforcementArgs
): Promise<{ rows: number }> {
  const rows = buildReinforcementRows(args);
  if (rows.length === 0) return { rows: 0 };

  const { error } = await supabase
    .from('sage_signal_reinforcements')
    .insert(rows);

  if (error) {
    logger.error(
      `Failed to persist reinforcement for org ${args.orgId} (source ${args.sourcePillar}): ${error.message}`
    );
    return { rows: 0 };
  }
  return { rows: rows.length };
}

/**
 * Aggregate the reinforcement boost currently applied to each pillar for an org.
 * Sums `strength_delta` grouped by `recipient_pillar`. The scorer adds the boost for
 * a signal's pillar to that signal's decayed strength.
 */
export async function fetchReinforcementByPillar(
  supabase: SupabaseClient,
  orgId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('sage_signal_reinforcements')
    .select('recipient_pillar, strength_delta')
    .eq('org_id', orgId);

  const totals: Record<string, number> = { PR: 0, Content: 0, SEO: 0 };
  if (error) {
    logger.error(
      `Failed to fetch reinforcement for org ${orgId}: ${error.message}`
    );
    return totals;
  }
  for (const r of data ?? []) {
    const pillar = (r as { recipient_pillar: string }).recipient_pillar;
    const delta = Number((r as { strength_delta: number }).strength_delta) || 0;
    totals[pillar] = (totals[pillar] ?? 0) + delta;
  }
  return totals;
}
