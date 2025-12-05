/**
 * Audit Page E2E Tests (Sprint S36)
 * Playwright tests for audit log viewer and export functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Log Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to audit page (assumes authenticated session)
    await page.goto('/app/audit');
  });

  test.describe('Page Layout', () => {
    test('should display page header', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Audit Log');
      await expect(page.locator('text=Track and review all activity')).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
      // Wait for stats to load
      await page.waitForSelector('text=Total Events');

      await expect(page.locator('text=Total Events')).toBeVisible();
      await expect(page.locator('text=Errors')).toBeVisible();
      await expect(page.locator('text=Warnings')).toBeVisible();
      await expect(page.locator('text=Critical')).toBeVisible();
    });

    test('should display export button', async ({ page }) => {
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    });
  });

  test.describe('Filtering', () => {
    test('should filter by severity', async ({ page }) => {
      // Wait for initial load
      await page.waitForSelector('table');

      // Select error severity
      await page.selectOption('select:near(:text("Severity"))', 'error');

      // Wait for filtered results
      await page.waitForResponse((response) =>
        response.url().includes('/api/v1/audit') && response.status() === 200
      );

      // Verify filter was applied (table should update)
      await expect(page.locator('table')).toBeVisible();
    });

    test('should filter by actor type', async ({ page }) => {
      await page.waitForSelector('table');

      // Select system actor
      await page.selectOption('select:near(:text("Actor Type"))', 'system');

      await page.waitForResponse((response) =>
        response.url().includes('/api/v1/audit') && response.status() === 200
      );

      await expect(page.locator('table')).toBeVisible();
    });

    test('should search in context', async ({ page }) => {
      await page.waitForSelector('table');

      // Type in search box
      await page.fill('input[placeholder*="Search"]', 'login');

      // Trigger search (may need to wait for debounce)
      await page.waitForTimeout(500);

      await expect(page.locator('table')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.waitForSelector('table');

      // Set start date
      const startDateInput = page.locator('input[type="date"]').first();
      await startDateInput.fill('2024-01-01');

      await page.waitForResponse((response) =>
        response.url().includes('/api/v1/audit') && response.status() === 200
      );

      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await page.waitForSelector('table');

      // Check for pagination text
      await expect(page.locator('text=/Showing \\d+ to \\d+ of \\d+ results/')).toBeVisible();

      // Check for navigation buttons
      await expect(page.locator('button:has-text("Previous")')).toBeVisible();
      await expect(page.locator('button:has-text("Next")')).toBeVisible();
    });

    test('should navigate to next page', async ({ page }) => {
      await page.waitForSelector('table');

      // Get initial showing text
      const initialText = await page.locator('text=/Showing \\d+ to/').textContent();

      // Click next if enabled
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();

        await page.waitForResponse((response) =>
          response.url().includes('/api/v1/audit') && response.status() === 200
        );

        // Verify page changed
        const newText = await page.locator('text=/Showing \\d+ to/').textContent();
        expect(newText).not.toBe(initialText);
      }
    });
  });

  test.describe('Entry Details Modal', () => {
    test('should open entry details on row click', async ({ page }) => {
      await page.waitForSelector('tbody tr');

      // Click on first row
      await page.locator('tbody tr').first().click();

      // Modal should appear
      await expect(page.locator('text=Event ID')).toBeVisible();
      await expect(page.locator('text=Context')).toBeVisible();
    });

    test('should close modal on X button click', async ({ page }) => {
      await page.waitForSelector('tbody tr');

      // Open modal
      await page.locator('tbody tr').first().click();
      await expect(page.locator('text=Event ID')).toBeVisible();

      // Close modal
      await page.locator('button:has(svg)').filter({ hasText: '' }).first().click();

      // Modal should be closed
      await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    test('should initiate export on button click', async ({ page }) => {
      await page.waitForSelector('table');

      // Click export button
      await page.locator('button:has-text("Export CSV")').click();

      // Should show export modal or loading state
      await expect(
        page.locator('text=Export Status').or(page.locator('text=Exporting'))
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show export progress modal', async ({ page }) => {
      await page.waitForSelector('table');

      // Intercept export API call
      await page.route('**/api/v1/audit/export', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { jobId: 'test-job-123', status: 'queued' },
          }),
        });
      });

      // Intercept status polling
      await page.route('**/api/v1/audit/export/*', async (route) => {
        if (route.request().url().includes('/download')) {
          await route.continue();
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                job: {
                  id: 'test-job-123',
                  status: 'processing',
                  rowCount: null,
                  fileSizeBytes: null,
                },
                downloadUrl: null,
              },
            }),
          });
        }
      });

      // Click export
      await page.locator('button:has-text("Export CSV")').click();

      // Modal should show with status
      await expect(page.locator('text=Export Status')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
    });

    test('should show download button when export completes', async ({ page }) => {
      await page.waitForSelector('table');

      // Intercept export API call
      await page.route('**/api/v1/audit/export', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { jobId: 'test-job-123', status: 'queued' },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Intercept status polling - return success
      await page.route('**/api/v1/audit/export/test-job-123', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              job: {
                id: 'test-job-123',
                status: 'success',
                rowCount: 100,
                fileSizeBytes: 2048,
                filePath: '/tmp/export.csv',
              },
              downloadUrl: '/api/v1/audit/export/test-job-123/download',
            },
          }),
        });
      });

      // Click export
      await page.locator('button:has-text("Export CSV")').click();

      // Wait for modal with download button
      await expect(page.locator('a:has-text("Download CSV")')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Empty State', () => {
    test('should show empty message when no logs', async ({ page }) => {
      // Intercept API to return empty results
      await page.route('**/api/v1/audit?*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              entries: [],
              total: 0,
              hasMore: false,
            },
          }),
        });
      });

      await page.reload();

      await expect(page.locator('text=No audit logs found')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on API failure', async ({ page }) => {
      // Intercept API to return error
      await page.route('**/api/v1/audit?*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch audit logs',
            },
          }),
        });
      });

      await page.reload();

      await expect(page.locator('text=Failed to fetch audit logs').or(page.locator('.bg-red-50'))).toBeVisible();
    });
  });
});
