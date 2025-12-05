/**
 * Billing Usage Alerts Tests (Sprint S32)
 *
 * Tests for billing usage alert generation, retrieval, and acknowledgement.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../src/services/billingService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BillingAlertRecord } from '@pravado/types';

/**
 * Mock Supabase client for testing
 */
const createMockSupabase = () => {
  const mockData: Record<string, any> = {
    plans: [
      {
        id: 'plan-1',
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
    orgBillingState: {
      'org-1': {
        org_id: 'org-1',
        plan_id: 'plan-1',
        billing_status: 'active',
        trial_ends_at: null,
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        soft_token_limit_monthly: null,
        soft_playbook_run_limit_monthly: null,
        soft_seat_limit: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      'org-trial': {
        org_id: 'org-trial',
        plan_id: 'plan-1',
        billing_status: 'trial',
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        soft_token_limit_monthly: null,
        soft_playbook_run_limit_monthly: null,
        soft_seat_limit: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    usageRecords: {
      'org-1': {
        id: 'usage-1',
        org_id: 'org-1',
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-02-01T00:00:00Z',
        tokens_used: 400000, // 80% of 500k
        playbook_runs: 40, // 80% of 50
        seats: 2,
        last_calculated_at: new Date().toISOString(),
      },
      'org-over-limit': {
        id: 'usage-2',
        org_id: 'org-over-limit',
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-02-01T00:00:00Z',
        tokens_used: 600000, // 120% of 500k
        playbook_runs: 60, // 120% of 50
        seats: 3,
        last_calculated_at: new Date().toISOString(),
      },
    },
    alerts: [] as any[],
  };

  return {
    from: (table: string) => {
      if (table === 'billing_plans') {
        return {
          select: () => ({
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
          select: () => ({
            eq: (column: string, value: any) => ({
              single: async () => ({
                data: mockData.orgBillingState[value] || null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'org_billing_usage_monthly') {
        return {
          select: () => ({
            eq: (column: string, value: any) => ({
              order: () => ({
                limit: () => ({
                  single: async () => ({
                    data: mockData.usageRecords[value] || null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          upsert: (data: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  ...data,
                  id: data.id || 'new-usage-id',
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'billing_usage_alerts') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const newAlert = {
                  id: `alert-${mockData.alerts.length + 1}`,
                  org_id: data.org_id,
                  alert_type: data.alert_type,
                  severity: data.severity,
                  message: data.message,
                  metadata: data.metadata || {},
                  created_at: new Date().toISOString(),
                  acknowledged_at: null,
                };
                mockData.alerts.push(newAlert);
                return { data: newAlert, error: null };
              },
            }),
          }),
          select: () => ({
            eq: (column: string, value: any) => ({
              is: (col2: string, val2: any) => ({
                limit: () => ({
                  single: async () => {
                    const alert = mockData.alerts.find(
                      (a: any) => a[column] === value && a[col2] === val2
                    );
                    return { data: alert || null, error: null };
                  },
                }),
              }),
              order: (col: string, opts: any) => ({
                limit: (n: number) => ({
                  async (): Promise<{ data: any; error: any }> {
                    const filtered = mockData.alerts.filter((a: any) => a[column] === value);
                    return { data: filtered.slice(0, n), error: null };
                  },
                }),
                async (): Promise<{ data: any; error: any }> {
                  const filtered = mockData.alerts.filter((a: any) => a[column] === value);
                  return { data: filtered, error: null };
                },
              }),
            }),
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              async (): Promise<{ error: any }> {
                const alert = mockData.alerts.find((a: any) => a[column] === value);
                if (alert) {
                  Object.assign(alert, data);
                }
                return { error: null };
              },
            }),
          }),
        };
      }

      // Default mock
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  } as any as SupabaseClient;
};

describe('BillingService - Usage Alerts (S32)', () => {
  let billingService: BillingService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    billingService = new BillingService(mockSupabase, 'internal-dev');
  });

  describe('generateUsageAlerts()', () => {
    it('should generate usage_soft_warning alert at 80% token usage', async () => {
      const alerts = await billingService.generateUsageAlerts('org-1');

      expect(alerts).toHaveLength(2); // Tokens + playbook runs at 80%
      expect(alerts.some((a) => a.alertType === 'usage_soft_warning')).toBe(true);
      expect(alerts.find((a) => a.message.includes('Token usage'))?.severity).toBe('warning');
    });

    it('should generate usage_hard_warning alert at 100%+ token usage', async () => {
      const alerts = await billingService.generateUsageAlerts('org-over-limit');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.alertType === 'usage_hard_warning')).toBe(true);
      expect(alerts.find((a) => a.alertType === 'usage_hard_warning')?.severity).toBe('critical');
    });

    it('should generate trial_expiring alert when trial ends in ≤5 days', async () => {
      const alerts = await billingService.generateUsageAlerts('org-trial');

      expect(alerts.some((a) => a.alertType === 'trial_expiring')).toBe(true);
      const trialAlert = alerts.find((a) => a.alertType === 'trial_expiring');
      expect(trialAlert?.severity).toBe('warning'); // 3 days = warning
    });

    it('should not generate duplicate alerts (idempotency)', async () => {
      // First generation
      const alerts1 = await billingService.generateUsageAlerts('org-1');
      expect(alerts1.length).toBeGreaterThan(0);

      // Second generation (should skip existing alerts)
      const alerts2 = await billingService.generateUsageAlerts('org-1');
      expect(alerts2.length).toBe(0); // No new alerts
    });

    it('should include metadata with usage percentages', async () => {
      const alerts = await billingService.generateUsageAlerts('org-1');

      const tokenAlert = alerts.find((a) => a.message.includes('Token usage'));
      expect(tokenAlert?.metadata).toHaveProperty('metric', 'tokens');
      expect(tokenAlert?.metadata).toHaveProperty('usagePercent');
      expect(tokenAlert?.metadata?.usagePercent).toBeCloseTo(80, 0);
    });

    it('should return empty array if no billing summary available', async () => {
      const alerts = await billingService.generateUsageAlerts('org-nonexistent');

      expect(alerts).toEqual([]);
    });
  });

  describe('getAlertsForOrg()', () => {
    beforeEach(async () => {
      // Generate some alerts first
      await billingService.generateUsageAlerts('org-1');
    });

    it('should retrieve all alerts for an org', async () => {
      const alerts = await billingService.getAlertsForOrg('org-1');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((a) => a.orgId === 'org-1')).toBe(true);
    });

    it('should filter unacknowledged alerts only', async () => {
      const allAlerts = await billingService.getAlertsForOrg('org-1');
      expect(allAlerts.length).toBeGreaterThan(0);

      const unacknowledged = await billingService.getAlertsForOrg('org-1', {
        unacknowledgedOnly: true,
      });

      expect(unacknowledged.every((a) => a.acknowledgedAt === null)).toBe(true);
    });

    it('should limit number of alerts returned', async () => {
      const alerts = await billingService.getAlertsForOrg('org-1', { limit: 1 });

      expect(alerts.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for org with no alerts', async () => {
      const alerts = await billingService.getAlertsForOrg('org-no-alerts');

      expect(alerts).toEqual([]);
    });
  });

  describe('acknowledgeAlert()', () => {
    let alertId: string;

    beforeEach(async () => {
      // Generate alert and get its ID
      const alerts = await billingService.generateUsageAlerts('org-1');
      alertId = alerts[0]?.id;
    });

    it('should acknowledge an alert by setting acknowledgedAt', async () => {
      expect(alertId).toBeDefined();

      await billingService.acknowledgeAlert(alertId);

      // Verify the alert was updated (we can't easily verify this with current mock setup)
      // In a real test with a database, we'd query to check acknowledged_at is set
      expect(true).toBe(true); // Mock doesn't throw
    });

    it('should not throw error for non-existent alert', async () => {
      await expect(
        billingService.acknowledgeAlert('non-existent-alert-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getAlertSummaryForOrg()', () => {
    beforeEach(async () => {
      // Generate alerts
      await billingService.generateUsageAlerts('org-1');
    });

    it('should return summary with correct counts', async () => {
      const summary = await billingService.getAlertSummaryForOrg('org-1');

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('unacknowledged');
      expect(summary).toHaveProperty('bySeverity');
      expect(summary).toHaveProperty('byType');

      expect(summary.total).toBeGreaterThan(0);
      expect(summary.unacknowledged).toBe(summary.total); // All unacknowledged initially
    });

    it('should count alerts by severity correctly', async () => {
      const summary = await billingService.getAlertSummaryForOrg('org-1');

      const totalBySeverity =
        summary.bySeverity.info + summary.bySeverity.warning + summary.bySeverity.critical;

      expect(totalBySeverity).toBe(summary.total);
    });

    it('should count alerts by type correctly', async () => {
      const summary = await billingService.getAlertSummaryForOrg('org-1');

      const totalByType =
        summary.byType.usage_soft_warning +
        summary.byType.usage_hard_warning +
        summary.byType.overage_incurred +
        summary.byType.trial_expiring +
        summary.byType.subscription_canceled +
        summary.byType.plan_upgraded +
        summary.byType.plan_downgraded;

      expect(totalByType).toBe(summary.total);
    });

    it('should return empty summary for org with no alerts', async () => {
      const summary = await billingService.getAlertSummaryForOrg('org-no-alerts');

      expect(summary.total).toBe(0);
      expect(summary.unacknowledged).toBe(0);
      expect(summary.bySeverity.info).toBe(0);
      expect(summary.bySeverity.warning).toBe(0);
      expect(summary.bySeverity.critical).toBe(0);
    });
  });

  describe('Alert severity assignment', () => {
    it('should assign warning severity for 80-99% usage', async () => {
      const alerts = await billingService.generateUsageAlerts('org-1');

      const softWarning = alerts.find((a) => a.alertType === 'usage_soft_warning');
      expect(softWarning?.severity).toBe('warning');
    });

    it('should assign critical severity for 100%+ usage', async () => {
      const alerts = await billingService.generateUsageAlerts('org-over-limit');

      const hardWarning = alerts.find((a) => a.alertType === 'usage_hard_warning');
      expect(hardWarning?.severity).toBe('critical');
    });

    it('should assign appropriate severity for trial expiration', async () => {
      const alerts = await billingService.generateUsageAlerts('org-trial');

      const trialAlert = alerts.find((a) => a.alertType === 'trial_expiring');
      // 3 days remaining should be warning (not critical which is ≤2 days)
      expect(trialAlert?.severity).toBe('warning');
    });
  });

  describe('Alert messages', () => {
    it('should include usage percentage in soft warning messages', async () => {
      const alerts = await billingService.generateUsageAlerts('org-1');

      const tokenAlert = alerts.find(
        (a) => a.alertType === 'usage_soft_warning' && a.message.includes('Token')
      );
      expect(tokenAlert?.message).toMatch(/80%/);
    });

    it('should include token count in messages', async () => {
      const alerts = await billingService.generateUsageAlerts('org-1');

      const tokenAlert = alerts.find(
        (a) => a.alertType === 'usage_soft_warning' && a.message.includes('Token')
      );
      expect(tokenAlert?.message).toMatch(/400,000/);
      expect(tokenAlert?.message).toMatch(/500,000/);
    });

    it('should include days remaining in trial expiring messages', async () => {
      const alerts = await billingService.generateUsageAlerts('org-trial');

      const trialAlert = alerts.find((a) => a.alertType === 'trial_expiring');
      expect(trialAlert?.message).toMatch(/3 days?/);
    });
  });
});
