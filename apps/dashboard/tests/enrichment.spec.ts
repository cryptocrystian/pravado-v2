/**
 * Journalist Enrichment E2E Tests (Sprint S50)
 * End-to-end testing for enrichment engine UI and workflows
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000';

test.describe('Journalist Enrichment Engine', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto(DASHBOARD_URL);
    await page.evaluate(() => {
      localStorage.setItem('orgId', '00000000-0000-0000-0000-000000000001');
      localStorage.setItem('userId', '00000000-0000-0000-0000-000000000002');
    });
  });

  // ========================================
  // Page Load and Navigation
  // ========================================

  test('should load enrichment page successfully', async ({ page }) => {
    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Check for main page elements
    await expect(page.locator('h1')).toContainText('Contact Enrichment');
    await expect(page.locator('text=Enrich journalist contact data')).toBeVisible();

    // Verify three-panel layout exists
    await expect(page.locator('text=Generate Enrichment')).toBeVisible();
    await expect(page.locator('text=Enrichment Records')).toBeVisible();
  });

  test('should display enrichment generator form', async ({ page }) => {
    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Check form fields
    await expect(page.locator('label:has-text("Source Type")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Media Outlet")')).toBeVisible();
    await expect(page.locator('label:has-text("Social Profile URL")')).toBeVisible();

    // Check generate button
    await expect(
      page.locator('button:has-text("Generate Enrichment")')
    ).toBeVisible();
  });

  // ========================================
  // Enrichment Generation
  // ========================================

  test('should generate enrichment from email', async ({ page, context }) => {
    // Mock API response
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/generate`, (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-enrichment-id',
          orgId: '00000000-0000-0000-0000-000000000001',
          sourceType: 'email_verification',
          email: 'journalist@nytimes.com',
          emailVerified: true,
          emailConfidence: 0.9,
          overallConfidenceScore: 85,
          completenessScore: 70,
          dataFreshnessScore: 95,
          status: 'completed',
          createdAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Fill form
    await page.locator('select[name="sourceType"]').selectOption('email_verification');
    await page.fill('input[type="email"]', 'journalist@nytimes.com');

    // Submit
    await page.click('button:has-text("Generate Enrichment")');

    // Wait for success
    await expect(page.locator('text=test-enrichment-id')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate required fields in generator form', async ({ page }) => {
    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Try to submit empty form
    const generateButton = page.locator('button:has-text("Generate Enrichment")');
    await expect(generateButton).toBeDisabled();

    // Fill email field
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(generateButton).toBeEnabled();
  });

  test('should display loading state during generation', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/generate`, async (route) => {
      // Delay response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-id',
          status: 'processing',
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Generate Enrichment")');

    // Check for loading state
    await expect(page.locator('text=Generating...')).toBeVisible();
  });

  // ========================================
  // Enrichment Records List
  // ========================================

  test('should display enrichment records list', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/records*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'record-1',
              sourceType: 'email_verification',
              email: 'journalist1@nytimes.com',
              emailVerified: true,
              outlet: 'The New York Times',
              overallConfidenceScore: 85,
              completenessScore: 90,
              dataFreshnessScore: 95,
              status: 'completed',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'record-2',
              sourceType: 'social_scraping',
              email: 'journalist2@wsj.com',
              outlet: 'The Wall Street Journal',
              overallConfidenceScore: 75,
              completenessScore: 80,
              dataFreshnessScore: 85,
              status: 'completed',
              createdAt: new Date().toISOString(),
            },
          ],
          total: 2,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Wait for records to load
    await expect(page.locator('text=journalist1@nytimes.com')).toBeVisible();
    await expect(page.locator('text=journalist2@wsj.com')).toBeVisible();
  });

  test('should select enrichment record and show details', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/records*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'record-1',
              email: 'test@example.com',
              status: 'completed',
              overallConfidenceScore: 85,
              completenessScore: 90,
              dataFreshnessScore: 95,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Click on record card
    await page.click('text=View Details →');

    // Verify detail drawer opens
    await expect(page.locator('text=Enrichment Details')).toBeVisible();
  });

  // ========================================
  // Merge Suggestions
  // ========================================

  test('should display merge suggestions', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/suggestions/*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            {
              targetId: 'journalist-1',
              targetEmail: 'journalist@example.com',
              confidence: 0.85,
              reason: 'Email and phone match',
              fieldsToMerge: ['email', 'phone', 'social_profiles'],
              matchScore: 0.9,
              matchFields: ['email', 'phone'],
              potentialConflicts: [],
            },
          ],
          totalSuggestions: 1,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Switch to suggestions tab
    await page.click('button:has-text("Suggestions")');

    // Verify suggestions are displayed
    await expect(page.locator('text=Email and phone match')).toBeVisible();
    await expect(page.locator('text=Accept Merge')).toBeVisible();
  });

  test('should accept merge suggestion', async ({ page, context }) => {
    let mergeRequested = false;

    await context.route(`${API_BASE}/api/v1/journalist-enrichment/merge`, (route) => {
      mergeRequested = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await context.route(`${API_BASE}/api/v1/journalist-enrichment/suggestions/*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: [
            {
              targetId: 'journalist-1',
              confidence: 0.85,
              reason: 'Match found',
              fieldsToMerge: ['email'],
              matchScore: 0.9,
              matchFields: ['email'],
            },
          ],
          totalSuggestions: 1,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Go to suggestions tab
    await page.click('button:has-text("Suggestions")');

    // Expand suggestion
    await page.click('text=Match found');

    // Accept merge
    await page.click('button:has-text("Accept Merge")');

    // Verify API was called
    await page.waitForTimeout(500);
    expect(mergeRequested).toBe(true);
  });

  // ========================================
  // Batch Jobs
  // ========================================

  test('should display batch jobs', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/jobs*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [
            {
              id: 'job-1',
              jobType: 'batch_enrichment',
              status: 'processing',
              inputRecordCount: 100,
              successfulRecords: 75,
              failedRecords: 5,
              progressPercentage: 80,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Switch to jobs tab
    await page.click('button:has-text("Jobs")');

    // Verify jobs are displayed
    await expect(page.locator('text=Batch Enrichment')).toBeVisible();
    await expect(page.locator('text=80%')).toBeVisible();
    await expect(page.locator('text=75 success')).toBeVisible();
  });

  // ========================================
  // Confidence Badges
  // ========================================

  test('should display confidence badges correctly', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/records*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'high-confidence',
              email: 'high@example.com',
              overallConfidenceScore: 90,
              status: 'completed',
            },
            {
              id: 'low-confidence',
              email: 'low@example.com',
              overallConfidenceScore: 25,
              status: 'completed',
            },
          ],
          total: 2,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Check for high confidence badge (green)
    await expect(page.locator('text=High')).toBeVisible();

    // Check for low confidence badge (red)
    await expect(page.locator('text=Low')).toBeVisible();
  });

  // ========================================
  // Error Handling
  // ========================================

  test('should handle API errors gracefully', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/generate`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Generate Enrichment")');

    // Should display error message
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('error');
      dialog.accept();
    });
  });

  // ========================================
  // Quality Flags
  // ========================================

  test('should display quality flags', async ({ page, context }) => {
    await context.route(`${API_BASE}/api/v1/journalist-enrichment/records*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 'flagged-record',
              email: 'flagged@example.com',
              status: 'completed',
              overallConfidenceScore: 60,
              qualityFlags: ['unverified_email', 'missing_social_profiles'],
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Should show quality issue indicator
    await expect(page.locator('text=2 quality issues')).toBeVisible();
  });

  // ========================================
  // Refresh Functionality
  // ========================================

  test('should refresh records list', async ({ page, context }) => {
    let requestCount = 0;

    await context.route(`${API_BASE}/api/v1/journalist-enrichment/records*`, (route) => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [],
          total: 0,
          hasMore: false,
        }),
      });
    });

    await page.goto(`${DASHBOARD_URL}/app/pr/enrichment`);

    // Initial load
    await page.waitForTimeout(500);
    const initialCount = requestCount;

    // Click refresh
    await page.click('button:has-text("Refresh")');

    // Verify new request was made
    await page.waitForTimeout(500);
    expect(requestCount).toBeGreaterThan(initialCount);
  });
});
