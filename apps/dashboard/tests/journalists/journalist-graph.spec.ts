/**
 * Journalist Graph E2E Tests (Sprint S46)
 */

import { test, expect } from '@playwright/test';

test.describe('Journalist Intelligence Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pr/journalists');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Journalist Intelligence');
    await expect(page.locator('text=Unified contact intelligence')).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search journalists"]');
    await expect(searchInput).toBeVisible();
  });

  test('should display journalist table', async ({ page }) => {
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Outlet")')).toBeVisible();
    await expect(page.locator('th:has-text("Beat")')).toBeVisible();
    await expect(page.locator('th:has-text("Engagement")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Activity")')).toBeVisible();
  });

  test('should handle search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search journalists"]');
    await searchInput.fill('tech');
    await searchInput.press('Enter');

    await expect(page.locator('table')).toBeVisible();
  });

  test('should display engagement scores as progress bars', async ({ page }) => {
    const progressBars = page.locator('.bg-blue-600');
    if (await progressBars.count() > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test('should handle error state', async ({ page }) => {
    await page.route('**/api/v1/journalist-graph/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: { message: 'Server error' } }),
      });
    });

    await page.reload();

    await expect(page.locator('text=/Error:/')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    await page.route('**/api/v1/journalist-graph/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { profiles: [], total: 0, limit: 50, offset: 0 },
        }),
      });
    });

    await page.reload();

    await expect(page.locator('text=No journalists found')).toBeVisible();
  });
});
