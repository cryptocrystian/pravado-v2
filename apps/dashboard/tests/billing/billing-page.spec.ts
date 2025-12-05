/**
 * Billing Page E2E Tests (Sprint S33.2)
 * Tests billing self-service portal UI and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/v1/billing/org/summary-enriched', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            plan: {
              id: 'plan-1',
              slug: 'starter',
              name: 'Starter',
              description: 'For small teams',
              monthlyPriceCents: 2900,
              includedTokensMonthly: 1000000,
              includedPlaybookRunsMonthly: 500,
              includedSeats: 5,
              overageTokenPriceMilliCents: 2,
              overagePlaybookRunPriceCents: 10,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            billingStatus: 'active',
            tokensUsedThisPeriod: 500000,
            playbookRunsThisPeriod: 250,
            seatsUsed: 3,
            overages: {
              tokens: 0,
              playbookRuns: 0,
              seats: 0,
              estimatedCost: 0,
            },
            currentPeriodStart: '2024-01-01T00:00:00Z',
            currentPeriodEnd: '2024-02-01T00:00:00Z',
            nextBillingDate: '2024-02-01T00:00:00Z',
            daysUntilRenewal: 15,
            projectedMonthlyCost: 2900,
            projectedOverageCost: 0,
            recommendedPlanSlug: null,
            trialDaysRemaining: null,
          },
        }),
      });
    });

    await page.route('**/api/v1/billing/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'plan-0',
              slug: 'internal-dev',
              name: 'Internal Dev',
              description: 'For development',
              monthlyPriceCents: 0,
              includedTokensMonthly: 100000,
              includedPlaybookRunsMonthly: 100,
              includedSeats: 2,
              overageTokenPriceMilliCents: 0,
              overagePlaybookRunPriceCents: 0,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'plan-1',
              slug: 'starter',
              name: 'Starter',
              description: 'For small teams',
              monthlyPriceCents: 2900,
              includedTokensMonthly: 1000000,
              includedPlaybookRunsMonthly: 500,
              includedSeats: 5,
              overageTokenPriceMilliCents: 2,
              overagePlaybookRunPriceCents: 10,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'plan-2',
              slug: 'growth',
              name: 'Growth',
              description: 'For growing teams',
              monthlyPriceCents: 9900,
              includedTokensMonthly: 5000000,
              includedPlaybookRunsMonthly: 2000,
              includedSeats: 15,
              overageTokenPriceMilliCents: 1,
              overagePlaybookRunPriceCents: 5,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'plan-3',
              slug: 'enterprise',
              name: 'Enterprise',
              description: 'Custom solutions',
              monthlyPriceCents: 0,
              includedTokensMonthly: 999999999,
              includedPlaybookRunsMonthly: 999999,
              includedSeats: 999,
              overageTokenPriceMilliCents: 0,
              overagePlaybookRunPriceCents: 0,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/billing/alerts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
  });

  test('should display billing page with current plan', async ({ page }) => {
    await page.goto('/app/billing');

    // Check page title
    await expect(page.locator('h1')).toContainText('Billing & Subscription');

    // Check current plan card
    await expect(page.locator('h2:has-text("Current Plan")')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=$29.00 / month')).toBeVisible();
    await expect(page.locator('text=ACTIVE')).toBeVisible();

    // Check action buttons
    await expect(page.locator('button:has-text("Cancel Subscription")')).toBeVisible();
    await expect(page.locator('button:has-text("Manage Payment Method")')).toBeVisible();
  });

  test('should display usage progress bars', async ({ page }) => {
    await page.goto('/app/billing');

    // Check usage section exists
    await expect(page.locator('h2:has-text("Usage This Period")')).toBeVisible();

    // Check for usage bars (they should show labels)
    await expect(page.locator('text=LLM Tokens')).toBeVisible();
    await expect(page.locator('text=Playbook Runs')).toBeVisible();
    await expect(page.locator('text=Team Seats')).toBeVisible();

    // Check usage values are displayed
    await expect(page.locator('text=500,000 / 1,000,000 tokens')).toBeVisible();
    await expect(page.locator('text=250 / 500 runs')).toBeVisible();
    await expect(page.locator('text=3 / 5 seats')).toBeVisible();
  });

  test('should display available plans grid', async ({ page }) => {
    await page.goto('/app/billing');

    // Check plan selection header
    await expect(page.locator('h2:has-text("Available Plans")')).toBeVisible();

    // Check all 4 plans are displayed
    await expect(page.locator('text=Internal Dev')).toBeVisible();
    await expect(page.locator('text=Starter').nth(1)).toBeVisible(); // nth(1) because Starter appears twice
    await expect(page.locator('text=Growth')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();

    // Check current plan has "Current Plan" button
    const starterCard = page.locator('.text-xl:has-text("Starter")').locator('..').locator('..');
    await expect(starterCard.locator('button:has-text("Current Plan")')).toBeVisible();
  });

  test('should show cancel subscription modal', async ({ page }) => {
    await page.goto('/app/billing');

    // Click cancel button
    await page.locator('button:has-text("Cancel Subscription")').click();

    // Check modal appears
    await expect(page.locator('h3:has-text("Cancel Subscription")')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to cancel?')).toBeVisible();

    // Check radio options exist
    await expect(page.locator('text=Cancel at period end (Recommended)')).toBeVisible();
    await expect(page.locator('text=Cancel immediately')).toBeVisible();

    // Check buttons
    await expect(page.locator('button:has-text("Keep Subscription")')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm Cancel")')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("Keep Subscription")').click();

    // Modal should disappear
    await expect(page.locator('h3:has-text("Cancel Subscription")')).not.toBeVisible();
  });

  test('should handle downgrade with usage guardrails', async ({ page }) => {
    await page.goto('/app/billing');

    // Mock downgrade attempt that returns 422 error
    await page.route('**/api/v1/billing/org/switch-plan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: '422_UPGRADE_REQUIRED',
            message: 'Your current usage exceeds the limits of the selected plan',
          },
        }),
      });
    });

    // Try to downgrade (click downgrade button on Internal Dev plan)
    const internalDevCard = page.locator('.text-xl:has-text("Internal Dev")').locator('..').locator('..');
    await internalDevCard.locator('button:has-text("Downgrade")').click();

    // Wait for the downgrade blocked dialog
    await expect(page.locator('h3:has-text("Cannot Downgrade Plan")')).toBeVisible();
    await expect(page.locator('text=Your current usage exceeds')).toBeVisible();

    // Check that it shows usage exceeds limits
    await expect(page.locator('text=Usage Exceeds Limits')).toBeVisible();

    // Close dialog
    await page.locator('button:has-text("Close")').click();

    // Dialog should disappear
    await expect(page.locator('h3:has-text("Cannot Downgrade Plan")')).not.toBeVisible();
  });

  test('should show trial banner when in trial', async ({ page }) => {
    // Override summary to show trial
    await page.route('**/api/v1/billing/org/summary-enriched', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            plan: null,
            billingStatus: 'trial',
            tokensUsedThisPeriod: 50000,
            playbookRunsThisPeriod: 25,
            seatsUsed: 1,
            overages: {
              tokens: 0,
              playbookRuns: 0,
              seats: 0,
              estimatedCost: 0,
            },
            currentPeriodStart: '2024-01-01T00:00:00Z',
            currentPeriodEnd: '2024-02-01T00:00:00Z',
            nextBillingDate: '2024-01-08T00:00:00Z',
            trialDaysRemaining: 7,
            daysUntilRenewal: null,
            projectedMonthlyCost: 0,
            projectedOverageCost: null,
            recommendedPlanSlug: 'starter',
          },
        }),
      });
    });

    await page.goto('/app/billing');

    // Check trial banner appears
    await expect(page.locator('text=Your trial ends in 7 days')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible();
  });

  test('should display alerts panel when alerts exist', async ({ page }) => {
    // Override alerts endpoint to return alerts
    await page.route('**/api/v1/billing/alerts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'alert-1',
              orgId: 'org-1',
              severity: 'high',
              resourceType: 'tokens',
              message: 'Token usage at 90%',
              currentUsage: 900000,
              limit: 1000000,
              threshold: 90,
              createdAt: '2024-01-15T00:00:00Z',
              acknowledgedAt: null,
            },
          ],
        }),
      });
    });

    await page.goto('/app/billing');

    // Check alerts panel appears
    await expect(page.locator('h2:has-text("Usage Alerts")')).toBeVisible();
    await expect(page.locator('text=Token usage at 90%')).toBeVisible();

    // Check dismiss button exists
    await expect(page.locator('button:has-text("Dismiss")')).toBeVisible();
  });

  test('should show Enterprise contact sales button', async ({ page }) => {
    await page.goto('/app/billing');

    // Find Enterprise card
    const enterpriseCard = page.locator('.text-xl:has-text("Enterprise")').locator('..').locator('..');

    // Check it has Contact Sales button
    await expect(enterpriseCard.locator('button:has-text("Contact Sales")')).toBeVisible();
  });

  test('should show billing history CTA', async ({ page }) => {
    await page.goto('/app/billing');

    // Check billing history section
    await expect(page.locator('h3:has-text("Billing History")')).toBeVisible();
    await expect(page.locator('text=View past invoices and payment history')).toBeVisible();
    await expect(page.locator('button:has-text("View Invoices (Coming in S34)")')).toBeDisabled();
  });

  test('should display overage breakdown when overages exist', async ({ page }) => {
    // Override summary to show overages
    await page.route('**/api/v1/billing/org/summary-enriched', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            plan: {
              id: 'plan-1',
              slug: 'starter',
              name: 'Starter',
              description: 'For small teams',
              monthlyPriceCents: 2900,
              includedTokensMonthly: 1000000,
              includedPlaybookRunsMonthly: 500,
              includedSeats: 5,
              overageTokenPriceMilliCents: 2,
              overagePlaybookRunPriceCents: 10,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            billingStatus: 'active',
            tokensUsedThisPeriod: 1000000,
            playbookRunsThisPeriod: 500,
            seatsUsed: 5,
            overages: {
              tokens: 50000,
              playbookRuns: 10,
              seats: 0,
              estimatedCost: 200, // $2.00 in cents
            },
            currentPeriodStart: '2024-01-01T00:00:00Z',
            currentPeriodEnd: '2024-02-01T00:00:00Z',
            nextBillingDate: '2024-02-01T00:00:00Z',
            daysUntilRenewal: 15,
            projectedMonthlyCost: 3100,
            projectedOverageCost: 200,
            recommendedPlanSlug: 'growth',
            trialDaysRemaining: null,
          },
        }),
      });
    });

    await page.goto('/app/billing');

    // Check overage breakdown appears
    await expect(page.locator('h3:has-text("Overage Charges")')).toBeVisible();
    await expect(page.locator('text=Total Overage')).toBeVisible();
    await expect(page.locator('text=$2.00').last()).toBeVisible();
  });
});
