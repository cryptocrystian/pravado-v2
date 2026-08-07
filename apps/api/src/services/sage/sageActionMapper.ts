/**
 * SAGE signal → structured action mapper (Wave-2 — SAGE proposals that ACT).
 *
 * Deterministically maps a scored signal (pillar + signal_type + signal_data) to a
 * machine-executable `action_type` + `action_params`. Pure + side-effect free so the
 * generator (signal-driven) and cold-start path both emit the SAME structured action
 * for the same input, and it is unit-testable without a DB.
 *
 * Mapping policy:
 *   - Where the mapping is CLEAN, emit the specific action + params (e.g. a Content
 *     topic/coverage gap → content.create_brief with {topic, keyword}).
 *   - Otherwise fall back to the safe per-pillar default action_type
 *     (DEFAULT_ACTION_BY_PILLAR) with best-effort params — never invent an action
 *     outside the closed vocabulary.
 *
 * NOTE: `suggested_action` (free-text display) is produced elsewhere and left
 * untouched — this module only produces the executable half of the contract.
 */

import {
  defaultActionTypeForPillar,
  type SageActionType,
} from '../craft/actionTypes';

export interface StructuredAction {
  action_type: SageActionType | null;
  action_params: Record<string, unknown>;
}

/** Read a string field from a loosely-typed signal_data bag. */
function str(
  data: Record<string, unknown> | null | undefined,
  key: string
): string | undefined {
  const v = data?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * Map a signal to its structured action. `signalData` is the raw jsonb the pillar
 * ingestor wrote (shape varies by signal_type); this reads it defensively.
 */
export function mapSignalToAction(
  pillar: string,
  signalType: string,
  signalData?: Record<string, unknown> | null
): StructuredAction {
  const key = (signalType || '').toLowerCase();

  // --- Content ------------------------------------------------------------
  if (pillar === 'Content') {
    // CLEAN case: a topic/coverage gap maps to creating a brief for that topic.
    // sageContentSignalIngestor writes `topic_name` for content_coverage_gap.
    if (key.includes('coverage_gap') || key.includes('content_gap')) {
      const topic =
        str(signalData, 'topic_name') ?? str(signalData, 'topic') ?? '';
      const keyword = str(signalData, 'keyword') ?? topic;
      return {
        action_type: 'content.create_brief',
        action_params: { topic, keyword },
      };
    }

    // stale_draft / low_quality / cold_start_content / anything else Content →
    // still a create_brief (the safe default), seeded with whatever topic-ish
    // text we can recover for a useful title/keyword.
    const topic =
      str(signalData, 'topic_name') ??
      str(signalData, 'topic') ??
      str(signalData, 'title') ??
      '';
    return {
      action_type: 'content.create_brief',
      action_params: topic ? { topic, keyword: topic } : {},
    };
  }

  // --- PR -----------------------------------------------------------------
  // A concrete pr.send_pitch executor IS registered (routes through the B+C
  // governed send chokepoint). Emit whatever recipient/subject is cleanly
  // derivable from the signal; the PR signals (sagePRSignalIngestor) carry a
  // journalist_id, and pr_stale_followup also carries the sequence subject +
  // sequence_id. We NEVER fabricate a pitch body — when the body is absent (the
  // usual case at proposal time) the executor records a needs_content outcome.
  if (pillar === 'PR') {
    const journalistId =
      str(signalData, 'journalist_id') ?? str(signalData, 'journalist');
    const contactId = str(signalData, 'contact_id');
    const subject = str(signalData, 'subject');
    const sequenceId = str(signalData, 'sequence_id');
    const params: Record<string, unknown> = {};
    if (journalistId) params.journalist_id = journalistId;
    if (contactId) params.contact_id = contactId;
    if (subject) params.subject = subject;
    if (sequenceId) {
      params.sequence_id = sequenceId;
      // A follow-up on an existing sequence — subject to the 2-per-7-days cap.
      params.is_follow_up = true;
    }
    return { action_type: 'pr.send_pitch', action_params: params };
  }

  // --- SEO (reserved this slice) ------------------------------------------
  // No concrete executor is registered yet, so we emit the safe per-pillar
  // default action_type with minimal params. These degrade to the governed
  // no-op at dispatch until their executors land.
  const fallback = defaultActionTypeForPillar(pillar);
  return { action_type: fallback, action_params: {} };
}
