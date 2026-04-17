/**
 * Plan Limits Service (Sprint S-INT-09)
 *
 * Defines resource limits per plan tier and provides enforcement functions.
 * Works alongside existing BillingService for quota checking.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

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
  /** Maximum journalist contacts stored */
  journalistContacts: number;
  /** Maximum competitors tracked */
  competitors: number;
  /** Access to advanced analytics */
  advancedAnalytics: boolean;
  /** Access to API integrations (GSC, etc.) */
  apiIntegrations: boolean;
  /** Autopilot mode available */
  autopilotMode: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  /** Starter — $99/mo: 1 seat, 5 SAGE proposals/day, 50 CiteMind/mo, 500K tokens */
  starter: {
    seats: 1,
    contentDocumentsPerMonth: 25,
    sageProposalsPerMonth: 150, // ~5/day
    citemindScoresPerMonth: 50,
    llmTokensPerMonth: 500_000,
    journalistContacts: 200,
    competitors: 5,
    advancedAnalytics: false,
    apiIntegrations: false,
    autopilotMode: false,
  },
  /** Pro — $299/mo: 3 seats, 50 SAGE proposals/day, 500 CiteMind/mo, citation monitoring, 5M tokens */
  pro: {
    seats: 3,
    contentDocumentsPerMonth: 100,
    sageProposalsPerMonth: 1500, // ~50/day
    citemindScoresPerMonth: 500,
    llmTokensPerMonth: 5_000_000,
    journalistContacts: 1000,
    competitors: 20,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: false,
  },
  /** Growth — $799/mo: 10 seats, unlimited proposals, unlimited CiteMind, 20M tokens, CRAFT */
  growth: {
    seats: 10,
    contentDocumentsPerMonth: 500,
    sageProposalsPerMonth: 999_999, // effectively unlimited
    citemindScoresPerMonth: 999_999, // effectively unlimited
    llmTokensPerMonth: 20_000_000,
    journalistContacts: 5000,
    competitors: 50,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: true,
  },
  /** Internal dev — unlimited (for development) */
  'internal-dev': {
    seats: 999,
    contentDocumentsPerMonth: 999999,
    sageProposalsPerMonth: 999999,
    citemindScoresPerMonth: 999999,
    llmTokensPerMonth: 999_999_999,
    journalistContacts: 999999,
    competitors: 999,
    advancedAnalytics: true,
    apiIntegrations: true,
    autopilotMode: true,
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
  | 'journalistContacts'
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
export function hasFeature(planSlug: string, feature: BooleanResource): boolean {
  const limits = getPlanLimits(planSlug);
  return limits[feature];
}

/**
 * Get the org's current plan slug from billing state.
 */
async function getOrgPlanSlug(supabase: SupabaseClient, orgId: string): Promise<string> {
  const { data } = await supabase
    .from('org_billing_state')
    .select('plan_id')
    .eq('org_id', orgId)
    .single();

  if (!data?.plan_id) return 'starter';

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
      const { count } = await supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', monthStart.toISOString());
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

    case 'journalistContacts': {
      const { count } = await supabase
        .from('journalist_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      return count ?? 0;
    }

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
  const result = await checkPlanLimit(supabase, orgId, resource, additionalUnits);

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
