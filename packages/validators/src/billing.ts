/**
 * Billing & Quota Validators (Sprint S28)
 * Zod schemas for billing-related data validation
 */

import { z } from 'zod';

/**
 * Billing status enum
 */
export const billingStatusSchema = z.enum(['trial', 'active', 'past_due', 'canceled']);

/**
 * Billing Plan schema
 */
export const billingPlanSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  monthlyPriceCents: z.number().int().min(0),
  includedTokensMonthly: z.number().int().min(0),
  includedPlaybookRunsMonthly: z.number().int().min(0),
  includedSeats: z.number().int().min(0),
  overageTokenPriceMilliCents: z.number().int().min(0),
  overagePlaybookRunPriceCents: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Org Billing State schema
 */
export const orgBillingStateSchema = z.object({
  orgId: z.string().uuid(),
  planId: z.string().uuid().nullable(),
  billingStatus: billingStatusSchema,
  trialEndsAt: z.string().nullable(),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  softTokenLimitMonthly: z.number().int().positive().nullable(),
  softPlaybookRunLimitMonthly: z.number().int().positive().nullable(),
  softSeatLimit: z.number().int().positive().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Org Billing Usage Monthly schema
 */
export const orgBillingUsageMonthlySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  tokensUsed: z.number().int().min(0),
  playbookRuns: z.number().int().min(0),
  seats: z.number().int().min(0),
  lastCalculatedAt: z.string(),
});

/**
 * Org Billing Summary schema
 */
export const orgBillingSummarySchema = z.object({
  plan: billingPlanSchema.nullable(),
  billingStatus: billingStatusSchema,
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  tokensUsed: z.number().int().min(0),
  playbookRuns: z.number().int().min(0),
  seats: z.number().int().min(0),
  softLimits: z.object({
    tokens: z.number().int().positive().optional(),
    playbookRuns: z.number().int().positive().optional(),
    seats: z.number().int().positive().optional(),
  }),
});

/**
 * Usage Check Result schema
 */
export const usageCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  hardLimitExceeded: z.boolean(),
  softLimitExceeded: z.boolean(),
  usage: z.object({
    tokensUsed: z.number().int().min(0),
    playbookRuns: z.number().int().min(0),
    seats: z.number().int().min(0),
  }),
  limits: z.object({
    tokens: z.number().int().positive().optional(),
    playbookRuns: z.number().int().positive().optional(),
    seats: z.number().int().positive().optional(),
  }),
});

/**
 * Update Usage Options schema
 */
export const updateUsageOptionsSchema = z.object({
  tokensDelta: z.number().int().optional(),
  playbookRunDelta: z.number().int().optional(),
});

/**
 * Check Quota Options schema
 */
export const checkQuotaOptionsSchema = z.object({
  tokensToConsume: z.number().int().min(0).optional(),
  playbookRunsToConsume: z.number().int().min(0).optional(),
});

/**
 * Set Plan Request schema
 */
export const setPlanRequestSchema = z.object({
  planSlug: z.string().min(1),
});

/**
 * ============================================================================
 * OVERAGE BILLING VALIDATORS (Sprint S31)
 * ============================================================================
 */

/**
 * Overage Metric Type schema
 */
export const overageMetricTypeSchema = z.enum(['tokens', 'playbook_runs', 'seats']);

/**
 * Billing Period schema
 */
export const billingPeriodSchema = z.object({
  start: z.string(),
  end: z.string(),
});

/**
 * Overage Rates schema
 */
export const overageRatesSchema = z.object({
  tokens: z.number().min(0), // milli-cents per token
  playbookRuns: z.number().min(0), // cents per run
  seats: z.number().min(0), // cents per seat per month
});

/**
 * Overage Record schema
 */
export const overageRecordSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  metricType: overageMetricTypeSchema,
  amount: z.number().min(0),
  unitPrice: z.number().min(0),
  cost: z.number().min(0),
  billingPeriodStart: z.string(),
  billingPeriodEnd: z.string(),
  createdAt: z.string(),
});

/**
 * Overage Calculation Result schema
 */
export const overageCalculationResultSchema = z.object({
  orgId: z.string().uuid(),
  period: billingPeriodSchema,
  overages: z.object({
    tokens: z.object({
      amount: z.number().min(0),
      unitPrice: z.number().min(0),
      cost: z.number().min(0),
    }),
    playbookRuns: z.object({
      amount: z.number().min(0),
      unitPrice: z.number().min(0),
      cost: z.number().min(0),
    }),
    seats: z.object({
      amount: z.number().min(0),
      unitPrice: z.number().min(0),
      cost: z.number().min(0),
    }),
  }),
  totalCost: z.number().min(0),
});

/**
 * Recalculate Overages Request schema
 */
export const recalculateOveragesRequestSchema = z.object({
  force: z.boolean().optional(),
});

/**
 * ============================================================================
 * BILLING USAGE ALERTS VALIDATORS (Sprint S32)
 * ============================================================================
 */

/**
 * Billing Alert Type schema
 */
export const billingAlertTypeSchema = z.enum([
  'usage_soft_warning',
  'usage_hard_warning',
  'overage_incurred',
  'trial_expiring',
  'subscription_canceled',
  'plan_upgraded',
  'plan_downgraded',
]);

/**
 * Billing Alert Severity schema
 */
export const billingAlertSeveritySchema = z.enum(['info', 'warning', 'critical']);

/**
 * Billing Alert Record schema
 */
export const billingAlertRecordSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  alertType: billingAlertTypeSchema,
  severity: billingAlertSeveritySchema,
  message: z.string().min(1),
  metadata: z.record(z.any()),
  createdAt: z.string(),
  acknowledgedAt: z.string().nullable(),
});

/**
 * Create Billing Alert schema
 */
export const createBillingAlertSchema = z.object({
  orgId: z.string().uuid(),
  alertType: billingAlertTypeSchema,
  severity: billingAlertSeveritySchema,
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

/**
 * List Billing Alerts Query schema
 */
export const listBillingAlertsQuerySchema = z.object({
  unacknowledgedOnly: z.boolean().optional(),
  severity: billingAlertSeveritySchema.optional(),
  alertType: billingAlertTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Acknowledge Alert schema
 */
export const acknowledgeAlertSchema = z.object({
  alertId: z.string().uuid(),
});

/**
 * Billing Alert Summary schema
 */
export const billingAlertSummarySchema = z.object({
  total: z.number().int().min(0),
  unacknowledged: z.number().int().min(0),
  bySeverity: z.object({
    info: z.number().int().min(0),
    warning: z.number().int().min(0),
    critical: z.number().int().min(0),
  }),
  byType: z.object({
    usage_soft_warning: z.number().int().min(0),
    usage_hard_warning: z.number().int().min(0),
    overage_incurred: z.number().int().min(0),
    trial_expiring: z.number().int().min(0),
    subscription_canceled: z.number().int().min(0),
    plan_upgraded: z.number().int().min(0),
    plan_downgraded: z.number().int().min(0),
  }),
});

/**
 * ============================================================================
 * PLAN MANAGEMENT VALIDATORS (Sprint S33)
 * ============================================================================
 */

/**
 * Switch plan request schema (S33)
 * For POST /api/v1/billing/org/switch-plan
 */
export const switchPlanRequestSchema = z.object({
  targetPlanSlug: z.string().min(1, 'Target plan slug is required'),
});

/**
 * Get plan by slug params schema (S33)
 * For GET /api/v1/billing/plans/:slug
 */
export const getPlanBySlugParamsSchema = z.object({
  slug: z.string().min(1, 'Plan slug is required'),
});

/**
 * Cancel plan request schema (S33)
 * For POST /api/v1/billing/org/plan/cancel
 */
export const cancelPlanRequestSchema = z.object({
  immediate: z.boolean().optional().default(false), // false = cancel at period end, true = immediate
});
