/**
 * Plan Limits Service (Sprint S-INT-09)
 *
 * Defines resource limits per plan tier and provides enforcement functions.
 * Works alongside existing BillingService for quota checking.
 */

import * as Sentry from '@sentry/node';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from '../../lib/logger';

const logger = createLogger('plan-limits');

// ============================================================================
// Plan Limit Definitions
// ============================================================================

export interface PlanLimits {
  /** Maximum team members */
  seats: number;
  /** Maximum content documents per month */
  contentDocumentsPerMonth: number;
  /** Maximum SAGE proposals generated per month */
  sageProposalsPerMonth: number;
  /** Maximum CiteMind scoring runs per month */
  citemindScoresPerMonth: number;
  /** Maximum LLM tokens consumed per month */
  llmTokensPerMonth: number;
  /** Maximum competitors tracked */
  competitors: number;
  /** Access to advanced analytics */
  advancedAnalytics: boolean;
  /** Access to API integrations (GSC, etc.) */
  apiIntegrations: boolean;
  /** Autopilot mode available */
  autopilotMode: boolean;
  /** Number of AI engines CiteMind can monitor */
  citeMindEngineLimit: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  /** Trial — 72H audit window: 1 seat, 2 CiteMind engines, limited everything */
  trial: {
    seats: 1,
    contentDocumentsPerMonth: 1,
    sageProposalsPerMonth: 10,
    citemindScoresPerMonth: 10,
    llmTokensPerMonth: 500_000,
    competitors: 2,
    advancedAnalytics: false,
    apiIntegrations: false,
    autopilotMode: false,
    citeMindEngineLimit: 2,
  },
  /** Starter — $199/mo: 1 seat, 3 SAGE actions/day, daily CiteMind, 10 CRAFT/mo, 2.5M tokens */
  starter: {
    seats: 1,
    contentDocumentsPerMonth: 10,
    sageProposalsPerMonth: 90, // ~3/day
    citemindScoresPerMonth: 50,
    llmTokensPerMonth: 2_500_000,
    competitors: 5,
    advancedAnalytics: false,
    apiIntegrations: false,
    autopilotMode: false,
    citeMindEngineLimit: 5,
  },
  /** Pro — $599/mo: 5 seats, 50 CRAFT/mo, 5M tokens (live pricing page; PR-C) */
  pro: {
    seats: 5, // live page (was 15 — over-delivered vs contract)
    contentDocumentsPerMonth: 50, // live page CRAFT/mo (was 100)
    sageProposalsPerMonth: 999_999,
    citemindScoresPerMonth: 999_999,
    llmTokensPerMonth: 5_000_000,
    competitors: 20,
    advancedAnalytics: true,
    apiIntegrations: true,
    // H1 (PR-4a): Pro's ceiling is Autopilot. PLANS_LIMITS_ENTITLEMENTS canon —
    // "Pro: limited Autopilot for low-risk workflows"; "limited" is an
    // action-level restriction (§2C), not a plan-tier ceiling of Copilot.
    autopilotMode: true,
    citeMindEngineLimit: 5,
  },
  /** Growth — $1,199/mo: 15 seats, unlimited CRAFT, 50M tokens, autopilot (live page; PR-C) */
  growth: {
    seats: 15, // live page (was 50 — over-delivered vs contract)
    contentDocumentsPerMonth: 999_999, // live page: CRAFT Unlimited (was 500)
    sageProposalsPerMonth: 999_999,
    citemindScoresPerMonth: 999_999,
    llmTokensPerMonth: 50_000_000,
    competitors: 50,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: true,
    citeMindEngineLimit: 5,
  },
  /**
   * Enterprise — custom contract: per-pillar mode control incl. Autopilot
   * (PLANS_LIMITS_ENTITLEMENTS canon), RBAC/SSO, approval chains, custom limits.
   * H2 (PR-4a): ceiling = Autopilot (`autopilotMode: true`). Default mode is
   * Manual per D026 — default ≠ ceiling, so Enterprise users graduate pillars
   * up to Autopilot. Quotas mirror Growth as the baseline until per-contract
   * limits are wired (admin governance surface, §7, not yet built). Previously
   * absent → `getPlanLimits('enterprise')` fell back to Starter, capping the
   * ceiling at Copilot; this entry removes that latent denial.
   */
  enterprise: {
    seats: 50,
    contentDocumentsPerMonth: 500,
    sageProposalsPerMonth: 999_999,
    citemindScoresPerMonth: 999_999,
    llmTokensPerMonth: 50_000_000,
    competitors: 50,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: true,
    citeMindEngineLimit: 5,
  },
  /** Internal dev — unlimited (for development) */
  'internal-dev': {
    seats: 999,
    contentDocumentsPerMonth: 999999,
    sageProposalsPerMonth: 999999,
    citemindScoresPerMonth: 999999,
    llmTokensPerMonth: 999_999_999,
    competitors: 999,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: true,
    citeMindEngineLimit: 5,
  },
};

// ============================================================================
// Resource Types
// ============================================================================

export type CountableResource =
  | 'seats'
  | 'contentDocumentsPerMonth'
  | 'sageProposalsPerMonth'
  | 'citemindScoresPerMonth'
  | 'llmTokensPerMonth'
  | 'competitors';

export type BooleanResource =
  | 'advancedAnalytics'
  | 'apiIntegrations'
  | 'autopilotMode';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resource: string;
  planSlug: string;
}

export class PlanLimitExceededError extends Error {
  resource: string;
  current: number;
  limit: number;
  planSlug: string;

  constructor(result: LimitCheckResult) {
    super(
      `Plan limit exceeded for ${result.resource}: ${result.current}/${result.limit} on ${result.planSlug} plan`
    );
    this.name = 'PlanLimitExceededError';
    this.resource = result.resource;
    this.current = result.current;
    this.limit = result.limit;
    this.planSlug = result.planSlug;
  }
}

// ============================================================================
// Service
// ============================================================================

/**
 * Get the plan limits for a given plan slug.
 * Falls back to starter limits if unknown plan.
 */
export function getPlanLimits(planSlug: string): PlanLimits {
  return PLAN_LIMITS[planSlug] ?? PLAN_LIMITS.starter;
}

/**
 * Check if a boolean feature is available on the plan.
 */
export function hasFeature(
  planSlug: string,
  feature: BooleanResource
): boolean {
  const limits = getPlanLimits(planSlug);
  return limits[feature];
}

/**
 * Get the org's current plan slug from billing state.
 */
async function getOrgPlanSlug(
  supabase: SupabaseClient,
  orgId: string
): Promise<string> {
  const { data } = await supabase
    .from('org_billing_state')
    .select('plan_id, subscription_status')
    .eq('org_id', orgId)
    .single();

  if (!data?.plan_id) {
    // Fail LOUD (PR-A / #75): a live subscription resolving to the starter
    // fallback means plan_id never reconciled — the org is being silently
    // under-entitled. Alert; the fallback still returns so nothing crashes.
    const status = (data as { subscription_status?: string } | null)
      ?.subscription_status;
    if (status === 'active' || status === 'trialing') {
      logger.error('Entitlement fell back to starter for a subscribed org', {
        orgId,
        subscription_status: status,
      });
      Sentry.captureMessage(
        'entitlement resolved to starter fallback for a subscribed org',
        {
          level: 'error',
          tags: {
            phase: 'entitlement_resolve',
            reason: 'null_plan_id_with_live_sub',
          },
          extra: { orgId, subscription_status: status },
        }
      );
    }
    return 'starter';
  }

  const { data: plan } = await supabase
    .from('billing_plans')
    .select('slug')
    .eq('id', data.plan_id)
    .single();

  return plan?.slug ?? 'starter';
}

/**
 * Get current usage count for a countable resource.
 */
async function getCurrentUsage(
  supabase: SupabaseClient,
  orgId: string,
  resource: CountableResource
): Promise<number> {
  switch (resource) {
    case 'seats': {
      const { count } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return count ?? 0;
    }

    case 'contentDocumentsPerMonth': {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      // Exempt onboarding URL imports (onboarding/index.ts POST /content tags
      // rows metadata.source='onboarding'). Those are existing published URLs
      // pulled in for context, not CRAFT-authored documents, so they must not
      // consume the CRAFT/mo allowance. The `.or` keeps rows whose source is
      // null OR anything other than 'onboarding' — a bare `.neq` on the jsonb
      // path would also drop every row where source is null (i.e. all normal
      // content), which is exactly wrong.
      const { count } = await supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', monthStart.toISOString())
        .or('metadata->>source.is.null,metadata->>source.neq.onboarding');
      return count ?? 0;
    }

    case 'sageProposalsPerMonth': {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('sage_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', monthStart.toISOString());
      return count ?? 0;
    }

    case 'citemindScoresPerMonth': {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('citemind_scores')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', monthStart.toISOString());
      return count ?? 0;
    }

    case 'llmTokensPerMonth': {
      // Read from org_billing_usage_monthly
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('org_billing_usage_monthly')
        .select('tokens_consumed')
        .eq('org_id', orgId)
        .gte('period_start', monthStart.toISOString())
        .single();
      return data?.tokens_consumed ?? 0;
    }

    // `journalistContacts` retired here: the stored-contact count model is
    // replaced by §10.3 daily caps (unlocks/pitches), and the counter read a
    // `journalist_contacts` table that does not exist in the schema — so it
    // always returned 0 and could never have blocked anything.

    case 'competitors': {
      const { count } = await supabase
        .from('org_competitors')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return count ?? 0;
    }

    default:
      return 0;
  }
}

/**
 * Check if an org can consume a resource. Does NOT enforce — just checks.
 */
export async function checkPlanLimit(
  supabase: SupabaseClient,
  orgId: string,
  resource: CountableResource,
  additionalUnits: number = 1
): Promise<LimitCheckResult> {
  const planSlug = await getOrgPlanSlug(supabase, orgId);
  const limits = getPlanLimits(planSlug);
  const limit = limits[resource];
  const current = await getCurrentUsage(supabase, orgId, resource);

  return {
    allowed: current + additionalUnits <= limit,
    current,
    limit,
    resource,
    planSlug,
  };
}

/**
 * Enforce a plan limit — throws PlanLimitExceededError if over limit.
 * Call this before creating a resource.
 */
export async function enforcePlanLimit(
  supabase: SupabaseClient,
  orgId: string,
  resource: CountableResource,
  additionalUnits: number = 1
): Promise<void> {
  const result = await checkPlanLimit(
    supabase,
    orgId,
    resource,
    additionalUnits
  );

  if (!result.allowed) {
    logger.warn('Plan limit exceeded', {
      orgId,
      resource,
      current: result.current,
      limit: result.limit,
      planSlug: result.planSlug,
    });
    throw new PlanLimitExceededError(result);
  }
}

/**
 * Check if an org has access to a boolean feature.
 * Throws PlanLimitExceededError if not.
 */
export async function enforceFeatureAccess(
  supabase: SupabaseClient,
  orgId: string,
  feature: BooleanResource
): Promise<void> {
  const planSlug = await getOrgPlanSlug(supabase, orgId);

  if (!hasFeature(planSlug, feature)) {
    throw new PlanLimitExceededError({
      allowed: false,
      current: 0,
      limit: 0,
      resource: feature,
      planSlug,
    });
  }
}
