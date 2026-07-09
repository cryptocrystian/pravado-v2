/**
 * PR-1 Keystone — per-pillar automation mode resolution (backend).
 *
 * Canon: mode is per-pillar (MODE_UX_ARCHITECTURE §2A/§3). Effective mode for a
 * pillar resolves as: explicit user preference → plan-tier default (D026) →
 * `copilot` fallback. Each pillar also carries a floor/ceiling governance
 * envelope; server-side ENFORCEMENT of that envelope lands in PR-4 — this module
 * wires the READ path (compute + report floor/ceiling/source) and persists the
 * user's chosen mode.
 *
 * Pure functions that take the Supabase client (mirrors F36 applyCheckoutCompletion)
 * so the resolution logic is unit-testable without booting Fastify.
 */

import type {
  AutomationMode,
  ModePillar,
  OrgModeState,
  PillarModeState,
} from '@pravado/types';
import { MODE_PILLARS, clampMode } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getPlanLimits } from '../billing/planLimitsService';

/**
 * Plan-tier default mode — D026 canon: every tier defaults to Copilot EXCEPT
 * Enterprise = Manual. Autopilot is a per-pillar graduation state, never a
 * plan-tier default. (Supersedes MODE_UX_ARCHITECTURE §2D's stale "SMB = Autopilot".)
 */
export function getPlanDefaultMode(planSlug: string): AutomationMode {
  switch (planSlug) {
    case 'enterprise':
      return 'manual';
    default:
      return 'copilot';
  }
}

/**
 * Plan-tier ceiling — the maximum mode the plan permits. Autopilot is gated on
 * the plan's `autopilotMode` capability (PLAN_LIMITS, the single source of truth
 * for that flag); otherwise the ceiling is Copilot. Floor is `manual` until admin
 * policy (PR-4) can raise it.
 */
export function getPlanCeiling(planSlug: string): AutomationMode {
  return getPlanLimits(planSlug).autopilotMode ? 'autopilot' : 'copilot';
}

/**
 * Resolve the org's plan slug from billing state. Returns `null` when the org has
 * no plan_id (e.g. the 11/12 orgs with a null-plan billing row) so callers can
 * distinguish `plan_default` from `fallback`.
 */
export async function resolveOrgPlanSlug(
  supabase: SupabaseClient,
  orgId: string
): Promise<string | null> {
  const { data: billing } = await supabase
    .from('org_billing_state')
    .select('plan_id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!billing?.plan_id) return null;

  const { data: plan } = await supabase
    .from('billing_plans')
    .select('slug')
    .eq('id', billing.plan_id)
    .maybeSingle();

  return plan?.slug ?? null;
}

function buildPillarState(
  userMode: AutomationMode | undefined,
  planSlug: string | null
): PillarModeState {
  const floor: AutomationMode = 'manual';
  const ceiling: AutomationMode = planSlug
    ? getPlanCeiling(planSlug)
    : 'copilot';

  let rawMode: AutomationMode;
  let source: PillarModeState['source'];
  if (userMode) {
    rawMode = userMode;
    source = 'user';
  } else if (planSlug) {
    rawMode = getPlanDefaultMode(planSlug);
    source = 'plan_default';
  } else {
    rawMode = 'copilot';
    source = 'fallback';
  }

  return {
    mode: clampMode(rawMode, floor, ceiling),
    source,
    floor,
    ceiling,
    lockedByAdmin: floor === ceiling,
  };
}

/**
 * Full per-org, per-pillar mode state for a user. Reads the plan once and the
 * user's preference rows once, then builds a PillarModeState per product pillar.
 */
export async function resolveOrgModeState(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<OrgModeState> {
  const planSlug = await resolveOrgPlanSlug(supabase, orgId);

  const { data: prefs } = await supabase
    .from('user_mode_preferences')
    .select('pillar, mode')
    .eq('user_id', userId)
    .eq('org_id', orgId);

  const byPillar = new Map<string, AutomationMode>(
    (prefs ?? []).map((r) => [r.pillar as string, r.mode as AutomationMode])
  );

  const pillars = {} as OrgModeState['pillars'];
  for (const pillar of MODE_PILLARS) {
    pillars[pillar] = buildPillarState(byPillar.get(pillar), planSlug);
  }
  return { pillars };
}

export type SetPillarModeResult =
  | { ok: true; state: PillarModeState }
  | { ok: false; reason: 'invalid_pillar' | 'invalid_mode' | 'write_failed' };

const VALID_MODES: readonly AutomationMode[] = [
  'manual',
  'copilot',
  'autopilot',
];

/**
 * Persist a user's explicit mode for one pillar (upsert on the composite PK),
 * then return the freshly-resolved PillarModeState (mode clamped to the plan
 * ceiling, source now `user`). Enum-validates pillar + mode; ceiling ENFORCEMENT
 * is deferred to PR-4 (the stored value is clamped only on read).
 */
export async function setPillarMode(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  pillar: string,
  mode: string
): Promise<SetPillarModeResult> {
  if (!MODE_PILLARS.includes(pillar as ModePillar)) {
    return { ok: false, reason: 'invalid_pillar' };
  }
  if (!VALID_MODES.includes(mode as AutomationMode)) {
    return { ok: false, reason: 'invalid_mode' };
  }

  const { error } = await supabase.from('user_mode_preferences').upsert(
    {
      user_id: userId,
      org_id: orgId,
      pillar,
      mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,org_id,pillar' }
  );

  if (error) {
    return { ok: false, reason: 'write_failed' };
  }

  const planSlug = await resolveOrgPlanSlug(supabase, orgId);
  return {
    ok: true,
    state: buildPillarState(mode as AutomationMode, planSlug),
  };
}
