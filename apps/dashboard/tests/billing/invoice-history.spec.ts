/**
 * Billing History E2E Tests (Sprint S34)
 * Tests invoice history page functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Billing History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/v1/billing/org/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            last12Invoices: [
              {
                id: 'inv-1',
                stripeInvoiceId: 'in_test_123',
                invoiceNumber: 'INV-001',
                amountDue: 2900,
                amountPaid: 2900,
                status: 'paid',
                periodStart: '2024-01-01T00:00:00Z',
                periodEnd: '2024-02-01T00:00:00Z',
                hostedInvoiceUrl: 'https://stripe.com/invoice',
                invoicePdf: 'https://stripe.com/invoice.pdf',
              },
            ],
            totalPaid12Mo: 2900,
            highestInvoice: 2900,
            averageMonthlyCost: 2900,
            overageCostsPerInvoice: {},
          },
        }),
      });
    });
  });

  test('should display billing history page with invoice table', async ({ page }) => {
    await page.goto('/app/billing/history');

    await expect(page.locator('h1')).toContainText('Billing History');
    await expect(page.locator('text=Total Paid (12 Months)')).toBeVisible();
    await expect(page.locator('text=$29.00')).toBeVisible();
  });

  test('should show invoice list with status badges', async ({ page }) => {
    await page.goto('/app/billing/history');

    await expect(page.locator('text=INV-001')).toBeVisible();
    await expect(page.locator('text=PAID')).toBeVisible();
  });

  test('should allow sorting invoices', async ({ page }) => {
    await page.goto('/app/billing/history');

    // Click sort by amount
    await page.locator('th:has-text("Amount")').click();
    // Verify sort indicator appears
    await expect(page.locator('th:has-text("Amount")')).toContainText('↓');
  });
});
