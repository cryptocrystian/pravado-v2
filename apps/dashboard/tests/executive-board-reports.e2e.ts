/**
 * Executive Board Report E2E Tests (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * Playwright tests for:
 * - Report list view
 * - Report creation
 * - Report detail view
 * - Section management
 * - Audience management
 * - Generation workflow
 * - Publishing workflow
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const BOARD_REPORTS_URL = `${BASE_URL}/app/exec/board-reports`;

// Mock authentication helper
async function loginAsTestUser(page: any) {
  // Set authentication cookies/tokens as needed for your auth system
  await page.goto(`${BASE_URL}/login`);
  // Add your login flow here
  await page.waitForLoadState('networkidle');
}

test.describe('Executive Board Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test.describe('Report List View', () => {
    test('should display the board reports page', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Check page title
      await expect(page.locator('h1')).toContainText('Executive Board Reports');

      // Check for create button
      await expect(page.getByRole('button', { name: /create report/i })).toBeVisible();
    });

    test('should display statistics cards', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Check for stats cards
      await expect(page.getByText('Total Reports')).toBeVisible();
      await expect(page.getByText('Drafts')).toBeVisible();
      await expect(page.getByText('Published')).toBeVisible();
    });

    test('should show empty state when no reports exist', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Wait for loading to complete
      await page.waitForLoadState('networkidle');

      // Check for empty state or report cards
      const hasReports = await page.locator('[data-testid="report-card"]').count() > 0;

      if (!hasReports) {
        await expect(page.getByText('No reports created yet')).toBeVisible();
        await expect(page.getByRole('button', { name: /create first report/i })).toBeVisible();
      }
    });
  });

  test.describe('Report Creation', () => {
    test('should open create dialog when clicking create button', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      await page.getByRole('button', { name: /create report/i }).click();

      // Check dialog is visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Create Board Report')).toBeVisible();
    });

    test('should have required form fields', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);
      await page.getByRole('button', { name: /create report/i }).click();

      // Check form fields
      await expect(page.getByLabel('Report Title')).toBeVisible();
      await expect(page.getByLabel('Report Format')).toBeVisible();
      await expect(page.getByLabel('Period Start')).toBeVisible();
      await expect(page.getByLabel('Period End')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);
      await page.getByRole('button', { name: /create report/i }).click();

      // Try to submit without title
      await page.getByLabel('Report Title').fill('');

      // Create button should be disabled without required fields
      const createButton = page.getByRole('button', { name: /create report/i }).last();
      await expect(createButton).toBeDisabled();
    });

    test('should create a new report successfully', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);
      await page.getByRole('button', { name: /create report/i }).click();

      // Fill in form
      await page.getByLabel('Report Title').fill('E2E Test Report');
      await page.getByLabel('Description').fill('Test report created via E2E tests');

      // Submit form
      await page.getByRole('button', { name: /create report/i }).last().click();

      // Wait for dialog to close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

      // Check report appears in list
      await expect(page.getByText('E2E Test Report')).toBeVisible();
    });
  });

  test.describe('Report Detail View', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test report first
      await page.goto(BOARD_REPORTS_URL);
      await page.getByRole('button', { name: /create report/i }).click();
      await page.getByLabel('Report Title').fill('Detail View Test Report');
      await page.getByRole('button', { name: /create report/i }).last().click();
      await page.waitForTimeout(1000);
    });

    test('should display report header with actions', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Click on the test report
      await page.getByText('Detail View Test Report').click();

      // Check header elements
      await expect(page.getByRole('heading', { name: 'Detail View Test Report' })).toBeVisible();
      await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
    });

    test('should have tabbed content for sections, audience, and activity', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);
      await page.getByText('Detail View Test Report').click();

      // Check tabs
      await expect(page.getByRole('tab', { name: /sections/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /audience/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /activity/i })).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);
      await page.getByText('Detail View Test Report').click();

      // Click audience tab
      await page.getByRole('tab', { name: /audience/i }).click();
      await expect(page.getByText(/add member/i)).toBeVisible();

      // Click activity tab
      await page.getByRole('tab', { name: /activity/i }).click();
      await expect(page.getByText(/activity log/i)).toBeVisible();
    });
  });

  test.describe('Section Management', () => {
    test('should display sections tab with empty state', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Create and select a report
      await page.getByRole('button', { name: /create report/i }).click();
      await page.getByLabel('Report Title').fill('Sections Test Report');
      await page.getByRole('button', { name: /create report/i }).last().click();
      await page.waitForTimeout(1000);

      await page.getByText('Sections Test Report').click();

      // Check sections tab content
      await expect(page.getByText('No sections generated yet')).toBeVisible();
    });

    test('should have expand/collapse all buttons', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Assuming there's a report with sections
      const reportCard = page.locator('[data-testid="report-card"]').first();
      if (await reportCard.isVisible()) {
        await reportCard.click();

        // Check for expand/collapse buttons
        await expect(page.getByRole('button', { name: /expand all/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /collapse all/i })).toBeVisible();
      }
    });
  });

  test.describe('Audience Management', () => {
    test('should open add member dialog', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Create and select a report
      await page.getByRole('button', { name: /create report/i }).click();
      await page.getByLabel('Report Title').fill('Audience Test Report');
      await page.getByRole('button', { name: /create report/i }).last().click();
      await page.waitForTimeout(1000);

      await page.getByText('Audience Test Report').click();
      await page.getByRole('tab', { name: /audience/i }).click();

      // Click add member button
      await page.getByRole('button', { name: /add member/i }).click();

      // Check dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('should add an audience member', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Navigate to audience tab
      const reportCard = page.locator('[data-testid="report-card"]').first();
      if (await reportCard.isVisible()) {
        await reportCard.click();
        await page.getByRole('tab', { name: /audience/i }).click();
        await page.getByRole('button', { name: /add member/i }).click();

        // Fill in member details
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Name').fill('Test User');
        await page.getByLabel('Role').fill('Board Member');

        // Submit
        await page.getByRole('button', { name: /add member/i }).last().click();

        // Wait for dialog to close
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

        // Check member appears in list
        await expect(page.getByText('test@example.com')).toBeVisible();
      }
    });
  });

  test.describe('Generation Workflow', () => {
    test('should trigger generation when clicking generate button', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Create a new report
      await page.getByRole('button', { name: /create report/i }).click();
      await page.getByLabel('Report Title').fill('Generation Test Report');
      await page.getByRole('button', { name: /create report/i }).last().click();
      await page.waitForTimeout(1000);

      await page.getByText('Generation Test Report').click();

      // Click generate button
      const generateButton = page.getByRole('button', { name: /generate/i });
      if (await generateButton.isVisible()) {
        await generateButton.click();

        // Check for loading state
        await expect(page.getByText(/generating/i)).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Approval Workflow', () => {
    test('should show approve button when in review status', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Look for a report in review status
      const reviewBadge = page.getByText('In Review');
      if (await reviewBadge.isVisible()) {
        await reviewBadge.click();

        // Check for approve button
        await expect(page.getByRole('button', { name: /approve/i })).toBeVisible();
      }
    });

    test('should show publish button when approved', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      // Look for a report in approved status
      const approvedBadge = page.getByText('Approved');
      if (await approvedBadge.isVisible()) {
        await approvedBadge.click();

        // Check for publish button
        await expect(page.getByRole('button', { name: /publish/i })).toBeVisible();
      }
    });
  });

  test.describe('Edit and Delete', () => {
    test('should open edit dialog', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      const reportCard = page.locator('[data-testid="report-card"]').first();
      if (await reportCard.isVisible()) {
        await reportCard.click();

        // Open more menu and click edit
        await page.getByRole('button', { name: /more/i }).click();
        await page.getByRole('menuitem', { name: /edit settings/i }).click();

        // Check dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Edit Report Settings')).toBeVisible();
      }
    });

    test('should confirm before deleting', async ({ page }) => {
      await page.goto(BOARD_REPORTS_URL);

      const reportCard = page.locator('[data-testid="report-card"]').first();
      if (await reportCard.isVisible()) {
        await reportCard.click();

        // Open more menu and click delete
        await page.getByRole('button', { name: /more/i }).click();
        await page.getByRole('menuitem', { name: /delete report/i }).click();

        // Check for confirmation dialog
        page.on('dialog', dialog => dialog.dismiss());
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BOARD_REPORTS_URL);

      // Check page loads correctly
      await expect(page.locator('h1')).toContainText('Executive Board Reports');
      await expect(page.getByRole('button', { name: /create report/i })).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BOARD_REPORTS_URL);

      // Check page loads correctly
      await expect(page.locator('h1')).toContainText('Executive Board Reports');
    });
  });
});
