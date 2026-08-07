/**
 * Wave-2 — SAGE structured-action vocabulary + signal→action mapper tests.
 *
 * Covers:
 *   1. The action vocabulary (schema/enum) and which actions are IMPLEMENTED vs
 *      reserved, and that the TS vocabulary stays in lockstep with the migration
 *      108 CHECK enum and with the executor registry (drift fails CI, not prod).
 *   2. The deterministic signal→action mapper: a Content topic/coverage gap →
 *      content.create_brief with {topic, keyword}; safe per-pillar defaults
 *      otherwise.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  SAGE_ACTION_TYPES,
  IMPLEMENTED_ACTION_TYPES,
  DEFAULT_ACTION_BY_PILLAR,
  isSageActionType,
  isImplementedActionType,
  defaultActionTypeForPillar,
} from '../src/services/craft/actionTypes';
import { getExecutor } from '../src/services/craft/executors/registry';
import { mapSignalToAction } from '../src/services/sage/sageActionMapper';

// ---------------------------------------------------------------------------
// 1. Vocabulary / schema / enum
// ---------------------------------------------------------------------------

describe('SAGE action vocabulary', () => {
  it('enumerates exactly the initial per-pillar vocabulary', () => {
    expect([...SAGE_ACTION_TYPES]).toEqual([
      'content.create_brief',
      'content.generate_draft',
      'content.publish',
      'pr.send_pitch',
      'pr.add_to_list',
      'seo.generate_schema',
    ]);
  });

  it('marks content.create_brief AND pr.send_pitch as implemented', () => {
    expect([...IMPLEMENTED_ACTION_TYPES]).toEqual([
      'content.create_brief',
      'pr.send_pitch',
    ]);
    expect(isImplementedActionType('content.create_brief')).toBe(true);
    expect(isImplementedActionType('pr.send_pitch')).toBe(true);
    // still-reserved actions remain unimplemented
    expect(isImplementedActionType('content.publish')).toBe(false);
    expect(isImplementedActionType('seo.generate_schema')).toBe(false);
  });

  it('type guard accepts vocabulary members and rejects anything else', () => {
    expect(isSageActionType('content.create_brief')).toBe(true);
    expect(isSageActionType('content.delete_everything')).toBe(false);
    expect(isSageActionType(null)).toBe(false);
  });

  it('has a safe default action per pillar', () => {
    expect(defaultActionTypeForPillar('Content')).toBe('content.create_brief');
    expect(defaultActionTypeForPillar('PR')).toBe('pr.send_pitch');
    expect(defaultActionTypeForPillar('SEO')).toBe('seo.generate_schema');
    expect(defaultActionTypeForPillar('Bogus')).toBeNull();
    // every default is itself a member of the vocabulary
    for (const v of Object.values(DEFAULT_ACTION_BY_PILLAR)) {
      expect(isSageActionType(v)).toBe(true);
    }
  });

  it('registry registers an executor for EXACTLY the implemented action types', () => {
    for (const action of SAGE_ACTION_TYPES) {
      const hasExecutor = Boolean(getExecutor(action));
      const declaredImplemented = (
        IMPLEMENTED_ACTION_TYPES as readonly string[]
      ).includes(action);
      expect(hasExecutor).toBe(declaredImplemented);
    }
  });

  it('TS vocabulary stays in lockstep with the migration 108 CHECK enum', () => {
    const sql = readFileSync(
      join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        '108_sage_proposal_structured_actions.sql'
      ),
      'utf8'
    );
    // Every TS action must appear as a quoted literal in the migration.
    for (const action of SAGE_ACTION_TYPES) {
      expect(sql).toContain(`'${action}'`);
    }
    // And the migration must not enumerate an action the TS vocabulary lacks:
    // collect quoted content.* / pr.* / seo.* literals inside the CHECK block.
    const checkBlock = sql.slice(
      sql.indexOf('sage_proposals_action_type_check'),
      sql.indexOf('COMMENT ON COLUMN')
    );
    const enumerated = [
      ...checkBlock.matchAll(/'((?:content|pr|seo)\.[a-z_]+)'/g),
    ].map((m) => m[1]);
    expect(new Set(enumerated)).toEqual(new Set(SAGE_ACTION_TYPES));
  });
});

// ---------------------------------------------------------------------------
// 2. Deterministic signal → action mapper
// ---------------------------------------------------------------------------

describe('mapSignalToAction', () => {
  it('Content coverage gap → content.create_brief with {topic, keyword}', () => {
    const action = mapSignalToAction('Content', 'content_coverage_gap', {
      topic_name: 'AI freight visibility',
      content_item_id: 'ci-1',
    });
    expect(action.action_type).toBe('content.create_brief');
    expect(action.action_params).toEqual({
      topic: 'AI freight visibility',
      keyword: 'AI freight visibility',
    });
  });

  it('Content coverage gap honours an explicit keyword when present', () => {
    const action = mapSignalToAction('Content', 'seo_content_gap', {
      topic_name: 'schema markup',
      keyword: 'json-ld schema',
    });
    expect(action.action_type).toBe('content.create_brief');
    expect(action.action_params).toEqual({
      topic: 'schema markup',
      keyword: 'json-ld schema',
    });
  });

  it('other Content signals fall back to content.create_brief with a topic hint', () => {
    const action = mapSignalToAction('Content', 'content_stale_draft', {
      title: 'Half-written explainer',
    });
    expect(action.action_type).toBe('content.create_brief');
    expect(action.action_params).toEqual({
      topic: 'Half-written explainer',
      keyword: 'Half-written explainer',
    });
  });

  it('is deterministic — same input yields the same structured action', () => {
    const a = mapSignalToAction('Content', 'content_coverage_gap', {
      topic_name: 'X',
    });
    const b = mapSignalToAction('Content', 'content_coverage_gap', {
      topic_name: 'X',
    });
    expect(a).toEqual(b);
  });

  it('PR signals map to pr.send_pitch carrying the derivable recipient (journalist_id)', () => {
    const action = mapSignalToAction('PR', 'pr_high_value_unpitched', {
      journalist_id: 'j-1',
    });
    expect(action.action_type).toBe('pr.send_pitch');
    expect(action.action_params).toEqual({ journalist_id: 'j-1' });
  });

  it('PR stale-followup maps to pr.send_pitch with subject + follow-up flag (no body)', () => {
    const action = mapSignalToAction('PR', 'pr_stale_followup', {
      journalist_id: 'j-2',
      sequence_id: 'seq-9',
      subject: 'Re: our earlier conversation',
    });
    expect(action.action_type).toBe('pr.send_pitch');
    expect(action.action_params).toEqual({
      journalist_id: 'j-2',
      sequence_id: 'seq-9',
      subject: 'Re: our earlier conversation',
      is_follow_up: true,
    });
    // We never fabricate a pitch body at proposal time.
    expect(action.action_params).not.toHaveProperty('body');
  });

  it('PR signal with no derivable recipient still maps to pr.send_pitch (empty params)', () => {
    const action = mapSignalToAction('PR', 'pr_pitch_window', {});
    expect(action.action_type).toBe('pr.send_pitch');
    expect(action.action_params).toEqual({});
  });

  it('SEO signals map to the reserved seo.generate_schema default', () => {
    const action = mapSignalToAction('SEO', 'seo_position_drop', {});
    expect(action.action_type).toBe('seo.generate_schema');
    expect(action.action_params).toEqual({});
  });

  it('every mapped action_type is a valid vocabulary member', () => {
    for (const [pillar, type] of [
      ['Content', 'content_coverage_gap'],
      ['PR', 'pr_stale_followup'],
      ['SEO', 'seo_opportunity_keyword'],
    ] as const) {
      const a = mapSignalToAction(pillar, type, {});
      expect(isSageActionType(a.action_type)).toBe(true);
    }
  });
});
