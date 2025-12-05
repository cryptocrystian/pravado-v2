/**
 * Invoice Details E2E Tests (Sprint S34)
 * Tests invoice details page functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Invoice Details Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response for invoice details
    await page.route('**/api/v1/billing/org/invoices/inv-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            invoice: {
              id: 'inv-1',
              stripeInvoiceId: 'in_test_123',
              invoiceNumber: 'INV-001',
              status: 'paid',
              periodStart: '2024-01-01T00:00:00Z',
              periodEnd: '2024-02-01T00:00:00Z',
              hostedInvoiceUrl: 'https://stripe.com/invoice',
              invoicePdf: 'https://stripe.com/invoice.pdf',
            },
            breakdown: {
              planCost: 2900,
              tokenOverages: 0,
              runOverages: 0,
              discounts: 0,
              prorations: 0,
              tax: 0,
              subtotal: 2900,
              total: 2900,
            },
            lineItems: [
              {
                description: 'Starter Plan Subscription',
                amount: 2900,
                quantity: 1,
                type: 'plan',
              },
            ],
            usageSnapshot: {
              tokens: 500000,
              playbookRuns: 250,
              seats: 3,
            },
            relatedAlerts: [],
          },
        }),
      });
    });
  });

  test('should display invoice details with breakdown', async ({ page }) => {
    await page.goto('/app/billing/invoice/inv-1');

    await expect(page.locator('h1')).toContainText('Invoice INV-001');
    await expect(page.locator('text=Invoice Summary')).toBeVisible();
    await expect(page.locator('text=$29.00')).toBeVisible();
  });

  test('should show line items table', async ({ page }) => {
    await page.goto('/app/billing/invoice/inv-1');

    await expect(page.locator('text=Line Items')).toBeVisible();
    await expect(page.locator('text=Starter Plan Subscription')).toBeVisible();
  });

  test('should display usage snapshot', async ({ page }) => {
    await page.goto('/app/billing/invoice/inv-1');

    await expect(page.locator('text=Usage During This Period')).toBeVisible();
    await expect(page.locator('text=500,000')).toBeVisible();
  });
});
