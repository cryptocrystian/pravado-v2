/**
 * Content Publish Governance (Lane H)
 *
 * Server-side enforcement of the canon publishing rules for the Content pillar.
 * This is the chokepoint canon promises but the codebase never had: publishing
 * is NOT a plain `status` write — it must clear two hard gates before a content
 * item may transition to `published`.
 *
 * Canon authority: docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 *  - §7.4 Automation Mode Ceilings: "Publishing = Manual only (irreversible,
 *    brand-affecting)". Copilot=No, Autopilot=No. Only a pillar in Manual mode
 *    may perform the publish action; automation must never auto-publish.
 *  - §7.1 CiteMind Qualification Gates: "All content assets must pass CiteMind
 *    qualification before publishing." A `blocked` gate status hard-blocks.
 *
 * The previous FE-only `CiteMindPublishGate` component was dead code and always
 * offered a "Publish Anyway" bypass — governance was unenforceable. This module
 * moves the gate server-side where it cannot be bypassed by the client.
 */

import type { AutomationMode } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  checkGate,
  type GateCheckResult,
} from '../citeMind/citeMindPublishGateService';
import { resolveOrgModeState } from '../mode/modeService';

export type PublishDenyReason = 'mode_ceiling' | 'citemind_blocked';

export interface PublishGovernanceResult {
  ok: boolean;
  reason?: PublishDenyReason;
  mode?: AutomationMode;
  gate?: GateCheckResult;
  message?: string;
}

/**
 * Decide whether a content item is allowed to transition to `published`.
 *
 * Ordering is deliberate: the mode ceiling (§7.4) is checked first because it is
 * the cheaper, unambiguous gate and because an autopilot/copilot actor must never
 * even reach the CiteMind score check for a publish action.
 */
export async function enforcePublishGovernance(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  contentItemId: string
): Promise<PublishGovernanceResult> {
  // --- Gate 1: canon §7.4 mode ceiling — Publishing = Manual only ---
  const modeState = await resolveOrgModeState(supabase, userId, orgId);
  const mode = modeState.pillars.content.mode;
  if (mode !== 'manual') {
    return {
      ok: false,
      reason: 'mode_ceiling',
      mode,
      message:
        'Publishing is Manual-only (CONTENT_WORK_SURFACE_CONTRACT §7.4). ' +
        `Content pillar is in "${mode}" mode; switch to Manual to publish. ` +
        'Automation never publishes.',
    };
  }

  // --- Gate 2: canon §7.1 CiteMind qualification — blocked hard-blocks ---
  const gate = await checkGate(supabase, contentItemId, orgId);
  if (!gate.allowed) {
    return {
      ok: false,
      reason: 'citemind_blocked',
      mode,
      gate,
      message:
        'CiteMind qualification gate is blocked ' +
        '(CONTENT_WORK_SURFACE_CONTRACT §7.1). Resolve the flagged issues ' +
        'before publishing.',
    };
  }

  return { ok: true, mode, gate };
}
