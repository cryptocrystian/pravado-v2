/**
 * Auth Setup — runs once before all authenticated E2E tests.
 *
 * Logs in via the UI using TEST_EMAIL / TEST_PASSWORD from .env.test,
 * then saves the Supabase session cookies to playwright/.auth/user.json
 * so all subsequent tests can start already authenticated.
 *
 * Run:  pnpm test:e2e (auto) or npx playwright test --project=setup
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_EMAIL and TEST_PASSWORD must be set in .env.test to run authenticated E2E tests.\n' +
      'Copy .env.test.example → .env.test and fill in your dev credentials.'
    );
  }

  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect away from /login → either /app or /onboarding
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 20_000 });

  // If redirected to onboarding, we still have a valid session
  // Save cookie state so all tests can reuse it
  await page.context().storageState({ path: AUTH_FILE });
  console.log('[auth.setup] Session saved to', AUTH_FILE);
});
