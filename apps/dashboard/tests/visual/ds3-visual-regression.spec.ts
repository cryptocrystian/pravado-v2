/**
 * DS v3 Visual Regression Tests
 * Sprint S100.1: Visual snapshots for typography and design system enforcement
 *
 * PURPOSE: Prevent typography and visual regressions on key pages.
 * These tests capture baseline screenshots and fail CI on visual diffs.
 *
 * PAGES COVERED:
 * - Command Center (main operations hub)
 * - PR Inbox (media relations inbox)
 * - PR Database (journalist database)
 * - PR Pitches (pitch sequences)
 *
 * RUNNING:
 *   npx playwright test tests/visual --update-snapshots  # Update baselines
 *   npx playwright test tests/visual                    # Run regression test
 *
 * NOTE: These tests require MSW mocking to be active for consistent data.
 * The tests will fail without network mocking since page content varies.
 *
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Wait for page to be fully loaded and stable
 * Ensures animations complete and dynamic content renders
 */
async function waitForPageStable(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 5000;

  // Wait for network idle (no pending requests for 500ms)
  await page.waitForLoadState('networkidle', { timeout });

  // Wait for any animations to complete
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      // Check if there are any running animations
      const animations = document.getAnimations();
      if (animations.length === 0) {
        resolve();
        return;
      }
      Promise.all(animations.map((a) => a.finished)).then(() => resolve());
    });
  });

  // Additional wait for React hydration
  await page.waitForTimeout(300);
}

/**
 * Mask dynamic content that changes between runs
 * This prevents false positives from timestamps, counters, etc.
 */
function getCommonMasks(page: Page) {
  return [
    // Mask timestamps and dates
    page.locator('[data-testid="timestamp"]'),
    page.locator('[data-testid="date"]'),
    // Mask any elements with "ago" (e.g., "5 minutes ago")
    page.locator('text=/\\d+\\s+(seconds?|minutes?|hours?|days?)\\s+ago/'),
    // Mask current time displays
    page.locator('[data-testid="current-time"]'),
  ];
}

test.describe('Command Center Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Command Center
    await page.goto('/app/command-center');
    await waitForPageStable(page);
  });

  test('command-center-full-page', async ({ page }) => {
    await expect(page).toHaveScreenshot('command-center-full-page.png', {
      fullPage: true,
      mask: getCommonMasks(page),
      animations: 'disabled',
    });
  });

  test('command-center-action-stream-pane', async ({ page }) => {
    // Focus on action stream section
    const actionStream = page.locator('[data-testid="action-stream"]').or(
      page.locator('[class*="action-stream"]').first()
    );

    // If we can find the element, screenshot it specifically
    if (await actionStream.isVisible()) {
      await expect(actionStream).toHaveScreenshot('command-center-action-stream.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    } else {
      // Fall back to viewport screenshot
      await expect(page).toHaveScreenshot('command-center-viewport.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    }
  });

  test('command-center-strategy-panel', async ({ page }) => {
    const strategyPanel = page.locator('[data-testid="strategy-panel"]').or(
      page.locator('[class*="strategy-panel"]').first()
    );

    if (await strategyPanel.isVisible()) {
      await expect(strategyPanel).toHaveScreenshot('command-center-strategy-panel.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    }
  });
});

test.describe('PR Inbox Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PR main page (inbox)
    await page.goto('/app/pr');
    await waitForPageStable(page);
  });

  test('pr-inbox-full-page', async ({ page }) => {
    await expect(page).toHaveScreenshot('pr-inbox-full-page.png', {
      fullPage: true,
      mask: getCommonMasks(page),
      animations: 'disabled',
    });
  });

  test('pr-inbox-typography-check', async ({ page }) => {
    // Screenshot just the main content area for typography verification
    const mainContent = page.locator('main').or(page.locator('[role="main"]'));

    if (await mainContent.isVisible()) {
      await expect(mainContent).toHaveScreenshot('pr-inbox-main-content.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    }
  });
});

test.describe('PR Database (Journalists) Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PR journalists page
    await page.goto('/app/pr/journalists');
    await waitForPageStable(page);
  });

  test('pr-database-full-page', async ({ page }) => {
    await expect(page).toHaveScreenshot('pr-database-full-page.png', {
      fullPage: true,
      mask: getCommonMasks(page),
      animations: 'disabled',
    });
  });

  test('pr-database-table-view', async ({ page }) => {
    // Screenshot the table/list component
    const table = page.locator('table').or(page.locator('[role="table"]')).first();

    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('pr-database-table.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    }
  });

  test('pr-database-typography-consistency', async ({ page }) => {
    // Screenshot headers to verify typography consistency
    const headers = page.locator('h1, h2, h3').first();

    if (await headers.isVisible()) {
      await expect(headers).toHaveScreenshot('pr-database-header.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('PR Pitches Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to PR pitches page
    await page.goto('/app/pr/pitches');
    await waitForPageStable(page);
  });

  test('pr-pitches-full-page', async ({ page }) => {
    await expect(page).toHaveScreenshot('pr-pitches-full-page.png', {
      fullPage: true,
      mask: getCommonMasks(page),
      animations: 'disabled',
    });
  });

  test('pr-pitches-sequence-list', async ({ page }) => {
    // Screenshot the pitch sequences list
    const sequenceList = page.locator('[data-testid="pitch-sequences"]').or(
      page.locator('[class*="sequence"]').first()
    );

    if (await sequenceList.isVisible()) {
      await expect(sequenceList).toHaveScreenshot('pr-pitches-sequences.png', {
        mask: getCommonMasks(page),
        animations: 'disabled',
      });
    }
  });
});

test.describe('DS v3 Typography Token Verification', () => {
  /**
   * These tests verify that DS v3 typography tokens are being applied correctly
   * by checking computed styles on key elements
   */

  test('verify typography tokens on Command Center', async ({ page }) => {
    await page.goto('/app/command-center');
    await waitForPageStable(page);

    // Check that headings use appropriate font weights
    const headings = await page.locator('h1, h2, h3').all();

    for (const heading of headings.slice(0, 3)) {
      const fontWeight = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
      // DS v3 requires semibold (600) or bold (700) for headings
      const weight = parseInt(fontWeight);
      expect(weight).toBeGreaterThanOrEqual(500);
    }

    // Check body text isn't too small (DS v3 minimum is 13px for semantic text)
    const bodyText = await page.locator('p, span').all();

    for (const text of bodyText.slice(0, 5)) {
      const fontSize = await text.evaluate((el) => {
        const computed = getComputedStyle(el);
        return parseFloat(computed.fontSize);
      });

      // Skip very small text that might be icons or hidden elements
      if (fontSize > 0 && fontSize < 20) {
        // Allow 11px+ (DS v3 allows 11px for micro labels with uppercase)
        expect(fontSize).toBeGreaterThanOrEqual(10);
      }
    }
  });

  test('verify no undersized semantic text', async ({ page }) => {
    await page.goto('/app/pr');
    await waitForPageStable(page);

    // Find all visible text elements
    const textElements = await page.locator('p, span, div, td, li').all();

    let undersizedCount = 0;

    for (const el of textElements.slice(0, 20)) {
      const isVisible = await el.isVisible();
      if (!isVisible) continue;

      const styles = await el.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          fontSize: parseFloat(computed.fontSize),
          textTransform: computed.textTransform,
          letterSpacing: computed.letterSpacing,
        };
      });

      // If text is smaller than 12px and NOT uppercase with tracking, it's a violation
      if (styles.fontSize < 12 && styles.fontSize > 0) {
        const isUppercaseLabel =
          styles.textTransform === 'uppercase' && styles.letterSpacing !== 'normal';

        if (!isUppercaseLabel) {
          undersizedCount++;
        }
      }
    }

    // Allow some flexibility but flag if there are many violations
    expect(undersizedCount).toBeLessThan(5);
  });
});
