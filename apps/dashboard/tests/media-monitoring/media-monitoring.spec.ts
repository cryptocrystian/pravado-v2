/**
 * Media Monitoring E2E Tests (Sprint S40)
 * Playwright tests for media monitoring and earned coverage functionality
 */

import { expect, test } from '@playwright/test';

test.describe('Media Monitoring Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/media-monitoring');
  });

  test.describe('Page Layout', () => {
    test('should display sources sidebar', async ({ page }) => {
      await expect(page.getByText('Sources')).toBeVisible();
      await expect(page.getByRole('button', { name: /Add/i })).toBeVisible();
    });

    test('should display main content area with header', async ({ page }) => {
      await expect(page.getByText('Media Monitoring')).toBeVisible();
    });

    test('should display view mode toggle', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Articles' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mentions' })).toBeVisible();
    });

    test('should display ingest article button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Ingest Article/i })).toBeVisible();
    });

    test('should display statistics sidebar', async ({ page }) => {
      await expect(page.getByText('Statistics')).toBeVisible();
    });
  });

  test.describe('Source Management', () => {
    test('should show add source form when clicking Add', async ({ page }) => {
      await page.getByRole('button', { name: /Add/i }).click();

      await expect(page.getByText('Source Name')).toBeVisible();
      await expect(page.getByPlaceholder('TechCrunch')).toBeVisible();
      await expect(page.getByPlaceholder('https://techcrunch.com')).toBeVisible();
    });

    test('should validate source URL', async ({ page }) => {
      await page.getByRole('button', { name: /Add/i }).click();

      const nameInput = page.getByPlaceholder('TechCrunch');
      const urlInput = page.getByPlaceholder('https://techcrunch.com');
      const addButton = page.getByRole('button', { name: 'Add Source' });

      await nameInput.fill('Test Source');
      await urlInput.fill('invalid-url');

      // Button should be disabled or form should show error
      await expect(addButton).toBeDisabled();
    });

    test('should have All Sources option in sidebar', async ({ page }) => {
      await expect(page.getByText('All Sources')).toBeVisible();
    });
  });

  test.describe('Article Ingestion', () => {
    test('should show ingest form when clicking Ingest Article', async ({ page }) => {
      await page.getByRole('button', { name: /Ingest Article/i }).click();

      await expect(page.getByText('Article URL')).toBeVisible();
      await expect(page.getByPlaceholder(/techcrunch\.com/i)).toBeVisible();
    });

    test('should have cancel button in ingest form', async ({ page }) => {
      await page.getByRole('button', { name: /Ingest Article/i }).click();

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect(cancelButton).toBeVisible();

      await cancelButton.click();

      await expect(page.getByText('Article URL')).not.toBeVisible();
    });

    test('should require valid URL for ingestion', async ({ page }) => {
      await page.getByRole('button', { name: /Ingest Article/i }).click();

      const urlInput = page.getByPlaceholder(/techcrunch\.com/i);
      const ingestButton = page.getByRole('button', { name: 'Ingest' });

      // Empty URL should disable button
      await expect(ingestButton).toBeDisabled();

      // Valid URL should enable button
      await urlInput.fill('https://example.com/article');
      await expect(ingestButton).toBeEnabled();
    });
  });

  test.describe('View Mode Toggle', () => {
    test('should switch to mentions view', async ({ page }) => {
      const mentionsButton = page.getByRole('button', { name: 'Mentions' });
      await mentionsButton.click();

      await expect(page.getByText('Earned Mentions')).toBeVisible();
    });

    test('should switch back to articles view', async ({ page }) => {
      // First switch to mentions
      await page.getByRole('button', { name: 'Mentions' }).click();

      // Then switch back to articles
      await page.getByRole('button', { name: 'Articles' }).click();

      // Should not show mentions heading
      await expect(page.getByText('Earned Mentions')).not.toBeVisible();
    });
  });

  test.describe('Mentions View', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Mentions' }).click();
    });

    test('should display sentiment filter buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /All/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Positive/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Neutral/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Negative/i })).toBeVisible();
    });

    test('should filter by sentiment', async ({ page }) => {
      const positiveButton = page.getByRole('button', { name: /Positive/i });
      await positiveButton.click();

      // Button should show active state
      await expect(positiveButton).toHaveClass(/bg-green-600/);
    });
  });

  test.describe('Statistics Panel', () => {
    test('should display total articles stat', async ({ page }) => {
      await expect(page.getByText('Total Articles')).toBeVisible();
    });

    test('should display total mentions stat', async ({ page }) => {
      await expect(page.getByText('Total Mentions')).toBeVisible();
    });

    test('should display sentiment breakdown', async ({ page }) => {
      await expect(page.getByText('Sentiment Breakdown')).toBeVisible();
      await expect(page.getByText('Positive')).toBeVisible();
      await expect(page.getByText('Neutral')).toBeVisible();
      await expect(page.getByText('Negative')).toBeVisible();
    });

    test('should display average relevance', async ({ page }) => {
      await expect(page.getByText('Avg. Relevance')).toBeVisible();
    });

    test('should display active sources count', async ({ page }) => {
      await expect(page.getByText('Active Sources')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/app/media-monitoring');

      await expect(page.getByText('Media Monitoring')).toBeVisible();
      await expect(page.getByText('Sources')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/app/media-monitoring');

      await expect(page.getByText('Media Monitoring')).toBeVisible();
      await expect(page.getByText('Statistics')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/media-monitoring/sources', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
        })
      );

      await page.goto('/app/media-monitoring');

      // Page should still load without crashing
      await expect(page.getByText('Media Monitoring')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper button labels', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Add/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Ingest Article/i })).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
    });
  });
});

test.describe('Article Drawer', () => {
  test('should not be visible initially', async ({ page }) => {
    await page.goto('/app/media-monitoring');

    // Drawer backdrop should not be visible
    await expect(page.locator('.fixed.inset-0.bg-black')).not.toBeVisible();
  });
});
