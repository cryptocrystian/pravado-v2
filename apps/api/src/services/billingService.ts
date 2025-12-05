/**
 * Billing Service (Sprint S28)
 * Core billing logic for plans, usage tracking, and quota checking
 */

import { FLAGS } from '@pravado/feature-flags';
import type {
  BillingAlertCreateInput,
  BillingAlertRecord,
  BillingAlertSummary,
  BillingPlan,
  CheckQuotaOptions,
  OrgBillingState,
  OrgBillingSummary,
  OrgBillingSummaryEnriched,
  OrgBillingSummaryWithStripe,
  OrgBillingUsageMonthly,
  OverageCalculationResult,
  UpdateUsageOptions,
  UsageCheckResult,
} from '@pravado/types';
import { BillingQuotaError } from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { StripeService } from './stripeService';

const logger = createLogger('billing-service');

/**
 * Billing Service
 * Handles all billing-related operations
 */
export class BillingService {
  constructor(
    private supabase: SupabaseClient,
    private defaultPlanSlug: string = 'internal-dev',
    private stripeService?: StripeService
  ) {}

  /**
   * Get the default billing plan
   */
  async getDefaultPlan(): Promise<BillingPlan | null> {
    try {
      const { data, error } = await this.supabase
        .from('billing_plans')
        .select('*')
        .eq('slug', this.defaultPlanSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Failed to fetch default plan', { error, slug: this.defaultPlanSlug });
        return null;
      }

      return this.mapPlanFromDb(data);
    } catch (error) {
      logger.error('Error fetching default plan', { error });
      return null;
    }
  }

  /**
   * List all active billing plans
   */
  async listPlans(): Promise<BillingPlan[]> {
    try {
      const { data, error } = await this.supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price_cents', { ascending: true });

      if (error) {
        logger.error('Failed to list plans', { error });
        return [];
      }

      return (data || []).map(this.mapPlanFromDb);
    } catch (error) {
      logger.error('Error listing plans', { error });
      return [];
    }
  }

  /**
   * Get plan by slug
   */
  async getPlanBySlug(slug: string): Promise<BillingPlan | null> {
    try {
      const { data, error } = await this.supabase
        .from('billing_plans')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Failed to fetch plan by slug', { error, slug });
        return null;
      }

      return this.mapPlanFromDb(data);
    } catch (error) {
      logger.error('Error fetching plan by slug', { error, slug });
      return null;
    }
  }

  /**
   * Get org billing state
   * If no state exists, seeds a default state with the default plan
   */
  async getOrgBillingState(orgId: string): Promise<OrgBillingState | null> {
    try {
      // Try to fetch existing state
      const { data, error } = await this.supabase
        .from('org_billing_state')
        .select('*')
        .eq('org_id', orgId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        logger.error('Failed to fetch org billing state', { error, orgId });
        return null;
      }

      // If exists, return it
      if (data) {
        return this.mapBillingStateFromDb(data);
      }

      // Otherwise, seed a default state
      logger.info('Seeding default billing state for org', { orgId });
      return await this.seedOrgBillingState(orgId);
    } catch (error) {
      logger.error('Error getting org billing state', { error, orgId });
      return null;
    }
  }

  /**
   * Seed org billing state with default plan
   */
  private async seedOrgBillingState(orgId: string): Promise<OrgBillingState | null> {
    try {
      const defaultPlan = await this.getDefaultPlan();
      if (!defaultPlan) {
        logger.error('Cannot seed billing state: no default plan found', { orgId });
        return null;
      }

      // Calculate trial end date (30 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      // Calculate current period (first day of this month to first day of next month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data, error } = await this.supabase
        .from('org_billing_state')
        .insert({
          org_id: orgId,
          plan_id: defaultPlan.id,
          billing_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to seed org billing state', { error, orgId });
        return null;
      }

      return this.mapBillingStateFromDb(data);
    } catch (error) {
      logger.error('Error seeding org billing state', { error, orgId });
      return null;
    }
  }

  /**
   * Get org usage for current billing period
   */
  async getOrgUsageForCurrentPeriod(orgId: string): Promise<OrgBillingUsageMonthly | null> {
    try {
      // Get billing state to determine current period
      const billingState = await this.getOrgBillingState(orgId);
      if (!billingState) {
        logger.error('Cannot get usage: no billing state', { orgId });
        return null;
      }

      // Determine period boundaries
      let periodStart: Date;
      let periodEnd: Date;

      if (billingState.currentPeriodStart && billingState.currentPeriodEnd) {
        periodStart = new Date(billingState.currentPeriodStart);
        periodEnd = new Date(billingState.currentPeriodEnd);
      } else {
        // Fall back to simple monthly period (first day of month to first day of next month)
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Try to fetch existing usage record
      const { data, error } = await this.supabase
        .from('org_billing_usage_monthly')
        .select('*')
        .eq('org_id', orgId)
        .eq('period_start', periodStart.toISOString())
        .eq('period_end', periodEnd.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch org usage', { error, orgId });
        return null;
      }

      // If exists, calculate current seats and return
      if (data) {
        // Update seats count from org_members
        const seats = await this.getOrgSeatsCount(orgId);
        const { data: updated } = await this.supabase
          .from('org_billing_usage_monthly')
          .update({
            seats,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', data.id)
          .select()
          .single();

        return this.mapUsageFromDb(updated || data);
      }

      // Otherwise, create a new usage record
      const seats = await this.getOrgSeatsCount(orgId);
      const { data: newUsage, error: insertError } = await this.supabase
        .from('org_billing_usage_monthly')
        .insert({
          org_id: orgId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_used: 0,
          playbook_runs: 0,
          seats,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create org usage record', { error: insertError, orgId });
        return null;
      }

      return this.mapUsageFromDb(newUsage);
    } catch (error) {
      logger.error('Error getting org usage for current period', { error, orgId });
      return null;
    }
  }

  /**
   * Get current seat count for an org
   */
  private async getOrgSeatsCount(orgId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

      if (error) {
        logger.warn('Failed to count org seats', { error, orgId });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error counting org seats', { error, orgId });
      return 0;
    }
  }

  /**
   * Update usage counters (best-effort, non-blocking)
   */
  async updateUsageCounters(orgId: string, opts: UpdateUsageOptions): Promise<void> {
    try {
      const usage = await this.getOrgUsageForCurrentPeriod(orgId);
      if (!usage) {
        logger.warn('Cannot update usage counters: no usage record', { orgId });
        return;
      }

      const updates: Record<string, unknown> = {
        last_calculated_at: new Date().toISOString(),
      };

      if (opts.tokensDelta !== undefined && opts.tokensDelta !== 0) {
        updates.tokens_used = usage.tokensUsed + opts.tokensDelta;
      }

      if (opts.playbookRunDelta !== undefined && opts.playbookRunDelta !== 0) {
        updates.playbook_runs = usage.playbookRuns + opts.playbookRunDelta;
      }

      const { error } = await this.supabase
        .from('org_billing_usage_monthly')
        .update(updates)
        .eq('id', usage.id);

      if (error) {
        logger.warn('Failed to update usage counters', { error, orgId, opts });
      } else {
        logger.debug('Updated usage counters', { orgId, updates });
      }
    } catch (error) {
      logger.error('Error updating usage counters', { error, orgId, opts });
    }
  }

  /**
   * Build org billing summary (combines plan, state, usage)
   * S30: Enhanced to include Stripe subscription metadata
   */
  async buildOrgBillingSummary(orgId: string): Promise<OrgBillingSummaryWithStripe | null> {
    try {
      const [billingState, usage] = await Promise.all([
        this.getOrgBillingState(orgId),
        this.getOrgUsageForCurrentPeriod(orgId),
      ]);

      if (!billingState || !usage) {
        logger.error('Cannot build billing summary: missing state or usage', { orgId });
        return null;
      }

      // Fetch plan details if planId is set
      let plan: BillingPlan | null = null;
      if (billingState.planId) {
        const { data, error } = await this.supabase
          .from('billing_plans')
          .select('*')
          .eq('id', billingState.planId)
          .single();

        if (!error && data) {
          plan = this.mapPlanFromDb(data);
        }
      }

      // Build soft limits (from org_billing_state overrides or plan defaults)
      const softLimits: OrgBillingSummary['softLimits'] = {};

      if (billingState.softTokenLimitMonthly !== null) {
        softLimits.tokens = billingState.softTokenLimitMonthly;
      } else if (plan) {
        softLimits.tokens = plan.includedTokensMonthly;
      }

      if (billingState.softPlaybookRunLimitMonthly !== null) {
        softLimits.playbookRuns = billingState.softPlaybookRunLimitMonthly;
      } else if (plan) {
        softLimits.playbookRuns = plan.includedPlaybookRunsMonthly;
      }

      if (billingState.softSeatLimit !== null) {
        softLimits.seats = billingState.softSeatLimit;
      } else if (plan) {
        softLimits.seats = plan.includedSeats;
      }

      // S30: Fetch raw billing state data for Stripe metadata
      const { data: rawBillingState } = await this.supabase
        .from('org_billing_state')
        .select('*')
        .eq('org_id', orgId)
        .single();

      const stripeMetadata = rawBillingState
        ? this.buildStripeMetadata(rawBillingState)
        : undefined;

      return {
        plan,
        billingStatus: billingState.billingStatus,
        currentPeriodStart: billingState.currentPeriodStart,
        currentPeriodEnd: billingState.currentPeriodEnd,
        tokensUsed: usage.tokensUsed,
        playbookRuns: usage.playbookRuns,
        seats: usage.seats,
        softLimits,
        stripe: stripeMetadata,
      };
    } catch (error) {
      logger.error('Error building org billing summary', { error, orgId });
      return null;
    }
  }

  /**
   * Build Stripe metadata from billing state (S30)
   */
  private buildStripeMetadata(billingState: any): OrgBillingSummaryWithStripe['stripe'] {
    // If no Stripe customer ID, return undefined
    if (!billingState.stripe_customer_id) {
      return undefined;
    }

    // Calculate trial days remaining
    let trialDaysRemaining: number | null = null;
    if (billingState.trial_ends_at) {
      const trialEnd = new Date(billingState.trial_ends_at);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, daysRemaining);
    }

    return {
      customerId: billingState.stripe_customer_id,
      subscriptionId: billingState.stripe_subscription_id || null,
      subscriptionStatus: billingState.subscription_status || null,
      trialEndsAt: billingState.trial_ends_at || null,
      cancelAtPeriodEnd: billingState.cancel_at_period_end || false,
      trialDaysRemaining,
    };
  }

  /**
   * Check org quota (soft limits only, never hard-blocks)
   */
  async checkOrgQuota(orgId: string, opts: CheckQuotaOptions): Promise<UsageCheckResult> {
    try {
      const summary = await this.buildOrgBillingSummary(orgId);
      if (!summary) {
        // If we can't get billing info, allow by default (graceful degradation)
        logger.warn('Cannot check quota: no billing summary', { orgId });
        return {
          allowed: true,
          reason: 'Billing data unavailable',
          hardLimitExceeded: false,
          softLimitExceeded: false,
          usage: { tokensUsed: 0, playbookRuns: 0, seats: 0 },
          limits: {},
        };
      }

      // Calculate projected usage
      const projectedTokens = summary.tokensUsed + (opts.tokensToConsume || 0);
      const projectedRuns = summary.playbookRuns + (opts.playbookRunsToConsume || 0);

      // Check soft limits
      let softLimitExceeded = false;
      const reasons: string[] = [];

      if (summary.softLimits.tokens && projectedTokens > summary.softLimits.tokens) {
        softLimitExceeded = true;
        reasons.push(
          `Token usage (${projectedTokens}) would exceed soft limit (${summary.softLimits.tokens})`
        );
      }

      if (
        summary.softLimits.playbookRuns &&
        projectedRuns > summary.softLimits.playbookRuns
      ) {
        softLimitExceeded = true;
        reasons.push(
          `Playbook run usage (${projectedRuns}) would exceed soft limit (${summary.softLimits.playbookRuns})`
        );
      }

      if (summary.softLimits.seats && summary.seats > summary.softLimits.seats) {
        softLimitExceeded = true;
        reasons.push(
          `Seat count (${summary.seats}) exceeds soft limit (${summary.softLimits.seats})`
        );
      }

      // For S28: Always allow, just flag soft limit exceeded
      return {
        allowed: true, // Never hard-block in S28
        reason: reasons.length > 0 ? reasons.join('; ') : undefined,
        hardLimitExceeded: false, // No hard limits in S28
        softLimitExceeded,
        usage: {
          tokensUsed: summary.tokensUsed,
          playbookRuns: summary.playbookRuns,
          seats: summary.seats,
        },
        limits: summary.softLimits,
      };
    } catch (error) {
      logger.error('Error checking org quota', { error, orgId, opts });
      // On error, allow by default (graceful degradation)
      return {
        allowed: true,
        reason: 'Quota check failed',
        hardLimitExceeded: false,
        softLimitExceeded: false,
        usage: { tokensUsed: 0, playbookRuns: 0, seats: 0 },
        limits: {},
      };
    }
  }

  /**
   * Enforce org quota (Sprint S29: Hard limits)
   * Throws BillingQuotaError if hard limits are exceeded
   *
   * @throws {BillingQuotaError} When quota would be exceeded and ENABLE_BILLING_HARD_LIMITS is true
   */
  async enforceOrgQuotaOrThrow(orgId: string, opts: CheckQuotaOptions): Promise<void> {
    // Skip enforcement if feature flag is disabled
    if (!FLAGS.ENABLE_BILLING_HARD_LIMITS) {
      logger.debug('Hard quota enforcement disabled by feature flag', { orgId });
      return;
    }

    try {
      const summary = await this.buildOrgBillingSummary(orgId);
      if (!summary) {
        // If we can't get billing info, allow by default (graceful degradation)
        logger.warn('Cannot enforce quota: no billing summary', { orgId });
        return;
      }

      // Calculate projected usage
      const tokensToConsume = opts.tokensToConsume || 0;
      const playbookRunsToConsume = opts.playbookRunsToConsume || 0;
      const projectedTokens = summary.tokensUsed + tokensToConsume;
      const projectedRuns = summary.playbookRuns + playbookRunsToConsume;

      // Check token limits
      if (summary.softLimits.tokens && projectedTokens > summary.softLimits.tokens) {
        logger.warn('Token quota exceeded', {
          orgId,
          currentUsage: summary.tokensUsed,
          requested: tokensToConsume,
          limit: summary.softLimits.tokens,
          projected: projectedTokens,
        });

        const error = new BillingQuotaError({
          type: 'quota_exceeded',
          quotaType: 'tokens',
          currentUsage: summary.tokensUsed,
          limit: summary.softLimits.tokens,
          requested: tokensToConsume,
          billingStatus: summary.billingStatus,
          planSlug: summary.plan?.slug || 'unknown',
          periodStart: summary.currentPeriodStart,
          periodEnd: summary.currentPeriodEnd,
        });

        // S30: Enhance error message with upgrade URL
        error.message = `${error.message}. Upgrade at /app/billing to continue.`;
        throw error;
      }

      // Check playbook run limits
      if (
        summary.softLimits.playbookRuns &&
        projectedRuns > summary.softLimits.playbookRuns
      ) {
        logger.warn('Playbook run quota exceeded', {
          orgId,
          currentUsage: summary.playbookRuns,
          requested: playbookRunsToConsume,
          limit: summary.softLimits.playbookRuns,
          projected: projectedRuns,
        });

        const error = new BillingQuotaError({
          type: 'quota_exceeded',
          quotaType: 'playbook_runs',
          currentUsage: summary.playbookRuns,
          limit: summary.softLimits.playbookRuns,
          requested: playbookRunsToConsume,
          billingStatus: summary.billingStatus,
          planSlug: summary.plan?.slug || 'unknown',
          periodStart: summary.currentPeriodStart,
          periodEnd: summary.currentPeriodEnd,
        });

        // S30: Enhance error message with upgrade URL
        error.message = `${error.message}. Upgrade at /app/billing to continue.`;
        throw error;
      }

      // Check seat limits (current, not projected)
      if (summary.softLimits.seats && summary.seats > summary.softLimits.seats) {
        logger.warn('Seat quota exceeded', {
          orgId,
          currentSeats: summary.seats,
          limit: summary.softLimits.seats,
        });

        const error = new BillingQuotaError({
          type: 'quota_exceeded',
          quotaType: 'seats',
          currentUsage: summary.seats,
          limit: summary.softLimits.seats,
          requested: 0,
          billingStatus: summary.billingStatus,
          planSlug: summary.plan?.slug || 'unknown',
          periodStart: summary.currentPeriodStart,
          periodEnd: summary.currentPeriodEnd,
        });

        // S30: Enhance error message with upgrade URL
        error.message = `${error.message}. Upgrade at /app/billing to continue.`;
        throw error;
      }

      logger.debug('Quota check passed', {
        orgId,
        projectedTokens,
        projectedRuns,
        limits: summary.softLimits,
      });
    } catch (error) {
      // Re-throw BillingQuotaError
      if (error instanceof BillingQuotaError) {
        throw error;
      }

      // For other errors, log and allow by default (graceful degradation)
      logger.error('Error enforcing org quota', { error, orgId, opts });
    }
  }

  /**
   * Set org's billing plan
   * S30: Enhanced to create Stripe subscriptions for paid plans
   */
  async setOrgPlan(
    orgId: string,
    planSlug: string,
    opts?: {
      priceId?: string;
      trialPeriodDays?: number;
    }
  ): Promise<OrgBillingState | null> {
    try {
      const plan = await this.getPlanBySlug(planSlug);
      if (!plan) {
        logger.error('Cannot set org plan: plan not found', { orgId, planSlug });
        return null;
      }

      // Ensure billing state exists
      await this.getOrgBillingState(orgId);

      // S30: If this is a paid plan and Stripe is enabled, create Stripe subscription
      const isPaidPlan = plan.monthlyPriceCents > 0;
      if (isPaidPlan && FLAGS.ENABLE_STRIPE_BILLING && this.stripeService) {
        logger.info('Creating Stripe subscription for paid plan', { orgId, planSlug });

        try {
          // Ensure Stripe customer exists
          await this.stripeService.getOrCreateStripeCustomer(orgId);

          // Create Stripe subscription if priceId is provided
          if (opts?.priceId) {
            const subscriptionId = await this.stripeService.createSubscription(
              orgId,
              opts.priceId,
              planSlug,
              opts.trialPeriodDays
            );

            logger.info('Created Stripe subscription', { orgId, planSlug, subscriptionId });

            // Update billing state with subscription info
            // (webhook will update status, but we set initial values here)
            const { data, error } = await this.supabase
              .from('org_billing_state')
              .update({
                plan_id: plan.id,
                stripe_subscription_id: subscriptionId,
                subscription_status: opts.trialPeriodDays ? 'trialing' : 'active',
                billing_status: opts.trialPeriodDays ? 'trial' : 'active',
              })
              .eq('org_id', orgId)
              .select()
              .single();

            if (error) {
              logger.error('Failed to update org plan with Stripe subscription', {
                error,
                orgId,
                planSlug,
              });
              return null;
            }

            return this.mapBillingStateFromDb(data);
          } else {
            logger.warn('Paid plan upgrade requested but no priceId provided', { orgId, planSlug });
          }
        } catch (stripeError) {
          logger.error('Failed to create Stripe subscription', {
            error: stripeError,
            orgId,
            planSlug,
          });
          // Don't fail the entire operation - continue with plan update
        }
      }

      // Update plan (without Stripe subscription)
      const { data, error } = await this.supabase
        .from('org_billing_state')
        .update({ plan_id: plan.id })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to set org plan', { error, orgId, planSlug });
        return null;
      }

      return this.mapBillingStateFromDb(data);
    } catch (error) {
      logger.error('Error setting org plan', { error, orgId, planSlug });
      return null;
    }
  }

  /**
   * Map billing plan from database row to TypeScript type
   */
  private mapPlanFromDb(data: any): BillingPlan {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      monthlyPriceCents: data.monthly_price_cents,
      includedTokensMonthly: data.included_tokens_monthly,
      includedPlaybookRunsMonthly: data.included_playbook_runs_monthly,
      includedSeats: data.included_seats,
      overageTokenPriceMilliCents: data.overage_token_price_milli_cents,
      overagePlaybookRunPriceCents: data.overage_playbook_run_price_cents,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map billing state from database row to TypeScript type
   */
  private mapBillingStateFromDb(data: any): OrgBillingState {
    return {
      orgId: data.org_id,
      planId: data.plan_id,
      billingStatus: data.billing_status,
      trialEndsAt: data.trial_ends_at,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      softTokenLimitMonthly: data.soft_token_limit_monthly,
      softPlaybookRunLimitMonthly: data.soft_playbook_run_limit_monthly,
      softSeatLimit: data.soft_seat_limit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map usage from database row to TypeScript type
   */
  private mapUsageFromDb(data: any): OrgBillingUsageMonthly {
    return {
      id: data.id,
      orgId: data.org_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      tokensUsed: data.tokens_used,
      playbookRuns: data.playbook_runs,
      seats: data.seats,
      lastCalculatedAt: data.last_calculated_at,
    };
  }

  // ========================================
  // S31: OVERAGE BILLING METHODS
  // ========================================

  /**
   * Calculate overages for an org based on current usage vs plan limits (S31)
   * Formula: overage = max(0, usage - limit)
   * Cost = overage × unitPrice
   */
  async calculateOveragesForOrg(orgId: string): Promise<OverageCalculationResult | null> {
    if (!FLAGS.ENABLE_OVERAGE_BILLING) {
      logger.debug('Overage billing disabled', { orgId });
      return null;
    }

    try {
      logger.info('Calculating overages for org', { orgId });

      // Get billing summary (includes usage and plan limits)
      const summary = await this.buildOrgBillingSummary(orgId);

      if (!summary) {
        logger.warn('No billing summary found for org', { orgId });
        return null;
      }

      if (!summary.plan) {
        logger.warn('No plan found for org, cannot calculate overages', { orgId });
        return null;
      }

      const { plan, tokensUsed, playbookRuns, seats, currentPeriodStart, currentPeriodEnd } = summary;

      // Calculate overage amounts
      const tokenLimit = summary.softLimits.tokens ?? plan.includedTokensMonthly;
      const runLimit = summary.softLimits.playbookRuns ?? plan.includedPlaybookRunsMonthly;
      const seatLimit = summary.softLimits.seats ?? plan.includedSeats;

      const tokenOverage = Math.max(0, tokensUsed - tokenLimit);
      const runOverage = Math.max(0, playbookRuns - runLimit);
      const seatOverage = Math.max(0, seats - seatLimit);

      // Get overage rates from plan
      const tokenUnitPrice = plan.overageTokenPriceMilliCents;
      const runUnitPrice = plan.overagePlaybookRunPriceCents;
      const seatUnitPrice = 0; // S31: Seat overages not priced yet (stub)

      // Calculate costs
      const tokenCost = (tokenOverage * tokenUnitPrice) / 1000; // Convert milli-cents to cents
      const runCost = runOverage * runUnitPrice;
      const seatCost = seatOverage * seatUnitPrice;

      const totalCost = tokenCost + runCost + seatCost;

      const result: OverageCalculationResult = {
        orgId,
        period: {
          start: currentPeriodStart || new Date().toISOString(),
          end: currentPeriodEnd || new Date().toISOString(),
        },
        overages: {
          tokens: {
            amount: tokenOverage,
            unitPrice: tokenUnitPrice,
            cost: tokenCost,
          },
          playbookRuns: {
            amount: runOverage,
            unitPrice: runUnitPrice,
            cost: runCost,
          },
          seats: {
            amount: seatOverage,
            unitPrice: seatUnitPrice,
            cost: seatCost,
          },
        },
        totalCost,
      };

      logger.info('Calculated overages', {
        orgId,
        tokenOverage,
        runOverage,
        seatOverage,
        totalCost,
      });

      return result;
    } catch (error) {
      logger.error('Failed to calculate overages', { error, orgId });
      throw error;
    }
  }

  /**
   * Record calculated overages to database (S31)
   * Inserts into org_billing_overages and updates org_billing_usage_monthly
   */
  async recordOverages(orgId: string, calculation: OverageCalculationResult): Promise<void> {
    if (!FLAGS.ENABLE_OVERAGE_BILLING) {
      logger.debug('Overage billing disabled, skipping record', { orgId });
      return;
    }

    try {
      logger.info('Recording overages for org', {
        orgId,
        totalCost: calculation.totalCost,
      });

      // Prepare overage records to insert
      const records: Array<{
        org_id: string;
        metric_type: 'tokens' | 'playbook_runs' | 'seats';
        amount: number;
        unit_price: number;
        cost: number;
        billing_period_start: string;
        billing_period_end: string;
      }> = [];

      // Add token overage if any
      if (calculation.overages.tokens.amount > 0) {
        records.push({
          org_id: orgId,
          metric_type: 'tokens',
          amount: calculation.overages.tokens.amount,
          unit_price: calculation.overages.tokens.unitPrice,
          cost: calculation.overages.tokens.cost,
          billing_period_start: calculation.period.start,
          billing_period_end: calculation.period.end,
        });
      }

      // Add playbook run overage if any
      if (calculation.overages.playbookRuns.amount > 0) {
        records.push({
          org_id: orgId,
          metric_type: 'playbook_runs',
          amount: calculation.overages.playbookRuns.amount,
          unit_price: calculation.overages.playbookRuns.unitPrice,
          cost: calculation.overages.playbookRuns.cost,
          billing_period_start: calculation.period.start,
          billing_period_end: calculation.period.end,
        });
      }

      // Add seat overage if any
      if (calculation.overages.seats.amount > 0) {
        records.push({
          org_id: orgId,
          metric_type: 'seats',
          amount: calculation.overages.seats.amount,
          unit_price: calculation.overages.seats.unitPrice,
          cost: calculation.overages.seats.cost,
          billing_period_start: calculation.period.start,
          billing_period_end: calculation.period.end,
        });
      }

      // Insert overage records
      if (records.length > 0) {
        const { error: insertError } = await this.supabase
          .from('org_billing_overages')
          .insert(records);

        if (insertError) {
          logger.error('Failed to insert overage records', { error: insertError, orgId });
          throw insertError;
        }

        logger.info('Inserted overage records', { orgId, count: records.length });
      }

      // Update org_billing_usage_monthly with overage totals
      const { error: updateError } = await this.supabase
        .from('org_billing_usage_monthly')
        .update({
          overage_tokens: calculation.overages.tokens.amount,
          overage_runs: calculation.overages.playbookRuns.amount,
          overage_seats: calculation.overages.seats.amount,
        })
        .eq('org_id', orgId)
        .eq('period_start', calculation.period.start)
        .eq('period_end', calculation.period.end);

      if (updateError) {
        logger.error('Failed to update usage with overages', { error: updateError, orgId });
        throw updateError;
      }

      logger.info('Recorded overages successfully', { orgId });
    } catch (error) {
      logger.error('Failed to record overages', { error, orgId });
      throw error;
    }
  }

  /**
   * Get overage summary for current billing period (S31)
   * Aggregates all overage records for the org's current period
   */
  async getOverageSummaryForOrg(orgId: string): Promise<OverageCalculationResult | null> {
    if (!FLAGS.ENABLE_OVERAGE_BILLING) {
      logger.debug('Overage billing disabled', { orgId });
      return null;
    }

    try {
      logger.info('Getting overage summary for org', { orgId });

      // Get current billing period from org_billing_state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('current_period_start, current_period_end')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.current_period_start || !billingState?.current_period_end) {
        logger.warn('No current billing period found for org', { orgId });
        return null;
      }

      const periodStart = billingState.current_period_start;
      const periodEnd = billingState.current_period_end;

      // Query all overage records for this period
      const { data: overageRecords, error } = await this.supabase
        .from('org_billing_overages')
        .select('*')
        .eq('org_id', orgId)
        .eq('billing_period_start', periodStart)
        .eq('billing_period_end', periodEnd);

      if (error) {
        logger.error('Failed to fetch overage records', { error, orgId });
        throw error;
      }

      // Aggregate by metric type
      const tokenRecords = overageRecords?.filter((r) => r.metric_type === 'tokens') || [];
      const runRecords = overageRecords?.filter((r) => r.metric_type === 'playbook_runs') || [];
      const seatRecords = overageRecords?.filter((r) => r.metric_type === 'seats') || [];

      const tokenAmount = tokenRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const tokenCost = tokenRecords.reduce((sum, r) => sum + Number(r.cost), 0);
      const tokenUnitPrice = tokenRecords[0]?.unit_price ? Number(tokenRecords[0].unit_price) : 0;

      const runAmount = runRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const runCost = runRecords.reduce((sum, r) => sum + Number(r.cost), 0);
      const runUnitPrice = runRecords[0]?.unit_price ? Number(runRecords[0].unit_price) : 0;

      const seatAmount = seatRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const seatCost = seatRecords.reduce((sum, r) => sum + Number(r.cost), 0);
      const seatUnitPrice = seatRecords[0]?.unit_price ? Number(seatRecords[0].unit_price) : 0;

      const totalCost = tokenCost + runCost + seatCost;

      const result: OverageCalculationResult = {
        orgId,
        period: {
          start: periodStart,
          end: periodEnd,
        },
        overages: {
          tokens: {
            amount: tokenAmount,
            unitPrice: tokenUnitPrice,
            cost: tokenCost,
          },
          playbookRuns: {
            amount: runAmount,
            unitPrice: runUnitPrice,
            cost: runCost,
          },
          seats: {
            amount: seatAmount,
            unitPrice: seatUnitPrice,
            cost: seatCost,
          },
        },
        totalCost,
      };

      logger.info('Retrieved overage summary', { orgId, totalCost });

      return result;
    } catch (error) {
      logger.error('Failed to get overage summary', { error, orgId });
      throw error;
    }
  }

  // ========================================
  // S32: BILLING USAGE ALERTS METHODS
  // ========================================

  /**
   * Generate usage alerts for an org based on current usage (S32)
   * Called after usage updates, quota checks, and overage calculations
   */
  async generateUsageAlerts(orgId: string): Promise<BillingAlertRecord[]> {
    if (!FLAGS.ENABLE_USAGE_ALERTS) {
      logger.debug('Usage alerts disabled', { orgId });
      return [];
    }

    try {
      logger.info('Generating usage alerts for org', { orgId });

      const alertsToCreate: BillingAlertCreateInput[] = [];

      // Get billing summary
      const summary = await this.buildOrgBillingSummary(orgId);

      if (!summary || !summary.plan) {
        logger.warn('No billing summary or plan for org, skipping alerts', { orgId });
        return [];
      }

      const { plan, tokensUsed, playbookRuns, softLimits, billingStatus } = summary;

      // Token usage alerts
      const tokenLimit = softLimits.tokens ?? plan.includedTokensMonthly;
      const tokenUsagePercent = tokenLimit > 0 ? (tokensUsed / tokenLimit) * 100 : 0;

      if (tokenUsagePercent >= 80 && tokenUsagePercent < 100) {
        // Check if alert already exists (idempotency)
        const existingAlert = await this.checkExistingAlert(orgId, 'usage_soft_warning');
        if (!existingAlert) {
          alertsToCreate.push({
            orgId,
            alertType: 'usage_soft_warning',
            severity: 'warning',
            message: `Token usage at ${tokenUsagePercent.toFixed(0)}% (${tokensUsed.toLocaleString()} of ${tokenLimit.toLocaleString()})`,
            metadata: {
              metric: 'tokens',
              usagePercent: tokenUsagePercent,
              currentUsage: tokensUsed,
              limit: tokenLimit,
            },
          });
        }
      }

      if (tokenUsagePercent >= 100) {
        const existingAlert = await this.checkExistingAlert(orgId, 'usage_hard_warning');
        if (!existingAlert) {
          alertsToCreate.push({
            orgId,
            alertType: 'usage_hard_warning',
            severity: 'critical',
            message: `Token usage limit reached (${tokensUsed.toLocaleString()} tokens used)`,
            metadata: {
              metric: 'tokens',
              usagePercent: tokenUsagePercent,
              currentUsage: tokensUsed,
              limit: tokenLimit,
            },
          });
        }
      }

      // Playbook run usage alerts
      const runLimit = softLimits.playbookRuns ?? plan.includedPlaybookRunsMonthly;
      const runUsagePercent = runLimit > 0 ? (playbookRuns / runLimit) * 100 : 0;

      if (runUsagePercent >= 80 && runUsagePercent < 100) {
        const existingAlert = await this.checkExistingAlert(orgId, 'usage_soft_warning');
        if (!existingAlert) {
          alertsToCreate.push({
            orgId,
            alertType: 'usage_soft_warning',
            severity: 'warning',
            message: `Playbook run usage at ${runUsagePercent.toFixed(0)}% (${playbookRuns} of ${runLimit})`,
            metadata: {
              metric: 'playbook_runs',
              usagePercent: runUsagePercent,
              currentUsage: playbookRuns,
              limit: runLimit,
            },
          });
        }
      }

      // Check for trial expiring (if trial status and within 5 days)
      if (billingStatus === 'trial' && summary.stripe?.trialDaysRemaining) {
        if (summary.stripe.trialDaysRemaining <= 5) {
          const existingAlert = await this.checkExistingAlert(orgId, 'trial_expiring');
          if (!existingAlert) {
            alertsToCreate.push({
              orgId,
              alertType: 'trial_expiring',
              severity: summary.stripe.trialDaysRemaining <= 2 ? 'critical' : 'warning',
              message: `Trial expires in ${summary.stripe.trialDaysRemaining} day${summary.stripe.trialDaysRemaining === 1 ? '' : 's'}`,
              metadata: {
                daysRemaining: summary.stripe.trialDaysRemaining,
                trialEndsAt: summary.stripe?.trialEndsAt,
              },
            });
          }
        }
      }

      // Create alert records
      const createdAlerts: BillingAlertRecord[] = [];

      for (const alertInput of alertsToCreate) {
        const { data, error } = await this.supabase
          .from('billing_usage_alerts')
          .insert({
            org_id: alertInput.orgId,
            alert_type: alertInput.alertType,
            severity: alertInput.severity,
            message: alertInput.message,
            metadata: alertInput.metadata || {},
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to insert alert', { error, alertInput });
          continue;
        }

        createdAlerts.push(this.mapAlertFromDb(data));
      }

      logger.info('Generated usage alerts', { orgId, count: createdAlerts.length });

      return createdAlerts;
    } catch (error) {
      logger.error('Failed to generate usage alerts', { error, orgId });
      // Non-blocking: return empty array on error
      return [];
    }
  }

  /**
   * Get all alerts for an org (S32)
   */
  async getAlertsForOrg(
    orgId: string,
    options?: {
      unacknowledgedOnly?: boolean;
      limit?: number;
    }
  ): Promise<BillingAlertRecord[]> {
    if (!FLAGS.ENABLE_USAGE_ALERTS) {
      logger.debug('Usage alerts disabled', { orgId });
      return [];
    }

    try {
      let query = this.supabase
        .from('billing_usage_alerts')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (options?.unacknowledgedOnly) {
        query = query.is('acknowledged_at', null);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch alerts', { error, orgId });
        throw error;
      }

      return (data || []).map((alert) => this.mapAlertFromDb(alert));
    } catch (error) {
      logger.error('Failed to get alerts for org', { error, orgId });
      throw error;
    }
  }

  /**
   * Acknowledge an alert (S32)
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    if (!FLAGS.ENABLE_USAGE_ALERTS) {
      logger.debug('Usage alerts disabled', { alertId });
      return;
    }

    try {
      const { error } = await this.supabase
        .from('billing_usage_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) {
        logger.error('Failed to acknowledge alert', { error, alertId });
        throw error;
      }

      logger.info('Acknowledged alert', { alertId });
    } catch (error) {
      logger.error('Failed to acknowledge alert', { error, alertId });
      throw error;
    }
  }

  /**
   * Get alert summary for an org (S32)
   */
  async getAlertSummaryForOrg(orgId: string): Promise<BillingAlertSummary> {
    if (!FLAGS.ENABLE_USAGE_ALERTS) {
      return this.getEmptyAlertSummary();
    }

    try {
      const { data, error } = await this.supabase
        .from('billing_usage_alerts')
        .select('*')
        .eq('org_id', orgId);

      if (error) {
        logger.error('Failed to fetch alerts for summary', { error, orgId });
        return this.getEmptyAlertSummary();
      }

      const alerts = (data || []).map((alert) => this.mapAlertFromDb(alert));

      const summary: BillingAlertSummary = {
        total: alerts.length,
        unacknowledged: alerts.filter((a) => !a.acknowledgedAt).length,
        bySeverity: {
          info: alerts.filter((a) => a.severity === 'info').length,
          warning: alerts.filter((a) => a.severity === 'warning').length,
          critical: alerts.filter((a) => a.severity === 'critical').length,
        },
        byType: {
          usage_soft_warning: alerts.filter((a) => a.alertType === 'usage_soft_warning').length,
          usage_hard_warning: alerts.filter((a) => a.alertType === 'usage_hard_warning').length,
          overage_incurred: alerts.filter((a) => a.alertType === 'overage_incurred').length,
          trial_expiring: alerts.filter((a) => a.alertType === 'trial_expiring').length,
          subscription_canceled: alerts.filter((a) => a.alertType === 'subscription_canceled')
            .length,
          plan_upgraded: alerts.filter((a) => a.alertType === 'plan_upgraded').length,
          plan_downgraded: alerts.filter((a) => a.alertType === 'plan_downgraded').length,
        },
      };

      return summary;
    } catch (error) {
      logger.error('Failed to get alert summary', { error, orgId });
      return this.getEmptyAlertSummary();
    }
  }

  // ========================================
  // S32: PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if an alert of a given type already exists for the org (S32)
   */
  private async checkExistingAlert(
    orgId: string,
    alertType: string
  ): Promise<BillingAlertRecord | null> {
    const { data } = await this.supabase
      .from('billing_usage_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('alert_type', alertType)
      .is('acknowledged_at', null)
      .limit(1)
      .single();

    return data ? this.mapAlertFromDb(data) : null;
  }

  /**
   * Map alert from database row to TypeScript type (S32)
   */
  private mapAlertFromDb(data: any): BillingAlertRecord {
    return {
      id: data.id,
      orgId: data.org_id,
      alertType: data.alert_type,
      severity: data.severity,
      message: data.message,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      acknowledgedAt: data.acknowledged_at,
    };
  }

  /**
   * Get empty alert summary (S32)
   */
  private getEmptyAlertSummary(): BillingAlertSummary {
    return {
      total: 0,
      unacknowledged: 0,
      bySeverity: {
        info: 0,
        warning: 0,
        critical: 0,
      },
      byType: {
        usage_soft_warning: 0,
        usage_hard_warning: 0,
        overage_incurred: 0,
        trial_expiring: 0,
        subscription_canceled: 0,
        plan_upgraded: 0,
        plan_downgraded: 0,
      },
    };
  }

  // ========================================
  // S33: PLAN MANAGEMENT METHODS
  // ========================================

  /**
   * Switch org to a different plan (S33)
   * Validates transition, prevents downgrades when over quota, integrates with Stripe
   *
   * @throws {BillingQuotaError} When downgrade would violate new plan limits
   */
  async switchOrgPlan(
    orgId: string,
    targetPlanSlug: string
  ): Promise<OrgBillingState | null> {
    try {
      logger.info('Switching org plan', { orgId, targetPlanSlug });

      // Get current billing state and summary
      const [currentState, currentSummary, targetPlan] = await Promise.all([
        this.getOrgBillingState(orgId),
        this.buildOrgBillingSummary(orgId),
        this.getPlanBySlug(targetPlanSlug),
      ]);

      if (!currentState || !currentSummary || !targetPlan) {
        logger.error('Cannot switch plan: missing required data', {
          orgId,
          targetPlanSlug,
          hasState: !!currentState,
          hasSummary: !!currentSummary,
          hasTargetPlan: !!targetPlan,
        });
        return null;
      }

      const currentPlan = currentSummary.plan;

      // Determine if this is an upgrade or downgrade
      const isUpgrade = targetPlan.monthlyPriceCents > (currentPlan?.monthlyPriceCents || 0);
      const isDowngrade = !isUpgrade && targetPlan.slug !== currentPlan?.slug;

      // For downgrades, check if current usage would exceed new plan limits
      if (isDowngrade) {
        const wouldExceedTokens = targetPlan.includedTokensMonthly < currentSummary.tokensUsed;
        const wouldExceedRuns =
          targetPlan.includedPlaybookRunsMonthly < currentSummary.playbookRuns;
        const wouldExceedSeats = targetPlan.includedSeats < currentSummary.seats;

        if (wouldExceedTokens || wouldExceedRuns || wouldExceedSeats) {
          const reasons: string[] = [];
          if (wouldExceedTokens) {
            reasons.push(
              `Current token usage (${currentSummary.tokensUsed}) exceeds ${targetPlan.name} limit (${targetPlan.includedTokensMonthly})`
            );
          }
          if (wouldExceedRuns) {
            reasons.push(
              `Current playbook runs (${currentSummary.playbookRuns}) exceed ${targetPlan.name} limit (${targetPlan.includedPlaybookRunsMonthly})`
            );
          }
          if (wouldExceedSeats) {
            reasons.push(
              `Current seats (${currentSummary.seats}) exceed ${targetPlan.name} limit (${targetPlan.includedSeats})`
            );
          }

          logger.warn('Downgrade blocked: usage exceeds target plan limits', {
            orgId,
            currentPlan: currentPlan?.slug,
            targetPlan: targetPlan.slug,
            reasons,
          });

          throw new BillingQuotaError({
            type: 'quota_exceeded',
            quotaType: 'tokens', // Use first exceeded metric
            currentUsage: currentSummary.tokensUsed,
            limit: targetPlan.includedTokensMonthly,
            requested: 0,
            billingStatus: currentSummary.billingStatus,
            planSlug: currentPlan?.slug || 'unknown',
            periodStart: currentSummary.currentPeriodStart,
            periodEnd: currentSummary.currentPeriodEnd,
          });
        }
      }

      // If switching to a paid plan and Stripe is enabled, use StripeService
      const isPaidPlan = targetPlan.monthlyPriceCents > 0;
      if (isPaidPlan && FLAGS.ENABLE_STRIPE_BILLING && this.stripeService) {
        logger.info('Switching Stripe subscription', { orgId, targetPlanSlug });

        try {
          await this.stripeService.switchSubscriptionPlan(orgId, targetPlan.slug);

          // Stripe webhook will update billing state
          // Return the updated state
          const updatedState = await this.getOrgBillingState(orgId);

          // Generate alert for plan change
          await this.generatePlanChangeAlert(
            orgId,
            currentPlan?.slug,
            targetPlan.slug,
            isUpgrade
          );

          return updatedState;
        } catch (stripeError) {
          logger.error('Failed to switch Stripe subscription', {
            error: stripeError,
            orgId,
            targetPlanSlug,
          });
          throw stripeError;
        }
      }

      // For free plans or when Stripe is disabled, update directly
      const { data, error } = await this.supabase
        .from('org_billing_state')
        .update({
          plan_id: targetPlan.id,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update org billing state', { error, orgId, targetPlanSlug });
        return null;
      }

      // Generate alert for plan change
      await this.generatePlanChangeAlert(
        orgId,
        currentPlan?.slug,
        targetPlan.slug,
        isUpgrade
      );

      logger.info('Successfully switched plan', {
        orgId,
        fromPlan: currentPlan?.slug,
        toPlan: targetPlan.slug,
        isUpgrade,
      });

      return this.mapBillingStateFromDb(data);
    } catch (error) {
      logger.error('Error switching org plan', { error, orgId, targetPlanSlug });
      throw error;
    }
  }

  /**
   * Get plan recommendations based on usage patterns (S33)
   * Returns recommended plan slug for upsell nudges
   */
  async getPlanRecommendations(orgId: string): Promise<string | null> {
    try {
      logger.debug('Getting plan recommendations', { orgId });

      const summary = await this.buildOrgBillingSummary(orgId);
      if (!summary || !summary.plan) {
        return null;
      }

      const currentPlan = summary.plan;

      // If already on enterprise plan, no recommendations
      if (currentPlan.slug === 'enterprise') {
        return null;
      }

      // Get all plans ordered by price
      const allPlans = await this.listPlans();
      const currentPlanIndex = allPlans.findIndex((p) => p.slug === currentPlan.slug);
      const nextPlan = allPlans[currentPlanIndex + 1];

      if (!nextPlan) {
        return null; // No higher plan available
      }

      // Recommendation logic:
      // 1. Usage > 80% of current plan limit
      const tokenLimit = summary.softLimits.tokens ?? currentPlan.includedTokensMonthly;
      const runLimit = summary.softLimits.playbookRuns ?? currentPlan.includedPlaybookRunsMonthly;
      const tokenUsagePercent = tokenLimit > 0 ? (summary.tokensUsed / tokenLimit) * 100 : 0;
      const runUsagePercent = runLimit > 0 ? (summary.playbookRuns / runLimit) * 100 : 0;

      if (tokenUsagePercent > 80 || runUsagePercent > 80) {
        logger.info('Recommending upgrade due to high usage', {
          orgId,
          currentPlan: currentPlan.slug,
          recommendedPlan: nextPlan.slug,
          tokenUsagePercent,
          runUsagePercent,
        });
        return nextPlan.slug;
      }

      // 2. Active critical alerts
      if (FLAGS.ENABLE_USAGE_ALERTS) {
        const alertSummary = await this.getAlertSummaryForOrg(orgId);
        if (alertSummary.bySeverity.critical > 0) {
          logger.info('Recommending upgrade due to critical alerts', {
            orgId,
            currentPlan: currentPlan.slug,
            recommendedPlan: nextPlan.slug,
            criticalAlerts: alertSummary.bySeverity.critical,
          });
          return nextPlan.slug;
        }
      }

      // 3. Overage costs > $50/month
      if (FLAGS.ENABLE_OVERAGE_BILLING) {
        const overageSummary = await this.getOverageSummaryForOrg(orgId);
        if (overageSummary && overageSummary.totalCost > 5000) {
          // 5000 cents = $50
          logger.info('Recommending upgrade due to high overage costs', {
            orgId,
            currentPlan: currentPlan.slug,
            recommendedPlan: nextPlan.slug,
            overageCostCents: overageSummary.totalCost,
          });
          return nextPlan.slug;
        }
      }

      return null; // No recommendation
    } catch (error) {
      logger.error('Error getting plan recommendations', { error, orgId });
      return null;
    }
  }

  /**
   * Build enriched org billing summary (S33)
   * Extends S32 summary with plan recommendation and renewal information
   */
  async buildOrgBillingSummaryEnriched(
    orgId: string
  ): Promise<OrgBillingSummaryEnriched | null> {
    try {
      // Get base summary
      const baseSummary = await this.buildOrgBillingSummary(orgId);
      if (!baseSummary) {
        return null;
      }

      // Calculate days until renewal
      let daysUntilRenewal: number | null = null;
      if (baseSummary.currentPeriodEnd) {
        const periodEnd = new Date(baseSummary.currentPeriodEnd);
        const now = new Date();
        const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysUntilRenewal = Math.max(0, daysRemaining);
      }

      // Calculate projected overage cost
      let projectedOverageCost: number | null = null;
      if (FLAGS.ENABLE_OVERAGE_BILLING) {
        const overageSummary = await this.getOverageSummaryForOrg(orgId);
        if (overageSummary) {
          projectedOverageCost = overageSummary.totalCost;
        }
      }

      // Get plan recommendation
      const recommendedPlanSlug = await this.getPlanRecommendations(orgId);

      return {
        ...baseSummary,
        daysUntilRenewal,
        projectedOverageCost,
        recommendedPlanSlug,
      };
    } catch (error) {
      logger.error('Error building enriched billing summary', { error, orgId });
      return null;
    }
  }

  // ========================================
  // S33: PRIVATE HELPER METHODS
  // ========================================

  /**
   * Generate alert for plan change (S33 helper)
   */
  private async generatePlanChangeAlert(
    orgId: string,
    fromPlanSlug: string | undefined,
    toPlanSlug: string,
    isUpgrade: boolean
  ): Promise<void> {
    if (!FLAGS.ENABLE_USAGE_ALERTS) {
      return;
    }

    try {
      const alertType = isUpgrade ? 'plan_upgraded' : 'plan_downgraded';
      const severity = isUpgrade ? 'info' : 'warning';
      const message = isUpgrade
        ? `Plan upgraded from ${fromPlanSlug || 'trial'} to ${toPlanSlug}`
        : `Plan downgraded from ${fromPlanSlug} to ${toPlanSlug}`;

      await this.supabase.from('billing_usage_alerts').insert({
        org_id: orgId,
        alert_type: alertType,
        severity,
        message,
        metadata: {
          fromPlan: fromPlanSlug,
          toPlan: toPlanSlug,
        },
      });

      logger.info('Created plan change alert', { orgId, alertType });
    } catch (error) {
      logger.warn('Failed to create plan change alert', { error, orgId });
      // Non-blocking
    }
  }

  // ========================================
  // S34: INVOICE HISTORY & BREAKDOWN
  // ========================================

  /**
   * Get billing history summary for an organization (S34)
   * Returns summary of last 12 months of invoices with aggregated metrics
   *
   * @param orgId - Organization ID
   * @returns Billing history summary with invoice metrics
   */
  async getBillingHistorySummary(orgId: string): Promise<{
    last12Invoices: Array<{
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
    }>;
    totalPaid12Mo: number;
    highestInvoice: number;
    averageMonthlyCost: number;
    overageCostsPerInvoice: Record<string, number>;
  }> {
    logger.info('Getting billing history summary', { orgId });

    try {
      // Query cached invoices from org_invoice_cache
      const { data: invoices, error } = await this.supabase
        .from('org_invoice_cache')
        .select('*')
        .eq('org_id', orgId)
        .order('period_start', { ascending: false })
        .limit(12);

      if (error) {
        logger.error('Failed to query invoice cache', { error, orgId });
        throw error;
      }

      // Transform to response format
      const last12Invoices = (invoices || []).map((inv) => ({
        id: inv.id,
        stripeInvoiceId: inv.stripe_invoice_id,
        invoiceNumber: inv.invoice_number,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        status: inv.status,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      }));

      // Calculate aggregate metrics
      const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || [];
      const totalPaid12Mo = paidInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
      const highestInvoice = Math.max(...(invoices?.map((inv) => inv.amount_due) || [0]));
      const averageMonthlyCost = paidInvoices.length > 0
        ? totalPaid12Mo / paidInvoices.length
        : 0;

      // Calculate overage costs per invoice (from metadata)
      const overageCostsPerInvoice: Record<string, number> = {};
      for (const invoice of invoices || []) {
        if (invoice.metadata && typeof invoice.metadata === 'object') {
          const metadata = invoice.metadata as any;
          const lines = metadata.lines || [];

          // Sum up overage line items
          let overageCost = 0;
          for (const line of lines) {
            if (line.description &&
                (line.description.includes('overage') ||
                 line.description.includes('Overage') ||
                 line.description.includes('usage'))) {
              overageCost += line.amount || 0;
            }
          }

          if (overageCost > 0) {
            overageCostsPerInvoice[invoice.stripe_invoice_id] = overageCost;
          }
        }
      }

      logger.info('Built billing history summary', {
        orgId,
        invoiceCount: last12Invoices.length,
        totalPaid12Mo,
      });

      return {
        last12Invoices,
        totalPaid12Mo,
        highestInvoice,
        averageMonthlyCost,
        overageCostsPerInvoice,
      };
    } catch (error) {
      logger.error('Error getting billing history summary', { error, orgId });
      throw error;
    }
  }

  /**
   * Get detailed invoice breakdown with line items (S34)
   * Returns full breakdown of an invoice including plan costs, overages, and adjustments
   *
   * @param orgId - Organization ID
   * @param invoiceId - Invoice ID (from org_invoice_cache, NOT Stripe ID)
   * @returns Detailed invoice breakdown
   */
  async getInvoiceWithBreakdown(orgId: string, invoiceId: string): Promise<{
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
    breakdown: {
      planCost: number;
      tokenOverages: number;
      runOverages: number;
      discounts: number;
      prorations: number;
      tax: number;
      subtotal: number;
      total: number;
    };
    lineItems: Array<{
      description: string;
      amount: number;
      quantity: number | null;
      type: 'plan' | 'overage' | 'discount' | 'proration' | 'tax' | 'other';
    }>;
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
  }> {
    logger.info('Getting invoice with breakdown', { orgId, invoiceId });

    try {
      // Get invoice from cache
      const { data: invoice, error: invError } = await this.supabase
        .from('org_invoice_cache')
        .select('*')
        .eq('id', invoiceId)
        .eq('org_id', orgId)
        .single();

      if (invError || !invoice) {
        logger.error('Invoice not found in cache', { error: invError, orgId, invoiceId });
        throw new Error('Invoice not found');
      }

      // Parse metadata for line items
      const metadata = (invoice.metadata || {}) as any;
      const lines = metadata.lines || [];

      // Initialize breakdown
      const breakdown = {
        planCost: 0,
        tokenOverages: 0,
        runOverages: 0,
        discounts: 0,
        prorations: 0,
        tax: metadata.tax || 0,
        subtotal: metadata.subtotal || 0,
        total: metadata.total || invoice.amount_due,
      };

      // Parse line items and categorize
      const lineItems: Array<{
        description: string;
        amount: number;
        quantity: number | null;
        type: 'plan' | 'overage' | 'discount' | 'proration' | 'tax' | 'other';
      }> = [];

      for (const line of lines) {
        const description = line.description || 'Unknown';
        const amount = line.amount || 0;
        const quantity = line.quantity || null;

        // Categorize line item
        let type: 'plan' | 'overage' | 'discount' | 'proration' | 'tax' | 'other' = 'other';

        if (description.toLowerCase().includes('subscription') ||
            description.toLowerCase().includes('plan')) {
          type = 'plan';
          breakdown.planCost += amount;
        } else if (description.toLowerCase().includes('token') &&
                   description.toLowerCase().includes('overage')) {
          type = 'overage';
          breakdown.tokenOverages += amount;
        } else if (description.toLowerCase().includes('run') &&
                   description.toLowerCase().includes('overage')) {
          type = 'overage';
          breakdown.runOverages += amount;
        } else if (description.toLowerCase().includes('proration')) {
          type = 'proration';
          breakdown.prorations += amount;
        } else if (description.toLowerCase().includes('discount')) {
          type = 'discount';
          breakdown.discounts += Math.abs(amount); // Discounts are typically negative
        } else if (description.toLowerCase().includes('tax')) {
          type = 'tax';
        }

        lineItems.push({
          description,
          amount,
          quantity,
          type,
        });
      }

      // Get usage snapshot for the invoice period
      const usageSnapshot = await this.getUsageSnapshotForPeriod(
        orgId,
        invoice.period_start,
        invoice.period_end
      );

      // Get related alerts from the same period
      const { data: alerts } = await this.supabase
        .from('billing_usage_alerts')
        .select('id, alert_type, severity, message, created_at')
        .eq('org_id', orgId)
        .gte('created_at', invoice.period_start)
        .lte('created_at', invoice.period_end)
        .order('created_at', { ascending: false });

      const relatedAlerts = (alerts || []).map((alert) => ({
        id: alert.id,
        alertType: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        createdAt: alert.created_at,
      }));

      logger.info('Built invoice breakdown', {
        orgId,
        invoiceId,
        lineItemCount: lineItems.length,
        alertCount: relatedAlerts.length,
      });

      return {
        invoice: {
          id: invoice.id,
          stripeInvoiceId: invoice.stripe_invoice_id,
          invoiceNumber: invoice.invoice_number,
          status: invoice.status,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        },
        breakdown,
        lineItems,
        usageSnapshot,
        relatedAlerts,
      };
    } catch (error) {
      logger.error('Error getting invoice breakdown', { error, orgId, invoiceId });
      throw error;
    }
  }

  /**
   * Get usage snapshot for a specific billing period (S34 helper)
   * Retrieves usage metrics for tokens, runs, and seats during the period
   *
   * @param orgId - Organization ID
   * @param periodStart - Period start date
   * @param periodEnd - Period end date
   * @returns Usage snapshot or null if not available
   */
  private async getUsageSnapshotForPeriod(
    orgId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{
    tokens: number;
    playbookRuns: number;
    seats: number;
  } | null> {
    try {
      // Get usage tracking data for the period
      const { data: usageData } = await this.supabase
        .from('org_usage_tracking')
        .select('resource_type, amount_used')
        .eq('org_id', orgId)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd);

      if (!usageData || usageData.length === 0) {
        return null;
      }

      // Aggregate usage by resource type
      const usage = {
        tokens: 0,
        playbookRuns: 0,
        seats: 0,
      };

      for (const record of usageData) {
        if (record.resource_type === 'tokens') {
          usage.tokens += record.amount_used || 0;
        } else if (record.resource_type === 'playbook_runs') {
          usage.playbookRuns += record.amount_used || 0;
        } else if (record.resource_type === 'seats') {
          usage.seats = Math.max(usage.seats, record.amount_used || 0); // Max seats used
        }
      }

      return usage;
    } catch (error) {
      logger.warn('Failed to get usage snapshot for period', {
        error,
        orgId,
        periodStart,
        periodEnd,
      });
      return null;
    }
  }
}
