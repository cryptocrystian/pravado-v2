/**
 * /health smoke test — verify the dashboard /health endpoint returns the
 * documented shape and does NOT leak secrets, internal URLs, or stack
 * traces.
 *
 * Phase 0.5 Plan 03. Runs against production via the smoke-tests CI
 * workflow (PLAYWRIGHT_BASE_URL=https://app.pravado.io). The leak
 * assertions are the architect-mandated risk controls — see
 * docs/sprints/PHASE-0-5-OBSERVABILITY/03-health.md.
 *
 * NOTE on test-runner coverage: the dashboard package has no vitest
 * scaffold (only Playwright). A Phase 1 issue tracks setting up
 * @vitest + @testing-library for true unit-level coverage of route
 * handlers; until then this Playwright spec runs against the deployed
 * preview/production endpoint, which is the highest-value place to
 * verify the leak invariants anyway.
 */

import { test, expect, type APIResponse } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';

const DEP_STATUS_VALUES = ['ok', 'not_configured', 'degraded'] as const;

test.describe('Dashboard /health endpoint', () => {
  let response: APIResponse;
  let bodyText: string;
  let bodyJson: Record<string, unknown>;

  test.beforeAll(async ({ request }) => {
    response = await request.get(`${BASE}/health`);
    bodyText = await response.text();
    bodyJson = JSON.parse(bodyText);
  });

  test('returns 200 or 503 (well-formed health response)', () => {
    expect([200, 503]).toContain(response.status());
  });

  test('Cache-Control header disables intermediate caching', () => {
    const cacheControl = response.headers()['cache-control'] ?? '';
    expect(cacheControl).toMatch(/no-store/);
  });

  test('top-level shape matches the documented allowlist', () => {
    const allowedKeys = new Set([
      'status',
      'version',
      'timestamp',
      'vercel',
      'deps',
    ]);
    for (const key of Object.keys(bodyJson)) {
      expect(allowedKeys, `unexpected top-level key "${key}"`).toContain(key);
    }
    expect(bodyJson.status).toMatch(/^(healthy|unhealthy)$/);
    expect(typeof bodyJson.version).toBe('string');
    expect(typeof bodyJson.timestamp).toBe('string');
  });

  test('vercel block contains only env/deployment/region strings', () => {
    const vercel = bodyJson.vercel as Record<string, unknown>;
    expect(vercel).toBeTruthy();
    const allowed = new Set(['env', 'deployment', 'region']);
    for (const key of Object.keys(vercel)) {
      expect(allowed, `unexpected vercel key "${key}"`).toContain(key);
      expect(typeof vercel[key]).toBe('string');
    }
  });

  test('deps.supabase is one of the documented DepStatus values', () => {
    const deps = bodyJson.deps as Record<string, unknown>;
    expect(deps).toBeTruthy();
    expect(DEP_STATUS_VALUES).toContain(deps.supabase as string);
  });

  // === ARCHITECT-MANDATED LEAK ASSERTIONS ===
  // The body is broadcast over an unauth endpoint that monitors poll.
  // Stack traces, env values, and internal URLs MUST stay out of the
  // response body. These assertions match the api-side leak tests in
  // apps/api/tests/health.test.ts so both sides converge on the same
  // invariant.
  test.describe('leak assertions', () => {
    test('does not include any Supabase anon-key fragment', () => {
      // Supabase anon keys are JWTs (start with `eyJ`). Any 'eyJ'
      // substring in the body would mean we accidentally embedded a
      // JWT or the SDK-init error spilled the env value.
      expect(bodyText).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    });

    test('does not include the Supabase project URL', () => {
      // *.supabase.co is the canonical Supabase project host pattern.
      // It would only appear here via an error message or stack frame.
      expect(bodyText).not.toMatch(/[a-z0-9-]+\.supabase\.co/);
    });

    test('does not include stack-trace markers', () => {
      // Common Node.js stack-frame patterns. None of these strings
      // should ever appear in a /health response body.
      expect(bodyText).not.toMatch(/\s+at\s+\S+\s+\(/); // "    at Object.foo ("
      expect(bodyText).not.toContain('node_modules');
      expect(bodyText).not.toContain('Error:');
      expect(bodyText).not.toContain('TypeError:');
      expect(bodyText).not.toContain('.next/server');
    });

    test('does not include env-var names that imply a value leak', () => {
      // If we ever accidentally serialized process.env into the body,
      // these key names would appear. The endpoint should NEVER name
      // the env vars it reads — only their resolved status.
      expect(bodyText).not.toContain('SERVICE_ROLE_KEY');
      expect(bodyText).not.toContain('SUPABASE_SERVICE_ROLE');
      expect(bodyText).not.toContain('STRIPE_SECRET_KEY');
    });
  });
});
