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

  // --- PR + SEO (reserved this slice) -------------------------------------
  // No concrete executor is registered yet, so we emit the safe per-pillar
  // default action_type with minimal params. These degrade to the governed
  // no-op at dispatch until their executors land.
  const fallback = defaultActionTypeForPillar(pillar);
  return { action_type: fallback, action_params: {} };
}
