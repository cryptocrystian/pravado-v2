/**
 * Basic smoke tests for dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Smoke Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Pravado/);
    await expect(page.locator('h2')).toContainText('Sign in to Pravado');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show sign up form when toggled', async ({ page }) => {
    await page.goto('/login');

    const toggleButton = page.locator('button:has-text("Don\'t have an account")');
    await toggleButton.click();

    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('button[type="submit"]')).toContainText('Sign up');
  });

  test('should redirect unauthenticated users from /app to /login', async ({ page }) => {
    await page.goto('/app');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users from /onboarding to /login', async ({ page }) => {
    await page.goto('/onboarding');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Browser native validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  // Note: Authenticated flow tests require test user setup
  // These should be implemented with test fixtures in future sprints
  test.skip('should allow user to sign in', async () => {
    // TODO: Implement with test user credentials
  });

  test.skip('should redirect to onboarding if no orgs', async () => {
    // TODO: Implement with test user without orgs
  });

  test.skip('should redirect to /app if user has orgs', async () => {
    // TODO: Implement with test user with orgs
  });
});
