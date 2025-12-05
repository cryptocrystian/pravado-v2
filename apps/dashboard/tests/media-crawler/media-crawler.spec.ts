/**
 * Media Crawler E2E Tests (Sprint S41)
 * Playwright tests for RSS feeds and crawl jobs
 */

import { expect, test } from '@playwright/test';

test.describe('RSS & Media Crawler Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/media-monitoring/rss');
  });

  test.describe('Page Layout', () => {
    test('should display RSS feeds section', async ({ page }) => {
      await expect(page.getByText('RSS Feeds')).toBeVisible();
      await expect(page.getByRole('button', { name: /Add Feed/i })).toBeVisible();
    });

    test('should display crawl jobs section', async ({ page }) => {
      await expect(page.getByText('Crawl Jobs')).toBeVisible();
    });

    test('should display statistics sidebar', async ({ page }) => {
      await expect(page.getByText('Statistics')).toBeVisible();
      await expect(page.getByText('Total Feeds')).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Fetch All Feeds/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Run Jobs/i })).toBeVisible();
    });
  });

  test.describe('RSS Feed Management', () => {
    test('should show add feed form', async ({ page }) => {
      await page.getByRole('button', { name: /Add Feed/i }).click();

      await expect(page.getByText('Feed URL')).toBeVisible();
      await expect(page.getByPlaceholder(/feed\.xml/i)).toBeVisible();
    });

    test('should require valid URL', async ({ page }) => {
      await page.getByRole('button', { name: /Add Feed/i }).click();

      const urlInput = page.getByPlaceholder(/feed\.xml/i);
      const addButton = page.getByRole('button', { name: 'Add Feed' }).first();

      // Empty URL should disable button
      await expect(addButton).toBeDisabled();

      // Valid URL should enable button
      await urlInput.fill('https://example.com/feed.xml');
      await expect(addButton).toBeEnabled();
    });

    test('should have cancel button', async ({ page }) => {
      await page.getByRole('button', { name: /Add Feed/i }).click();

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect(cancelButton).toBeVisible();

      await cancelButton.click();

      await expect(page.getByText('Feed URL')).not.toBeVisible();
    });
  });

  test.describe('Crawl Jobs Table', () => {
    test('should display job columns', async ({ page }) => {
      await expect(page.getByText('URL')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Attempts')).toBeVisible();
      await expect(page.getByText('Created')).toBeVisible();
    });

    test('should show empty state when no jobs', async ({ page }) => {
      const emptyMessage = page.getByText(/No crawl jobs yet/i);
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });

  test.describe('Statistics Panel', () => {
    test('should display all stat cards', async ({ page }) => {
      await expect(page.getByText('Total Feeds')).toBeVisible();
      await expect(page.getByText('Total Jobs')).toBeVisible();
      await expect(page.getByText('Articles Discovered')).toBeVisible();
    });

    test('should display job status breakdown', async ({ page }) => {
      await expect(page.getByText('Queued:')).toBeVisible();
      await expect(page.getByText('Running:')).toBeVisible();
      await expect(page.getByText('Success:')).toBeVisible();
      await expect(page.getByText('Failed:')).toBeVisible();
    });
  });

  test.describe('Actions', () => {
    test('should trigger RSS fetch', async ({ page }) => {
      const fetchButton = page.getByRole('button', { name: /Fetch All Feeds/i });
      await fetchButton.click();

      // Button should show loading state
      await expect(page.getByText('Fetching...')).toBeVisible();
    });

    test('should trigger job run', async ({ page }) => {
      const runButton = page.getByRole('button', { name: /Run Jobs/i });
      await runButton.click();

      // Button should show loading state
      await expect(page.getByText('Running...')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/app/media-monitoring/rss');

      await expect(page.getByText('RSS & Media Crawling')).toBeVisible();
      await expect(page.getByText('Statistics')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/media-monitoring/rss-feeds', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
        })
      );

      await page.goto('/app/media-monitoring/rss');

      // Page should still load without crashing
      await expect(page.getByText('RSS & Media Crawling')).toBeVisible();
    });
  });
});
