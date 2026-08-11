/**
 * SAGE Daily Brief backend tests (D039 — SAGE_DAILY_BRIEF.md).
 *
 * Honesty is the property under test. These drive the deterministic STUB path
 * (over-budget ledger → no LLM/network) so they are hermetic, and assert:
 *   - the stub brief is GROUNDED: every number in it traces to a real input
 *     signal (a mocked proposal + EVI delta) — no invented numbers (§4.1/§4.2);
 *   - honest empty: no proposals AND no EVI snapshot → NO brief, NO row (§4.3);
 *   - budget-exceeded → deterministic stub provider (§4.2/§4.4);
 *   - persistence records traceability (proposal ids + evi snapshot id, §4.5);
 *   - getActionStreamForOrg returns `daily_brief`, org-scoped, honest-null.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { buildStubBrief } from '../src/prompts/sage/dailyBrief';
import { getActionStreamForOrg } from '../src/services/sage/sageActionStreamService';
import {
  generateDailyBrief,
  hasRealSignals,
} from '../src/services/sage/sageDailyBriefService';

const ORG = 'org-1';

// A real, number-free proposal title so the ONLY numbers that can appear in the
// grounded brief come from the structured signal values (count + EVI scores).
const topProposal = {
  id: 'prop-1',
  title: 'Pitch the TechCrunch enterprise reporter',
  pillar: 'PR',
  priority: 'critical',
  evi_impact_estimate: 4.2,
  deep_link: { href: '/app/pr/pitches', label: 'Open in PR Intelligence' },
};

// Two EVI snapshots → a real +5.0 delta (42.0 current vs 37.0 prior).
const eviSnapshots = [
  { id: 'evi-cur', evi_score: 42.0, calculated_at: '2026-08-10T00:00:00Z' },
  { id: 'evi-prior', evi_score: 37.0, calculated_at: '2026-08-09T00:00:00Z' },
];

interface MockConfig {
  proposals?: unknown[];
  eviSnapshots?: unknown[];
  citation?: unknown[];
  overBudget?: boolean;
  dailyBriefRows?: unknown[]; // for action-stream reads
}

/**
 * Chainable Supabase mock. Read queries resolve via `then`; `.single()` serves
 * org lookups + the insert `returning`. Captures inserts and the `eq` filters
 * applied so org-scoping can be asserted.
 */
function makeSupabase(cfg: MockConfig) {
  const inserts: Array<{ table: string; payload: any }> = [];
  const eqCalls: Array<{ table: string; col: string; val: unknown }> = [];

  function resolveRead(table: string, op: string | undefined) {
    if (op === 'insert') {
      if (table === 'sage_daily_briefs')
        return { data: { id: 'brief-row-1' }, error: null };
      return { data: null, error: null };
    }
    if (table === 'orgs') return { data: { name: 'FreightCo' }, error: null };
    if (table === 'sage_proposals')
      return { data: cfg.proposals ?? [], error: null };
    if (table === 'evi_snapshots')
      return { data: cfg.eviSnapshots ?? [], error: null };
    if (table === 'citation_summaries')
      return { data: cfg.citation ?? [], error: null };
    if (table === 'llm_usage_ledger')
      return {
        data: cfg.overBudget ? [{ tokens_total: 999_999 }] : [],
        error: null,
      };
    if (table === 'sage_executions') return { data: [], error: null };
    if (table === 'sage_outcomes') return { data: [], error: null };
    if (table === 'sage_daily_briefs')
      return { data: cfg.dailyBriefRows ?? [], error: null };
    return { data: null, error: null };
  }

  function table(name: string) {
    const state: { op?: string } = {};
    const chain: any = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        eqCalls.push({ table: name, col, val });
        return chain;
      },
      in: () => chain,
      not: () => chain,
      or: () => chain,
      gte: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (payload: any) => {
        inserts.push({ table: name, payload });
        state.op = 'insert';
        return chain;
      },
      single: async () => resolveRead(name, state.op),
      maybeSingle: async () => resolveRead(name, state.op),
      then: (res: any, rej: any) =>
        Promise.resolve(resolveRead(name, state.op)).then(res, rej),
    };
    return chain;
  }

  const client = {
    from: (name: string) => table(name),
  } as unknown as SupabaseClient;
  return { client, inserts, eqCalls };
}

describe('buildStubBrief — grounded, no invented numbers', () => {
  it('reflects the real proposal + EVI delta and invents no numbers', () => {
    const { brief_text } = buildStubBrief({
      org_name: 'FreightCo',
      proposals: [
        {
          id: topProposal.id,
          title: topProposal.title,
          pillar: topProposal.pillar,
          priority: topProposal.priority,
          evi_impact_estimate: topProposal.evi_impact_estimate,
        },
      ],
      top_action: {
        proposal_id: topProposal.id,
        title: topProposal.title,
        pillar: topProposal.pillar,
        priority: topProposal.priority,
        deep_link: topProposal.deep_link,
      },
      evi_delta: {
        current_snapshot_id: 'evi-cur',
        prior_snapshot_id: 'evi-prior',
        current_score: 42.0,
        prior_score: 37.0,
        delta: 5.0,
      },
      citation: null,
    });

    // Grounded: the real proposal title + the real EVI numbers are present.
    expect(brief_text).toContain(topProposal.title);
    expect(brief_text).toContain('42.0'); // current EVI score
    expect(brief_text).toContain('5.0'); // real delta (42.0 - 37.0)

    // No citation was provided → the stub must not invent a citation rate.
    expect(brief_text).not.toContain('%');

    // Every number in the brief must be one of the grounded values. This is the
    // core anti-fabrication assertion: nothing numeric is invented.
    const allowed = new Set(['42.0', '5.0', '1']); // current, delta, proposal count
    const numbers = brief_text.match(/\d+\.?\d*/g) ?? [];
    for (const n of numbers) {
      expect(allowed.has(n)).toBe(true);
    }
  });
});

describe('generateDailyBrief — honest empty (§4.3)', () => {
  it('returns null and writes NO row when there are no proposals and no EVI', async () => {
    const { client, inserts } = makeSupabase({
      proposals: [],
      eviSnapshots: [],
      citation: [],
    });

    const result = await generateDailyBrief(client, ORG);

    expect(result).toBeNull();
    expect(
      inserts.find((i) => i.table === 'sage_daily_briefs')
    ).toBeUndefined();
  });

  it('hasRealSignals is false with no proposals and no snapshot, true otherwise', () => {
    const base = {
      org_name: 'X',
      proposals: [],
      top_action: null,
      evi_delta: null,
      citation: {
        summary_id: 'c1',
        mention_rate: 0.5,
        total_mentions: 5,
        total_queries: 10,
      },
    };
    // Citation alone is NOT sufficient to ground a brief.
    expect(hasRealSignals(base as any)).toBe(false);
    expect(
      hasRealSignals({
        ...base,
        evi_delta: {
          current_snapshot_id: 's',
          prior_snapshot_id: null,
          current_score: 10,
          prior_score: null,
          delta: null,
        },
      } as any)
    ).toBe(true);
  });
});

describe('generateDailyBrief — budget-exceeded → grounded stub + traceability', () => {
  it('uses the stub provider and persists source_signal_ids for traceability', async () => {
    const { client, inserts } = makeSupabase({
      proposals: [topProposal],
      eviSnapshots,
      citation: [],
      overBudget: true, // forces the deterministic stub path (no LLM/network)
    });

    const result = await generateDailyBrief(client, ORG);

    expect(result).not.toBeNull();
    expect(result!.provider_used).toBe('stub');

    // Grounded prose.
    expect(result!.brief_text).toContain(topProposal.title);
    expect(result!.brief_text).toContain('42.0');

    // Persisted with traceability (§4.5).
    const insert = inserts.find((i) => i.table === 'sage_daily_briefs');
    expect(insert).toBeTruthy();
    expect(insert!.payload.provider_used).toBe('stub');
    expect(insert!.payload.source_signal_ids.proposal_ids).toEqual([
      topProposal.id,
    ]);
    expect(insert!.payload.source_signal_ids.top_action_proposal_id).toBe(
      topProposal.id
    );
    expect(insert!.payload.source_signal_ids.evi_snapshot_id).toBe('evi-cur');
    expect(insert!.payload.source_signal_ids.evi_prior_snapshot_id).toBe(
      'evi-prior'
    );
    expect(insert!.payload.top_action.proposal_id).toBe(topProposal.id);
  });
});

describe('getActionStreamForOrg — daily_brief field (org-scoped, honest null)', () => {
  it('includes the latest persisted brief, org-scoped', async () => {
    const { client, eqCalls } = makeSupabase({
      proposals: [], // action stream empty is fine
      dailyBriefRows: [{ brief_text: 'FreightCo EVI is up 5.0 to 42.0.' }],
    });

    const stream = await getActionStreamForOrg(client, ORG);

    expect(stream.daily_brief).toBe('FreightCo EVI is up 5.0 to 42.0.');
    // Org-scoped: the brief read filtered by org_id = ORG.
    expect(
      eqCalls.some(
        (c) =>
          c.table === 'sage_daily_briefs' && c.col === 'org_id' && c.val === ORG
      )
    ).toBe(true);
  });

  it('is honest-null when no brief has been generated', async () => {
    const { client } = makeSupabase({ proposals: [], dailyBriefRows: [] });

    const stream = await getActionStreamForOrg(client, ORG);

    expect(stream.daily_brief).toBeNull();
  });
});
