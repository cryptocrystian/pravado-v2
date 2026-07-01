/**
 * Shared monthly LLM token-budget helper (F13 Tier 2 remediation).
 *
 * Extracted from sageProposalGenerator.ts so signal-driven and cold-start
 * proposal generation share the same budget check. Pure motion — no
 * behavior change from the pre-refactor state.
 *
 * The check queries `llm_usage_ledger` for the caller's org for the
 * current calendar month (UTC) and compares against MONTHLY_TOKEN_BUDGET.
 * If we're over budget, we return false and the caller drops to stub-only
 * output. This prevents any single org from running away with LLM spend.
 */

import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('sage:llm-budget');

/**
 * Conservative default cap. Tune if we ever need per-org overrides —
 * the ledger row already carries the org_id so a per-org limits table
 * can layer over this later without touching this helper's callers.
 */
export const MONTHLY_TOKEN_BUDGET = 500_000;

/**
 * Return `true` if the org is still within its monthly LLM token budget,
 * `false` if not. On DB read failure we conservatively assume within-budget
 * so a transient Supabase blip doesn't lock the caller out of LLM calls.
 */
export async function checkLLMBudget(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  const { data } = await supabase
    .from('llm_usage_ledger')
    .select('tokens_total')
    .eq('org_id', orgId)
    .gte('created_at', monthStart);

  const totalTokens = (data ?? []).reduce(
    (sum: number, row: { tokens_total: number }) =>
      sum + (row.tokens_total || 0),
    0
  );

  const withinBudget = totalTokens < MONTHLY_TOKEN_BUDGET;
  if (!withinBudget) {
    logger.warn(
      `Org ${orgId} exceeded monthly LLM budget: ${totalTokens}/${MONTHLY_TOKEN_BUDGET}`
    );
  }
  return withinBudget;
}
