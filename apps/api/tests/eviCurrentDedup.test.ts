/**
 * EVI /current dedup — Adjacent P2 (F13 Tier 2) unit tests.
 *
 * Regression proof:
 *   - Before this fix, GET /current unconditionally called calculateEVI
 *     which inserts a fresh evi_snapshots row. FlowMetric's Command
 *     Center produced 34 snapshots in 14 hours from a single idle tab.
 *   - After this fix, /current returns the cached snapshot when the
 *     latest one is younger than 1 hour, without calling calculateEVI.
 *
 * The tests here lock in both branches:
 *
 *   1. Latest snapshot is 30 min old → calculateEVI NOT called; response
 *      uses cached fields.
 *   2. Latest snapshot is 2 hours old → calculateEVI IS called; response
 *      reflects the fresh calculation.
 *   3. No prior snapshot → calculateEVI IS called (cold path unchanged).
 */

import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pravado/feature-flags', async () => {
  const actual = await vi.importActual<typeof import('@pravado/feature-flags')>(
    '@pravado/feature-flags'
  );
  return {
    ...actual,
    FLAGS: { ...actual.FLAGS, ENABLE_EVI: true },
  };
});

vi.mock('../src/middleware/requireUser', () => ({
  requireUser: async (request: { user: { id: string } }) => {
    request.user = { id: 'test-user-id' };
  },
}));

vi.mock('../src/services/evi/eviCalculationService', () => ({
  calculateEVI: vi.fn(),
}));

vi.mock('../src/services/evi/eviDeltaService', () => ({
  getEVIDelta: vi.fn(async () => ({
    delta: 0,
    deltaPercent: 0,
    direction: 'flat',
  })),
}));

vi.mock('../src/services/evi/eviHistoryService', () => ({
  getEVIHistory: vi.fn(),
}));

// Cached test-scoped state so we can vary the evi_snapshots response
// per test without redefining the whole mock chain.
let latestSnapshotResponse: {
  data: unknown;
  error: unknown;
} = { data: null, error: null };

const ORG_ID = 'dddddddd-1111-2222-3333-444444444444';

vi.mock('../src/lib/supabase', () => ({
  getSupabaseClient: () => {
    const evi_snapshotsBuilder = (): Record<string, unknown> => {
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.limit = vi.fn(() => b);
      b.maybeSingle = vi.fn(() =>
        Promise.resolve({
          data: latestSnapshotResponse.data,
          error: latestSnapshotResponse.error,
        })
      );
      return b;
    };

    const org_membersBuilder = (): Record<string, unknown> => {
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.limit = vi.fn(() => b);
      b.single = vi.fn(() =>
        Promise.resolve({ data: { org_id: ORG_ID }, error: null })
      );
      return b;
    };

    return {
      from: vi.fn((table: string) => {
        if (table === 'org_members') return org_membersBuilder();
        if (table === 'evi_snapshots') return evi_snapshotsBuilder();
        return {
          select: vi.fn(),
          eq: vi.fn(),
          order: vi.fn(),
          limit: vi.fn(),
          maybeSingle: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        };
      }),
    } as never;
  },
}));

import { eviRoutes } from '../src/routes/evi';
import { calculateEVI } from '../src/services/evi/eviCalculationService';

async function buildServer() {
  const app = Fastify({ logger: false });
  await app.register(eviRoutes);
  return app;
}

describe('GET /current — snapshot dedup (Adjacent P2)', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    latestSnapshotResponse = { data: null, error: null };
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns cached snapshot without calling calculateEVI when latest is 30 minutes old', async () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    latestSnapshotResponse = {
      data: {
        evi_score: 42.5,
        visibility_score: 30,
        authority_score: 50,
        momentum_score: 45,
        signal_breakdown: { PR: 10, Content: 20, SEO: 15 },
        calculated_at: thirtyMinsAgo,
        period_days: 30,
      },
      error: null,
    };

    const res = await app.inject({ method: 'GET', url: '/current' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      data: { evi_score: number; calculated_at: string };
    };
    expect(body.data.evi_score).toBe(42.5);
    expect(body.data.calculated_at).toBe(thirtyMinsAgo);
    expect(calculateEVI).not.toHaveBeenCalled();
  });

  it('calls calculateEVI when latest snapshot is 2 hours old', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    latestSnapshotResponse = {
      data: {
        evi_score: 40,
        visibility_score: 30,
        authority_score: 45,
        momentum_score: 40,
        signal_breakdown: {},
        calculated_at: twoHoursAgo,
        period_days: 30,
      },
      error: null,
    };
    vi.mocked(calculateEVI).mockResolvedValue({
      evi_score: 47.2,
      visibility_score: 32,
      authority_score: 52,
      momentum_score: 50,
      signal_breakdown: { PR: 12 },
      calculated_at: new Date().toISOString(),
      period_days: 30,
    } as never);

    const res = await app.inject({ method: 'GET', url: '/current' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { data: { evi_score: number } };
    expect(body.data.evi_score).toBe(47.2);
    expect(calculateEVI).toHaveBeenCalledTimes(1);
  });

  it('calls calculateEVI when there is no prior snapshot (cold path preserved)', async () => {
    latestSnapshotResponse = { data: null, error: null };
    vi.mocked(calculateEVI).mockResolvedValue({
      evi_score: 25,
      visibility_score: 10,
      authority_score: 30,
      momentum_score: 25,
      signal_breakdown: {},
      calculated_at: new Date().toISOString(),
      period_days: 30,
    } as never);

    const res = await app.inject({ method: 'GET', url: '/current' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { data: { evi_score: number } };
    expect(body.data.evi_score).toBe(25);
    expect(calculateEVI).toHaveBeenCalledTimes(1);
  });
});
