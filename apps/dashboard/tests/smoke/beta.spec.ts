/**
 * Beta request flow smoke tests.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.pravado.io';

test.describe('Beta request flow', () => {
  test('beta page loads with form', async ({ page }) => {
    await page.goto(`${BASE}/beta`);
    await expect(page.getByText('Apply for Private Beta Access')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('rejects free email domains (gmail.com)', async ({ page }) => {
    await page.goto(`${BASE}/beta`);
    await page.fill('input[type="email"]', 'test@gmail.com');
    // Try to find and click a submit button
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      const text = await page.textContent('body');
      expect(text).toMatch(/work email|business email|not accepted/i);
    }
  });

  test('API endpoint responds to beta request', async ({ request }) => {
    const response = await request.post(`${BASE}/api/beta/request`, {
      data: {
        email: `smoke-test-${Date.now()}@testcompany.io`,
        companyName: 'Smoke Test Corp',
        companySize: '2-10',
        useCase: 'Automated smoke test — ignore',
      },
    });
    expect(response.status()).toBeLessThan(500);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  // Manual test: email delivery cannot be automated
  test.skip('MANUAL: confirmation email arrives within 60 seconds', async () => {
    // Check inbox for "You're on the Pravado waitlist" email
  });
});
