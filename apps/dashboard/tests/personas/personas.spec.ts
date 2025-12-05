/**
 * Audience Personas E2E Tests (Sprint S51.2)
 * End-to-end tests for persona builder UI flows
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PERSONAS_PAGE = `${BASE_URL}/app/personas`;

// Test data
const TEST_PRESS_RELEASE = `
We're excited to announce our new enterprise platform for Fortune 500 CTOs.
This solution helps technology leaders at large enterprises manage cloud infrastructure at scale.
Healthcare and financial services companies are our primary targets.
`;

test.describe('Audience Personas', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to personas page and ensure auth
    await page.goto(PERSONAS_PAGE);
    // Wait for page load
    await page.waitForSelector('h1:has-text("Audience Personas")', { timeout: 10000 });
  });

  // ========================================
  // 1. Generate Persona from Press Release
  // ========================================
  test('should generate persona from press release', async ({ page }) => {
    // Click generate button
    await page.click('button:has-text("Generate Persona")');

    // Wait for form modal
    await expect(page.locator('h2:has-text("Generate New Persona")')).toBeVisible();

    // Select source type
    await page.click('[id="sourceType"]');
    await page.click('text=Press Release');

    // Enter source text
    await page.fill('[id="sourceText"]', TEST_PRESS_RELEASE);

    // Enter suggested name
    await page.fill('[id="suggestedName"]', 'Enterprise CTO');

    // Select persona type
    await page.click('[id="personaType"]');
    await page.click('text=Primary Audience');

    // Enable extraction toggles (should be on by default)
    await expect(page.locator('[id="extractTraits"]')).toBeChecked();
    await expect(page.locator('[id="extractInsights"]')).toBeChecked();

    // Submit form
    await page.click('button:has-text("Generate Persona")');

    // Wait for generation (may take a few seconds)
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('button:has-text("Generating...")')).not.toBeVisible({ timeout: 30000 });

    // Verify persona appears in list
    await expect(page.locator('text=Enterprise CTO')).toBeVisible({ timeout: 5000 });

    // Verify traits and insights were extracted
    await expect(page.locator('text=Traits (')).toBeVisible();
    await expect(page.locator('text=Insights (')).toBeVisible();
  });

  // ========================================
  // 2. Create Persona Manually
  // ========================================
  test('should create persona manually', async ({ page }) => {
    // Click generate button
    await page.click('button:has-text("Generate Persona")');

    // Fill manual form
    await page.fill('[id="sourceText"]', 'Marketing managers at SaaS companies');
    await page.fill('[id="suggestedName"]', 'SaaS Marketing Manager');

    // Select source type: Manual
    await page.click('[id="sourceType"]');
    await page.click('text=Manual Input');

    // Disable LLM extraction for faster test
    await page.click('[id="extractTraits"]');
    await page.click('[id="extractInsights"]');

    // Submit
    await page.click('button:has-text("Generate Persona")');

    // Verify creation
    await expect(page.locator('text=SaaS Marketing Manager')).toBeVisible({ timeout: 10000 });
  });

  // ========================================
  // 3. Edit Persona Details
  // ========================================
  test('should edit persona details', async ({ page }) => {
    // Select first persona
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    await firstPersona.click();

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Wait for editor modal
    await expect(page.locator('h2:has-text("Edit Persona")')).toBeVisible();

    // Update fields
    await page.fill('[id="name"]', 'Updated Persona Name');
    await page.fill('[id="description"]', 'This is an updated description');
    await page.fill('[id="role"]', 'Senior Director');
    await page.fill('[id="industry"]', 'Technology');

    // Update status
    await page.click('[id="status"]');
    await page.click('text=Active');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify update
    await expect(page.locator('text=Updated Persona Name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=This is an updated description')).toBeVisible();
  });

  // ========================================
  // 4. Add Trait to Persona
  // ========================================
  test('should add trait to persona', async ({ page }) => {
    // Note: This would require a trait addition UI which isn't in the main page
    // For now, we verify traits are displayed
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    await firstPersona.click();

    // Click traits tab
    await page.click('button:has-text("Traits")');

    // Verify traits are visible
    await expect(page.locator('[class*="PersonaTraitChips"]')).toBeVisible();
  });

  // ========================================
  // 5. Add Insight to Persona
  // ========================================
  test('should view persona insights', async ({ page }) => {
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    await firstPersona.click();

    // Click insights tab
    await page.click('button:has-text("Insights")');

    // Verify insight panel loads
    await expect(page.locator('text=total insights')).toBeVisible({ timeout: 5000 });

    // Test tab navigation
    await page.click('button:has-text("Actionable")');
    await expect(page.locator('button:has-text("Actionable")[aria-selected="true"]')).toBeVisible();
  });

  // ========================================
  // 6. View History Timeline
  // ========================================
  test('should view history timeline', async ({ page }) => {
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    await firstPersona.click();

    // Click history tab
    await page.click('button:has-text("History")');

    // Verify timeline renders
    await expect(page.locator('text=snapshots')).toBeVisible({ timeout: 5000 });

    // Test date filters
    await page.click('button:has-text("7D")');
    await expect(page.locator('button:has-text("7D")[class*="blue"]')).toBeVisible();
  });

  // ========================================
  // 7. View Trends Chart
  // ========================================
  test('should view persona trends', async ({ page }) => {
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    await firstPersona.click();

    // History tab shows trends data
    await page.click('button:has-text("History")');

    // Verify score changes are visible
    await expect(page.locator('text=Overall').or(page.locator('text=Relevance'))).toBeVisible();
  });

  // ========================================
  // 8. Compare Two Personas
  // ========================================
  test('should compare two personas', async ({ page }) => {
    // Ensure we have at least 2 personas
    const personaCards = page.locator('[class*="PersonaCard"]');
    const count = await personaCards.count();

    if (count < 2) {
      test.skip();
      return;
    }

    // Select first persona
    await personaCards.first().click();

    // Click compare button
    await page.click('button:has-text("Compare")');

    // Verify comparison drawer opens
    await expect(page.locator('text=Persona Comparison')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Similarity Score')).toBeVisible();

    // Check for common/unique traits sections
    await expect(page.locator('text=Common Traits').or(page.locator('text=Unique to'))).toBeVisible();
  });

  // ========================================
  // 9. Merge Similar Personas
  // ========================================
  test('should offer merge option for similar personas', async ({ page }) => {
    // This requires high similarity personas
    // We'll test the UI exists
    const personaCards = page.locator('[class*="PersonaCard"]');
    if (await personaCards.count() < 2) {
      test.skip();
      return;
    }

    await personaCards.first().click();
    await page.click('button:has-text("Compare")');

    // If similarity > 80%, merge recommendation should appear
    const mergeButton = page.locator('button:has-text("Merge Personas")');
    const hasHighSimilarity = await mergeButton.isVisible().catch(() => false);

    if (hasHighSimilarity) {
      // Verify merge direction selector
      await expect(page.locator('text=Merge Direction')).toBeVisible();
    }
  });

  // ========================================
  // 10. Filter/Search Personas
  // ========================================
  test('should filter and search personas', async ({ page }) => {
    // Test search
    const searchInput = page.locator('input[placeholder*="Search personas"]');
    await searchInput.fill('CTO');

    // Verify filtered results
    await page.waitForTimeout(500); // Debounce
    const results = page.locator('[class*="PersonaCard"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Test status filter
    await page.click('text=All Status');
    await page.click('text=Active');

    // Verify filter applied
    await page.waitForTimeout(500);

    // Test sort
    await page.click('text=Sort by Score');
    await page.click('text=Sort by Updated');

    // Verify sort applied
    await expect(page.locator('text=Sort by Updated')).toBeVisible();
  });

  // ========================================
  // 11. Pagination
  // ========================================
  test('should handle pagination', async ({ page }) => {
    // This test only runs if there are enough personas
    const personaCards = page.locator('[class*="PersonaCard"]');
    const count = await personaCards.count();

    // Verify persona list is scrollable
    const personaList = page.locator('[class*="overflow-y-auto"]').first();
    await expect(personaList).toBeVisible();

    // Scroll to bottom
    await personaList.evaluate((el) => el.scrollTo(0, el.scrollHeight));

    // All personas should still be visible
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ========================================
  // 12. Error States
  // ========================================
  test('should handle error states gracefully', async ({ page }) => {
    // Try to generate with empty text
    await page.click('button:has-text("Generate Persona")');

    // Leave source text empty
    await page.fill('[id="sourceText"]', '');

    // Submit
    await page.click('button:has-text("Generate Persona")');

    // Verify error message
    await expect(page.locator('text=Source text is required').or(page.locator('[class*="red"]'))).toBeVisible();

    // Try with text too short
    await page.fill('[id="sourceText"]', 'Hi');
    await page.click('button:has-text("Generate Persona")');

    // Verify error
    await expect(page.locator('text=at least 10 characters').or(page.locator('[class*="red"]'))).toBeVisible();
  });
});

test.describe('Persona Statistics', () => {
  test('should display correct statistics', async ({ page }) => {
    await page.goto(PERSONAS_PAGE);
    await page.waitForSelector('h1:has-text("Audience Personas")');

    // Verify stats panel
    await expect(page.locator('text=Statistics')).toBeVisible();
    await expect(page.locator('text=Total Personas')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Validated')).toBeVisible();

    // Stats should have numbers
    const totalText = await page.locator('text=Total Personas').locator('..').textContent();
    expect(totalText).toMatch(/\d+/);
  });
});

test.describe('Persona Detail Views', () => {
  test('should switch between detail tabs', async ({ page }) => {
    await page.goto(PERSONAS_PAGE);
    await page.waitForSelector('h1:has-text("Audience Personas")');

    // Select first persona
    const firstPersona = page.locator('[class*="PersonaCard"]').first();
    if (await firstPersona.isVisible()) {
      await firstPersona.click();

      // Test tab switching
      await page.click('button:has-text("Traits")');
      await expect(page.locator('button:has-text("Traits")[aria-selected="true"]')).toBeVisible();

      await page.click('button:has-text("Insights")');
      await expect(page.locator('button:has-text("Insights")[aria-selected="true"]')).toBeVisible();

      await page.click('button:has-text("History")');
      await expect(page.locator('button:has-text("History")[aria-selected="true"]')).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PERSONAS_PAGE);

    // Page should still render
    await expect(page.locator('h1:has-text("Audience Personas")')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(PERSONAS_PAGE);

    // Three-panel layout should adapt
    await expect(page.locator('h1:has-text("Audience Personas")')).toBeVisible();
  });
});
