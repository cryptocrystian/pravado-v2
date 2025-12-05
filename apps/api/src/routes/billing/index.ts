/**
 * Billing Routes (Sprint S28 + S30 + S31 + S32 + S33)
 * REST endpoints for billing and quota management
 * S30: Added Stripe subscription endpoints
 * S31: Added overage billing endpoints
 * S32: Added billing usage alert endpoints
 * S33: Added plan management endpoints
 */

import { FLAGS } from '@pravado/feature-flags';
import {
  acknowledgeAlertSchema,
  apiEnvSchema,
  cancelPlanRequestSchema,
  getPlanBySlugParamsSchema,
  listBillingAlertsQuerySchema,
  recalculateOveragesRequestSchema,
  setPlanRequestSchema,
  switchPlanRequestSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { BillingService } from '../../services/billingService';
import { StripeService } from '../../services/stripeService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

/**
 * Register billing routes
 */
export async function billingRoutes(server: FastifyInstance): Promise<void> {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // S30: Initialize Stripe service if enabled
  const stripeService = FLAGS.ENABLE_STRIPE_BILLING
    ? new StripeService(supabase, env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
    : undefined;

  const billingService = new BillingService(
    supabase,
    env.BILLING_DEFAULT_PLAN_SLUG,
    stripeService
  );

  /**
   * GET /api/v1/billing/plans
   * List all active billing plans
   */
  server.get('/plans', { preHandler: requireUser }, async (_request, reply) => {
    try {
      const plans = await billingService.listPlans();

      return reply.send({
        success: true,
        data: plans,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to list plans', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to list billing plans',
        },
      });
    }
  });

  /**
   * GET /api/v1/billing/org/summary
   * Get current org's billing summary
   */
  server.get('/org/summary', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      const summary = await billingService.buildOrgBillingSummary(orgId);
      if (!summary) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'BILLING_ERROR',
            message: 'Failed to build billing summary',
          },
        });
      }

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to get org summary', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get billing summary',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/plan
   * Set org's billing plan (internal/admin use)
   */
  server.post<{
    Body: { planSlug: string };
  }>('/org/plan', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = setPlanRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validation.error.errors,
          },
        });
      }

      const { planSlug } = validation.data;

      const billingState = await billingService.setOrgPlan(orgId, planSlug);
      if (!billingState) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: `Plan '${planSlug}' not found or inactive`,
          },
        });
      }

      // Return updated summary
      const summary = await billingService.buildOrgBillingSummary(orgId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to set org plan', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to set billing plan',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/check
   * Check if an operation would exceed quotas (internal use)
   */
  server.post<{
    Body: { tokensToConsume?: number; playbookRunsToConsume?: number };
  }>('/org/check', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      const result = await billingService.checkOrgQuota(orgId, request.body);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to check quota', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to check quota',
        },
      });
    }
  });

  // ========================================
  // S30: STRIPE SUBSCRIPTION ENDPOINTS
  // ========================================

  /**
   * POST /api/v1/billing/org/create-checkout
   * Create Stripe checkout session for subscription upgrade (S30)
   */
  server.post<{
    Body: {
      planSlug: string;
      successUrl?: string;
      cancelUrl?: string;
      trialPeriodDays?: number;
    };
  }>('/org/create-checkout', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if Stripe is enabled
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'STRIPE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { planSlug, successUrl, cancelUrl, trialPeriodDays } = request.body;

      // Validate plan exists
      const plan = await billingService.getPlanBySlug(planSlug);
      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: `Plan '${planSlug}' not found`,
          },
        });
      }

      // Get Stripe price ID from environment
      const priceIdMap: Record<string, string | undefined> = {
        starter: env.STRIPE_PRICE_STARTER,
        growth: env.STRIPE_PRICE_GROWTH,
        enterprise: env.STRIPE_PRICE_ENTERPRISE,
      };

      const priceId = priceIdMap[planSlug];
      if (!priceId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'NO_PRICE_ID',
            message: `No Stripe price ID configured for plan '${planSlug}'`,
          },
        });
      }

      // Create checkout session
      const dashboardUrl = env.DASHBOARD_URL;
      const checkoutSession = await stripeService.createCheckoutSession({
        orgId,
        planSlug,
        priceId,
        successUrl: successUrl || `${dashboardUrl}/app/billing?success=true`,
        cancelUrl: cancelUrl || `${dashboardUrl}/app/billing?canceled=true`,
        trialPeriodDays,
      });

      return reply.send({
        success: true,
        data: checkoutSession,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to create checkout session', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'CHECKOUT_FAILED',
          message: error.message || 'Failed to create checkout session',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/stripe/webhook
   * Handle Stripe webhook events (S30)
   * No authentication required - uses Stripe signature verification
   */
  server.post('/stripe/webhook', async (request, reply) => {
    try {
      // Check if Stripe is enabled
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'STRIPE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      // Get raw body and signature
      const signature = request.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'Missing stripe-signature header',
          },
        });
      }

      // Verify webhook signature and construct event
      const rawBody = JSON.stringify(request.body);
      const event = stripeService.verifyWebhookSignature(rawBody, signature);

      // Process webhook event
      await stripeService.processWebhookEvent(event);

      return reply.send({ received: true });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Webhook processing failed', { error });
      return reply.code(400).send({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error.message || 'Webhook processing failed',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/cancel
   * Cancel Stripe subscription (S30)
   */
  server.post<{
    Body: { immediate?: boolean };
  }>('/org/cancel', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if Stripe is enabled
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'STRIPE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { immediate = false } = request.body;

      // Cancel subscription
      await stripeService.cancelSubscription(orgId, !immediate);

      // Return updated summary
      const summary = await billingService.buildOrgBillingSummary(orgId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to cancel subscription', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message || 'Failed to cancel subscription',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/resume
   * Resume canceled Stripe subscription (S30)
   */
  server.post('/org/resume', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if Stripe is enabled
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'STRIPE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Resume subscription
      await stripeService.resumeSubscription(orgId);

      // Return updated summary
      const summary = await billingService.buildOrgBillingSummary(orgId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to resume subscription', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'RESUME_FAILED',
          message: error.message || 'Failed to resume subscription',
        },
      });
    }
  });

  // ========================================
  // S31: OVERAGE BILLING ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/billing/org/overages
   * Get overage summary for current billing period (S31)
   */
  server.get('/org/overages', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if overage billing is enabled
      if (!FLAGS.ENABLE_OVERAGE_BILLING) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'OVERAGE_BILLING_DISABLED',
            message: 'Overage billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Get overage summary for current period
      const overageSummary = await billingService.getOverageSummaryForOrg(orgId);

      if (!overageSummary) {
        // No overages found - return zero overages
        return reply.send({
          success: true,
          data: {
            orgId,
            period: {
              start: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            overages: {
              tokens: { amount: 0, unitPrice: 0, cost: 0 },
              playbookRuns: { amount: 0, unitPrice: 0, cost: 0 },
              seats: { amount: 0, unitPrice: 0, cost: 0 },
            },
            totalCost: 0,
          },
        });
      }

      return reply.send({
        success: true,
        data: overageSummary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to get overage summary', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'OVERAGE_ERROR',
          message: error.message || 'Failed to get overage summary',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/overages/recalculate
   * Recalculate and record overages for current period (S31)
   */
  server.post<{
    Body: { force?: boolean };
  }>('/org/overages/recalculate', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if overage billing is enabled
      if (!FLAGS.ENABLE_OVERAGE_BILLING) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'OVERAGE_BILLING_DISABLED',
            message: 'Overage billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = recalculateOveragesRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validation.error.errors,
          },
        });
      }

      const { force = false } = validation.data;

      console.log('[Billing] Recalculating overages', { orgId, force });

      // Calculate overages
      const calculation = await billingService.calculateOveragesForOrg(orgId);

      if (!calculation) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CALCULATION_FAILED',
            message: 'Failed to calculate overages (no plan or billing summary)',
          },
        });
      }

      // Record overages to database
      await billingService.recordOverages(orgId, calculation);

      return reply.send({
        success: true,
        data: calculation,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to recalculate overages', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'RECALCULATION_FAILED',
          message: error.message || 'Failed to recalculate overages',
        },
      });
    }
  });

  // ========================================
  // S32: BILLING USAGE ALERTS ENDPOINTS
  // ========================================

  /**
   * POST /api/v1/billing/alerts/generate
   * Generate usage alerts for current org (S32)
   */
  server.post('/alerts/generate', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if usage alerts are enabled
      if (!FLAGS.ENABLE_USAGE_ALERTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'USAGE_ALERTS_DISABLED',
            message: 'Billing usage alerts are not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Generate alerts
      const alerts = await billingService.generateUsageAlerts(orgId);

      return reply.send({
        success: true,
        data: {
          generatedCount: alerts.length,
          alerts,
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to generate usage alerts', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'ALERT_GENERATION_FAILED',
          message: error.message || 'Failed to generate usage alerts',
        },
      });
    }
  });

  /**
   * GET /api/v1/billing/alerts
   * List billing alerts for current org (S32)
   */
  server.get<{
    Querystring: {
      unacknowledgedOnly?: boolean;
      limit?: number;
    };
  }>('/alerts', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if usage alerts are enabled
      if (!FLAGS.ENABLE_USAGE_ALERTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'USAGE_ALERTS_DISABLED',
            message: 'Billing usage alerts are not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate query parameters
      const validation = listBillingAlertsQuerySchema.safeParse(request.query);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          },
        });
      }

      const { unacknowledgedOnly, limit } = validation.data;

      // Get alerts
      const alerts = await billingService.getAlertsForOrg(orgId, {
        unacknowledgedOnly,
        limit,
      });

      // Get summary
      const summary = await billingService.getAlertSummaryForOrg(orgId);

      return reply.send({
        success: true,
        data: {
          alerts,
          summary,
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to list alerts', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'ALERT_LIST_FAILED',
          message: error.message || 'Failed to list billing alerts',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/alerts/:alertId/acknowledge
   * Acknowledge a billing alert (S32)
   */
  server.post<{
    Params: { alertId: string };
  }>('/alerts/:alertId/acknowledge', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check if usage alerts are enabled
      if (!FLAGS.ENABLE_USAGE_ALERTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'USAGE_ALERTS_DISABLED',
            message: 'Billing usage alerts are not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate alert ID
      const validation = acknowledgeAlertSchema.safeParse({ alertId: request.params.alertId });
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert ID',
            details: validation.error.errors,
          },
        });
      }

      const { alertId } = validation.data;

      // Verify alert belongs to user's org
      const alerts = await billingService.getAlertsForOrg(orgId);
      const alertExists = alerts.some((a) => a.id === alertId);

      if (!alertExists) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ALERT_NOT_FOUND',
            message: 'Alert not found or does not belong to your organization',
          },
        });
      }

      // Acknowledge alert
      await billingService.acknowledgeAlert(alertId);

      return reply.send({
        success: true,
        data: {
          alertId,
          acknowledgedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to acknowledge alert', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'ACKNOWLEDGE_FAILED',
          message: error.message || 'Failed to acknowledge alert',
        },
      });
    }
  });

  // ========================================
  // S33: PLAN MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/billing/plans/:slug
   * Get plan details by slug (S33)
   */
  server.get('/plans/:slug', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Validate params
      const validation = getPlanBySlugParamsSchema.safeParse(request.params);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid plan slug',
            details: validation.error.errors,
          },
        });
      }

      const { slug } = validation.data;

      // Get plan
      const plan = await billingService.getPlanBySlug(slug);

      if (!plan) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: `Plan '${slug}' not found`,
          },
        });
      }

      return reply.send({
        success: true,
        data: plan,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to get plan', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve plan',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/switch-plan
   * Switch organization to a different plan (S33)
   */
  server.post('/org/switch-plan', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = switchPlanRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.errors,
          },
        });
      }

      const { targetPlanSlug } = validation.data;

      // Switch plan
      const updatedState = await billingService.switchOrgPlan(orgId, targetPlanSlug);

      if (!updatedState) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SWITCH_FAILED',
            message: 'Failed to switch plan',
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          planId: updatedState.planId,
          billingStatus: updatedState.billingStatus,
          message: `Successfully switched to ${targetPlanSlug}`,
        },
      });
    } catch (err) {
      const error = err as any;
      console.error('[Billing] Failed to switch plan', { error });

      // Handle BillingQuotaError (downgrade blocked)
      if (error.name === 'BillingQuotaError') {
        return reply.code(422).send({
          success: false,
          error: {
            code: 'UPGRADE_REQUIRED',
            message: error.message || 'Cannot downgrade: current usage exceeds target plan limits',
            details: error.details,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'SWITCH_FAILED',
          message: error.message || 'Failed to switch plan',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/payment-method
   * Generate Stripe Customer Portal link for payment method management (S33)
   */
  server.post('/org/payment-method', { preHandler: requireUser }, async (request, reply) => {
    try {
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Get or create Stripe customer
      const customerId = await stripeService.getOrCreateStripeCustomer(orgId);

      // Create Stripe Customer Portal session
      // Note: Stripe SDK is typed, but portalSessions may not be fully typed
      const stripe = (stripeService as any).stripe;
      if (!stripe) {
        throw new Error('Stripe client not initialized');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${env.DASHBOARD_URL}/app/billing`,
      });

      return reply.send({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to create portal session', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'PORTAL_FAILED',
          message: error.message || 'Failed to create payment portal session',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/plan/cancel
   * Cancel subscription (S33)
   */
  server.post('/org/plan/cancel', { preHandler: requireUser }, async (request, reply) => {
    try {
      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = cancelPlanRequestSchema.safeParse(request.body || {});
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.errors,
          },
        });
      }

      const { immediate } = validation.data;

      // Cancel subscription
      await stripeService.cancelSubscription(orgId, !immediate); // atPeriodEnd = !immediate

      return reply.send({
        success: true,
        data: {
          message: immediate
            ? 'Subscription canceled immediately'
            : 'Subscription will be canceled at the end of the billing period',
          canceledAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to cancel subscription', { error });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message || 'Failed to cancel subscription',
        },
      });
    }
  });

  // ========================================
  // S34: INVOICE HISTORY ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/billing/org/invoices
   * Get billing history (invoice list) for the organization (S34)
   */
  server.get('/org/invoices', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Get billing history summary from BillingService
      const historySummary = await billingService.getBillingHistorySummary(orgId);

      return reply.send({
        success: true,
        data: historySummary,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to get invoice history', { error, orgId: request.user?.id });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INVOICE_HISTORY_FAILED',
          message: error.message || 'Failed to retrieve invoice history',
        },
      });
    }
  });

  /**
   * GET /api/v1/billing/org/invoices/:id
   * Get detailed invoice breakdown (S34)
   */
  server.get('/org/invoices/:id', { preHandler: requireUser }, async (request, reply) => {
    try {
      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Get invoice ID from URL params
      const params = request.params as { id: string };
      const invoiceId = params.id;

      if (!invoiceId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_INVOICE_ID',
            message: 'Invoice ID is required',
          },
        });
      }

      // Get invoice with detailed breakdown
      const invoiceDetails = await billingService.getInvoiceWithBreakdown(orgId, invoiceId);

      return reply.send({
        success: true,
        data: invoiceDetails,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to get invoice details', { error, orgId: request.user?.id });

      // Check if invoice not found
      if (error.message === 'Invoice not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: 'Invoice not found',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INVOICE_DETAILS_FAILED',
          message: error.message || 'Failed to retrieve invoice details',
        },
      });
    }
  });

  /**
   * POST /api/v1/billing/org/invoices/sync
   * Manually sync invoices from Stripe to cache (S34)
   * Admin-only, feature flag protected
   */
  server.post('/org/invoices/sync', { preHandler: requireUser }, async (request, reply) => {
    try {
      // Check feature flag for admin sync
      if (!FLAGS.ENABLE_ADMIN_INVOICE_SYNC) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Manual invoice sync is not enabled',
          },
        });
      }

      if (!FLAGS.ENABLE_STRIPE_BILLING || !stripeService) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Stripe billing is not enabled',
          },
        });
      }

      const orgId = await getUserOrgId(request.user!.id!, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG_ACCESS',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Check if user is admin (optional - implement based on your auth system)
      // For now, any authenticated user can sync their org's invoices

      console.log('[Billing] Starting manual invoice sync', { orgId });

      // Sync all invoices for the org
      const syncedCount = await stripeService.syncAllInvoicesForOrg(orgId, 12);

      return reply.send({
        success: true,
        data: {
          message: `Successfully synced ${syncedCount} invoices`,
          syncedCount,
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Billing] Failed to sync invoices', { error, orgId: request.user?.id });
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INVOICE_SYNC_FAILED',
          message: error.message || 'Failed to sync invoices',
        },
      });
    }
  });
}
