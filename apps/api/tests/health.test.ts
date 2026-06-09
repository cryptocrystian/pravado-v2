/**
 * /health endpoint tests (Phase 0.5 Plan 03)
 *
 * Coverage:
 *   - resolveDeployVersion() — env-var precedence
 *   - checkResendInit() / checkStripeInit() — shape-only validation
 *   - checkSupabaseInit() — SDK init + getSession round-trip
 *   - Route smoke test against the registered handler
 *   - **Leak assertions** — response body MUST NOT contain API key
 *     fragments, internal URLs, or stack-trace markers. These are the
 *     architect-mandated risk controls for an unauth poll target.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/03-health.md
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted runs BEFORE any ESM import — required because the route
// module imports `config` which eagerly validates env on first read.
// Without hoisting, the validator throws before our test code runs.
//
// The values are deliberately recognizable so the leak assertions can
// look for them by exact substring further down.
vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL =
    process.env.SUPABASE_URL ?? 'https://internal-secret-host.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'super-secret-service-role-key-xyz';
  process.env.SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ?? 'super-secret-anon-key-xyz';
});

// Mock @supabase/supabase-js BEFORE importing the route module — vi.mock
// is hoisted to top of file by Vitest, so the route's import binds to
// the mocked createClient.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
  })),
}));

import {
  checkResendInit,
  checkStripeInit,
  checkSupabaseInit,
  healthRoutes,
  resolveDeployVersion,
} from '../src/routes/health';

describe('resolveDeployVersion', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.RENDER_GIT_COMMIT = originalEnv.RENDER_GIT_COMMIT;
    process.env.VERCEL_GIT_COMMIT_SHA = originalEnv.VERCEL_GIT_COMMIT_SHA;
  });

  it('prefers RENDER_GIT_COMMIT when set, truncated to 12 chars', () => {
    process.env.RENDER_GIT_COMMIT = 'abcdef1234567890abcdef1234567890abcdef12';
    process.env.VERCEL_GIT_COMMIT_SHA = 'should-not-win';
    expect(resolveDeployVersion()).toBe('abcdef123456');
  });

  it('falls back to VERCEL_GIT_COMMIT_SHA when Render env absent', () => {
    delete process.env.RENDER_GIT_COMMIT;
    process.env.VERCEL_GIT_COMMIT_SHA = '0123456789abcdef0123456789abcdef';
    expect(resolveDeployVersion()).toBe('0123456789ab');
  });

  it('falls back to APP_VERSION or "unknown" when no SHA env present', () => {
    delete process.env.RENDER_GIT_COMMIT;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    const v = resolveDeployVersion();
    // APP_VERSION resolves from npm_package_version or '0.0.0-dev' fallback
    expect(typeof v).toBe('string');
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('checkResendInit', () => {
  it('returns not_configured when key is undefined', () => {
    expect(checkResendInit(undefined)).toBe('not_configured');
  });
  it('returns not_configured when key is empty string', () => {
    expect(checkResendInit('')).toBe('not_configured');
  });
  it('returns ok for plausible re_ prefixed key', () => {
    expect(checkResendInit('re_abc123def456')).toBe('ok');
  });
  it('returns degraded for malformed key (wrong prefix)', () => {
    expect(checkResendInit('sk_abc123def456')).toBe('degraded');
  });
  it('returns degraded for too-short key', () => {
    expect(checkResendInit('re_')).toBe('degraded');
  });
});

describe('checkStripeInit', () => {
  it('returns not_configured when key is undefined', () => {
    expect(checkStripeInit(undefined)).toBe('not_configured');
  });
  it('returns ok for plausible sk_live_ prefixed key', () => {
    expect(checkStripeInit('sk_live_abcdefghij1234567890')).toBe('ok');
  });
  it('returns ok for plausible sk_test_ prefixed key', () => {
    expect(checkStripeInit('sk_test_abcdefghij1234567890')).toBe('ok');
  });
  it('returns degraded for malformed key (wrong prefix)', () => {
    expect(checkStripeInit('pk_live_abcdefghij1234567890')).toBe('degraded');
  });
  it('returns degraded for too-short key', () => {
    expect(checkStripeInit('sk_live_')).toBe('degraded');
  });
});

describe('checkSupabaseInit', () => {
  it('returns not_configured when url or key missing', async () => {
    expect(await checkSupabaseInit(undefined, 'k')).toBe('not_configured');
    expect(await checkSupabaseInit('u', undefined)).toBe('not_configured');
    expect(await checkSupabaseInit(undefined, undefined)).toBe(
      'not_configured'
    );
  });

  it('returns ok when getSession resolves without error', async () => {
    const result = await checkSupabaseInit(
      'https://internal-secret-host.supabase.co',
      'super-secret-service-role-key-xyz'
    );
    expect(result).toBe('ok');
  });
});

describe('GET /health/ — route handler', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    await server.register(healthRoutes, { prefix: '/health' });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('returns 200 with the expected top-level shape', async () => {
    const res = await server.inject({ method: 'GET', url: '/health/' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      status: 'healthy',
      version: expect.any(String),
      timestamp: expect.any(String),
      deps: {
        supabase: expect.any(String),
        resend: expect.any(String),
        stripe: expect.any(String),
      },
      checks: expect.any(Object),
    });
  });

  it('reports each dep as one of the DepStatus values', async () => {
    const res = await server.inject({ method: 'GET', url: '/health/' });
    const body = res.json();
    const validStatuses = ['ok', 'not_configured', 'degraded'];
    expect(validStatuses).toContain(body.deps.supabase);
    expect(validStatuses).toContain(body.deps.resend);
    expect(validStatuses).toContain(body.deps.stripe);
  });

  // === ARCHITECT-MANDATED LEAK ASSERTIONS ===
  // /health is an unauth endpoint that monitors poll every 5 minutes.
  // The response body MUST NOT broadcast secrets, internal infra
  // hostnames, or exception stack traces. These assertions enforce that
  // at the wire level — the test deliberately uses recognizable values
  // for the secrets so any spread/serialize regression fails loud.
  describe('response body leak assertions', () => {
    it('does not include the Supabase service role key fragment', async () => {
      const res = await server.inject({ method: 'GET', url: '/health/' });
      const raw = res.body;
      expect(raw).not.toContain('super-secret-service-role-key');
      expect(raw).not.toContain('super-secret-anon-key');
    });

    it('does not include the internal Supabase URL', async () => {
      const res = await server.inject({ method: 'GET', url: '/health/' });
      const raw = res.body;
      expect(raw).not.toContain('internal-secret-host');
      expect(raw).not.toContain('.supabase.co');
    });

    it('does not include stack-trace markers', async () => {
      const res = await server.inject({ method: 'GET', url: '/health/' });
      const raw = res.body;
      // Common stack-trace markers in Node.js. None of these strings
      // should ever appear in a /health response body.
      expect(raw).not.toMatch(/\s+at\s+\S+\s+\(/); // "    at Object.foo ("
      expect(raw).not.toContain('node_modules');
      expect(raw).not.toContain('Error:');
      expect(raw).not.toContain('TypeError:');
    });

    it('only contains the documented top-level keys', async () => {
      const res = await server.inject({ method: 'GET', url: '/health/' });
      const body = res.json();
      const allowedKeys = new Set([
        'status',
        'version',
        'timestamp',
        'deps',
        'checks',
      ]);
      for (const key of Object.keys(body)) {
        expect(allowedKeys).toContain(key);
      }
    });

    it('checks block contains only string values (no nested errors/objects)', async () => {
      const res = await server.inject({ method: 'GET', url: '/health/' });
      const body = res.json();
      for (const [, v] of Object.entries(body.checks)) {
        expect(typeof v).toBe('string');
      }
    });
  });
});

describe('GET /health/live', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    await server.register(healthRoutes, { prefix: '/health' });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('returns alive:true', async () => {
    const res = await server.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      alive: true,
      timestamp: expect.any(String),
    });
  });
});
