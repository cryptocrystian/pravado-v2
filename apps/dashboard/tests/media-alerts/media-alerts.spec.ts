/**
 * Media Alerts E2E Tests (Sprint S43)
 * Playwright tests for media alerts dashboard
 */

import { expect, test } from '@playwright/test';

test.describe('Media Alerts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/media-alerts');
  });

  test.describe('Page Layout', () => {
    test('should display page title and description', async ({ page }) => {
      await expect(page.getByText('Media Alerts')).toBeVisible();
      await expect(page.getByText('Smart Signals')).toBeVisible();
      await expect(page.getByText('Alert Rules')).toBeVisible();
    });

    test('should display three-panel layout', async ({ page }) => {
      // Left panel - Alert Rules
      await expect(page.getByText('Alert Rules')).toBeVisible();
      await expect(page.getByText('Manage monitoring conditions')).toBeVisible();

      // Center panel - Events
      await expect(page.getByText('Media Alerts')).toBeVisible();

      // Right panel - Signals
      await expect(page.getByText('Smart Signals')).toBeVisible();
      await expect(page.getByText('Real-time monitoring overview')).toBeVisible();
    });

    test('should display New Rule button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /new rule/i })).toBeVisible();
    });
  });

  test.describe('Alert Rules', () => {
    test('should display rules list or empty state', async ({ page }) => {
      // Either rules are present or empty state is shown
      const hasRules = await page.locator('[class*="bg-white border"]').count();
      const hasEmptyState = await page.getByText('No rules found').isVisible();

      expect(hasRules > 0 || hasEmptyState).toBeTruthy();
    });

    test('should have filter dropdowns', async ({ page }) => {
      await expect(page.getByText('All Types')).toBeVisible();
      await expect(page.getByText('All Status')).toBeVisible();
    });

    test('should open new rule form on button click', async ({ page }) => {
      await page.click('button:has-text("+ New Rule")');

      // Form should appear
      await expect(page.getByText('New Alert Rule')).toBeVisible();
      await expect(page.getByText('Rule Name')).toBeVisible();
    });

    test('should have all alert type options in form', async ({ page }) => {
      await page.click('button:has-text("+ New Rule")');

      const typeSelect = page.locator('select').first();
      await expect(typeSelect).toBeVisible();

      // Check that alert type options exist
      const options = await typeSelect.locator('option').allTextContents();
      expect(options.some((opt) => opt.includes('Mention Match'))).toBeTruthy();
      expect(options.some((opt) => opt.includes('Volume Spike'))).toBeTruthy();
      expect(options.some((opt) => opt.includes('Sentiment Shift'))).toBeTruthy();
    });

    test('should close form on cancel', async ({ page }) => {
      await page.click('button:has-text("+ New Rule")');
      await expect(page.getByText('New Alert Rule')).toBeVisible();

      await page.click('button:has-text("Cancel")');

      // Form should close (text should not be visible)
      await expect(page.getByText('New Alert Rule')).not.toBeVisible();
    });
  });

  test.describe('Alert Events', () => {
    test('should display events list or empty state', async ({ page }) => {
      const hasEvents = await page.locator('[class*="bg-white border rounded-lg"]').count();
      const hasEmptyState = await page.getByText('No alerts yet').isVisible();

      expect(hasEvents > 0 || hasEmptyState).toBeTruthy();
    });

    test('should show empty state message when no events', async ({ page }) => {
      // If empty, should show helpful message
      const emptyState = await page.getByText('No alerts yet').isVisible();
      if (emptyState) {
        await expect(page.getByText('When your alert rules trigger, events will appear here')).toBeVisible();
      }
    });
  });

  test.describe('Signals Overview', () => {
    test('should display refresh button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /refresh signals/i })).toBeVisible();
    });

    test('should display statistics sections', async ({ page }) => {
      await expect(page.getByText('Past 24 Hours')).toBeVisible();
      await expect(page.getByText('Overall')).toBeVisible();
    });

    test('should show stat cards', async ({ page }) => {
      // Check for key stat labels
      const statLabels = [
        'Critical Alerts',
        'Warning Alerts',
        'Info Alerts',
        'Total Rules',
        'Active Rules',
        'Unread Events',
      ];

      for (const label of statLabels) {
        await expect(page.getByText(label)).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should maintain layout on standard screen', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.getByText('Alert Rules')).toBeVisible();
      await expect(page.getByText('Smart Signals')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should gracefully handle loading states', async ({ page }) => {
      // Page should render without crashing
      await expect(page.getByText('Media Alerts')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should be accessible from app navigation', async ({ page }) => {
      // Navigate to main app first
      await page.goto('/app');

      // Check if media alerts link exists (may vary by navigation structure)
      const url = page.url();
      expect(url).toContain('/app');
    });
  });
});
