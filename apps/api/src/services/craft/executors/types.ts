/**
 * CRAFT per-pillar action executor contract (Wave-2 — SAGE proposals that ACT).
 *
 * An executor turns a structured SAGE proposal (`action_type` + `action_params`)
 * into a REAL, governed effect in its pillar's backend, and returns the outcome the
 * CRAFT lifecycle records. Executors run INSIDE the governed execution lifecycle
 * (after markExecuting, before completeExecution) — they do NOT flip proposals, write
 * audit rows, or bypass the mode/risk envelope computed at intake (that governance is
 * owned by craftExecutionService). This keeps CRAFT's "No Silent Automation"
 * guarantee: an executor can only run as part of an already-audited, human-initiated
 * execution.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { OutcomeResult } from '../craftExecutionService';

/** Context handed to every executor. Org-scoped; carries the loop's linkage ids. */
export interface ExecutorContext {
  supabase: SupabaseClient;
  orgId: string;
  proposalId: string;
  executionId: string;
  /**
   * The human initiating this execution, when there is one (e.g. the approver in
   * the PR pitch review flow). Optional: autonomous/scheduled executions have no
   * acting user. Used to resolve outreach reply-to; never affects governance.
   */
  actingUser?: { id?: string; email?: string; name?: string };
}

/**
 * What an executor returns to the lifecycle.
 *   - `result: 'success'`  → a VERIFIED business effect happened (e.g. a brief row
 *     was actually created). This is intentionally distinct from the neutral
 *     `governed_complete` the no-op path records.
 *   - `result: 'failure'`  → the effect could not be produced.
 *   - `detail` → recorded on the audit + outcome rows (real ids, not fabricated).
 */
export interface ExecutorResult {
  result: OutcomeResult;
  detail: Record<string, unknown>;
}

/** A loosely-typed proposal row (the executor reads action_params + title). */
export type ProposalRecord = Record<string, unknown>;

export type ActionExecutor = (
  proposal: ProposalRecord,
  ctx: ExecutorContext
) => Promise<ExecutorResult>;
