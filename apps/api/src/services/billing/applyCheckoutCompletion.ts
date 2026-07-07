import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * F36 — apply a completed Stripe Checkout to the org's billing state.
 *
 * `checkout.session.completed` is subscribed at Stripe but was never handled,
 * so a paid checkout never updated the org's plan. This resolves the plan from
 * the session metadata (`{ orgId, planSlug }`, set by
 * stripeService.createCheckoutSession) and writes `plan_id` +
 * customer/subscription ids onto `org_billing_state`.
 *
 * Idempotent: Stripe may redeliver an event, so if the org is already on this
 * plan with this subscription, no write happens.
 *
 * Extracted as a pure function (mirrors F46 resolveUserEmails) so the logic is
 * unit-testable without booting Fastify / the Stripe SDK.
 */
export type CheckoutCompletionReason =
  | 'missing_metadata'
  | 'plan_not_found'
  | 'already_applied'
  | 'update_failed';

export interface CheckoutCompletionResult {
  updated: boolean;
  reason?: CheckoutCompletionReason;
  orgId?: string;
  planSlug?: string;
}

export async function applyCheckoutCompletion(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<CheckoutCompletionResult> {
  const orgId = session.metadata?.orgId ?? undefined;
  const planSlug = session.metadata?.planSlug ?? undefined;

  if (!orgId || !planSlug) {
    return { updated: false, reason: 'missing_metadata' };
  }

  // Resolve plan_id from the slug.
  const { data: plan, error: planError } = await supabase
    .from('billing_plans')
    .select('id')
    .eq('slug', planSlug)
    .single();

  if (planError || !plan) {
    return { updated: false, reason: 'plan_not_found', orgId, planSlug };
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription?.id ?? null);
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : (session.customer?.id ?? null);

  // Idempotency — skip if already on this plan + subscription.
  const { data: current } = await supabase
    .from('org_billing_state')
    .select('plan_id, stripe_subscription_id')
    .eq('org_id', orgId)
    .single();

  if (
    current &&
    current.plan_id === plan.id &&
    current.stripe_subscription_id === subscriptionId
  ) {
    return { updated: false, reason: 'already_applied', orgId, planSlug };
  }

  const { error: updateError } = await supabase
    .from('org_billing_state')
    .update({
      plan_id: plan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      billing_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId);

  if (updateError) {
    return { updated: false, reason: 'update_failed', orgId, planSlug };
  }

  return { updated: true, orgId, planSlug };
}
