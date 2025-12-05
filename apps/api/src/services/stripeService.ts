/**
 * Stripe Service (Sprint S30)
 * Handles Stripe customer management, subscriptions, and webhook processing
 */


import { FLAGS } from '@pravado/feature-flags';
import type {
  StripeCheckoutSessionParams,
  StripeCheckoutSessionResponse,
  StripeSubscriptionStatus,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const logger = createLogger('stripe-service');

export class StripeService {
  private stripe: Stripe | null = null;
  private webhookSecret: string | null = null;

  constructor(
    private supabase: SupabaseClient,
    stripeSecretKey?: string,
    webhookSecret?: string
  ) {
    // S30: Initialize Stripe only if feature flag is enabled and keys are provided
    if (FLAGS.ENABLE_STRIPE_BILLING && stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
        typescript: true,
      });
      this.webhookSecret = webhookSecret || null;

      logger.info('StripeService initialized', {
        webhookConfigured: !!this.webhookSecret,
      });
    } else {
      logger.warn('StripeService disabled', {
        featureFlag: FLAGS.ENABLE_STRIPE_BILLING,
        keyProvided: !!stripeSecretKey,
      });
    }
  }

  /**
   * Check if Stripe is enabled and configured
   */
  private ensureStripeEnabled(): void {
    if (!this.stripe) {
      throw new Error('Stripe is not enabled or configured');
    }
  }

  // ========================================
  // CUSTOMER HANDLING
  // ========================================

  /**
   * Create a Stripe customer for an org
   */
  async createStripeCustomerForOrg(orgId: string, email?: string): Promise<string> {
    this.ensureStripeEnabled();

    logger.info('Creating Stripe customer for org', { orgId, email });

    try {
      const customer = await this.stripe!.customers.create({
        email: email || undefined,
        metadata: {
          orgId,
        },
      });

      logger.info('Created Stripe customer', { orgId, customerId: customer.id });
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, orgId });
      throw error;
    }
  }

  /**
   * Get or create Stripe customer for an org
   * Checks org_billing_state first, creates if not exists
   */
  async getOrCreateStripeCustomer(orgId: string, email?: string): Promise<string> {
    this.ensureStripeEnabled();

    // Check if org already has a Stripe customer
    const { data: billingState } = await this.supabase
      .from('org_billing_state')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    if (billingState?.stripe_customer_id) {
      logger.debug('Org already has Stripe customer', {
        orgId,
        customerId: billingState.stripe_customer_id,
      });
      return billingState.stripe_customer_id;
    }

    // Create new customer
    const customerId = await this.createStripeCustomerForOrg(orgId, email);

    // Update org_billing_state with customer ID
    const { error } = await this.supabase
      .from('org_billing_state')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to save Stripe customer ID to billing state', {
        error,
        orgId,
        customerId,
      });
    }

    return customerId;
  }

  // ========================================
  // SUBSCRIPTION HANDLING
  // ========================================

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    params: StripeCheckoutSessionParams
  ): Promise<StripeCheckoutSessionResponse> {
    this.ensureStripeEnabled();

    logger.info('Creating Stripe checkout session', { orgId: params.orgId, planSlug: params.planSlug });

    try {
      // Get or create customer
      const customerId = await this.getOrCreateStripeCustomer(params.orgId, params.customerEmail);

      // Create checkout session
      const session = await this.stripe!.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          metadata: {
            orgId: params.orgId,
            planSlug: params.planSlug,
          },
          trial_period_days: params.trialPeriodDays,
        },
        metadata: {
          orgId: params.orgId,
          planSlug: params.planSlug,
        },
      });

      logger.info('Created checkout session', {
        orgId: params.orgId,
        sessionId: session.id,
        url: session.url,
      });

      if (!session.url) {
        throw new Error('Checkout session URL is null');
      }

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      logger.error('Failed to create checkout session', { error, params });
      throw error;
    }
  }

  /**
   * Create a subscription directly (for testing or internal use)
   */
  async createSubscription(
    orgId: string,
    priceId: string,
    planSlug: string,
    trialPeriodDays?: number
  ): Promise<string> {
    this.ensureStripeEnabled();

    logger.info('Creating Stripe subscription', { orgId, planSlug });

    try {
      const customerId = await this.getOrCreateStripeCustomer(orgId);

      const subscription = await this.stripe!.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        metadata: {
          orgId,
          planSlug,
        },
      });

      logger.info('Created subscription', { orgId, subscriptionId: subscription.id });
      return subscription.id;
    } catch (error) {
      logger.error('Failed to create subscription', { error, orgId });
      throw error;
    }
  }

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscription(orgId: string, atPeriodEnd: boolean = true): Promise<void> {
    this.ensureStripeEnabled();

    logger.info('Canceling subscription', { orgId, atPeriodEnd });

    try {
      // Get subscription ID from billing state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('stripe_subscription_id')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.stripe_subscription_id) {
        throw new Error('No active subscription found for org');
      }

      if (atPeriodEnd) {
        // Cancel at period end
        await this.stripe!.subscriptions.update(billingState.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        // Update local state
        await this.supabase
          .from('org_billing_state')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
      } else {
        // Cancel immediately
        await this.stripe!.subscriptions.cancel(billingState.stripe_subscription_id);

        // Update local state (webhook will handle status change)
        await this.supabase
          .from('org_billing_state')
          .update({
            subscription_status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
      }

      logger.info('Canceled subscription', { orgId, atPeriodEnd });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, orgId });
      throw error;
    }
  }

  /**
   * Resume a canceled subscription (if not yet expired)
   */
  async resumeSubscription(orgId: string): Promise<void> {
    this.ensureStripeEnabled();

    logger.info('Resuming subscription', { orgId });

    try {
      // Get subscription ID from billing state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('stripe_subscription_id, cancel_at_period_end')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.stripe_subscription_id) {
        throw new Error('No subscription found for org');
      }

      if (!billingState.cancel_at_period_end) {
        throw new Error('Subscription is not scheduled for cancellation');
      }

      // Resume subscription
      await this.stripe!.subscriptions.update(billingState.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      // Update local state
      await this.supabase
        .from('org_billing_state')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);

      logger.info('Resumed subscription', { orgId });
    } catch (error) {
      logger.error('Failed to resume subscription', { error, orgId });
      throw error;
    }
  }

  // ========================================
  // S33: PLAN MANAGEMENT METHODS
  // ========================================

  /**
   * Switch subscription to a different plan (S33)
   * Handles proration, immediate switch, and trial upgrades
   *
   * @param orgId - Organization ID
   * @param targetPlanSlug - Target plan slug to switch to
   */
  async switchSubscriptionPlan(orgId: string, targetPlanSlug: string): Promise<void> {
    this.ensureStripeEnabled();

    logger.info('Switching subscription plan', { orgId, targetPlanSlug });

    try {
      // Get current subscription from billing state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('stripe_subscription_id, stripe_customer_id, plan_id, trial_ends_at')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.stripe_subscription_id) {
        throw new Error('No active subscription found for org');
      }

      // Get target plan from billing_plans to get the price ID
      const { data: targetPlanData } = await this.supabase
        .from('billing_plans')
        .select('id, slug, name, monthly_price_cents, stripe_price_id')
        .eq('slug', targetPlanSlug)
        .eq('is_active', true)
        .single();

      if (!targetPlanData) {
        throw new Error(`Target plan '${targetPlanSlug}' not found`);
      }

      const stripePriceId = (targetPlanData as any).stripe_price_id;
      if (!stripePriceId) {
        // If no stripe_price_id in database, construct from convention
        // This assumes Stripe price IDs follow pattern like: price_starter_monthly
        throw new Error(`No Stripe price ID configured for plan '${targetPlanSlug}'`);
      }

      // Retrieve current subscription from Stripe
      const subscription = await this.stripe!.subscriptions.retrieve(
        billingState.stripe_subscription_id
      );

      // Get the current subscription item
      const currentItem = subscription.items.data[0];
      if (!currentItem) {
        throw new Error('Subscription has no items');
      }

      // Update subscription with new price (Stripe handles proration automatically)
      const updatedSubscription = await this.stripe!.subscriptions.update(
        billingState.stripe_subscription_id,
        {
          items: [
            {
              id: currentItem.id,
              price: stripePriceId,
            },
          ],
          // Proration is enabled by default, charges/credits are applied automatically
          proration_behavior: 'always_invoice',
          // Update metadata
          metadata: {
            orgId,
            planSlug: targetPlanSlug,
          },
          // If subscription is trialing, this will end the trial and start billing
          trial_end: subscription.status === 'trialing' ? 'now' : undefined,
        }
      );

      logger.info('Switched subscription plan in Stripe', {
        orgId,
        subscriptionId: updatedSubscription.id,
        targetPlan: targetPlanSlug,
        status: updatedSubscription.status,
      });

      // Update local billing state
      const { error: updateError } = await this.supabase
        .from('org_billing_state')
        .update({
          plan_id: targetPlanData.id,
          subscription_status: updatedSubscription.status as StripeSubscriptionStatus,
          billing_status: this.mapStripeStatusToBillingStatus(
            updatedSubscription.status as StripeSubscriptionStatus
          ),
          // If trial was active and ended, clear trial_ends_at
          trial_ends_at:
            subscription.status === 'trialing' && updatedSubscription.status !== 'trialing'
              ? null
              : billingState.trial_ends_at,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);

      if (updateError) {
        logger.error('Failed to update local billing state after plan switch', {
          error: updateError,
          orgId,
        });
        // Don't throw - Stripe subscription was updated successfully, webhook will sync state
      }

      logger.info('Successfully switched subscription plan', { orgId, targetPlanSlug });
    } catch (error) {
      logger.error('Failed to switch subscription plan', { error, orgId, targetPlanSlug });
      throw error;
    }
  }

  /**
   * Retrieve subscription details including renewal dates and proration preview (S33)
   *
   * @param orgId - Organization ID
   * @returns Subscription details with renewal dates and proration info
   */
  async retrieveSubscriptionDetails(orgId: string): Promise<{
    currentPeriodEnd: string;
    nextBillingDate: string;
    cancelAtPeriodEnd: boolean;
    status: StripeSubscriptionStatus;
    trialEnd: string | null;
  }> {
    this.ensureStripeEnabled();

    logger.debug('Retrieving subscription details', { orgId });

    try {
      // Get subscription ID from billing state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('stripe_subscription_id')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.stripe_subscription_id) {
        throw new Error('No active subscription found for org');
      }

      // Retrieve subscription from Stripe
      const subscription: Stripe.Subscription = await this.stripe!.subscriptions.retrieve(
        billingState.stripe_subscription_id
      );

      // Type assertion for Stripe subscription fields (types may be incomplete in SDK)
      const sub = subscription as Stripe.Subscription & {
        trial_end?: number | null;
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
      };

      // Access fields with type assertion
      const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
      const nextBillingDate = sub.cancel_at_period_end
        ? new Date(sub.current_period_end * 1000).toISOString() // Last billing date if canceling
        : new Date(sub.current_period_end * 1000).toISOString(); // Next renewal date

      const trialEnd = sub.trial_end
        ? new Date(sub.trial_end * 1000).toISOString()
        : null;

      return {
        currentPeriodEnd,
        nextBillingDate,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: subscription.status as StripeSubscriptionStatus,
        trialEnd,
      };
    } catch (error) {
      logger.error('Failed to retrieve subscription details', { error, orgId });
      throw error;
    }
  }

  // ========================================
  // WEBHOOK PROCESSING
  // ========================================

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    this.ensureStripeEnabled();

    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw error;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    this.ensureStripeEnabled();

    logger.info('Processing Stripe webhook', { eventType: event.type, eventId: event.id });

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.debug('Unhandled webhook event type', { eventType: event.type });
      }

      logger.info('Processed Stripe webhook', { eventType: event.type, eventId: event.id });
    } catch (error) {
      logger.error('Failed to process webhook event', { error, eventType: event.type, eventId: event.id });
      // Note: We don't throw here - webhook failures shouldn't break API flow
    }
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    const orgId = subscription.metadata.orgId;

    if (!orgId) {
      logger.warn('Subscription missing orgId in metadata', { subscriptionId: subscription.id });
      return;
    }

    logger.info('Handling subscription change', { orgId, subscriptionId: subscription.id, status: subscription.status });

    // Map Stripe status to our status
    const subscriptionStatus = subscription.status as StripeSubscriptionStatus;

    // Type assertion for Stripe subscription fields (types may be incomplete in SDK)
    const sub = subscription as Stripe.Subscription & {
      trial_end?: number | null;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
    };

    // Calculate trial end if applicable
    const trialEndsAt = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null;

    // Calculate current period
    const currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Update org_billing_state
    const { error } = await this.supabase
      .from('org_billing_state')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscriptionStatus,
        trial_ends_at: trialEndsAt,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        billing_status: this.mapStripeStatusToBillingStatus(subscriptionStatus),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to update org billing state from webhook', { error, orgId });
    }
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const orgId = subscription.metadata.orgId;

    if (!orgId) {
      logger.warn('Subscription missing orgId in metadata', { subscriptionId: subscription.id });
      return;
    }

    logger.info('Handling subscription deleted', { orgId, subscriptionId: subscription.id });

    // Update org_billing_state
    const { error } = await this.supabase
      .from('org_billing_state')
      .update({
        subscription_status: 'canceled',
        billing_status: 'canceled',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to update org billing state for deleted subscription', { error, orgId });
    }
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Invoice payment succeeded', { invoiceId: invoice.id, customerId: invoice.customer });

    // Fetch subscription to get orgId
    // Note: subscription field exists at runtime but may not be in types
    const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
    const subscriptionId = typeof invoiceWithSub.subscription === 'string'
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id;

    if (subscriptionId) {
      const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId);
      const orgId = subscription.metadata.orgId;

      if (orgId) {
        // Update billing status to active
        await this.supabase
          .from('org_billing_state')
          .update({
            billing_status: 'active',
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);

        logger.info('Updated billing status after payment success', { orgId });
      }
    }
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.error('Invoice payment failed', { invoiceId: invoice.id, customerId: invoice.customer });

    // Fetch subscription to get orgId
    // Note: subscription field exists at runtime but may not be in types
    const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
    const subscriptionId = typeof invoiceWithSub.subscription === 'string'
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id;

    if (subscriptionId) {
      const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId);
      const orgId = subscription.metadata.orgId;

      if (orgId) {
        // Update billing status to past_due
        await this.supabase
          .from('org_billing_state')
          .update({
            billing_status: 'past_due',
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);

        logger.info('Updated billing status after payment failure', { orgId });
      }
    }
  }

  /**
   * Map Stripe subscription status to our BillingStatus
   */
  private mapStripeStatusToBillingStatus(
    stripeStatus: StripeSubscriptionStatus
  ): 'trial' | 'active' | 'past_due' | 'canceled' {
    switch (stripeStatus) {
      case 'trialing':
        return 'trial';
      case 'active':
        return 'active';
      case 'past_due':
      case 'unpaid':
        return 'past_due';
      case 'canceled':
      case 'incomplete':
      case 'incomplete_expired':
        return 'canceled';
      default:
        return 'canceled';
    }
  }

  // ========================================
  // S31: OVERAGE BILLING METHODS (STUB)
  // ========================================

  /**
   * Create a Stripe invoice item for overage charges (S31 - Stub)
   * @param orgId - Organization ID
   * @param metricType - Type of overage (tokens, playbook_runs, seats)
   * @param amount - Overage amount
   * @param unitPrice - Price per unit in cents
   * @returns Stripe invoice item ID
   */
  async createInvoiceItemForOverage(
    orgId: string,
    metricType: 'tokens' | 'playbook_runs' | 'seats',
    amount: number,
    unitPrice: number
  ): Promise<string> {
    this.ensureStripeEnabled();

    logger.info('Creating invoice item for overage (stub)', {
      orgId,
      metricType,
      amount,
      unitPrice,
    });

    // S31: Stub implementation - will be fully implemented in future sprint
    // TODO: Create actual Stripe invoice item using stripe.invoiceItems.create()
    // For now, return a mock ID
    const stubInvoiceItemId = `ii_stub_${Date.now()}`;

    logger.warn('Using stub invoice item creation', {
      orgId,
      stubInvoiceItemId,
    });

    return stubInvoiceItemId;
  }

  /**
   * Attach calculated overages to the org's upcoming Stripe invoice (S31 - Stub)
   * @param orgId - Organization ID
   * @param overageCalculation - Calculated overage amounts and costs
   */
  async attachOveragesToUpcomingInvoice(
    orgId: string,
    overageCalculation: {
      tokens: { amount: number; unitPrice: number; cost: number };
      playbookRuns: { amount: number; unitPrice: number; cost: number };
      seats: { amount: number; unitPrice: number; cost: number };
      totalCost: number;
    }
  ): Promise<void> {
    this.ensureStripeEnabled();

    logger.info('Attaching overages to upcoming invoice (stub)', {
      orgId,
      totalCost: overageCalculation.totalCost,
    });

    // S31: Stub implementation - will be fully implemented in future sprint
    // TODO: Fetch customer's subscription and upcoming invoice
    // TODO: Create invoice items for each overage metric
    // TODO: Attach items to the upcoming invoice

    logger.warn('Using stub overage attachment', {
      orgId,
      tokenOverage: overageCalculation.tokens.amount,
      runOverage: overageCalculation.playbookRuns.amount,
      seatOverage: overageCalculation.seats.amount,
    });

    // No-op for S31
  }

  // ========================================
  // S34: INVOICE HISTORY METHODS
  // ========================================

  /**
   * List invoices for an organization from Stripe (S34)
   * Retrieves last 12 months of invoices by default
   *
   * @param orgId - Organization ID
   * @param limit - Maximum number of invoices to retrieve (default: 12)
   * @returns Array of Stripe invoices
   */
  async listInvoicesForOrg(orgId: string, limit: number = 12): Promise<Stripe.Invoice[]> {
    this.ensureStripeEnabled();

    logger.info('Listing invoices for org', { orgId, limit });

    try {
      // Get Stripe customer ID from billing state
      const { data: billingState } = await this.supabase
        .from('org_billing_state')
        .select('stripe_customer_id')
        .eq('org_id', orgId)
        .single();

      if (!billingState?.stripe_customer_id) {
        logger.warn('No Stripe customer ID found for org', { orgId });
        return [];
      }

      // List invoices from Stripe
      const invoices = await this.stripe!.invoices.list({
        customer: billingState.stripe_customer_id,
        limit,
        // Expand line items and subscription to get full details
        expand: ['data.lines', 'data.subscription'],
      });

      logger.info('Retrieved invoices from Stripe', {
        orgId,
        count: invoices.data.length,
      });

      return invoices.data;
    } catch (error) {
      logger.error('Failed to list invoices for org', { error, orgId });
      throw error;
    }
  }

  /**
   * Sync a Stripe invoice to the local cache (S34)
   * Upserts invoice data to org_invoice_cache table
   *
   * @param stripeInvoice - Stripe invoice object
   * @param orgId - Organization ID (must be provided if not in invoice metadata)
   */
  async syncInvoiceToCache(stripeInvoice: Stripe.Invoice, orgId?: string): Promise<void> {
    logger.info('Syncing invoice to cache', {
      invoiceId: stripeInvoice.id,
      orgId,
    });

    try {
      // Extract orgId from subscription metadata if not provided
      let resolvedOrgId = orgId;
      const subscription = (stripeInvoice as any).subscription;
      if (!resolvedOrgId && subscription) {
        const subscriptionId = typeof subscription === 'string'
          ? subscription
          : subscription.id;

        if (subscriptionId && this.stripe) {
          const subscriptionData = await this.stripe.subscriptions.retrieve(subscriptionId);
          resolvedOrgId = subscriptionData.metadata.orgId;
        }
      }

      if (!resolvedOrgId) {
        logger.warn('Cannot sync invoice without orgId', {
          invoiceId: stripeInvoice.id,
        });
        return;
      }

      // Extract invoice metadata for caching
      const invoiceData = {
        org_id: resolvedOrgId,
        stripe_invoice_id: stripeInvoice.id,
        invoice_number: stripeInvoice.number || null,
        amount_due: stripeInvoice.amount_due,
        amount_paid: stripeInvoice.amount_paid,
        amount_remaining: stripeInvoice.amount_remaining,
        currency: stripeInvoice.currency,
        status: stripeInvoice.status || 'draft',
        hosted_invoice_url: stripeInvoice.hosted_invoice_url || null,
        invoice_pdf: stripeInvoice.invoice_pdf || null,
        period_start: new Date(stripeInvoice.period_start * 1000).toISOString(),
        period_end: new Date(stripeInvoice.period_end * 1000).toISOString(),
        metadata: {
          lines: stripeInvoice.lines?.data || [],
          total: stripeInvoice.total,
          subtotal: stripeInvoice.subtotal,
          tax: (stripeInvoice as any).total_tax_amounts?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0,
          discount: (stripeInvoice as any).total_discount_amounts?.reduce((sum: number, d: any) => sum + d.amount, 0) || null,
        },
        updated_at: new Date().toISOString(),
      };

      // Upsert to cache (on conflict update)
      const { error } = await this.supabase
        .from('org_invoice_cache')
        .upsert(invoiceData, {
          onConflict: 'stripe_invoice_id',
          ignoreDuplicates: false,
        });

      if (error) {
        logger.error('Failed to sync invoice to cache', {
          error,
          invoiceId: stripeInvoice.id,
        });
        throw error;
      }

      logger.info('Successfully synced invoice to cache', {
        invoiceId: stripeInvoice.id,
        orgId: resolvedOrgId,
      });
    } catch (error) {
      logger.error('Failed to sync invoice to cache', {
        error,
        invoiceId: stripeInvoice.id,
      });
      throw error;
    }
  }

  /**
   * Get detailed invoice information from Stripe (S34)
   * Retrieves full invoice with line items and metadata
   *
   * @param stripeInvoiceId - Stripe invoice ID (e.g., "in_1ABC...")
   * @returns Stripe invoice with full details
   */
  async getInvoiceDetails(stripeInvoiceId: string): Promise<Stripe.Invoice> {
    this.ensureStripeEnabled();

    logger.info('Retrieving invoice details from Stripe', { stripeInvoiceId });

    try {
      const invoice = await this.stripe!.invoices.retrieve(stripeInvoiceId, {
        // Expand all relevant data for full details
        expand: [
          'lines',
          'subscription',
          'charge',
          'payment_intent',
          'customer',
        ],
      });

      logger.info('Retrieved invoice details', {
        invoiceId: invoice.id,
        status: invoice.status,
        total: invoice.total,
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to retrieve invoice details', {
        error,
        stripeInvoiceId,
      });
      throw error;
    }
  }

  /**
   * Sync all invoices for an org to the cache (S34)
   * Useful for initial population or manual sync
   *
   * @param orgId - Organization ID
   * @param limit - Maximum number of invoices to sync (default: 12)
   */
  async syncAllInvoicesForOrg(orgId: string, limit: number = 12): Promise<number> {
    this.ensureStripeEnabled();

    logger.info('Syncing all invoices for org', { orgId, limit });

    try {
      const invoices = await this.listInvoicesForOrg(orgId, limit);

      let syncedCount = 0;
      for (const invoice of invoices) {
        try {
          await this.syncInvoiceToCache(invoice, orgId);
          syncedCount++;
        } catch (error) {
          logger.error('Failed to sync individual invoice', {
            error,
            invoiceId: invoice.id,
            orgId,
          });
          // Continue syncing other invoices even if one fails
        }
      }

      logger.info('Completed invoice sync for org', {
        orgId,
        total: invoices.length,
        synced: syncedCount,
      });

      return syncedCount;
    } catch (error) {
      logger.error('Failed to sync all invoices for org', { error, orgId });
      throw error;
    }
  }
}
