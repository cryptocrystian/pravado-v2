/**
 * Onboarding Enqueue Transparency — Adjacent P1 (F13 Tier 2) unit tests.
 *
 * Before this fix, both /complete and /activate had a silent
 * try/catch (empty catch body with only a comment) that swallowed BullMQ
 * enqueue failures. F13 incident (2026-06-30) sat undetected for 14
 * hours because of this exact silence.
 *
 * These tests lock in the new posture:
 *
 *   1. HTTP 200 is still returned (onboarding completion itself worked)
 *   2. Response body contains queued:false and a warning string
 *   3. Sentry.captureException is called with the right phase tag
 *   4. The happy path (enqueue succeeds) still returns queued:true with
 *      no warning field
 *
 * The route uses `await import('../../queue/bullmqQueue')` for the
 * enqueue functions — that dynamic import is what we intercept.
 */

import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enqueueEVIRecalculate,
  enqueueSageSignalScan,
} from '../src/queue/bullmqQueue';
import { onboardingRoutes } from '../src/routes/onboarding';

// vi.mock is hoisted to the top of the module by vitest's transformer,
// so these run before the imports above resolve at runtime.
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

vi.mock('../src/middleware/requireUser', () => ({
  requireUser: async (request: { user: { id: string } }) => {
    request.user = { id: 'test-user-id' };
  },
}));

vi.mock('../src/queue/bullmqQueue', () => ({
  enqueueEVIRecalculate: vi.fn(),
  enqueueSageSignalScan: vi.fn(),
}));

const ORG_ID = 'cccccccc-1111-2222-3333-444444444444';

// The onboarding route calls getSupabaseClient() at register time.
// We inject a chainable mock whose org update path always succeeds and
// whose org_members lookup returns a stable org id.
vi.mock('../src/lib/supabase', () => ({
  getSupabaseClient: () => {
    // Simple hand-rolled chainable stub scoped to this test file's
    // narrow usage:
    //   - .from('org_members').select().eq().limit().single()
    //   - .from('orgs').update().eq()  (used with await)
    const chain = (finalValue: unknown): Record<string, unknown> => {
      const b: Record<string, unknown> = {};
      const term = () => finalValue;
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() =>
        // .update().eq() is awaited directly, so eq must also be thenable
        Object.assign(b, {
          then: <T>(fn: (v: unknown) => T) => Promise.resolve(term()).then(fn),
        })
      );
      b.limit = vi.fn(() => b);
      b.single = vi.fn(() => Promise.resolve(term()));
      b.maybeSingle = vi.fn(() => Promise.resolve(term()));
      b.update = vi.fn(() => b);
      b.insert = vi.fn(() => b);
      return b;
    };

    return {
      from: vi.fn((table: string) => {
        if (table === 'org_members') {
          return chain({ data: { org_id: ORG_ID }, error: null });
        }
        if (table === 'orgs') {
          return chain({ error: null });
        }
        return chain({ data: null, error: null });
      }),
    } as never;
  },
}));

async function buildServer() {
  const app = Fastify({ logger: false });
  await app.register(onboardingRoutes);
  return app;
}

describe('onboarding enqueue transparency (Adjacent P1)', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /complete', () => {
    it('returns 200 with queued:false + warning + captures Sentry on enqueue failure', async () => {
      vi.mocked(enqueueEVIRecalculate).mockRejectedValueOnce(
        new Error('Redis connection refused')
      );

      const res = await app.inject({ method: 'POST', url: '/complete' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body) as {
        success: boolean;
        data: {
          completed: boolean;
          queued: boolean;
          warning?: string;
        };
      };
      expect(body.success).toBe(true);
      expect(body.data.completed).toBe(true);
      expect(body.data.queued).toBe(false);
      expect(body.data.warning).toMatch(/SAGE activation is delayed/i);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            org_id: ORG_ID,
            phase: 'onboarding_complete_enqueue',
          }),
        })
      );
    });

    it('returns queued:true and no warning on the happy path', async () => {
      vi.mocked(enqueueEVIRecalculate).mockResolvedValueOnce(
        undefined as never
      );
      vi.mocked(enqueueSageSignalScan).mockResolvedValueOnce(
        undefined as never
      );

      const res = await app.inject({ method: 'POST', url: '/complete' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body) as {
        data: { queued: boolean; warning?: string };
      };
      expect(body.data.queued).toBe(true);
      expect(body.data.warning).toBeUndefined();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('POST /activate', () => {
    it('returns 200 with queued:false + warning + captures Sentry on enqueue failure', async () => {
      vi.mocked(enqueueSageSignalScan).mockRejectedValueOnce(
        new Error('BullMQ queue not ready')
      );

      const res = await app.inject({ method: 'POST', url: '/activate' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body) as {
        data: { queued: boolean; warning?: string; reason?: string };
      };
      expect(body.data.queued).toBe(false);
      expect(body.data.warning).toMatch(/SAGE activation is delayed/i);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            org_id: ORG_ID,
            phase: 'onboarding_activate_enqueue',
          }),
        })
      );
    });

    it('returns queued:true on the happy path', async () => {
      vi.mocked(enqueueEVIRecalculate).mockResolvedValueOnce(
        undefined as never
      );
      vi.mocked(enqueueSageSignalScan).mockResolvedValueOnce(
        undefined as never
      );

      const res = await app.inject({ method: 'POST', url: '/activate' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body) as {
        data: { queued: boolean; warning?: string };
      };
      expect(body.data.queued).toBe(true);
      expect(body.data.warning).toBeUndefined();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
