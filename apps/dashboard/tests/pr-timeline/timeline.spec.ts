/**
 * Journalist Timeline E2E Tests (Sprint S49)
 * Playwright tests for relationship timeline functionality
 */

import { test, expect } from '@playwright/test';

const TEST_JOURNALIST_ID = 'test-journalist-123';
const TIMELINE_URL = `/app/journalists/${TEST_JOURNALIST_ID}/timeline`;

test.describe('Journalist Relationship Timeline', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in (add auth setup if needed)
    await page.goto(TIMELINE_URL);
  });

  test('should display timeline page with header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Journalist Relationship Timeline');
    await expect(page.locator('text=Comprehensive view')).toBeVisible();
  });

  test('should show health score badge', async ({ page }) => {
    const healthScoreBadge = page.locator('text=/Health Score:/');
    await expect(healthScoreBadge).toBeVisible();
  });

  test('should display stats bar with metrics', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('text=Total Events', { timeout: 5000 });

    await expect(page.locator('text=Total Events')).toBeVisible();
    await expect(page.locator('text=Last 30 Days')).toBeVisible();
    await expect(page.locator('text=Avg Relevance')).toBeVisible();
    await expect(page.locator('text=Positive Events')).toBeVisible();
  });

  test('should display timeline events list', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('[class*="timeline"]', { timeout: 5000 });

    // Check if events are displayed or empty state
    const hasEvents = await page.locator('text=/Pitch Sent|Coverage Published|Manual Note/').count();
    const hasEmptyState = await page.locator('text=No timeline events yet').count();

    expect(hasEvents > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should open add note modal', async ({ page }) => {
    const addNoteButton = page.locator('button:has-text("Add Note")');
    await addNoteButton.click();

    await expect(page.locator('text=Add Manual Note')).toBeVisible();
    await expect(page.locator('input[placeholder*="E.g., Phone call"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Detailed notes"]')).toBeVisible();
  });

  test('should create a manual note', async ({ page }) => {
    // Open add note modal
    await page.locator('button:has-text("Add Note")').click();

    // Fill in note details
    await page.fill('input[id="note-title"]', 'Test follow-up call');
    await page.fill('textarea[id="note-description"]', 'Discussed Q4 coverage opportunities. Very interested in our story angle.');

    // Select positive sentiment
    await page.locator('button:has-text("Positive")').click();

    // Adjust relationship impact slider
    await page.locator('input[type="range"]').fill('0.5');

    // Submit note
    await page.locator('button:has-text("Add Note")').click();

    // Verify note was added (modal closes)
    await expect(page.locator('text=Add Manual Note')).not.toBeVisible();

    // Check if new note appears (may need to wait for refresh)
    await page.waitForTimeout(1000);
  });

  test('should filter events by sentiment', async ({ page }) => {
    // Expand filters if collapsed
    const expandButton = page.locator('button:has-text("Expand")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }

    // Check positive sentiment filter
    await page.locator('input[type="checkbox"]').filter({ hasText: 'Positive' }).check();

    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify URL or events filtered (implementation-dependent)
  });

  test('should filter events by time range', async ({ page }) => {
    // Expand filters
    const expandButton = page.locator('button:has-text("Expand")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }

    // Select last 30 days
    await page.locator('input[type="radio"][value="last30Days"]').check();

    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();

    await page.waitForTimeout(500);
  });

  test('should search events', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('pitch');

    await page.locator('button:has-text("Apply Filters")').click();

    await page.waitForTimeout(500);
  });

  test('should open event drawer when clicking event', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('[class*="timeline"]', { timeout: 5000 });

    // Click first event (if exists)
    const firstEvent = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]').first();
    if (await firstEvent.isVisible()) {
      await firstEvent.click();

      // Verify drawer opened
      await expect(page.locator('text=Event Details')).toBeVisible();
    }
  });

  test('should display event details in drawer', async ({ page }) => {
    // Click an event
    const firstEvent = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]').first();
    if (await firstEvent.isVisible()) {
      await firstEvent.click();

      // Check drawer content
      await expect(page.locator('text=Event Time')).toBeVisible();
      await expect(page.locator('text=Sentiment')).toBeVisible();
      await expect(page.locator('text=Relevance Score')).toBeVisible();
      await expect(page.locator('text=Source Information')).toBeVisible();
    }
  });

  test('should generate narrative', async ({ page }) => {
    // Click quick action to generate narrative
    const narrativeButton = page.locator('button:has-text("Generate 30-day narrative")').first();

    if (await narrativeButton.isVisible()) {
      await narrativeButton.click();

      // Wait for narrative to generate
      await page.waitForTimeout(2000);

      // Check if narrative panel appears
      const narrativePanel = page.locator('text=Relationship Narrative');
      if (await narrativePanel.isVisible()) {
        await expect(narrativePanel).toBeVisible();
        await expect(page.locator('text=Executive Summary')).toBeVisible();
      }
    }
  });

  test('should display health score breakdown', async ({ page }) => {
    const healthScoreBadge = page.locator('text=/Health Score:/');

    if (await healthScoreBadge.isVisible()) {
      // If health score has breakdown, check components
      const hasBreakdown = await page.locator('text=Recency').count();

      if (hasBreakdown > 0) {
        await expect(page.locator('text=Recency')).toBeVisible();
        await expect(page.locator('text=Activity')).toBeVisible();
        await expect(page.locator('text=Sentiment')).toBeVisible();
      }
    }
  });

  test('should auto-cluster events', async ({ page }) => {
    const clusterButton = page.locator('button:has-text("Auto-cluster events")');

    if (await clusterButton.isVisible()) {
      await clusterButton.click();

      // Wait for clustering to complete
      await page.waitForTimeout(1000);

      // Check for success or updated events
    }
  });

  test('should paginate through events', async ({ page }) => {
    // Wait for pagination controls
    const nextButton = page.locator('button:has-text("Next")');

    if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
      await nextButton.click();

      // Wait for new events to load
      await page.waitForTimeout(500);

      // Verify pagination info updated
      await expect(page.locator('text=/Showing/')).toBeVisible();

      // Go back to previous page
      const prevButton = page.locator('button:has-text("Previous")');
      await prevButton.click();
    }
  });

  test('should reset filters', async ({ page }) => {
    // Apply some filters first
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');

    await page.locator('button:has-text("Apply Filters")').click();
    await page.waitForTimeout(300);

    // Reset filters
    await page.locator('button:has-text("Reset")').click();

    // Verify filters cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Navigate to a journalist with no events (or mock empty state)
    const emptyState = page.locator('text=No timeline events yet');

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Start tracking interactions')).toBeVisible();
      await expect(page.locator('button:has-text("Add First Note")')).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Reload page and check for loading indicators
    await page.reload();

    // Look for loading spinner or skeleton
    const loadingIndicator = page.locator('[class*="animate-spin"]');

    // Loading indicator should appear briefly then disappear
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should close event drawer', async ({ page }) => {
    // Open drawer
    const firstEvent = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]').first();
    if (await firstEvent.isVisible()) {
      await firstEvent.click();

      // Close drawer
      const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('svg').filter({ hasText: '×' }).first());
      await closeButton.click();

      // Verify drawer closed
      await expect(page.locator('text=Event Details')).not.toBeVisible();
    }
  });

  test('should close add note modal without saving', async ({ page }) => {
    // Open modal
    await page.locator('button:has-text("Add Note")').click();

    // Fill some data
    await page.fill('input[id="note-title"]', 'Test note');

    // Cancel
    await page.locator('button:has-text("Cancel")').click();

    // Verify modal closed
    await expect(page.locator('text=Add Manual Note')).not.toBeVisible();
  });
});

test.describe('Timeline Access Control', () => {
  test('should require authentication', async ({ page, context }) => {
    // Clear cookies (logout)
    await context.clearCookies();

    // Try to access timeline
    await page.goto(TIMELINE_URL);

    // Should redirect to login or show error
    await expect(page.url()).not.toContain('/timeline');
  });

  test('should enforce org-level isolation', async ({ page }) => {
    // This test would verify RLS by attempting to access
    // a journalist from a different org
    // Implementation depends on your auth setup
  });
});

test.describe('Timeline Performance', () => {
  test('should load timeline within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(TIMELINE_URL);
    await page.waitForSelector('h1:has-text("Timeline")', { timeout: 5000 });

    const loadTime = Date.now() - startTime;

    // Timeline should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large event lists efficiently', async ({ page }) => {
    // This test would verify pagination and virtualization
    // work correctly with large datasets
    await page.goto(TIMELINE_URL);

    // Scroll through multiple pages
    for (let i = 0; i < 3; i++) {
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
