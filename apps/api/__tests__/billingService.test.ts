/**
 * Billing Service Tests (Sprint S28)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../src/services/billingService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData: Record<string, any> = {
    plans: [
      {
        id: 'plan-1',
        slug: 'internal-dev',
        name: 'Internal Dev',
        description: 'Internal development plan',
        monthly_price_cents: 0,
        included_tokens_monthly: 1000000,
        included_playbook_runs_monthly: 1000,
        included_seats: 10,
        overage_token_price_milli_cents: 0,
        overage_playbook_run_price_cents: 0,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'plan-2',
        slug: 'starter',
        name: 'Starter',
        description: 'Starter plan',
        monthly_price_cents: 4900,
        included_tokens_monthly: 500000,
        included_playbook_runs_monthly: 50,
        included_seats: 3,
        overage_token_price_milli_cents: 10,
        overage_playbook_run_price_cents: 100,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    orgBillingState: {},
    usageRecords: {},
  };

  return {
    from: (table: string) => {
      if (table === 'billing_plans') {
        return {
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              eq: (col2: string, val2: any) => ({
                single: async () => ({
                  data: mockData.plans.find((p: any) => p[column] === value && p[col2] === val2),
                  error: null,
                }),
              }),
              single: async () => ({
                data: mockData.plans.find((p: any) => p[column] === value),
                error: null,
              }),
            }),
            single: async () => ({
              data: mockData.plans[0],
              error: null,
            }),
          }),
        };
      }

      if (table === 'org_billing_state') {
        return {
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => ({
                data: mockData.orgBillingState[value] || null,
                error: null,
              }),
            }),
          }),
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const newState = {
                  org_id: data.org_id,
                  plan_id: data.plan_id,
                  billing_status: data.billing_status,
                  trial_ends_at: data.trial_ends_at,
                  current_period_start: data.current_period_start,
                  current_period_end: data.current_period_end,
                  soft_token_limit_monthly: data.soft_token_limit_monthly,
                  soft_playbook_run_limit_monthly: data.soft_playbook_run_limit_monthly,
                  soft_seat_limit: data.soft_seat_limit,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                mockData.orgBillingState[data.org_id] = newState;
                return { data: newState, error: null };
              },
            }),
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              select: () => ({
                single: async () => {
                  if (mockData.orgBillingState[value]) {
                    Object.assign(mockData.orgBillingState[value], data);
                    return { data: mockData.orgBillingState[value], error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                },
              }),
            }),
          }),
        };
      }

      if (table === 'org_billing_usage_monthly') {
        return {
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              eq: (col2: string, val2: any) => ({
                eq: (col3: string, val3: any) => ({
                  single: async () => {
                    const key = `${value}-${val2}-${val3}`;
                    return { data: mockData.usageRecords[key] || null, error: null };
                  },
                }),
              }),
            }),
          }),
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const key = `${data.org_id}-${data.period_start}-${data.period_end}`;
                const newUsage = {
                  id: 'usage-1',
                  org_id: data.org_id,
                  period_start: data.period_start,
                  period_end: data.period_end,
                  tokens_used: data.tokens_used || 0,
                  playbook_runs: data.playbook_runs || 0,
                  seats: data.seats || 0,
                  last_calculated_at: new Date().toISOString(),
                };
                mockData.usageRecords[key] = newUsage;
                return { data: newUsage, error: null };
              },
            }),
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              async single() {
                // For simplicity in tests, update first matching record
                const key = Object.keys(mockData.usageRecords).find((k) =>
                  mockData.usageRecords[k]?.id === value
                );
                if (key) {
                  Object.assign(mockData.usageRecords[key], data);
                  return { data: mockData.usageRecords[key], error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              },
            }),
          }),
        };
      }

      if (table === 'org_members') {
        return {
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              async count() {
                return { count: 2, error: null };
              },
            }),
          }),
        };
      }

      return {};
    },
  } as unknown as SupabaseClient;
};

describe('BillingService', () => {
  let billingService: BillingService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    billingService = new BillingService(mockSupabase, 'internal-dev');
  });

  describe('getDefaultPlan', () => {
    it('should return the default plan', async () => {
      const plan = await billingService.getDefaultPlan();
      expect(plan).toBeDefined();
      expect(plan?.slug).toBe('internal-dev');
    });
  });

  describe('getPlanBySlug', () => {
    it('should return a plan by slug', async () => {
      const plan = await billingService.getPlanBySlug('starter');
      expect(plan).toBeDefined();
      expect(plan?.slug).toBe('starter');
      expect(plan?.name).toBe('Starter');
    });

    it('should return null for non-existent slug', async () => {
      const plan = await billingService.getPlanBySlug('non-existent');
      expect(plan).toBeNull();
    });
  });

  describe('getOrgBillingState', () => {
    it('should return existing billing state', async () => {
      // First call to seed state
      const state1 = await billingService.getOrgBillingState('org-1');
      expect(state1).toBeDefined();
      expect(state1?.orgId).toBe('org-1');
      expect(state1?.billingStatus).toBe('trial');

      // Second call should return the same state
      const state2 = await billingService.getOrgBillingState('org-1');
      expect(state2?.orgId).toBe('org-1');
    });

    it('should auto-seed billing state for new org', async () => {
      const state = await billingService.getOrgBillingState('new-org');
      expect(state).toBeDefined();
      expect(state?.orgId).toBe('new-org');
      expect(state?.billingStatus).toBe('trial');
      expect(state?.planId).toBe('plan-1'); // internal-dev plan
    });
  });

  describe('buildOrgBillingSummary', () => {
    it('should build complete billing summary', async () => {
      // Seed state first
      await billingService.getOrgBillingState('org-1');

      const summary = await billingService.buildOrgBillingSummary('org-1');
      expect(summary).toBeDefined();
      expect(summary?.plan).toBeDefined();
      expect(summary?.plan?.slug).toBe('internal-dev');
      expect(summary?.billingStatus).toBe('trial');
      expect(summary?.tokensUsed).toBe(0);
      expect(summary?.playbookRuns).toBe(0);
      expect(summary?.seats).toBe(2);
    });

    it('should include soft limits in summary', async () => {
      await billingService.getOrgBillingState('org-1');

      const summary = await billingService.buildOrgBillingSummary('org-1');
      expect(summary?.softLimits).toBeDefined();
      expect(summary?.softLimits.tokens).toBe(1000000);
      expect(summary?.softLimits.playbookRuns).toBe(1000);
      expect(summary?.softLimits.seats).toBe(10);
    });
  });

  describe('checkOrgQuota', () => {
    it('should always allow operations in S28 (soft limits only)', async () => {
      await billingService.getOrgBillingState('org-1');

      const result = await billingService.checkOrgQuota('org-1', {
        tokensToConsume: 999999999,
        playbookRunsToConsume: 999999,
      });

      expect(result.allowed).toBe(true);
      expect(result.hardLimitExceeded).toBe(false);
    });

    it('should flag soft limit exceeded', async () => {
      await billingService.getOrgBillingState('org-1');

      const result = await billingService.checkOrgQuota('org-1', {
        tokensToConsume: 2000000, // Exceeds internal-dev limit of 1M
      });

      expect(result.allowed).toBe(true); // Still allowed
      expect(result.softLimitExceeded).toBe(true);
    });
  });

  describe('setOrgPlan', () => {
    it('should update org plan', async () => {
      await billingService.getOrgBillingState('org-1');

      const state = await billingService.setOrgPlan('org-1', 'starter');
      expect(state).toBeDefined();
      expect(state?.planId).toBe('plan-2'); // starter plan ID
    });

    it('should return null for invalid plan slug', async () => {
      const state = await billingService.setOrgPlan('org-1', 'invalid-plan');
      expect(state).toBeNull();
    });
  });

  describe('updateUsageCounters', () => {
    it('should increment token usage', async () => {
      await billingService.getOrgBillingState('org-1');

      // Create usage record by calling updateUsageCounters
      await billingService.updateUsageCounters('org-1', { tokensDelta: 1000 });

      const summary = await billingService.buildOrgBillingSummary('org-1');
      expect(summary?.tokensUsed).toBeGreaterThanOrEqual(1000);
    });

    it('should increment playbook run counter', async () => {
      await billingService.getOrgBillingState('org-1');

      await billingService.updateUsageCounters('org-1', { playbookRunDelta: 1 });

      const summary = await billingService.buildOrgBillingSummary('org-1');
      expect(summary?.playbookRuns).toBeGreaterThanOrEqual(1);
    });
  });
});
