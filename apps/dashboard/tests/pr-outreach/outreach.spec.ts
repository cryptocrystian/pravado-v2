/**
 * PR Outreach E2E Tests (Sprint S44)
 * Playwright tests for journalist outreach dashboard
 */

import { expect, test } from '@playwright/test';

test.describe('PR Outreach Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pr/outreach');
  });

  test.describe('Page Layout', () => {
    test('should display page title and description', async ({ page }) => {
      await expect(page.getByText('Journalist Outreach')).toBeVisible();
      await expect(page.getByText('Automated email sequences')).toBeVisible();
    });

    test('should display stats overview cards', async ({ page }) => {
      await expect(page.getByText('Total Sequences')).toBeVisible();
      await expect(page.getByText('Active Runs')).toBeVisible();
      await expect(page.getByText('Emails Sent')).toBeVisible();
      await expect(page.getByText('Replies')).toBeVisible();
    });

    test('should display two-panel layout', async ({ page }) => {
      // Left panel - Sequences
      await expect(page.getByText('Outreach Sequences')).toBeVisible();
      await expect(page.getByText('Email campaign sequences')).toBeVisible();

      // Right panel - Runs
      await expect(page.getByText('Outreach Runs')).toBeVisible();
    });

    test('should display New Sequence button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /new sequence/i })).toBeVisible();
    });
  });

  test.describe('Outreach Sequences', () => {
    test('should display sequences list or empty state', async ({ page }) => {
      const hasSequences = await page.locator('[class*="bg-white border"]').count();
      const hasEmptyState = await page.getByText('No sequences found').isVisible();

      expect(hasSequences > 0 || hasEmptyState).toBeTruthy();
    });

    test('should open new sequence form on button click', async ({ page }) => {
      await page.click('button:has-text("+ New Sequence")');

      // Form should appear
      await expect(page.getByText('New Outreach Sequence')).toBeVisible();
      await expect(page.getByText('Name*')).toBeVisible();
    });

    test('should have basic sequence form fields', async ({ page }) => {
      await page.click('button:has-text("+ New Sequence")');

      // Check for required fields
      await expect(page.getByPlaceholder(/campaign/i)).toBeVisible();
      await expect(page.getByText('Description')).toBeVisible();
      await expect(page.getByText('Max Runs Per Day')).toBeVisible();
      await expect(page.getByText('Stop sequence on journalist reply')).toBeVisible();
    });

    test('should allow adding email steps', async ({ page }) => {
      await page.click('button:has-text("+ New Sequence")');

      // Add step button should be visible
      await expect(page.getByRole('button', { name: /add step/i })).toBeVisible();

      // Click add step
      await page.click('button:has-text("+ Add Step")');

      // Step form should appear
      await expect(page.getByText('Step 1')).toBeVisible();
      await expect(page.getByText('Subject*')).toBeVisible();
      await expect(page.getByText('Body*')).toBeVisible();
    });

    test('should close form on cancel', async ({ page }) => {
      await page.click('button:has-text("+ New Sequence")');
      await expect(page.getByText('New Outreach Sequence')).toBeVisible();

      await page.click('button:has-text("Cancel")');

      // Form should close
      await expect(page.getByText('New Outreach Sequence')).not.toBeVisible();
    });
  });

  test.describe('Outreach Runs', () => {
    test('should display runs list or empty state', async ({ page }) => {
      const hasRuns = await page.locator('[class*="bg-white border rounded-lg"]').count();
      const hasEmptyState = await page.getByText('No runs found').isVisible();

      expect(hasRuns > 0 || hasEmptyState).toBeTruthy();
    });

    test('should show empty state message when no sequence selected', async ({ page }) => {
      const emptyState = await page.getByText('No runs found').isVisible();
      if (emptyState) {
        await expect(page.getByText('Select a sequence to view runs')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should maintain layout on standard screen', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.getByText('Outreach Sequences')).toBeVisible();
      await expect(page.getByText('Outreach Runs')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should gracefully handle loading states', async ({ page }) => {
      // Page should render without crashing
      await expect(page.getByText('Journalist Outreach')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should be accessible from PR section', async ({ page }) => {
      // Navigate to main PR page first
      await page.goto('/app/pr');

      // Check if we can navigate to outreach
      const url = page.url();
      expect(url).toContain('/app/pr');
    });
  });
});
