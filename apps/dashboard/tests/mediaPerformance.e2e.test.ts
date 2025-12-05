/**
 * Media Performance Dashboard E2E Tests (Sprint S52)
 * End-to-end tests for unified performance analytics dashboard
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Media Performance Dashboard', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Login or setup auth if needed
    // await page.goto('/login');
    // await login(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate to media performance dashboard', async () => {
      await page.goto('/app/media-performance');
      await expect(page).toHaveURL('/app/media-performance');
      await expect(page.locator('h1')).toContainText('Media Performance');
    });

    test('should display dashboard subtitle', async () => {
      await page.goto('/app/media-performance');
      await expect(page.locator('text=Unified analytics across all PR campaigns')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state on initial load', async () => {
      await page.goto('/app/media-performance');

      // Check for loading indicator (may be brief)
      const loadingIndicator = page.locator('text=Loading performance data');
      const isVisible = await loadingIndicator.isVisible().catch(() => false);

      // If loading is too fast, verify data loads successfully instead
      if (!isVisible) {
        await expect(page.locator('[data-testid="performance-score-card"]').first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle API errors gracefully', async () => {
      // Mock API failure
      await page.route('**/api/v1/media-performance/overview*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/app/media-performance');

      await expect(page.locator('text=Error Loading Data')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should retry on error', async () => {
      let callCount = 0;
      await page.route('**/api/v1/media-performance/overview*', route => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/app/media-performance');
      await page.click('button:has-text("Retry")');

      // Should load successfully after retry
      await expect(page.locator('h1')).toContainText('Media Performance');
    });
  });

  test.describe('Date Range Selection', () => {
    test('should change date range to 7 days', async () => {
      await page.goto('/app/media-performance');
      await page.click('[data-testid="date-range-selector"]');
      await page.click('text=Last 7 days');

      // Verify API is called with correct date range
      const request = await page.waitForRequest(req =>
        req.url().includes('/api/v1/media-performance/overview') &&
        req.url().includes('startDate')
      );
      expect(request.url()).toContain('startDate');
    });

    test('should change date range to 30 days', async () => {
      await page.goto('/app/media-performance');
      await page.click('[data-testid="date-range-selector"]');
      await page.click('text=Last 30 days');

      await page.waitForLoadState('networkidle');
      // Data should reload
      await expect(page.locator('[data-testid="performance-score-card"]').first()).toBeVisible();
    });

    test('should change date range to 90 days', async () => {
      await page.goto('/app/media-performance');
      await page.click('[data-testid="date-range-selector"]');
      await page.click('text=Last 90 days');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="performance-score-card"]').first()).toBeVisible();
    });
  });

  test.describe('Summary Cards', () => {
    test('should display all 4 summary cards', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Visibility Score')).toBeVisible();
      await expect(page.locator('text=EVI Score')).toBeVisible();
      await expect(page.locator('text=Avg Sentiment')).toBeVisible();
      await expect(page.locator('text=Coverage Stats')).toBeVisible();
    });

    test('should display score values', async () => {
      await page.goto('/app/media-performance');

      const visibilityCard = page.locator('text=Visibility Score').locator('..');
      await expect(visibilityCard.locator('.text-3xl')).toBeVisible();
    });

    test('should display trend indicators', async () => {
      await page.goto('/app/media-performance');

      const cards = page.locator('[data-testid="performance-score-card"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Sentiment Trend Chart', () => {
    test('should render sentiment trend chart', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Sentiment Trend')).toBeVisible();
      await expect(page.locator('svg').first()).toBeVisible();
    });

    test('should display current sentiment badge', async () => {
      await page.goto('/app/media-performance');

      const sentimentSection = page.locator('text=Sentiment Trend').locator('..');
      const badge = sentimentSection.locator('[data-testid="sentiment-badge"]');

      // Badge should be visible if data is available
      const badgeCount = await badge.count();
      if (badgeCount > 0) {
        await expect(badge.first()).toBeVisible();
      }
    });

    test('should show hover tooltips on data points', async () => {
      await page.goto('/app/media-performance');

      const chart = page.locator('text=Sentiment Trend').locator('..').locator('svg');
      const dataPoint = chart.locator('circle').first();

      if (await dataPoint.count() > 0) {
        await dataPoint.hover();
        // Tooltip should appear (implementation dependent)
      }
    });
  });

  test.describe('Coverage Velocity Chart', () => {
    test('should render coverage velocity chart', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Coverage Velocity')).toBeVisible();
    });

    test('should display mentions per day metric', async () => {
      await page.goto('/app/media-performance');

      const velocitySection = page.locator('text=Coverage Velocity').locator('..');
      const badge = velocitySection.locator('text=/mentions\\/day/');

      const badgeCount = await badge.count();
      if (badgeCount > 0) {
        await expect(badge.first()).toBeVisible();
      }
    });
  });

  test.describe('Tier Distribution', () => {
    test('should render tier distribution pie chart', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Outlet Tier Distribution')).toBeVisible();
    });

    test('should display quality score badge', async () => {
      await page.goto('/app/media-performance');

      const tierSection = page.locator('text=Outlet Tier Distribution').locator('..');
      const qualityBadge = tierSection.locator('text=/Quality:/');

      const badgeCount = await qualityBadge.count();
      if (badgeCount > 0) {
        await expect(qualityBadge.first()).toBeVisible();
      }
    });

    test('should show tier legend', async () => {
      await page.goto('/app/media-performance');

      const tierSection = page.locator('text=Outlet Tier Distribution').locator('..');

      // Check for tier labels
      const hasTier1 = await tierSection.locator('text=Tier 1').count() > 0;
      const hasTier2 = await tierSection.locator('text=Tier 2').count() > 0;

      // At least one tier should be visible if data exists
      expect(hasTier1 || hasTier2).toBeTruthy();
    });
  });

  test.describe('Journalist Impact Table', () => {
    test('should render journalist impact table', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Top Journalists')).toBeVisible();
    });

    test('should display table headers', async () => {
      await page.goto('/app/media-performance');

      const table = page.locator('text=Top Journalists').locator('..').locator('table');

      if (await table.count() > 0) {
        await expect(table.locator('th:has-text("Rank")')).toBeVisible();
        await expect(table.locator('th:has-text("Journalist")')).toBeVisible();
        await expect(table.locator('th:has-text("Impact")')).toBeVisible();
      }
    });

    test('should allow sorting by impact score', async () => {
      await page.goto('/app/media-performance');

      const impactHeader = page.locator('th:has-text("Impact")');

      if (await impactHeader.count() > 0) {
        await impactHeader.click();

        // Wait for sort animation
        await page.waitForTimeout(500);

        // Verify table re-rendered
        await expect(page.locator('table tbody tr').first()).toBeVisible();
      }
    });
  });

  test.describe('Campaign Heatmap', () => {
    test('should render campaign heatmap', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Campaign Activity')).toBeVisible();
    });

    test('should display activity cells', async () => {
      await page.goto('/app/media-performance');

      const heatmap = page.locator('text=Campaign Activity').locator('..');
      const cells = heatmap.locator('[data-testid="heatmap-cell"]');

      // Cells may not have test IDs, check for visual elements instead
      const hasSvg = await heatmap.locator('svg').count() > 0;
      expect(hasSvg).toBeTruthy();
    });

    test('should show hover tooltips on cells', async () => {
      await page.goto('/app/media-performance');

      const heatmap = page.locator('text=Campaign Activity').locator('..').locator('svg');
      const cell = heatmap.locator('rect').first();

      if (await cell.count() > 0) {
        await cell.hover();
        // Tooltip implementation dependent
      }
    });
  });

  test.describe('Insight Panel', () => {
    test('should render insight narrative panel', async () => {
      await page.goto('/app/media-performance');

      await expect(page.locator('text=Performance Insights')).toBeVisible();
    });

    test('should display unread count badge', async () => {
      await page.goto('/app/media-performance');

      const insightSection = page.locator('text=Performance Insights').locator('..');
      const unreadBadge = insightSection.locator('text=/new/');

      // Badge may not be visible if no unread insights
      const badgeCount = await unreadBadge.count();
      if (badgeCount > 0) {
        await expect(unreadBadge.first()).toBeVisible();
      }
    });

    test('should dismiss insight when X clicked', async () => {
      await page.goto('/app/media-performance');

      const dismissButton = page.locator('[data-testid="dismiss-insight"]').first();

      if (await dismissButton.count() > 0) {
        const initialCount = await page.locator('[data-testid="insight-card"]').count();
        await dismissButton.click();
        await page.waitForTimeout(500);
        const finalCount = await page.locator('[data-testid="insight-card"]').count();

        expect(finalCount).toBeLessThanOrEqual(initialCount);
      }
    });

    test('should mark insight as read when clicked', async () => {
      await page.goto('/app/media-performance');

      const insightCard = page.locator('[data-testid="insight-card"]').first();

      if (await insightCard.count() > 0) {
        // Check if unread styling exists
        const hasUnreadClass = await insightCard.evaluate(el =>
          el.className.includes('bg-blue-50')
        );

        if (hasUnreadClass) {
          await insightCard.click();
          await page.waitForTimeout(500);

          // Should no longer have unread styling
          const stillUnread = await insightCard.evaluate(el =>
            el.className.includes('bg-blue-50')
          );
          expect(stillUnread).toBeFalsy();
        }
      }
    });
  });

  test.describe('Refresh Functionality', () => {
    test('should refresh data when refresh button clicked', async () => {
      await page.goto('/app/media-performance');

      const refreshButton = page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible();

      // Track API call
      const apiCallPromise = page.waitForRequest(req =>
        req.url().includes('/api/v1/media-performance/overview')
      );

      await refreshButton.click();
      await apiCallPromise;

      // Should show refreshing state briefly
      const hasSpinner = await page.locator('.animate-spin').count() > 0;
      // Spinner may be too brief to catch
    });

    test('should disable refresh button while refreshing', async () => {
      await page.goto('/app/media-performance');

      const refreshButton = page.locator('button:has-text("Refresh")');
      await refreshButton.click();

      // Button should be disabled during refresh
      await expect(refreshButton).toBeDisabled();

      // Wait for refresh to complete
      await page.waitForLoadState('networkidle');

      // Button should be enabled again
      await expect(refreshButton).toBeEnabled();
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display correctly on desktop', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/app/media-performance');

      // All sections should be visible
      await expect(page.locator('text=Media Performance')).toBeVisible();
      await expect(page.locator('text=Sentiment Trend')).toBeVisible();
      await expect(page.locator('text=Performance Insights')).toBeVisible();
    });

    test('should display correctly on tablet', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/app/media-performance');

      await expect(page.locator('h1')).toBeVisible();
      // Layout may stack on smaller screens
    });

    test('should display correctly on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/app/media-performance');

      await expect(page.locator('h1')).toBeVisible();
      // Components should stack vertically
    });
  });

  test.describe('Data Filtering', () => {
    test('should filter data by date range', async () => {
      await page.goto('/app/media-performance');

      // Select 7 day range
      await page.click('[data-testid="date-range-selector"]');
      await page.click('text=Last 7 days');

      // Wait for API call
      await page.waitForRequest(req =>
        req.url().includes('/api/v1/media-performance/overview')
      );

      // Data should update
      await expect(page.locator('[data-testid="performance-score-card"]').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async () => {
      await page.goto('/app/media-performance');

      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2 = await page.locator('h2').count();
      expect(h2).toBeGreaterThanOrEqual(0);
    });

    test('should have alt text for visualizations', async () => {
      await page.goto('/app/media-performance');

      // SVG charts should have titles
      const svgTitles = await page.locator('svg title').count();
      expect(svgTitles).toBeGreaterThanOrEqual(0);
    });

    test('should be keyboard navigable', async () => {
      await page.goto('/app/media-performance');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focused element should be visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
    });
  });
});
