/**
 * CRAFT action executor registry + dispatch (Wave-2 — SAGE proposals that ACT).
 *
 * Maps `action_type` → concrete per-pillar executor (CRAFT_v2 "Executors (agents)
 * per domain"). Dispatch is the seam the governed execution lifecycle calls between
 * markExecuting and completeExecution.
 *
 * DEGRADATION CONTRACT: an action_type with NO registered executor (every remaining
 * PR/SEO action + the reserved Content actions) degrades GRACEFULLY — dispatch
 * returns a neutral `governed_complete` outcome with NO fabricated effect, exactly as
 * the pre-executor loop (migration 107) behaved. This preserves governance: the
 * lifecycle + immutable audit are still recorded; nothing is invented.
 *
 * A NULL action_type (legacy/unmapped proposal) degrades the same way.
 */

import type { SageActionType } from '../actionTypes';
import { isSageActionType } from '../actionTypes';
import { contentCreateBriefExecutor } from './contentCreateBriefExecutor';
import { prSendPitchExecutor } from './prSendPitchExecutor';
import type { ActionExecutor, ExecutorContext, ExecutorResult } from './types';

/**
 * The registry. Only actions with a real effect are present; everything else falls
 * through to the graceful governed no-op. IMPLEMENTED_ACTION_TYPES in actionTypes.ts
 * is the declared counterpart of these keys (a test cross-checks).
 */
const EXECUTORS: Partial<Record<SageActionType, ActionExecutor>> = {
  'content.create_brief': contentCreateBriefExecutor,
  // PR: the pitch send routes EXCLUSIVELY through the B+C governed chokepoint
  // (sendGuardedEmail) — it inherits CAN-SPAM suppression, pitch-eligibility, the
  // caps, and the personalization gate; it never touches the provider directly.
  'pr.send_pitch': prSendPitchExecutor,
};

/** Look up a registered executor, or undefined for reserved/unknown actions. */
export function getExecutor(actionType: unknown): ActionExecutor | undefined {
  if (!isSageActionType(actionType)) return undefined;
  return EXECUTORS[actionType];
}

/**
 * Dispatch a governed execution to its action executor. Returns the outcome the
 * lifecycle records. Unregistered/NULL action_types return a neutral governed
 * no-op — never a fabricated effect.
 */
export async function dispatchProposalExecution(
  proposal: Record<string, unknown> | null | undefined,
  ctx: ExecutorContext
): Promise<ExecutorResult> {
  const actionType = proposal?.action_type;
  const executor = getExecutor(actionType);

  if (!proposal || !executor) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'governed_handoff',
        action_type: (actionType as string | undefined) ?? null,
        note: proposal
          ? 'No executor registered for action_type (reserved/unimplemented); governed lifecycle recorded, no effect produced.'
          : 'Proposal not found for execution; governed lifecycle recorded, no effect produced.',
      },
    };
  }

  return executor(proposal, ctx);
}
