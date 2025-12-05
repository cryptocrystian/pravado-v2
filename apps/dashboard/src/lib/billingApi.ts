/**
 * Billing API Client (Sprint S33.2)
 * Frontend API layer for billing and plan management
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Client-side API request (for use in client components)
 * Uses credentials: 'include' to automatically send cookies
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Automatically sends cookies
  });

  return response.json();
}

// Import types from shared packages
// Note: In production, these would come from @pravado/types
// For now, we'll define them locally to match backend

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

export type BillingStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export interface OrgBillingSummaryEnriched {
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
  // S30: Stripe fields
  stripe?: {
    customerId: string | null;
    subscriptionId: string | null;
    subscriptionStatus: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
    trialDaysRemaining: number | null;
  };
  // S31: Overage fields
  overages?: {
    tokens: number;
    playbookRuns: number;
    seats: number;
    estimatedCost: number;
  };
  // S32: Alert fields
  alerts?: {
    unacknowledged: number;
    critical: number;
    warning: number;
    recentAlerts: BillingAlertRecord[];
  };
  // S33: Enriched fields
  daysUntilRenewal: number | null;
  projectedOverageCost: number | null;
  recommendedPlanSlug: string | null;
  nextBillingDate: string | null;
  tokensUsedThisPeriod: number;
  playbookRunsThisPeriod: number;
  seatsUsed: number;
  projectedMonthlyCost: number | null;
  trialDaysRemaining: number | null;
}

export type BillingAlertType =
  | 'usage_soft_warning'
  | 'usage_hard_warning'
  | 'overage_incurred'
  | 'trial_expiring'
  | 'subscription_canceled'
  | 'plan_upgraded'
  | 'plan_downgraded';

export type BillingAlertSeverity = 'info' | 'warning' | 'critical';

export interface BillingAlertRecord {
  id: string;
  orgId: string;
  alertType: BillingAlertType;
  severity: BillingAlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface SwitchPlanResult {
  planId: string;
  billingStatus: BillingStatus;
  message: string;
}

export interface StripePortalSession {
  url: string;
}

export interface CancelSubscriptionResult {
  message: string;
  canceledAt: string;
}

export interface CheckoutSessionResult {
  sessionUrl: string;
  sessionId: string;
}

/**
 * Get enriched billing summary (S33)
 * Includes renewal dates, overage projections, and recommendations
 */
export async function getBillingSummaryEnriched(): Promise<OrgBillingSummaryEnriched | null> {
  const response = await apiRequest<OrgBillingSummaryEnriched>('/api/v1/billing/org/summary', {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get all available billing plans
 */
export async function getAvailablePlans(): Promise<BillingPlan[]> {
  const response = await apiRequest<BillingPlan[]>('/api/v1/billing/plans', {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  return [];
}

/**
 * Get plan details by slug (S33)
 */
export async function getPlanDetails(slug: string): Promise<BillingPlan | null> {
  const response = await apiRequest<BillingPlan>(`/api/v1/billing/plans/${slug}`, {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Switch to a different plan (S33)
 * Throws error if downgrade would violate usage guardrails
 */
export async function switchPlan(targetPlanSlug: string): Promise<ApiResponse<SwitchPlanResult>> {
  return apiRequest<SwitchPlanResult>('/api/v1/billing/org/switch-plan', {
    method: 'POST',
    body: JSON.stringify({ targetPlanSlug }),
  });
}

/**
 * Cancel subscription (S33)
 * @param immediate - If true, cancels immediately. If false, cancels at period end.
 */
export async function cancelSubscription(
  immediate: boolean = false
): Promise<ApiResponse<CancelSubscriptionResult>> {
  return apiRequest<CancelSubscriptionResult>('/api/v1/billing/org/plan/cancel', {
    method: 'POST',
    body: JSON.stringify({ immediate }),
  });
}

/**
 * Resume a canceled subscription
 * Note: This requires updating cancel_at_period_end via Stripe
 */
export async function resumeSubscription(): Promise<ApiResponse<SwitchPlanResult>> {
  // This would call a backend endpoint to update Stripe subscription
  // For now, this is a stub that would need backend implementation
  throw new Error('Resume subscription not yet implemented in backend');
}

/**
 * Create Stripe Checkout session for plan upgrade
 * Redirects user to Stripe hosted checkout
 */
export async function createCheckoutSession(
  planSlug: string
): Promise<ApiResponse<CheckoutSessionResult>> {
  return apiRequest<CheckoutSessionResult>('/api/v1/billing/org/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ planSlug }),
  });
}

/**
 * Open Stripe Customer Portal for payment method management (S33)
 * Returns URL to redirect user to Stripe portal
 */
export async function openPaymentPortal(): Promise<string | null> {
  const response = await apiRequest<StripePortalSession>('/api/v1/billing/org/payment-method', {
    method: 'POST',
  });

  if (response.success && response.data) {
    return response.data.url;
  }

  return null;
}

/**
 * Get usage alerts for organization (S32)
 */
export async function getUsageAlerts(
  unacknowledgedOnly: boolean = false
): Promise<BillingAlertRecord[]> {
  const params = new URLSearchParams();
  if (unacknowledgedOnly) {
    params.append('unacknowledgedOnly', 'true');
  }

  const response = await apiRequest<BillingAlertRecord[]>(
    `/api/v1/billing/org/alerts?${params.toString()}`,
    {
      method: 'GET',
    }
  );

  if (response.success && response.data) {
    return response.data;
  }

  return [];
}

/**
 * Acknowledge a billing alert (S32)
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const response = await apiRequest(`/api/v1/billing/org/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });

  return response.success;
}

/**
 * Helper: Check if user can downgrade to target plan
 * Based on current usage vs target plan limits
 */
export function canDowngradeToPlan(
  summary: OrgBillingSummaryEnriched,
  targetPlan: BillingPlan
): { allowed: boolean; reason?: string } {
  if (!summary.plan) {
    return { allowed: false, reason: 'No current plan' };
  }

  // Check if it's actually a downgrade
  if (targetPlan.monthlyPriceCents >= summary.plan.monthlyPriceCents) {
    return { allowed: true }; // Upgrade or lateral move
  }

  // Check usage limits against target plan
  if (summary.tokensUsed > targetPlan.includedTokensMonthly) {
    return {
      allowed: false,
      reason: `Your current token usage (${summary.tokensUsed.toLocaleString()}) exceeds the ${targetPlan.name} plan limit (${targetPlan.includedTokensMonthly.toLocaleString()})`,
    };
  }

  if (summary.playbookRuns > targetPlan.includedPlaybookRunsMonthly) {
    return {
      allowed: false,
      reason: `Your current playbook runs (${summary.playbookRuns}) exceeds the ${targetPlan.name} plan limit (${targetPlan.includedPlaybookRunsMonthly})`,
    };
  }

  if (summary.seats > targetPlan.includedSeats) {
    return {
      allowed: false,
      reason: `Your current seats (${summary.seats}) exceeds the ${targetPlan.name} plan limit (${targetPlan.includedSeats})`,
    };
  }

  return { allowed: true };
}

/**
 * Helper: Calculate usage percentage
 */
export function calculateUsagePercentage(
  used: number,
  limit: number
): { percentage: number; color: 'green' | 'yellow' | 'red' } {
  if (limit === 0) {
    return { percentage: 0, color: 'green' };
  }

  const percentage = (used / limit) * 100;

  let color: 'green' | 'yellow' | 'red' = 'green';
  if (percentage >= 100) {
    color = 'red';
  } else if (percentage >= 70) {
    color = 'yellow';
  }

  return { percentage: Math.min(percentage, 100), color };
}

/**
 * Helper: Format currency (cents to dollars)
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Helper: Get alert severity badge color
 */
export function getAlertSeverityColor(severity: BillingAlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
}

// ========================================
// S34: INVOICE HISTORY TYPES & API
// ========================================

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  invoiceNumber: string | null;
  amountDue: number;
  amountPaid: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface BillingHistorySummary {
  last12Invoices: Invoice[];
  totalPaid12Mo: number;
  highestInvoice: number;
  averageMonthlyCost: number;
  overageCostsPerInvoice: Record<string, number>;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number | null;
  type: 'plan' | 'overage' | 'discount' | 'proration' | 'tax' | 'other';
}

export interface InvoiceBreakdown {
  planCost: number;
  tokenOverages: number;
  runOverages: number;
  discounts: number;
  prorations: number;
  tax: number;
  subtotal: number;
  total: number;
}

export interface InvoiceDetails {
  invoice: {
    id: string;
    stripeInvoiceId: string;
    invoiceNumber: string | null;
    status: string;
    periodStart: string;
    periodEnd: string;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  };
  breakdown: InvoiceBreakdown;
  lineItems: InvoiceLineItem[];
  usageSnapshot: {
    tokens: number;
    playbookRuns: number;
    seats: number;
  } | null;
  relatedAlerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
}

/**
 * Get billing history (invoice list) (S34)
 * Returns last 12 months of invoices with aggregated metrics
 */
export async function getBillingHistory(): Promise<BillingHistorySummary | null> {
  const response = await apiRequest<BillingHistorySummary>('/api/v1/billing/org/invoices', {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Get detailed invoice breakdown (S34)
 * Returns full invoice details with line items and usage snapshot
 */
export async function getInvoiceDetails(invoiceId: string): Promise<InvoiceDetails | null> {
  const response = await apiRequest<InvoiceDetails>(`/api/v1/billing/org/invoices/${invoiceId}`, {
    method: 'GET',
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
}

/**
 * Manually sync invoices from Stripe (S34)
 * Admin-only feature to refresh invoice cache
 */
export async function syncInvoices(): Promise<ApiResponse<{ message: string; syncedCount: number }>> {
  return apiRequest<{ message: string; syncedCount: number }>('/api/v1/billing/org/invoices/sync', {
    method: 'POST',
  });
}

/**
 * Helper: Get invoice status badge color (S34)
 */
export function getInvoiceStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'green';
    case 'open':
    case 'draft':
      return 'yellow';
    case 'past_due':
    case 'uncollectible':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Helper: Format date range for invoice period (S34)
 */
export function formatInvoicePeriod(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${startStr} - ${endStr}`;
}
