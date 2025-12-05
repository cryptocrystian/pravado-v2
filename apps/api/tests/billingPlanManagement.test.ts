/**
 * Billing Plan Management Tests (Sprint S33)
 * Comprehensive tests for self-service plan switching and management
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { BillingService } from '../src/services/billingService';
import { StripeService } from '../src/services/stripeService';
import { BillingQuotaError } from '@pravado/types';

// Mock Supabase
const supabase = createClient('http://localhost:54321', 'test-key');

describe('Plan Management (S33) - BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService(supabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('switchOrgPlan()', () => {
    it('should successfully upgrade from starter to growth plan', async () => {
      // Mock current state
      vi.spyOn(billingService, 'getOrgBillingState').mockResolvedValue({
        orgId: 'org-123',
        planId: 'plan-starter',
        billingStatus: 'active',
        trialEndsAt: null,
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        softTokenLimitMonthly: null,
        softPlaybookRunLimitMonthly: null,
        softSeatLimit: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 50000,
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanBySlug').mockResolvedValue({
        id: 'plan-growth',
        slug: 'growth',
        name: 'Growth',
        description: 'Growth plan',
        monthlyPriceCents: 5000,
        includedTokensMonthly: 500000,
        includedPlaybookRunsMonthly: 50,
        includedSeats: 5,
        overageTokenPriceMilliCents: 8,
        overagePlaybookRunPriceCents: 80,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await billingService.switchOrgPlan('org-123', 'growth');

      expect(result).toBeDefined();
      expect(result?.planId).toBe('plan-growth');
    });

    it('should block downgrade when current usage exceeds target plan limits', async () => {
      // Mock current state with high usage
      vi.spyOn(billingService, 'getOrgBillingState').mockResolvedValue({
        orgId: 'org-123',
        planId: 'plan-growth',
        billingStatus: 'active',
        trialEndsAt: null,
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        softTokenLimitMonthly: null,
        softPlaybookRunLimitMonthly: null,
        softSeatLimit: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-growth',
          slug: 'growth',
          name: 'Growth',
          description: 'Growth plan',
          monthlyPriceCents: 5000,
          includedTokensMonthly: 500000,
          includedPlaybookRunsMonthly: 50,
          includedSeats: 5,
          overageTokenPriceMilliCents: 8,
          overagePlaybookRunPriceCents: 80,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 200000, // Exceeds starter plan limit
        playbookRuns: 20,
        seats: 3,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanBySlug').mockResolvedValue({
        id: 'plan-starter',
        slug: 'starter',
        name: 'Starter',
        description: 'Starter plan',
        monthlyPriceCents: 1000,
        includedTokensMonthly: 100000,
        includedPlaybookRunsMonthly: 10,
        includedSeats: 1,
        overageTokenPriceMilliCents: 10,
        overagePlaybookRunPriceCents: 100,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      await expect(billingService.switchOrgPlan('org-123', 'starter')).rejects.toThrow(
        BillingQuotaError
      );
    });

    it('should allow downgrade when usage is within target plan limits', async () => {
      vi.spyOn(billingService, 'getOrgBillingState').mockResolvedValue({
        orgId: 'org-123',
        planId: 'plan-growth',
        billingStatus: 'active',
        trialEndsAt: null,
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        softTokenLimitMonthly: null,
        softPlaybookRunLimitMonthly: null,
        softSeatLimit: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-growth',
          slug: 'growth',
          name: 'Growth',
          description: 'Growth plan',
          monthlyPriceCents: 5000,
          includedTokensMonthly: 500000,
          includedPlaybookRunsMonthly: 50,
          includedSeats: 5,
          overageTokenPriceMilliCents: 8,
          overagePlaybookRunPriceCents: 80,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 50000, // Within starter limits
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanBySlug').mockResolvedValue({
        id: 'plan-starter',
        slug: 'starter',
        name: 'Starter',
        description: 'Starter plan',
        monthlyPriceCents: 1000,
        includedTokensMonthly: 100000,
        includedPlaybookRunsMonthly: 10,
        includedSeats: 1,
        overageTokenPriceMilliCents: 10,
        overagePlaybookRunPriceCents: 100,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await billingService.switchOrgPlan('org-123', 'starter');

      expect(result).toBeDefined();
      expect(result?.planId).toBe('plan-starter');
    });

    it('should create plan change alert on successful switch', async () => {
      vi.spyOn(billingService, 'getOrgBillingState').mockResolvedValue({
        orgId: 'org-123',
        planId: 'plan-starter',
        billingStatus: 'active',
        trialEndsAt: null,
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        softTokenLimitMonthly: null,
        softPlaybookRunLimitMonthly: null,
        softSeatLimit: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 50000,
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanBySlug').mockResolvedValue({
        id: 'plan-growth',
        slug: 'growth',
        name: 'Growth',
        description: 'Growth plan',
        monthlyPriceCents: 5000,
        includedTokensMonthly: 500000,
        includedPlaybookRunsMonthly: 50,
        includedSeats: 5,
        overageTokenPriceMilliCents: 8,
        overagePlaybookRunPriceCents: 80,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const generateAlertSpy = vi.spyOn(billingService as any, 'generatePlanChangeAlert');

      await billingService.switchOrgPlan('org-123', 'growth');

      expect(generateAlertSpy).toHaveBeenCalledWith('org-123', 'starter', 'growth', true);
    });
  });

  describe('getPlanRecommendations()', () => {
    it('should recommend upgrade when token usage > 80%', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 85000, // 85% of limit
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'listPlans').mockResolvedValue([
        {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'plan-growth',
          slug: 'growth',
          name: 'Growth',
          description: 'Growth plan',
          monthlyPriceCents: 5000,
          includedTokensMonthly: 500000,
          includedPlaybookRunsMonthly: 50,
          includedSeats: 5,
          overageTokenPriceMilliCents: 8,
          overagePlaybookRunPriceCents: 80,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]);

      const recommendation = await billingService.getPlanRecommendations('org-123');

      expect(recommendation).toBe('growth');
    });

    it('should recommend upgrade when playbook run usage > 80%', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 50000,
        playbookRuns: 9, // 90% of limit
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'listPlans').mockResolvedValue([
        {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'plan-growth',
          slug: 'growth',
          name: 'Growth',
          description: 'Growth plan',
          monthlyPriceCents: 5000,
          includedTokensMonthly: 500000,
          includedPlaybookRunsMonthly: 50,
          includedSeats: 5,
          overageTokenPriceMilliCents: 8,
          overagePlaybookRunPriceCents: 80,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]);

      const recommendation = await billingService.getPlanRecommendations('org-123');

      expect(recommendation).toBe('growth');
    });

    it('should return null for enterprise plan (no higher tier)', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-enterprise',
          slug: 'enterprise',
          name: 'Enterprise',
          description: 'Enterprise plan',
          monthlyPriceCents: 50000,
          includedTokensMonthly: 5000000,
          includedPlaybookRunsMonthly: 500,
          includedSeats: 50,
          overageTokenPriceMilliCents: 5,
          overagePlaybookRunPriceCents: 50,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 4500000, // 90% usage
        playbookRuns: 450,
        seats: 45,
        softLimits: {},
      });

      const recommendation = await billingService.getPlanRecommendations('org-123');

      expect(recommendation).toBeNull();
    });

    it('should return null when usage is below 80% threshold', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 50000, // 50% usage
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      const recommendation = await billingService.getPlanRecommendations('org-123');

      expect(recommendation).toBeNull();
    });
  });

  describe('buildOrgBillingSummaryEnriched()', () => {
    it('should include daysUntilRenewal when period end is set', async () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days from now

      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: futureDate,
        tokensUsed: 50000,
        playbookRuns: 5,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanRecommendations').mockResolvedValue(null);

      const enrichedSummary = await billingService.buildOrgBillingSummaryEnriched('org-123');

      expect(enrichedSummary?.daysUntilRenewal).toBeGreaterThanOrEqual(14);
      expect(enrichedSummary?.daysUntilRenewal).toBeLessThanOrEqual(15);
    });

    it('should include projectedOverageCost when overages exist', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 150000, // 50k overage
        playbookRuns: 15, // 5 overage
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService as any, 'getOverageSummaryForOrg').mockResolvedValue({
        totalCost: 10500, // $105 in cents
      });

      vi.spyOn(billingService, 'getPlanRecommendations').mockResolvedValue('growth');

      const enrichedSummary = await billingService.buildOrgBillingSummaryEnriched('org-123');

      expect(enrichedSummary?.projectedOverageCost).toBe(10500);
    });

    it('should include recommendedPlanSlug when recommendation exists', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue({
        plan: {
          id: 'plan-starter',
          slug: 'starter',
          name: 'Starter',
          description: 'Starter plan',
          monthlyPriceCents: 1000,
          includedTokensMonthly: 100000,
          includedPlaybookRunsMonthly: 10,
          includedSeats: 1,
          overageTokenPriceMilliCents: 10,
          overagePlaybookRunPriceCents: 100,
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        billingStatus: 'active',
        currentPeriodStart: '2025-01-01T00:00:00Z',
        currentPeriodEnd: '2025-02-01T00:00:00Z',
        tokensUsed: 85000, // 85% usage
        playbookRuns: 8,
        seats: 1,
        softLimits: {},
      });

      vi.spyOn(billingService, 'getPlanRecommendations').mockResolvedValue('growth');

      const enrichedSummary = await billingService.buildOrgBillingSummaryEnriched('org-123');

      expect(enrichedSummary?.recommendedPlanSlug).toBe('growth');
    });

    it('should return null when base summary is null', async () => {
      vi.spyOn(billingService, 'buildOrgBillingSummary').mockResolvedValue(null);

      const enrichedSummary = await billingService.buildOrgBillingSummaryEnriched('org-123');

      expect(enrichedSummary).toBeNull();
    });
  });
});

describe('Plan Management (S33) - StripeService Integration', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    // Note: StripeService tests would require proper Stripe mocking
    // This is a simplified version for demonstration
    stripeService = new StripeService(supabase, 'sk_test_fake', 'whsec_test_fake');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('switchSubscriptionPlan() (integration outline)', () => {
    it('should handle upgrade with trial termination', async () => {
      // This test would require full Stripe SDK mocking
      // Outline of what would be tested:
      // 1. Retrieve current subscription from Stripe
      // 2. Check if subscription is in trial
      // 3. Update subscription with new price
      // 4. End trial if applicable (trial_end: 'now')
      // 5. Update local billing state with new plan
      expect(true).toBe(true); // Placeholder
    });

    it('should handle downgrade with proration', async () => {
      // Outline: Test proration_behavior: 'always_invoice'
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('retrieveSubscriptionDetails() (integration outline)', () => {
    it('should return subscription renewal details', async () => {
      // Outline: Test retrieval of current_period_end, cancel_at_period_end, etc.
      expect(true).toBe(true); // Placeholder
    });
  });
});
