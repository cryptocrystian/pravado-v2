/**
 * Navigation smoke tests — verify all public routes return 200.
 * Authenticated routes tested as redirect-to-login (expected behavior).
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';

// Public routes that should return 200 directly
const publicRoutes = [
  { path: '/login', title: 'login' },
  { path: '/beta', title: 'beta' },
  { path: '/legal/terms', title: 'terms' },
  { path: '/legal/privacy', title: 'privacy' },
  { path: '/legal/cookies', title: 'cookies' },
  { path: '/legal/acceptable-use', title: 'acceptable use' },
];

// Protected routes that should redirect to /login
const protectedRoutes = [
  '/app/command-center',
  '/app/pr',
  '/app/content',
  '/app/seo',
  '/app/calendar',
  '/app/analytics',
  '/app/analytics/pr',
  '/app/analytics/seo',
  '/app/analytics/content',
  '/app/analytics/reports',
  '/app/settings',
  '/app/team',
  '/app/billing',
  '/app/playbooks',
];

test.describe('Public routes', () => {
  for (const route of publicRoutes) {
    test(`${route.path} loads (200)`, async ({ page }) => {
      const response = await page.goto(`${BASE}${route.path}`);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe('Protected routes redirect to login', () => {
  for (const path of protectedRoutes) {
    test(`${path} → /login redirect`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForURL('**/login**', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  }
});

test.describe('API health', () => {
  test('API server is healthy', async ({ request }) => {
    const response = await request.get('https://pravado-api.onrender.com/health/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('API readiness probe passes', async ({ request }) => {
    const response = await request.get('https://pravado-api.onrender.com/health/ready');
    expect(response.status()).toBe(200);
  });
});
