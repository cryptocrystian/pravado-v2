/**
 * CRAFT Governed Execution Service (Wave-2 — SAGE↔CRAFT loop closure).
 *
 * Before this slice, "executing" a SAGE proposal was a status flip on
 * `sage_proposals` (terminal, ungoverned, no audit, no outcome). That left the
 * SAGE → CRAFT → outcome → SAGE loop OPEN. This service closes it:
 *
 *   proposal → executeProposal()  → sage_executions row (state 'queued')
 *                                  → immutable sage_execution_audit row ('queued')
 *                                  → enqueue on the real execution substrate
 *          → worker transitions   → sage_executions state 'executing' (+ audit)
 *          → completeExecution()  → sage_executions terminal (completed/failed)
 *                                  → immutable audit row (outcome)
 *                                  → sage_outcomes row linked to proposal + signal
 *                                  → sage_signal_outcome_tally upsert  (feedback → SAGE)
 *                                  → sage_signal_reinforcements (cross-pillar mesh)
 *
 * Governance (CRAFT_EXECUTION_MODEL): the execution mode is COMPUTED from
 * Confidence × Risk × Reversibility × plan-ceiling — NOT a plan-default label.
 * `Mode = f(Confidence, Risk, Reversibility, Trust, Plan)` (canon §2.2). Trust
 * ladder + autonomous Autopilot execution are a LATER slice, so this slice keeps
 * Autopilot GATED: even when the matrix yields an Autopilot-eligible mode, actual
 * execution requires the human action that initiated it (requires_approval), and no
 * `system`-initiated autonomous path exists.
 *
 * Pure functions that take the Supabase client (mirrors modeService /
 * sageProposalActionService) so the governance logic is unit-testable without a
 * live queue or Fastify.
 */

import type { AutomationMode } from '@pravado/types';
import { clampMode } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getPlanCeiling, resolveOrgPlanSlug } from '../mode/modeService';
import { deriveImpactPillars } from '../sage/sageImpactPillars';
import { propagateReinforcement } from '../sage/sageReinforcement';

export type RiskClass = 'low' | 'medium' | 'high' | 'critical';
export type Reversibility = 'fully' | 'partially' | 'irreversible';

/**
 * Autonomous Autopilot execution is NOT enabled in this slice. The trust ladder,
 * guardrail metering, and per-engine ceilings that canon requires before an action
 * can run with no human in the loop (CRAFT §2/§6, SAGE "Automation Overreach"
 * failure mode) are a LATER slice. Until then, every governed execution requires the
 * initiating human action — this flag is the single switch that later slices flip.
 */
export const AUTONOMOUS_AUTOPILOT_ENABLED = false;

// ---------------------------------------------------------------------------
// Risk + reversibility classification (CRAFT §4.3 / §5.4).
//
// Keyed by action semantics inferred from pillar + signal_type. Conservative by
// construction: unknown maps to the more restrictive tier. The full 4-dimension
// weighted risk score (Externality/Magnitude/Recovery/Precedent) is a LATER slice;
// this slice ships the canon's own "by action type" ceiling tables as a lookup.
// ---------------------------------------------------------------------------

const IRREVERSIBLE_MARKERS: readonly string[] = [
  'pitch',
  'outreach',
  'email',
  'press_release',
  'publish',
  'statement',
  'send',
  'spend',
];

const FULLY_REVERSIBLE_MARKERS: readonly string[] = [
  'draft',
  'schedule',
  'tag',
  'internal',
  'audit',
  'analyze',
  'monitor',
];

export function classifyReversibility(
  pillar: string,
  signalType: string
): Reversibility {
  const st = (signalType || '').toLowerCase();
  if (IRREVERSIBLE_MARKERS.some((m) => st.includes(m))) return 'irreversible';
  if (FULLY_REVERSIBLE_MARKERS.some((m) => st.includes(m))) return 'fully';
  // PR actions are external-facing by default → conservatively irreversible unless
  // clearly a draft/internal action.
  if (pillar === 'PR') return 'irreversible';
  // Owned Content publishing / SEO changes are partially reversible.
  return 'partially';
}

const CRITICAL_MARKERS: readonly string[] = ['crisis', 'legal', 'incident'];
const HIGH_MARKERS: readonly string[] = [
  'press_release',
  'public',
  'statement',
];

/**
 * Risk class by action semantics + reversibility (CRAFT §5.3/§5.4). Irreversible
 * external actions floor at High; partially reversible at Medium; fully reversible
 * internal actions at Low. Crisis/legal escalate to Critical.
 */
export function classifyRisk(
  _pillar: string,
  signalType: string,
  reversibility: Reversibility
): RiskClass {
  const st = (signalType || '').toLowerCase();
  if (CRITICAL_MARKERS.some((m) => st.includes(m))) return 'critical';
  if (HIGH_MARKERS.some((m) => st.includes(m))) return 'high';
  if (reversibility === 'irreversible') return 'high';
  if (reversibility === 'partially') return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Computed mode eligibility (CRAFT §2.2 Mode Eligibility Matrix).
// ---------------------------------------------------------------------------

/** Risk → mode ceiling (canon §5.3). */
function riskCeiling(risk: RiskClass): AutomationMode {
  switch (risk) {
    case 'low':
      return 'autopilot';
    case 'medium':
      return 'copilot';
    default:
      return 'manual'; // high, critical
  }
}

/** Reversibility → mode ceiling (canon §4.2). */
function reversibilityCeiling(rev: Reversibility): AutomationMode {
  switch (rev) {
    case 'fully':
      return 'autopilot';
    case 'partially':
      return 'copilot';
    default:
      return 'manual'; // irreversible
  }
}

/** Confidence → mode ceiling (canon §2.2: Autopilot ≥0.85, Copilot ≥0.70). */
function confidenceCeiling(confidence: number): AutomationMode {
  if (confidence >= 0.85) return 'autopilot';
  if (confidence >= 0.7) return 'copilot';
  return 'manual';
}

export interface ComputeModeInput {
  confidence: number;
  riskClass: RiskClass;
  reversibility: Reversibility;
  planCeiling: AutomationMode;
}

export interface ComputedMode {
  /** Eligible mode = min(risk, reversibility, confidence, plan) ceilings. */
  mode: AutomationMode;
  requiresApproval: boolean;
  rationale: {
    riskCeiling: AutomationMode;
    reversibilityCeiling: AutomationMode;
    confidenceCeiling: AutomationMode;
    planCeiling: AutomationMode;
    autonomousAutopilotEnabled: boolean;
  };
}

/**
 * Compute the eligible execution mode. The eligible mode is the MOST RESTRICTIVE of
 * the four canonical ceilings (never exceeds the plan ceiling — money-code). Because
 * autonomous Autopilot is disabled this slice, `requiresApproval` is always true
 * even at Autopilot eligibility: the initiating human action IS the approval.
 */
export function computeExecutionMode(input: ComputeModeInput): ComputedMode {
  const rc = riskCeiling(input.riskClass);
  const revc = reversibilityCeiling(input.reversibility);
  const cc = confidenceCeiling(input.confidence);

  // Fold the ceilings by clamping down repeatedly from 'autopilot'.
  let mode: AutomationMode = 'autopilot';
  mode = clampMode(mode, 'manual', rc);
  mode = clampMode(mode, 'manual', revc);
  mode = clampMode(mode, 'manual', cc);
  mode = clampMode(mode, 'manual', input.planCeiling);

  const requiresApproval =
    !AUTONOMOUS_AUTOPILOT_ENABLED || mode !== 'autopilot';

  return {
    mode,
    requiresApproval,
    rationale: {
      riskCeiling: rc,
      reversibilityCeiling: revc,
      confidenceCeiling: cc,
      planCeiling: input.planCeiling,
      autonomousAutopilotEnabled: AUTONOMOUS_AUTOPILOT_ENABLED,
    },
  };
}

// ---------------------------------------------------------------------------
// executeProposal — proposal → governed execution + audit + enqueue.
// ---------------------------------------------------------------------------

export interface ProposalForExecution {
  id: string;
  org_id: string;
  signal_id?: string | null;
  signal_type: string;
  pillar: string;
  confidence?: number | null;
  evi_impact_estimate?: number | null;
  impact_pillars?: string[] | null;
}

/** Injected substrate: enqueue the governed execution onto the real queue. */
export type EnqueueExecution = (args: {
  executionId: string;
  orgId: string;
  proposalId: string;
}) => Promise<void>;

export interface ExecuteProposalDeps {
  /** Real BullMQ enqueue in production; a spy in tests. Optional → dispatch is a
   *  recorded no-op (execution is still created + audited so the loop is closed
   *  and reconcilable even when Redis is down). */
  enqueue?: EnqueueExecution;
}

export type ExecuteProposalResult =
  | {
      ok: true;
      executionId: string;
      mode: AutomationMode;
      riskClass: RiskClass;
      reversibility: Reversibility;
      requiresApproval: boolean;
    }
  | { ok: false; reason: 'write_failed' };

/**
 * Create a governed CRAFT execution for a proposal: classify risk/reversibility,
 * compute the mode against the plan ceiling, persist the execution (state 'queued'),
 * write the immutable 'queued' audit row, and enqueue onto the execution substrate.
 */
export async function executeProposal(
  supabase: SupabaseClient,
  args: { proposal: ProposalForExecution; userId: string },
  deps: ExecuteProposalDeps = {}
): Promise<ExecuteProposalResult> {
  const { proposal, userId } = args;
  const orgId = proposal.org_id;

  const planSlug = (await resolveOrgPlanSlug(supabase, orgId)) ?? 'starter';
  const planCeiling = getPlanCeiling(planSlug);

  const confidence = Number(proposal.confidence ?? 0);
  const reversibility = classifyReversibility(
    proposal.pillar,
    proposal.signal_type
  );
  const riskClass = classifyRisk(
    proposal.pillar,
    proposal.signal_type,
    reversibility
  );
  const computed = computeExecutionMode({
    confidence,
    riskClass,
    reversibility,
    planCeiling,
  });

  const nowIso = new Date().toISOString();

  const { data: execution, error: execErr } = await supabase
    .from('sage_executions')
    .insert({
      org_id: orgId,
      proposal_id: proposal.id,
      signal_id: proposal.signal_id ?? null,
      signal_type: proposal.signal_type,
      pillar: proposal.pillar,
      state: 'queued',
      mode: computed.mode,
      risk_class: riskClass,
      reversibility,
      confidence: Number.isFinite(confidence) ? confidence : null,
      plan_ceiling: planCeiling,
      requires_approval: computed.requiresApproval,
      initiated_by: userId,
      queued_at: nowIso,
    })
    .select('id')
    .maybeSingle();

  if (execErr || !execution) return { ok: false, reason: 'write_failed' };

  const executionId = (execution as { id: string }).id;

  // Immutable audit row — the 'queued' intake decision (CRAFT §7.1).
  const { error: auditErr } = await supabase
    .from('sage_execution_audit')
    .insert({
      execution_id: executionId,
      org_id: orgId,
      proposal_id: proposal.id,
      event: 'queued',
      actor: userId,
      mode: computed.mode,
      risk_class: riskClass,
      confidence: Number.isFinite(confidence) ? confidence : null,
      inputs: {
        signal_id: proposal.signal_id ?? null,
        signal_type: proposal.signal_type,
        pillar: proposal.pillar,
        reversibility,
        mode_rationale: computed.rationale,
      },
      approvals: [{ actor: userId, decision: 'initiated', at: nowIso }],
    });

  if (auditErr) return { ok: false, reason: 'write_failed' };

  // Enqueue on the real execution substrate. A missing/uninitialised queue is a
  // recorded no-op (graceful degradation, mirrors the rest of the queue layer) —
  // the execution row + audit already closed the intake half of the loop.
  if (deps.enqueue) {
    await deps.enqueue({ executionId, orgId, proposalId: proposal.id });
  }

  return {
    ok: true,
    executionId,
    mode: computed.mode,
    riskClass,
    reversibility,
    requiresApproval: computed.requiresApproval,
  };
}

// ---------------------------------------------------------------------------
// State transition helpers (worker-facing).
// ---------------------------------------------------------------------------

/** Mark a queued execution as executing and write the audit row. */
export async function markExecuting(
  supabase: SupabaseClient,
  executionId: string
): Promise<{ ok: boolean }> {
  const nowIso = new Date().toISOString();
  const { data: exec, error } = await supabase
    .from('sage_executions')
    .update({ state: 'executing', started_at: nowIso, updated_at: nowIso })
    .eq('id', executionId)
    .eq('state', 'queued')
    .select('*')
    .maybeSingle();

  if (error || !exec) return { ok: false };

  const e = exec as Record<string, unknown>;
  await supabase.from('sage_execution_audit').insert({
    execution_id: executionId,
    org_id: e.org_id,
    proposal_id: e.proposal_id,
    event: 'executing',
    actor: e.initiated_by,
    mode: e.mode,
    risk_class: e.risk_class,
    confidence: e.confidence ?? null,
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// completeExecution — terminal state + outcome fed back to SAGE (LOOP CLOSED).
// ---------------------------------------------------------------------------

/**
 * Outcome vocabulary. `governed_complete` = the governed execution lifecycle
 * finished without error — a NEUTRAL value, NOT a business KPI (this slice only
 * ever records this for the handoff worker). `success`/`failure` = a VERIFIED
 * business outcome, populated by a later slice via downstream signal correlation.
 * Keeping them distinct stops a future SAGE reader from misreading ~100% governed
 * completions as ~100% business success.
 */
export type OutcomeResult = 'governed_complete' | 'success' | 'failure';

export interface CompleteExecutionArgs {
  executionId: string;
  result: OutcomeResult;
  /** Free-form execution output/detail, recorded on the audit + outcome rows. */
  detail?: Record<string, unknown>;
}

export type CompleteExecutionResult =
  | { ok: true; outcomeId: string }
  | { ok: false; reason: 'not_found' | 'write_failed' };

/**
 * Terminal transition for an execution. Writes the terminal state + immutable audit
 * row, then persists the outcome BACK to the originating proposal + signal
 * (`sage_outcomes`) and increments the per-signal-type tally
 * (`sage_signal_outcome_tally`). That last write is the minimum-viable SAGE feedback
 * that closes the loop: SAGE can now read whether actions on a given signal type
 * have historically succeeded.
 *
 * OUTCOME SEMANTICS: the worker records `governed_complete` — a NEUTRAL value meaning
 * "the governed execution lifecycle finished without error" (canon §8.2 Completed) —
 * NOT a verified business KPI, and counted in its OWN tally column
 * (`governed_complete_count`). Verified business `success`/`failure` (did the pitch
 * earn coverage?) is a separate vocabulary populated by a LATER slice via downstream
 * signal correlation, so a SAGE reader is never biased toward ~100% "success".
 */
export async function completeExecution(
  supabase: SupabaseClient,
  args: CompleteExecutionArgs
): Promise<CompleteExecutionResult> {
  const { executionId, result } = args;
  const detail = args.detail ?? {};
  const nowIso = new Date().toISOString();
  // Only a verified business `failure` (or an execution error surfaced as such)
  // marks the execution FAILED; `governed_complete` and `success` both COMPLETED.
  const state = result === 'failure' ? 'failed' : 'completed';

  const { data: exec, error: fetchErr } = await supabase
    .from('sage_executions')
    .select('*')
    .eq('id', executionId)
    .maybeSingle();

  if (fetchErr) return { ok: false, reason: 'write_failed' };
  if (!exec) return { ok: false, reason: 'not_found' };

  const e = exec as Record<string, unknown>;
  const orgId = e.org_id as string;
  const proposalId = e.proposal_id as string;
  const signalId = (e.signal_id as string | null) ?? null;
  const signalType = e.signal_type as string;
  const pillar = e.pillar as string;

  const { error: updErr } = await supabase
    .from('sage_executions')
    .update({
      state,
      outcome: result,
      outcome_detail: detail,
      completed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', executionId);

  if (updErr) return { ok: false, reason: 'write_failed' };

  // Immutable audit row for the terminal event.
  await supabase.from('sage_execution_audit').insert({
    execution_id: executionId,
    org_id: orgId,
    proposal_id: proposalId,
    event: state,
    actor: (e.initiated_by as string) ?? 'system',
    mode: e.mode,
    risk_class: e.risk_class,
    confidence: e.confidence ?? null,
    outputs: detail,
    outcome: result,
  });

  const impactPillars = deriveImpactPillars(pillar, signalType);

  // Outcome fed back to the originating proposal + signal — the loop is now closed.
  const { data: outcome, error: outErr } = await supabase
    .from('sage_outcomes')
    .insert({
      org_id: orgId,
      execution_id: executionId,
      proposal_id: proposalId,
      signal_id: signalId,
      signal_type: signalType,
      pillar,
      impact_pillars: impactPillars,
      result,
      evi_impact_estimate: (e.evi_impact_estimate as number | null) ?? null,
      detail,
    })
    .select('id')
    .maybeSingle();

  if (outErr || !outcome) return { ok: false, reason: 'write_failed' };

  // Minimum-viable SAGE state update: per-signal-type success/failure tally.
  await upsertSignalOutcomeTally(supabase, orgId, signalType, result, nowIso);

  // MESH: cross-pillar reinforcement. A completed action's OUTPUTS become the INPUTS
  // of the other pillars — canon SAGE_OPERATING_MODEL §3 ("Every action in one pillar
  // reinforces outcomes in other pillars" — outputs become inputs). ONLY a verified
  // `success` propagates: it is the only outcome that produced a real cross-pillar
  // output (a sent pitch, a real brief, generated schema). `governed_complete` means
  // the governed lifecycle finished but NO output was produced (suppressed / ineligible
  // / needs_content / refused no-op), and `failure` produced none either — neither may
  // reinforce, or the mesh would be biased by actions that never happened. Best-effort:
  // a reinforcement write must not fail the (already-persisted) loop closure.
  if (result === 'success') {
    await propagateReinforcement(supabase, {
      orgId,
      sourcePillar: pillar,
      sourceSignalType: signalType,
      sourceOutcomeId: (outcome as { id: string }).id,
      sourceImpact: (e.evi_impact_estimate as number | null) ?? 0,
    });
  }

  return { ok: true, outcomeId: (outcome as { id: string }).id };
}

/**
 * Increment the per-(org, signal_type) outcome tally. Read-modify-write on the
 * composite PK; a missing row is created. This is the seed of pattern
 * reinforcement — a LATER slice replaces the raw tally with decay-weighted
 * reinforcement, but the write path (outcome → SAGE state) is established here.
 */
async function upsertSignalOutcomeTally(
  supabase: SupabaseClient,
  orgId: string,
  signalType: string,
  result: OutcomeResult,
  nowIso: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('sage_signal_outcome_tally')
    .select('governed_complete_count, success_count, failure_count')
    .eq('org_id', orgId)
    .eq('signal_type', signalType)
    .maybeSingle();

  const prev = existing as {
    governed_complete_count?: number;
    success_count?: number;
    failure_count?: number;
  } | null;

  // Each outcome increments EXACTLY its own counter. `governed_complete` is kept
  // strictly separate from business `success` so completion is never a counted win.
  const governedComplete =
    Number(prev?.governed_complete_count ?? 0) +
    (result === 'governed_complete' ? 1 : 0);
  const success =
    Number(prev?.success_count ?? 0) + (result === 'success' ? 1 : 0);
  const failure =
    Number(prev?.failure_count ?? 0) + (result === 'failure' ? 1 : 0);

  await supabase.from('sage_signal_outcome_tally').upsert(
    {
      org_id: orgId,
      signal_type: signalType,
      governed_complete_count: governedComplete,
      success_count: success,
      failure_count: failure,
      last_outcome_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'org_id,signal_type' }
  );
}
