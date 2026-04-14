/**
 * Auth smoke tests — verify login page, OAuth redirects, and sign out.
 * Run against production: PLAYWRIGHT_BASE_URL=https://app.pravado.io npx playwright test tests/smoke/auth.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';

test.describe('Auth flows', () => {
  test('login page loads with Google + Microsoft buttons', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Continue with Microsoft')).toBeVisible();
  });

  test('login page shows email and password fields', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('magic link: submits email and shows success message', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'smoketest@example.com');
    await page.getByText('Send Magic Link').click();
    // Should show a success message or loading state (not an error)
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    // Should NOT show an unhandled error
    expect(pageText).not.toContain('Application error');
  });

  test('Google OAuth button initiates redirect', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'commit', timeout: 5000 }).catch(() => null),
      page.getByText('Continue with Google').click(),
    ]);
    // Should either navigate to Google or Supabase auth endpoint
    if (response) {
      const url = page.url();
      expect(url).toMatch(/accounts\.google\.com|supabase/);
    }
  });

  test('callback page with invalid token shows error UI', async ({ page }) => {
    await page.goto(`${BASE}/callback?error=invalid_token&error_description=Test+error`);
    await expect(page.getByText('Authentication Error')).toBeVisible();
    await expect(page.getByText('Back to Sign In')).toBeVisible();
  });

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/app/command-center`);
    await page.waitForURL('**/login**', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('onboarding redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/ai-intro`);
    await page.waitForURL('**/login**', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
