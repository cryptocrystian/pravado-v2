/**
 * CRAFT Trust Ladder (Wave-2 — Autopilot prerequisites / SAFETY FLOOR).
 *
 * Implements the per-(org, pillar) trust ladder that canon
 * (CRAFT_EXECUTION_MODEL §2.2/§2.3) requires as an INPUT to mode eligibility:
 *
 *   Mode = f(Confidence, Risk, Reversibility, TRUST, Plan)   (canon §2.2)
 *
 * A pillar's trust graduates over time from EARNED SIGNAL — successful governed
 * executions and the human approvals-vs-dismissals track record — and gates the
 * maximum mode the pillar may reach. A LOW-TRUST pillar can NEVER reach Autopilot
 * eligibility even at 0.99 confidence. That gate is the reason Autopilot cannot be
 * "turned on" by confidence alone; it must be EARNED.
 *
 * CRITICAL: this does NOT enable autonomous execution. `AUTONOMOUS_AUTOPILOT_ENABLED`
 * stays false. The trust ceiling narrows the eligible mode; it never authorizes an
 * autonomous run on its own.
 *
 * CANON GRADUATION RULES (CRAFT_EXECUTION_MODEL §2.3, lines 73-78 — verbatim):
 *   | Level        | Requirements                                          | Unlocks           |
 *   | New          | Fresh organization                                    | Manual only       |
 *   | Established  | 30+ successful executions, 0 critical failures        | Copilot eligible  |
 *   | Proven       | 100+ successful executions, <2% failure rate, 90+ days| Autopilot eligible|
 *   | Veteran      | 500+ successful executions, <1% failure rate, 180+ days| Extended autopilot|
 *
 * TRUST DECAY (§2.3, lines 80-83): critical failure → drop one tier; moderate failure
 * → trust_score −10%; inactivity >60 days → trust_score −20%. The discrete level is the
 * graduation gate below; the continuous trust_score decay accumulator is persisted for a
 * later slice to fold back into level regression.
 *
 * Pure functions taking the Supabase client (mirrors modeService / craftExecutionService)
 * so the graduation logic is unit-testable without a live DB.
 */

import type { AutomationMode } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TrustLevel = 'new' | 'established' | 'proven' | 'veteran';

/** Pillar vocabulary matches sage_executions (migration 107): 'PR' | 'Content' | 'SEO'. */
export type TrustPillar = 'PR' | 'Content' | 'SEO';

/** The earned-signal counters that drive graduation (CRAFT §2.3). */
export interface TrustCounters {
  successful_executions: number;
  failed_executions: number;
  critical_failures: number;
  human_approvals: number;
  human_dismissals: number;
  first_active_at: string | null;
  last_activity_at: string | null;
}

const ZERO_COUNTERS: TrustCounters = {
  successful_executions: 0,
  failed_executions: 0,
  critical_failures: 0,
  human_approvals: 0,
  human_dismissals: 0,
  first_active_at: null,
  last_activity_at: null,
};

// Canon §2.3 graduation thresholds — kept as named constants so the graduation
// function reads as the canon table and any future canon change is a single edit.
const ESTABLISHED_MIN_SUCCESS = 30; // §2.3 "30+ successful executions"
const PROVEN_MIN_SUCCESS = 100; // §2.3 "100+ successful executions"
const PROVEN_MAX_FAILURE_RATE = 0.02; // §2.3 "<2% failure rate"
const PROVEN_MIN_DAYS = 90; // §2.3 "90+ days active"
const VETERAN_MIN_SUCCESS = 500; // §2.3 "500+ successful executions"
const VETERAN_MAX_FAILURE_RATE = 0.01; // §2.3 "<1% failure rate"
const VETERAN_MIN_DAYS = 180; // §2.3 "180+ days"

function daysActive(firstActiveAt: string | null, now: Date): number {
  if (!firstActiveAt) return 0;
  const first = new Date(firstActiveAt).getTime();
  if (!Number.isFinite(first)) return 0;
  return (now.getTime() - first) / (1000 * 60 * 60 * 24);
}

function failureRate(c: TrustCounters): number {
  const total = c.successful_executions + c.failed_executions;
  if (total <= 0) return 0;
  return c.failed_executions / total;
}

/**
 * Graduate a (org, pillar) to a trust level from its earned-signal counters, applying
 * the canon §2.3 requirements from the top down (most demanding first). Every threshold
 * is verbatim canon; nothing is invented.
 */
export function computeTrustLevel(
  counters: TrustCounters,
  now: Date = new Date()
): TrustLevel {
  const rate = failureRate(counters);
  const days = daysActive(counters.first_active_at, now);

  if (
    counters.successful_executions >= VETERAN_MIN_SUCCESS &&
    rate < VETERAN_MAX_FAILURE_RATE &&
    days >= VETERAN_MIN_DAYS
  ) {
    return 'veteran';
  }
  if (
    counters.successful_executions >= PROVEN_MIN_SUCCESS &&
    rate < PROVEN_MAX_FAILURE_RATE &&
    days >= PROVEN_MIN_DAYS
  ) {
    return 'proven';
  }
  if (
    counters.successful_executions >= ESTABLISHED_MIN_SUCCESS &&
    counters.critical_failures === 0
  ) {
    return 'established';
  }
  return 'new';
}

/**
 * Trust level → mode ceiling (CRAFT §2.2 Mode Eligibility Matrix, Trust Level row):
 * Manual = Any, Copilot = Established, Autopilot = Proven. Veteran keeps the Autopilot
 * ceiling (its "extended scope" is a later-slice concern, not a higher ceiling).
 */
export function trustCeiling(level: TrustLevel): AutomationMode {
  switch (level) {
    case 'veteran':
    case 'proven':
      return 'autopilot';
    case 'established':
      return 'copilot';
    case 'new':
    default:
      return 'manual';
  }
}

/**
 * Read the (org, pillar) trust row, returning zeroed 'new' counters when absent — a
 * fresh org/pillar is 'new' (Manual only) by construction, never an error.
 */
export async function getPillarTrust(
  supabase: SupabaseClient,
  orgId: string,
  pillar: TrustPillar
): Promise<{
  level: TrustLevel;
  ceiling: AutomationMode;
  counters: TrustCounters;
}> {
  const { data } = await supabase
    .from('craft_pillar_trust')
    .select(
      'trust_level, successful_executions, failed_executions, critical_failures, human_approvals, human_dismissals, first_active_at, last_activity_at'
    )
    .eq('org_id', orgId)
    .eq('pillar', pillar)
    .maybeSingle();

  if (!data) {
    return { level: 'new', ceiling: 'manual', counters: { ...ZERO_COUNTERS } };
  }

  const row = data as Record<string, unknown>;
  const counters: TrustCounters = {
    successful_executions: Number(row.successful_executions ?? 0),
    failed_executions: Number(row.failed_executions ?? 0),
    critical_failures: Number(row.critical_failures ?? 0),
    human_approvals: Number(row.human_approvals ?? 0),
    human_dismissals: Number(row.human_dismissals ?? 0),
    first_active_at: (row.first_active_at as string | null) ?? null,
    last_activity_at: (row.last_activity_at as string | null) ?? null,
  };
  // Recompute the level from counters rather than trusting the stored label — the
  // stored trust_level is a cache; the counters are the source of truth.
  const level = computeTrustLevel(counters);
  return { level, ceiling: trustCeiling(level), counters };
}

/**
 * Whether a completed execution counted toward trust as a "successful execution without
 * incident" (CRAFT §2.3). The governed lifecycle finishing without error IS the unit of
 * trust the canon counts — so both a verified business `success` AND a neutral
 * `governed_complete` (the lifecycle ran, nothing errored) count as successful; only a
 * `failure` (something errored) is a failed execution. This keeps trust about the SYSTEM
 * executing reliably, decoupled from business-KPI attribution (a later slice).
 */
export type ExecutionOutcome = 'governed_complete' | 'success' | 'failure';

export interface RecordExecutionArgs {
  orgId: string;
  pillar: TrustPillar;
  outcome: ExecutionOutcome;
  /** Risk class of the execution — a `failure` on a critical action is a CRITICAL failure. */
  riskClass?: 'low' | 'medium' | 'high' | 'critical';
  actor?: string;
}

/**
 * Fold one completed execution's outcome into the (org, pillar) trust counters, then
 * re-graduate the level and write an immutable governance-audit row IF the level moved.
 * Read-modify-write on the composite PK (a missing row is created 'new').
 *
 * This is the EARNED-SIGNAL write path: successful governed executions accumulate trust;
 * failures accumulate failed_executions (and, on a critical-risk action, critical_failures
 * — which per §2.3 blocks Established and would drop a tier under decay).
 */
export async function recordExecutionOutcome(
  supabase: SupabaseClient,
  args: RecordExecutionArgs
): Promise<{ level: TrustLevel; leveledChanged: boolean }> {
  const { orgId, pillar, outcome } = args;
  const nowIso = new Date().toISOString();

  const before = await getPillarTrust(supabase, orgId, pillar);
  const c = before.counters;

  const isFailure = outcome === 'failure';
  const isCriticalFailure = isFailure && args.riskClass === 'critical';

  const next: TrustCounters = {
    successful_executions: c.successful_executions + (isFailure ? 0 : 1),
    failed_executions: c.failed_executions + (isFailure ? 1 : 0),
    critical_failures: c.critical_failures + (isCriticalFailure ? 1 : 0),
    human_approvals: c.human_approvals,
    human_dismissals: c.human_dismissals,
    first_active_at: c.first_active_at ?? nowIso,
    last_activity_at: nowIso,
  };

  const nextLevel = computeTrustLevel(next);
  await persistTrust(supabase, orgId, pillar, next, nextLevel, nowIso);

  const leveledChanged = nextLevel !== before.level;
  if (leveledChanged) {
    await writeGovernanceAudit(supabase, {
      orgId,
      event: 'trust_level_change',
      pillar,
      actor: args.actor ?? 'system',
      before: { trust_level: before.level },
      after: { trust_level: nextLevel },
      reason: `execution outcome '${outcome}'${
        isCriticalFailure ? ' (critical failure)' : ''
      }`,
    });
  }

  return { level: nextLevel, leveledChanged };
}

/**
 * Fold a human's proposal decision into the trust track record (the human-in-the-loop
 * trust signal — CRAFT §2.3 "successful execution … human approvals"). Approvals build
 * trust; dismissals are recorded so a pillar humans keep rejecting does not accumulate
 * unchecked. Does not itself change the graduation level (that is driven by executions),
 * but persists the signal a later slice weights.
 */
export async function recordProposalDecision(
  supabase: SupabaseClient,
  args: {
    orgId: string;
    pillar: TrustPillar;
    decision: 'approved' | 'dismissed';
  }
): Promise<void> {
  const { orgId, pillar, decision } = args;
  const nowIso = new Date().toISOString();
  const before = await getPillarTrust(supabase, orgId, pillar);
  const c = before.counters;
  const next: TrustCounters = {
    ...c,
    human_approvals: c.human_approvals + (decision === 'approved' ? 1 : 0),
    human_dismissals: c.human_dismissals + (decision === 'dismissed' ? 1 : 0),
    first_active_at: c.first_active_at ?? nowIso,
    last_activity_at: nowIso,
  };
  await persistTrust(
    supabase,
    orgId,
    pillar,
    next,
    computeTrustLevel(next),
    nowIso
  );
}

async function persistTrust(
  supabase: SupabaseClient,
  orgId: string,
  pillar: TrustPillar,
  counters: TrustCounters,
  level: TrustLevel,
  nowIso: string
): Promise<void> {
  await supabase.from('craft_pillar_trust').upsert(
    {
      org_id: orgId,
      pillar,
      trust_level: level,
      successful_executions: counters.successful_executions,
      failed_executions: counters.failed_executions,
      critical_failures: counters.critical_failures,
      human_approvals: counters.human_approvals,
      human_dismissals: counters.human_dismissals,
      first_active_at: counters.first_active_at,
      last_activity_at: counters.last_activity_at,
      updated_at: nowIso,
    },
    { onConflict: 'org_id,pillar' }
  );
}

/** Append an immutable governance-audit row (shared by trust + kill-switch events). */
export async function writeGovernanceAudit(
  supabase: SupabaseClient,
  args: {
    orgId: string;
    event:
      | 'trust_level_change'
      | 'trust_counter_update'
      | 'kill_switch_engaged'
      | 'kill_switch_disengaged';
    actor: string;
    pillar?: string | null;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string | null;
  }
): Promise<void> {
  await supabase.from('craft_governance_audit').insert({
    org_id: args.orgId,
    event: args.event,
    pillar: args.pillar ?? null,
    actor: args.actor,
    before_state: args.before ?? {},
    after_state: args.after ?? {},
    reason: args.reason ?? null,
  });
}
