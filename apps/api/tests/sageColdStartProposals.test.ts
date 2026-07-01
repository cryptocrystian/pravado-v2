/**
 * SAGE Cold-Start Proposals — Fix B (F13 Tier 2 remediation) unit tests.
 *
 * Two concerns:
 *
 *   1. Pure prompt/parser tests — fast, no mocks. Locks in the shape of
 *      the LLM output contract so future prompt edits don't silently
 *      break the parser.
 *
 *   2. Service tests — verify the three guard clauses (idempotency,
 *      brand data, competitors), the LLM path, and the stub fallback.
 *      Every inserted row gets reasoning_trace.origin === 'cold_start'.
 *
 * The service-level tests use a hand-rolled chainable Supabase mock
 * (shared _helpers/supabase-mock.ts targets a different assertion style)
 * so we can control per-table responses independently.
 */

import { LlmRouter } from '@pravado/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildColdStartSystemPrompt,
  buildColdStartUserPrompt,
  generateStubColdStartProposals,
  parseColdStartResponse,
  type ColdStartPromptContext,
} from '../src/prompts/sage/coldStart';
import { generateColdStartProposals } from '../src/services/sage/sageColdStartProposals';

// vi.mock is hoisted to the top of the module by vitest's transformer,
// so this placement below imports is safe — the mock is registered
// before any `import` binding is resolved at runtime.
vi.mock('@pravado/utils', async () => {
  const actual =
    await vi.importActual<typeof import('@pravado/utils')>('@pravado/utils');
  return {
    ...actual,
    LlmRouter: vi.fn(),
  };
});

const ORG_ID = 'bbbbbbbb-1111-2222-3333-444444444444';

const flowMetricCtx: ColdStartPromptContext = {
  org_name: 'FlowMetric',
  industry: 'B2B SaaS',
  company_size: '11-50',
  competitors: [
    { domain: 'project44.com', name: 'project44' },
    { domain: 'fourkites.com', name: 'FourKites' },
    { domain: 'shippeo.com', name: 'Shippeo' },
  ],
};

// ---------------------------------------------------------------------------
// Section 1 — Prompt builders + parser + stubs (no mocks required)
// ---------------------------------------------------------------------------

describe('coldStart prompt builders', () => {
  it('system prompt names the org and enforces the hard rules', () => {
    const sys = buildColdStartSystemPrompt('FlowMetric');
    expect(sys).toMatch(/FlowMetric/);
    expect(sys).toMatch(/GROUNDED/);
    expect(sys).toMatch(/CONCRETE/);
    expect(sys).toMatch(/PILLAR DIVERSITY/);
    expect(sys).toMatch(/BOUNDED/);
    // Confidence range is a spec-level contract — locked in
    expect(sys).toMatch(/0\.5.*0\.75/);
  });

  it('user prompt includes competitor domains + industry', () => {
    const usr = buildColdStartUserPrompt(flowMetricCtx);
    expect(usr).toMatch(/FlowMetric/);
    expect(usr).toMatch(/B2B SaaS/);
    expect(usr).toMatch(/project44\.com/);
    expect(usr).toMatch(/fourkites\.com/);
    expect(usr).toMatch(/shippeo\.com/);
  });

  it('user prompt handles empty competitor list gracefully', () => {
    const usr = buildColdStartUserPrompt({
      ...flowMetricCtx,
      competitors: [],
    });
    expect(usr).toMatch(/no competitors provided/i);
  });
});

describe('parseColdStartResponse', () => {
  const validPayload = {
    proposals: [
      {
        title: 'Position against project44 in trade press',
        rationale:
          'project44 dominates share of voice. We need a differentiated angle now.',
        suggested_action:
          'Draft one pitch to FreightWaves this week focused on our SMB advantage.',
        pillar: 'PR',
        priority: 'high',
        confidence: 0.65,
        evi_impact_estimate: 14,
        grounded_in: 'competitor: project44.com',
      },
      {
        title: 'Publish FlowMetric vs project44 comparison',
        rationale:
          'Comparison queries are highest-intent in logistics. Own our side of it.',
        suggested_action: 'Publish a comparison page with structured FAQ data.',
        pillar: 'Content',
        priority: 'high',
        confidence: 0.7,
        evi_impact_estimate: 16,
        grounded_in: 'competitor: project44.com',
      },
    ],
  };

  it('parses a bare JSON object', () => {
    const drafts = parseColdStartResponse(JSON.stringify(validPayload));
    expect(drafts).toHaveLength(2);
    expect(drafts?.[0].pillar).toBe('PR');
    expect(drafts?.[1].pillar).toBe('Content');
  });

  it('strips ```json code fences', () => {
    const fenced = '```json\n' + JSON.stringify(validPayload) + '\n```';
    const drafts = parseColdStartResponse(fenced);
    expect(drafts).toHaveLength(2);
  });

  it('tolerates leading prose from the LLM', () => {
    const withPreamble =
      'Here are the cold-start proposals for FlowMetric:\n\n' +
      JSON.stringify(validPayload);
    const drafts = parseColdStartResponse(withPreamble);
    expect(drafts).toHaveLength(2);
  });

  it('drops entries with invalid pillar or priority', () => {
    const mixed = {
      proposals: [
        ...validPayload.proposals,
        {
          title: 'Bad',
          rationale: 'Bad',
          suggested_action: 'Bad',
          pillar: 'Broadcast', // invalid pillar
          priority: 'high',
          confidence: 0.6,
          evi_impact_estimate: 10,
          grounded_in: 'x',
        },
        {
          title: 'Bad2',
          rationale: 'Bad2',
          suggested_action: 'Bad2',
          pillar: 'PR',
          priority: 'critical', // banned for cold-start
          confidence: 0.6,
          evi_impact_estimate: 10,
          grounded_in: 'x',
        },
      ],
    };
    const drafts = parseColdStartResponse(JSON.stringify(mixed));
    expect(drafts).toHaveLength(2);
  });

  it('returns null on unparseable input', () => {
    expect(parseColdStartResponse('not json at all')).toBeNull();
    expect(parseColdStartResponse('')).toBeNull();
    expect(parseColdStartResponse('{"proposals": "not-an-array"}')).toBeNull();
  });
});

describe('generateStubColdStartProposals', () => {
  it('returns ≥3 drafts with all required fields when competitors provided', () => {
    const drafts = generateStubColdStartProposals(flowMetricCtx);
    expect(drafts.length).toBeGreaterThanOrEqual(3);
    for (const d of drafts) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(d.suggested_action.length).toBeGreaterThan(0);
      expect(['PR', 'Content', 'SEO']).toContain(d.pillar);
      expect(['high', 'medium']).toContain(d.priority);
      expect(d.confidence).toBeGreaterThanOrEqual(0.5);
      expect(d.confidence).toBeLessThanOrEqual(0.75);
      expect(d.grounded_in.length).toBeGreaterThan(0);
    }
  });

  it('names the primary competitor concretely in output', () => {
    const drafts = generateStubColdStartProposals(flowMetricCtx);
    const joined = drafts.map((d) => d.title + ' ' + d.rationale).join(' ');
    expect(joined).toMatch(/project44/);
  });

  it('covers all three pillars', () => {
    const drafts = generateStubColdStartProposals(flowMetricCtx);
    const pillars = new Set(drafts.map((d) => d.pillar));
    expect(pillars.has('PR')).toBe(true);
    expect(pillars.has('Content')).toBe(true);
    expect(pillars.has('SEO')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Service: guards, LLM path, stub fallback, DB writes
// ---------------------------------------------------------------------------

interface MockTableState {
  count?: number | null;
  countError?: { message: string } | null;
  data?: unknown;
  error?: { message: string } | null;
  insertError?: { message: string } | null;
}

function createMockSupabase(tables: Record<string, MockTableState>) {
  const insertedRows: Record<string, unknown[]> = {};
  const from = vi.fn((table: string) => {
    const state = tables[table] ?? {};
    insertedRows[table] = insertedRows[table] ?? [];

    // sage_proposals uses count-exact head-true on select then eq
    // Everything else terminates with .single(), .maybeSingle(), or .limit()
    const builder: Record<string, unknown> = {};
    const thenable = (val: unknown) => ({
      then: <T>(fn: (v: unknown) => T) => Promise.resolve(val).then(fn),
    });

    builder.select = vi.fn(
      (_col: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact' && opts?.head === true) {
          // Return a countable builder — .eq resolves to {count, error}
          return {
            eq: vi.fn(() =>
              Promise.resolve({
                count: state.count ?? 0,
                error: state.countError ?? null,
              })
            ),
          };
        }
        return builder;
      }
    );

    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    // Extra chain methods added for checkLLMBudget's
    // .gte('created_at', monthStart) — llm_usage_ledger path — and any
    // future range/nullability filters. All are chain-through no-ops
    // that still resolve to the table's configured data/error via the
    // trailing thenable below.
    builder.gte = vi.fn(() => builder);
    builder.lte = vi.fn(() => builder);
    builder.gt = vi.fn(() => builder);
    builder.lt = vi.fn(() => builder);
    builder.is = vi.fn(() => builder);
    builder.in = vi.fn(() => builder);
    builder.limit = vi.fn(() =>
      Promise.resolve({
        data: state.data ?? [],
        error: state.error ?? null,
      })
    );
    builder.single = vi.fn(() =>
      Promise.resolve({
        data: state.data ?? null,
        error: state.error ?? null,
      })
    );
    builder.maybeSingle = vi.fn(() =>
      Promise.resolve({
        data: state.data ?? null,
        error: state.error ?? null,
      })
    );
    builder.insert = vi.fn((row: unknown) => {
      insertedRows[table].push(row);
      return Promise.resolve({
        data: null,
        error: state.insertError ?? null,
      });
    });

    // Chain terminator when the query is `from(x).select(y).eq(z)` without
    // limit/single (e.g. org_competitors path uses select().eq().limit())
    Object.assign(
      builder,
      thenable({ data: state.data ?? [], error: state.error ?? null })
    );

    return builder;
  });

  return {
    supabase: { from } as never,
    insertedRows,
    from,
  };
}

describe('generateColdStartProposals — guards + LLM path + stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('short-circuits when org already has proposals (idempotent)', async () => {
    const { supabase } = createMockSupabase({
      sage_proposals: { count: 7 },
    });

    const result = await generateColdStartProposals(supabase, ORG_ID);

    expect(result.reason).toBe('already_has_proposals');
    expect(result.generated).toBe(0);
    expect(result.llm_provider_used).toBe('skipped');
  });

  it('short-circuits when brand data is incomplete', async () => {
    const { supabase } = createMockSupabase({
      sage_proposals: { count: 0 },
      orgs: {
        data: { name: 'FlowMetric', industry: null, company_size: '11-50' },
      },
    });

    const result = await generateColdStartProposals(supabase, ORG_ID);

    expect(result.reason).toBe('missing_brand_data');
    expect(result.generated).toBe(0);
  });

  it('short-circuits when no competitors are on file', async () => {
    const { supabase } = createMockSupabase({
      sage_proposals: { count: 0 },
      orgs: {
        data: {
          name: 'FlowMetric',
          industry: 'B2B SaaS',
          company_size: '11-50',
        },
      },
      org_competitors: { data: [] },
      llm_usage_ledger: { data: [], error: null },
    });

    const result = await generateColdStartProposals(supabase, ORG_ID);

    expect(result.reason).toBe('missing_competitors');
    expect(result.generated).toBe(0);
  });

  it('inserts LLM-generated proposals with cold_start origin tag', async () => {
    const { supabase, insertedRows } = createMockSupabase({
      sage_proposals: { count: 0 },
      orgs: {
        data: {
          name: 'FlowMetric',
          industry: 'B2B SaaS',
          company_size: '11-50',
        },
      },
      org_competitors: {
        data: [
          { domain: 'project44.com', name: 'project44' },
          { domain: 'fourkites.com', name: 'FourKites' },
        ],
      },
      llm_usage_ledger: { data: [], error: null },
    });

    const llmPayload = {
      proposals: [
        {
          title: 'Position against project44 in FreightWaves',
          rationale:
            'project44 owns share of voice in trade press. Differentiated pitch now.',
          suggested_action:
            'Draft a pitch to FreightWaves editors this week with our SMB angle.',
          pillar: 'PR',
          priority: 'high',
          confidence: 0.68,
          evi_impact_estimate: 15,
          grounded_in: 'competitor: project44.com',
        },
        {
          title: 'Publish FlowMetric vs project44',
          rationale: 'Comparison queries convert.',
          suggested_action: 'Publish comparison page.',
          pillar: 'Content',
          priority: 'high',
          confidence: 0.72,
          evi_impact_estimate: 18,
          grounded_in: 'competitor: project44.com',
        },
        {
          title: 'Connect GSC',
          rationale: 'No SEO signals until connected.',
          suggested_action: 'Authorize GSC in Settings.',
          pillar: 'SEO',
          priority: 'high',
          confidence: 0.7,
          evi_impact_estimate: 18,
          grounded_in: 'missing_integration: gsc',
        },
      ],
    };

    vi.mocked(LlmRouter).mockImplementation(
      () =>
        ({
          generate: vi.fn().mockResolvedValue({
            provider: 'anthropic',
            completion: JSON.stringify(llmPayload),
          }),
        }) as never
    );

    const result = await generateColdStartProposals(supabase, ORG_ID);

    expect(result.reason).toBe('ok');
    expect(result.generated).toBe(3);
    expect(result.llm_provider_used).toBe('anthropic');

    const inserts = insertedRows.sage_proposals as Array<{
      reasoning_trace: { origin: string };
      signal_id: string | null;
      signal_type: string;
      pillar: string;
      mode: string;
    }>;
    expect(inserts).toHaveLength(3);
    for (const row of inserts) {
      expect(row.reasoning_trace.origin).toBe('cold_start');
      expect(row.signal_id).toBeNull();
      expect(row.signal_type).toMatch(/^cold_start_(pr|content|seo)$/);
    }
    // Mode-routing spec: SEO → autopilot, others → copilot
    const seoRow = inserts.find((r) => r.pillar === 'SEO');
    const prRow = inserts.find((r) => r.pillar === 'PR');
    expect(seoRow?.mode).toBe('autopilot');
    expect(prRow?.mode).toBe('copilot');
  });

  it('falls back to stub proposals when the LLM output is unparseable', async () => {
    const { supabase, insertedRows } = createMockSupabase({
      sage_proposals: { count: 0 },
      orgs: {
        data: {
          name: 'FlowMetric',
          industry: 'B2B SaaS',
          company_size: '11-50',
        },
      },
      org_competitors: {
        data: [{ domain: 'project44.com', name: 'project44' }],
      },
      llm_usage_ledger: { data: [], error: null },
    });

    vi.mocked(LlmRouter).mockImplementation(
      () =>
        ({
          generate: vi.fn().mockResolvedValue({
            provider: 'anthropic',
            completion: 'not json at all',
          }),
        }) as never
    );

    const result = await generateColdStartProposals(supabase, ORG_ID);

    expect(result.reason).toBe('ok');
    expect(result.llm_provider_used).toBe('stub');
    expect(result.generated).toBeGreaterThanOrEqual(3);

    const inserts = insertedRows.sage_proposals as Array<{
      reasoning_trace: { origin: string; provider: string };
    }>;
    for (const row of inserts) {
      expect(row.reasoning_trace.origin).toBe('cold_start');
      expect(row.reasoning_trace.provider).toBe('stub');
    }
  });
});
