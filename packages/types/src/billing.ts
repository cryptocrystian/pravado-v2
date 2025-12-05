/**
 * Billing & Quota Types (Sprint S28)
 * Internal billing primitives and usage tracking
 */

/**
 * Billing status enum
 */
export type BillingStatus = 'trial' | 'active' | 'past_due' | 'canceled';

/**
 * Billing Plan
 * Represents a billing plan tier (starter, growth, enterprise, etc.)
 */
export interface BillingPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number;
  includedTokensMonthly: number;
  includedPlaybookRunsMonthly: number;
  includedSeats: number;
  overageTokenPriceMilliCents: number;
  overagePlaybookRunPriceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Org Billing State
 * Per-org billing status and soft limits
 */
export interface OrgBillingState {
  orgId: string;
  planId: string | null;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  // Soft limits (override plan defaults if set)
  softTokenLimitMonthly: number | null;
  softPlaybookRunLimitMonthly: number | null;
  softSeatLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Org Billing Usage Monthly
 * Usage tracking per org per billing period
 */
export interface OrgBillingUsageMonthly {
  id: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  tokensUsed: number;
  playbookRuns: number;
  seats: number;
  lastCalculatedAt: string;
}

/**
 * Org Billing Summary (DTO)
 * Combined view of plan, state, and usage for frontend
 */
export interface OrgBillingSummary {
  plan: BillingPlan | null;
  billingStatus: BillingStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  tokensUsed: number;
  playbookRuns: number;
  seats: number;
  softLimits: {
    tokens?: number;
    playbookRuns?: number;
    seats?: number;
  };
}

/**
 * Usage Check Result
 * Result of checking if an operation would exceed quotas
 */
export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  hardLimitExceeded: boolean;
  softLimitExceeded: boolean;
  usage: {
    tokensUsed: number;
    playbookRuns: number;
    seats: number;
  };
  limits: {
    tokens?: number;
    playbookRuns?: number;
    seats?: number;
  };
}

/**
 * Update Usage Options
 * Options for updating usage counters
 */
export interface UpdateUsageOptions {
  tokensDelta?: number;
  playbookRunDelta?: number;
}

/**
 * Check Quota Options
 * Options for checking if an operation would exceed quotas
 */
export interface CheckQuotaOptions {
  tokensToConsume?: number;
  playbookRunsToConsume?: number;
}

/**
 * Billing Quota Error Details (Sprint S29)
 * Discriminated error type for quota enforcement
 */
export interface BillingQuotaErrorDetails {
  type: 'quota_exceeded';
  quotaType: 'tokens' | 'playbook_runs' | 'seats';
  currentUsage: number;
  limit: number;
  requested: number;
  billingStatus: BillingStatus;
  planSlug: string;
  periodStart: string | null;
  periodEnd: string | null;
}

/**
 * Billing Quota Error (Sprint S29)
 * Thrown when hard quota limits are exceeded
 */
export class BillingQuotaError extends Error {
  public readonly details: BillingQuotaErrorDetails;
  public readonly httpStatus: number = 402; // Payment Required

  constructor(details: BillingQuotaErrorDetails) {
    const quotaTypeLabel =
      details.quotaType === 'tokens'
        ? 'tokens'
        : details.quotaType === 'playbook_runs'
          ? 'playbook runs'
          : 'seats';

    super(
      `Quota exceeded: Would consume ${details.requested} ${quotaTypeLabel}, ` +
        `but current usage (${details.currentUsage}) + requested (${details.requested}) ` +
        `exceeds limit (${details.limit}) for plan '${details.planSlug}'`
    );

    this.name = 'BillingQuotaError';
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BillingQuotaError.prototype);
  }
}

/**
 * ============================================================================
 * STRIPE INTEGRATION TYPES (Sprint S30)
 * ============================================================================
 */

/**
 * Stripe subscription status
 * Mirrors Stripe's subscription.status field
 */
export type StripeSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

/**
 * Stripe Customer (simplified)
 * Core fields we track from Stripe Customer object
 */
export interface StripeCustomer {
  id: string; // cus_xxx
  email: string | null;
  name: string | null;
  metadata: {
    orgId: string;
  };
  created: number;
}

/**
 * Stripe Subscription (simplified)
 * Core fields we track from Stripe Subscription object
 */
export interface StripeSubscription {
  id: string; // sub_xxx
  customer: string; // cus_xxx
  status: StripeSubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  trialStart: number | null;
  trialEnd: number | null;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  metadata: {
    orgId: string;
    planSlug: string;
  };
}

/**
 * Stripe Checkout Session Create Params
 * Parameters for creating a Stripe Checkout session
 */
export interface StripeCheckoutSessionParams {
  orgId: string;
  planSlug: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  trialPeriodDays?: number;
}

/**
 * Stripe Checkout Session Response
 * Response from creating a checkout session
 */
export interface StripeCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

/**
 * Stripe Webhook Event
 * Simplified webhook event structure
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

/**
 * Enhanced Org Billing Summary with Stripe (S30)
 * Extends S28 summary with Stripe subscription details
 */
export interface OrgBillingSummaryWithStripe extends OrgBillingSummary {
  stripe?: {
    customerId: string | null;
    subscriptionId: string | null;
    subscriptionStatus: StripeSubscriptionStatus | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
    trialDaysRemaining: number | null;
  };
}

/**
 * ============================================================================
 * OVERAGE BILLING TYPES (Sprint S31)
 * ============================================================================
 */

/**
 * Overage Metric Type
 * Types of metrics that can incur overage charges
 */
export type OverageMetricType = 'tokens' | 'playbook_runs' | 'seats';

/**
 * Billing Period
 * Defines a billing period timeframe
 */
export interface BillingPeriod {
  start: string; // ISO date
  end: string; // ISO date
}

/**
 * Overage Rates
 * Pricing configuration for overage charges
 */
export interface OverageRates {
  tokens: number; // Price per token in milli-cents
  playbookRuns: number; // Price per playbook run in cents
  seats: number; // Price per seat per month in cents
}

/**
 * Overage Record
 * Individual overage charge record
 */
export interface OverageRecord {
  id: string;
  orgId: string;
  metricType: OverageMetricType;
  amount: number; // Quantity consumed beyond limits
  unitPrice: number; // Price per unit in cents (or milli-cents for tokens)
  cost: number; // Total cost = amount * unitPrice
  billingPeriodStart: string;
  billingPeriodEnd: string;
  createdAt: string;
}

/**
 * Overage Calculation Result
 * Result of calculating overages for an org
 */
export interface OverageCalculationResult {
  orgId: string;
  period: BillingPeriod;
  overages: {
    tokens: {
      amount: number;
      unitPrice: number;
      cost: number;
    };
    playbookRuns: {
      amount: number;
      unitPrice: number;
      cost: number;
    };
    seats: {
      amount: number;
      unitPrice: number;
      cost: number;
    };
  };
  totalCost: number; // Sum of all overage costs
}

/**
 * Org Billing Usage Monthly Extended (S31)
 * Extends S28 usage with overage tracking
 */
export interface OrgBillingUsageMonthlyExtended extends OrgBillingUsageMonthly {
  overageTokens: number;
  overageRuns: number;
  overageSeats: number;
}

/**
 * Enhanced Org Billing Summary with Overages (S31)
 * Extends S30 summary with overage totals
 */
export interface OrgBillingSummaryWithOverages extends OrgBillingSummaryWithStripe {
  overages?: {
    tokens: number; // Total overage tokens this period
    playbookRuns: number; // Total overage runs this period
    seats: number; // Total overage seats this period
    estimatedCost: number; // Estimated cost in cents
  };
}

/**
 * ============================================================================
 * BILLING USAGE ALERTS TYPES (Sprint S32)
 * ============================================================================
 */

/**
 * Billing Alert Type
 * Types of billing-related alerts
 */
export type BillingAlertType =
  | 'usage_soft_warning' // 80% of soft limit reached
  | 'usage_hard_warning' // 100% of hard limit reached (about to be blocked)
  | 'overage_incurred' // Usage exceeded plan limits
  | 'trial_expiring' // Trial ends in <= 5 days
  | 'subscription_canceled' // Stripe subscription canceled
  | 'plan_upgraded' // Plan tier increased
  | 'plan_downgraded'; // Plan tier decreased

/**
 * Billing Alert Severity
 * Display severity levels for UI
 */
export type BillingAlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Billing Alert Record
 * Individual alert record from database
 */
export interface BillingAlertRecord {
  id: string;
  orgId: string;
  alertType: BillingAlertType;
  severity: BillingAlertSeverity;
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
  acknowledgedAt: string | null;
}

/**
 * Billing Alert Create Input
 * Input for creating a new alert
 */
export interface BillingAlertCreateInput {
  orgId: string;
  alertType: BillingAlertType;
  severity: BillingAlertSeverity;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Billing Alert Summary
 * Grouped alert counts by severity
 */
export interface BillingAlertSummary {
  total: number;
  unacknowledged: number;
  bySeverity: {
    info: number;
    warning: number;
    critical: number;
  };
  byType: {
    usage_soft_warning: number;
    usage_hard_warning: number;
    overage_incurred: number;
    trial_expiring: number;
    subscription_canceled: number;
    plan_upgraded: number;
    plan_downgraded: number;
  };
}

/**
 * Enhanced Org Billing Summary with Alerts (S32)
 * Extends S31 summary with alert information
 */
export interface OrgBillingSummaryWithAlerts extends OrgBillingSummaryWithOverages {
  alerts?: {
    unacknowledged: number;
    critical: number;
    warning: number;
    recentAlerts: BillingAlertRecord[];
  };
}

/**
 * ============================================================================
 * PLAN MANAGEMENT TYPES (Sprint S33)
 * ============================================================================
 */

/**
 * Enhanced Org Billing Summary for Plan Management (S33)
 * Extends S32 summary with plan recommendation and renewal information
 */
export interface OrgBillingSummaryEnriched extends OrgBillingSummaryWithAlerts {
  daysUntilRenewal: number | null; // Days remaining in current billing period
  projectedOverageCost: number | null; // Estimated overage cost in cents for current period
  recommendedPlanSlug: string | null; // Recommended plan for upgrade based on usage
}
