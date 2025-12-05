/**
 * PR Outreach Deliverability E2E Tests (Sprint S45)
 * Playwright tests for deliverability dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Deliverability Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to deliverability page
    await page.goto('/app/pr/deliverability');
  });

  test.describe('Page Structure', () => {
    test('should display page title and description', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Email Deliverability & Engagement');
      await expect(page.locator('text=Track email delivery, opens, clicks')).toBeVisible();
    });

    test('should display tab navigation', async ({ page }) => {
      await expect(page.locator('text=Overview')).toBeVisible();
      await expect(page.locator('text=Email Messages')).toBeVisible();
      await expect(page.locator('text=Engagement Metrics')).toBeVisible();
    });

    test('should default to Overview tab', async ({ page }) => {
      const overviewTab = page.locator('button:has-text("Overview")');
      await expect(overviewTab).toHaveClass(/border-blue-500/);
    });
  });

  test.describe('Overview Tab', () => {
    test('should display stats grid with 4 cards', async ({ page }) => {
      await expect(page.locator('text=Total Messages')).toBeVisible();
      await expect(page.locator('text=Delivery Rate')).toBeVisible();
      await expect(page.locator('text=Open Rate')).toBeVisible();
      await expect(page.locator('text=Click Rate')).toBeVisible();
    });

    test('should display detailed statistics section', async ({ page }) => {
      await expect(page.locator('text=Detailed Statistics')).toBeVisible();
      await expect(page.locator('text=Sent')).toBeVisible();
      await expect(page.locator('text=Delivered')).toBeVisible();
      await expect(page.locator('text=Bounced')).toBeVisible();
      await expect(page.locator('text=Complained')).toBeVisible();
    });

    test('should display top engaged journalists table', async ({ page }) => {
      await expect(page.locator('text=Top Engaged Journalists')).toBeVisible();
      await expect(page.locator('th:has-text("Journalist")')).toBeVisible();
      await expect(page.locator('th:has-text("Engagement Score")')).toBeVisible();
      await expect(page.locator('th:has-text("Open Rate")')).toBeVisible();
      await expect(page.locator('th:has-text("Click Rate")')).toBeVisible();
    });

    test('should format percentages correctly', async ({ page }) => {
      // Check if percentages are displayed with % symbol
      const deliveryRate = page.locator('text=/\\d+\\.\\d%/').first();
      await expect(deliveryRate).toBeVisible();
    });
  });

  test.describe('Email Messages Tab', () => {
    test('should switch to messages tab when clicked', async ({ page }) => {
      await page.click('button:has-text("Email Messages")');

      const messagesTab = page.locator('button:has-text("Email Messages")');
      await expect(messagesTab).toHaveClass(/border-blue-500/);
    });

    test('should display email messages table', async ({ page }) => {
      await page.click('button:has-text("Email Messages")');

      await expect(page.locator('text=Email Messages').first()).toBeVisible();
      await expect(page.locator('th:has-text("Subject")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Sent")')).toBeVisible();
      await expect(page.locator('th:has-text("Opened")')).toBeVisible();
      await expect(page.locator('th:has-text("Clicked")')).toBeVisible();
    });

    test('should display message count footer', async ({ page }) => {
      await page.click('button:has-text("Email Messages")');

      await expect(page.locator('text=/Showing \\d+ of \\d+ messages/')).toBeVisible();
    });

    test('should display status badges with colors', async ({ page }) => {
      await page.click('button:has-text("Email Messages")');

      // Check for status badge colors (green for sent, red for failed, etc.)
      const statusBadges = page.locator('.rounded-full');
      await expect(statusBadges.first()).toBeVisible();
    });
  });

  test.describe('Engagement Metrics Tab', () => {
    test('should switch to engagement tab when clicked', async ({ page }) => {
      await page.click('button:has-text("Engagement Metrics")');

      const engagementTab = page.locator('button:has-text("Engagement Metrics")');
      await expect(engagementTab).toHaveClass(/border-blue-500/);
    });

    test('should display engagement metrics table', async ({ page }) => {
      await page.click('button:has-text("Engagement Metrics")');

      await expect(page.locator('text=Journalist Engagement Metrics')).toBeVisible();
      await expect(page.locator('th:has-text("Journalist")')).toBeVisible();
      await expect(page.locator('th:has-text("Score")')).toBeVisible();
      await expect(page.locator('th:has-text("Sent")')).toBeVisible();
      await expect(page.locator('th:has-text("Opened")')).toBeVisible();
      await expect(page.locator('th:has-text("Clicked")')).toBeVisible();
      await expect(page.locator('th:has-text("Replied")')).toBeVisible();
      await expect(page.locator('th:has-text("Bounced")')).toBeVisible();
    });

    test('should display journalist count footer', async ({ page }) => {
      await page.click('button:has-text("Engagement Metrics")');

      await expect(page.locator('text=/Showing \\d+ of \\d+ journalists/')).toBeVisible();
    });

    test('should display engagement scores as percentages', async ({ page }) => {
      await page.click('button:has-text("Engagement Metrics")');

      // Check for score percentages in blue color
      const scoreElements = page.locator('.text-blue-600');
      await expect(scoreElements.first()).toBeVisible();
    });
  });

  test.describe('Tab Switching', () => {
    test('should maintain tab state when switching between tabs', async ({ page }) => {
      // Switch to messages
      await page.click('button:has-text("Email Messages")');
      await expect(page.locator('th:has-text("Subject")')).toBeVisible();

      // Switch to engagement
      await page.click('button:has-text("Engagement Metrics")');
      await expect(page.locator('th:has-text("Score")')).toBeVisible();

      // Switch back to overview
      await page.click('button:has-text("Overview")');
      await expect(page.locator('text=Total Messages')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message when data fails to load', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/v1/pr-outreach-deliverability/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: { message: 'Server error' } }),
        });
      });

      await page.reload();

      await expect(page.locator('text=/Error:/')).toBeVisible();
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should allow retry on error', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/v1/pr-outreach-deliverability/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: { message: 'Server error' } }),
        });
      });

      await page.reload();

      const retryButton = page.locator('button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
      await retryButton.click();

      // Should show loading state after retry
      await expect(page.locator('text=Loading')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should display loading message initially', async ({ page }) => {
      await page.route('**/api/v1/pr-outreach-deliverability/**', (route) => {
        // Delay response to capture loading state
        setTimeout(() => {
          route.continue();
        }, 1000);
      });

      await page.goto('/app/pr/deliverability');

      await expect(page.locator('text=Loading deliverability data')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display stats grid in mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Stats should stack vertically on mobile
      await expect(page.locator('text=Total Messages')).toBeVisible();
      await expect(page.locator('text=Delivery Rate')).toBeVisible();
    });

    test('should display tables in mobile view with scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click('button:has-text("Email Messages")');

      // Table should be scrollable on mobile
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    });
  });

  test.describe('Data Refresh', () => {
    test('should auto-refresh data every 30 seconds', async ({ page }) => {
      let requestCount = 0;

      await page.route('**/api/v1/pr-outreach-deliverability/stats/**', (route) => {
        requestCount++;
        route.continue();
      });

      // Wait for initial load
      await page.waitForTimeout(1000);
      const initialCount = requestCount;

      // Wait 31 seconds for auto-refresh
      await page.waitForTimeout(31000);

      // Should have made additional requests
      expect(requestCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2').first()).toBeVisible();
    });

    test('should have accessible tab navigation', async ({ page }) => {
      const tabs = page.locator('[role="navigation"] button, nav button');
      await expect(tabs.first()).toBeVisible();
    });

    test('should have accessible table headers', async ({ page }) => {
      await page.click('button:has-text("Email Messages")');

      const headers = page.locator('th');
      await expect(headers.first()).toBeVisible();
    });
  });
});
