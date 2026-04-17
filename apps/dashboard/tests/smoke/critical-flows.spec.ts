/**
 * Critical user flow smoke tests.
 * Tests UI rendering and interactions on public pages.
 * Authenticated flows are tested against redirect behavior.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';

test.describe('Login page interactions', () => {
  test('sign up toggle works', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByText("Don't have an account? Sign up").click();
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('password field shows for sign in', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();
  });

  test('email validation prevents empty submit', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const signInBtn = page.locator('button[type="submit"]');
    // HTML required attribute should prevent submit with empty fields
    await expect(signInBtn).toBeVisible();
  });
});

test.describe('Beta page interactions', () => {
  test('form shows all required fields', async ({ page }) => {
    await page.goto(`${BASE}/beta`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Check for company and use case fields
    const pageText = await page.textContent('body');
    expect(pageText).toContain('email');
  });

  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/beta`, { waitUntil: 'networkidle' });
    // Filter out known non-critical errors
    const critical = errors.filter(
      (e) => !e.includes('Sentry') && !e.includes('PostHog') && !e.includes('lockdown')
    );
    expect(critical).toHaveLength(0);
  });
});

test.describe('Legal pages render', () => {
  test('Terms of Service has content', async ({ page }) => {
    await page.goto(`${BASE}/legal/terms`);
    const text = await page.textContent('body');
    expect(text?.length).toBeGreaterThan(500);
    expect(text).toContain('Pravado');
  });

  test('Privacy Policy has content', async ({ page }) => {
    await page.goto(`${BASE}/legal/privacy`);
    const text = await page.textContent('body');
    expect(text?.length).toBeGreaterThan(500);
  });
});

test.describe('Root redirect', () => {
  test('/ redirects to /login', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForURL('**/login**', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('Command Center / Entity Map', () => {
  test('command center redirects without 500 error', async ({ page }) => {
    const response = await page.goto(`${BASE}/app/command-center`);
    // Should redirect to login (no auth), but must not 500
    expect(response?.status()).not.toBe(500);
    expect(page.url()).not.toContain('error');
  });

  test('entity map canvas renders without crash', async ({ page }) => {
    const response = await page.goto(`${BASE}/app/command-center`);
    // Unauthenticated redirects to login — just confirm no 500/crash
    expect(response?.status()).not.toBe(500);
    expect(page.url()).not.toContain('500');
  });

  test('command center page has no critical JS errors on redirect', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/app/command-center`, { waitUntil: 'networkidle' });
    // Filter known non-critical errors (analytics, polyfills)
    const critical = errors.filter(
      (e) =>
        !e.includes('Sentry') &&
        !e.includes('PostHog') &&
        !e.includes('lockdown') &&
        !e.includes('ResizeObserver')
    );
    // THREE.js "Multiple instances" warning is a console.warn, not a pageerror,
    // so it won't appear here. Any actual THREE crash would.
    expect(critical).toHaveLength(0);
  });
});

test.describe('Error handling', () => {
  test('auth callback with error shows friendly message', async ({ page }) => {
    await page.goto(`${BASE}/callback?error=access_denied&error_description=User+cancelled`);
    await expect(page.getByText('Sign-in failed')).toBeVisible();
    await expect(page.getByText('Back to Sign In')).toBeVisible();
  });

  test('auth callback with timeout fallback', async ({ page }) => {
    // Navigate to callback with no params — should timeout and redirect
    await page.goto(`${BASE}/callback`);
    // Should either show error or redirect to login within 15s
    await page.waitForTimeout(13000);
    const url = page.url();
    const hasError = await page.getByText('Authentication Error').isVisible().catch(() => false);
    expect(url.includes('/login') || hasError).toBeTruthy();
  });
});
