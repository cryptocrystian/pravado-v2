/**
 * Critical API endpoint smoke tests.
 * Tests response shape and non-500 status — not data correctness.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';
const API = 'https://pravado-api.onrender.com';

test.describe('Dashboard API proxies (unauthenticated)', () => {
  test('PR pitches sequences returns non-500', async ({ request }) => {
    const response = await request.get(`${BASE}/api/pr/pitches/sequences?limit=10`);
    // Should return 401 (auth required) or 200, not 500
    expect(response.status()).not.toBe(500);
  });

  test('EVI current endpoint responds', async ({ request }) => {
    const response = await request.get(`${BASE}/api/evi/current`);
    expect(response.status()).not.toBe(500);
  });

  test('Onboarding status endpoint responds', async ({ request }) => {
    const response = await request.get(`${BASE}/api/onboarding/status`);
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Backend API (direct)', () => {
  test('Health endpoint returns healthy', async ({ request }) => {
    const response = await request.get(`${API}/health/`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database', 'ok');
  });

  test('PR releases endpoint returns 401 without auth', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/pr/releases/generate`, {
      data: { companyName: 'Test', newsType: 'other', announcement: 'Test' },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('message');
  });

  test('Beta request endpoint accepts POST', async ({ request }) => {
    const response = await request.post(`${API}/api/v1/beta/request`, {
      data: {
        email: `api-test-${Date.now()}@smoketest.io`,
        companyName: 'API Smoke Test',
      },
    });
    expect(response.status()).toBeLessThan(500);
  });
});
