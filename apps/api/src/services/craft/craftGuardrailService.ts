/**
 * CRAFT Execution Guardrails (Wave-2 — Autopilot prerequisites / SAFETY FLOOR).
 *
 * Enforces the plan-tier guardrails and the per-org kill-switch that canon
 * (CRAFT_EXECUTION_MODEL §6 Plan-Tier Guardrails, §11.2 failure modes) requires
 * BEFORE autonomous execution can ever be enabled:
 *
 *   - Daily action caps        (§6.2 Max Actions/Day)
 *   - Daily external caps       (§6.2 External Actions/Day — irreversible sends/publishes)
 *   - Concurrency caps          (§6.2 Concurrent Executions)
 *   - Cost ceiling              (§6.3 LLM Spend/Month)
 *   - Kill-switch               (§11.2 Trust Regression / Cost Overrun → HALT autonomy)
 *
 * ENFORCEMENT POINT: `evaluateAutonomousGuardrails` is the single gate the CRAFT
 * execution path calls (craftExecutionService.executeProposal) to decide whether an
 * autonomous run may proceed. `assertAutonomousExecutionAllowed` is the strict form a
 * future autonomous worker calls — it ALSO hard-blocks on `AUTONOMOUS_AUTOPILOT_ENABLED`
 * being false, so there is no code path by which an autonomous execution can slip through
 * this slice.
 *
 * CRITICAL: autonomy is OFF (`AUTONOMOUS_AUTOPILOT_ENABLED === false`). These guardrails
 * gate/annotate a SIMULATED autonomous path today (recorded on the execution row +
 * governance audit); they change nothing about the human-initiated flow. They are proven
 * correct here so a later slice can rely on them the moment it flips the flag.
 *
 * Response tiers follow canon §6.4: soft(80%) warn, hard(100%) pause, overage(>100%)
 * block.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { AUTONOMOUS_AUTOPILOT_ENABLED } from './craftExecutionService';
import { writeGovernanceAudit } from './craftTrustService';
import { getPlanLimits, type PlanLimits } from '../billing/planLimitsService';
import { resolveOrgPlanSlug } from '../mode/modeService';

export type GuardrailResponse = 'ok' | 'soft' | 'hard' | 'overage';

export interface CapCheck {
  resource:
    | 'maxActionsPerDay'
    | 'externalActionsPerDay'
    | 'concurrentExecutions'
    | 'llmSpendPerMonthUsd';
  current: number;
  limit: number;
  response: GuardrailResponse;
  /** True when a NEW action must be BLOCKED (hard/overage) — canon §6.4. */
  blocked: boolean;
}

/** Classify usage into the canon §6.4 response tier (soft 80% / hard 100% / overage). */
export function classifyCap(
  current: number,
  additional: number,
  limit: number
): GuardrailResponse {
  if (limit >= 999_999) return 'ok'; // unlimited sentinel
  const projected = current + additional;
  if (projected > limit) return current >= limit ? 'overage' : 'hard';
  if (projected >= limit * 0.8) return 'soft';
  return 'ok';
}

function toCapCheck(
  resource: CapCheck['resource'],
  current: number,
  additional: number,
  limit: number
): CapCheck {
  const response = classifyCap(current, additional, limit);
  return {
    resource,
    current,
    limit,
    response,
    blocked: response === 'hard' || response === 'overage',
  };
}

// ---------------------------------------------------------------------------
// Kill-switch
// ---------------------------------------------------------------------------

/** Whether the org's kill-switch is engaged (halts ALL autonomous execution). */
export async function isKillSwitchEngaged(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('craft_kill_switch')
    .select('engaged')
    .eq('org_id', orgId)
    .maybeSingle();
  return Boolean((data as { engaged?: boolean } | null)?.engaged);
}

/**
 * Engage or disengage the org kill-switch and write an immutable governance-audit row
 * (CRAFT §7.1). Engaging instantly halts autonomous execution org-wide; human-initiated
 * execution is unaffected. Service-role write path only (RLS blocks user writes).
 */
export async function setKillSwitch(
  supabase: SupabaseClient,
  args: { orgId: string; engaged: boolean; actor: string; reason?: string }
): Promise<{ ok: boolean }> {
  const { orgId, engaged, actor } = args;
  const nowIso = new Date().toISOString();
  const before = await isKillSwitchEngaged(supabase, orgId);

  const { error } = await supabase.from('craft_kill_switch').upsert(
    {
      org_id: orgId,
      engaged,
      engaged_by: engaged ? actor : null,
      engaged_at: engaged ? nowIso : null,
      reason: args.reason ?? null,
      updated_at: nowIso,
    },
    { onConflict: 'org_id' }
  );
  if (error) return { ok: false };

  if (before !== engaged) {
    await writeGovernanceAudit(supabase, {
      orgId,
      event: engaged ? 'kill_switch_engaged' : 'kill_switch_disengaged',
      actor,
      before: { engaged: before },
      after: { engaged },
      reason: args.reason ?? null,
    });
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Usage counters (metering store — reads sage_executions, migration 107)
// ---------------------------------------------------------------------------

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countTodaysActions(
  supabase: SupabaseClient,
  orgId: string,
  onlyExternal: boolean
): Promise<number> {
  let q = supabase
    .from('sage_executions')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', startOfTodayIso());
  if (onlyExternal) {
    // External = irreversible actions (sends/publishes) — CRAFT §4.2/§6.2.
    q = q.eq('reversibility', 'irreversible');
  }
  const { count } = await q;
  return count ?? 0;
}

async function countConcurrentExecutions(
  supabase: SupabaseClient,
  orgId: string
): Promise<number> {
  const { count } = await supabase
    .from('sage_executions')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('state', 'executing');
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

export interface GuardrailContext {
  orgId: string;
  /** True when the action is external/irreversible (counts against external cap). */
  isExternal: boolean;
  /** Optional pre-resolved plan slug (avoids a re-read); resolved if absent. */
  planSlug?: string;
}

export interface GuardrailDecision {
  /** True only if an AUTONOMOUS execution would be permitted to proceed. */
  autonomousAllowed: boolean;
  /** Human-readable block reasons (empty when allowed). */
  blockedBy: string[];
  killSwitchEngaged: boolean;
  autonomousAutopilotEnabled: boolean;
  caps: CapCheck[];
  planSlug: string;
}

/**
 * Evaluate every guardrail for a would-be autonomous execution WITHOUT mutating state.
 * The CRAFT execution path calls this to ANNOTATE the execution row + governance audit.
 * `autonomousAllowed` requires: autonomy globally enabled AND kill-switch disengaged AND
 * no cap in hard/overage.
 *
 * Because `AUTONOMOUS_AUTOPILOT_ENABLED` is false this slice, `autonomousAllowed` is
 * ALWAYS false here — the guardrail arithmetic (caps/kill-switch) is still computed and
 * recorded so it is proven correct, but the global flag alone guarantees nothing runs.
 */
export async function evaluateAutonomousGuardrails(
  supabase: SupabaseClient,
  ctx: GuardrailContext
): Promise<GuardrailDecision> {
  const planSlug =
    ctx.planSlug ??
    (await resolveOrgPlanSlug(supabase, ctx.orgId)) ??
    'starter';
  const limits: PlanLimits = getPlanLimits(planSlug);

  const [todaysActions, todaysExternal, concurrent, killSwitch] =
    await Promise.all([
      countTodaysActions(supabase, ctx.orgId, false),
      ctx.isExternal
        ? countTodaysActions(supabase, ctx.orgId, true)
        : Promise.resolve(0),
      countConcurrentExecutions(supabase, ctx.orgId),
      isKillSwitchEngaged(supabase, ctx.orgId),
    ]);

  const caps: CapCheck[] = [
    toCapCheck('maxActionsPerDay', todaysActions, 1, limits.maxActionsPerDay),
    toCapCheck(
      'concurrentExecutions',
      concurrent,
      1,
      limits.concurrentExecutions
    ),
  ];
  if (ctx.isExternal) {
    caps.push(
      toCapCheck(
        'externalActionsPerDay',
        todaysExternal,
        1,
        limits.externalActionsPerDay
      )
    );
  }

  const blockedBy: string[] = [];
  if (!AUTONOMOUS_AUTOPILOT_ENABLED) {
    blockedBy.push('autonomous_autopilot_disabled');
  }
  if (killSwitch) blockedBy.push('kill_switch_engaged');
  for (const cap of caps) {
    if (cap.blocked) blockedBy.push(`cap:${cap.resource}:${cap.response}`);
  }

  return {
    autonomousAllowed: blockedBy.length === 0,
    blockedBy,
    killSwitchEngaged: killSwitch,
    autonomousAutopilotEnabled: AUTONOMOUS_AUTOPILOT_ENABLED,
    caps,
    planSlug,
  };
}

/**
 * Strict assertion for a would-be autonomous worker. Returns `{ allowed:false }` unless
 * EVERY gate passes AND autonomy is globally enabled. There is no path by which this
 * returns `allowed:true` while `AUTONOMOUS_AUTOPILOT_ENABLED` is false — the single
 * belt-and-suspenders guarantee that autonomy stays off this slice.
 */
export async function assertAutonomousExecutionAllowed(
  supabase: SupabaseClient,
  ctx: GuardrailContext
): Promise<{ allowed: boolean; decision: GuardrailDecision }> {
  const decision = await evaluateAutonomousGuardrails(supabase, ctx);
  return { allowed: decision.autonomousAllowed, decision };
}
