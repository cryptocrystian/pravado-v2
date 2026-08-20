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

  // --------------------------------------------------------------------------
  // CRAFT execution guardrails (CRAFT_EXECUTION_MODEL §6.2 / §6.3). These are the
  // HARD per-tier ceilings the CRAFT autonomous-execution gate enforces (Wave-2
  // safety floor). Autonomy is OFF this slice, so they gate/annotate a simulated
  // autonomous path today; they become live limits the moment autonomy is enabled.
  // The sentinel 999_999 = "unlimited" (Enterprise custom / internal-dev).
  //
  // TIER ORDER (RESOLVED 2026-08-18): the ladder is Starter < Pro < Scale (the
  // `growth` slug, priced above Pro) < Enterprise, with MONOTONICALLY increasing
  // caps. PLANS_LIMITS_ENTITLEMENTS is the tier authority (per the pricing model);
  // canon CRAFT §6.2/§6.3, which previously ordered Growth BELOW Pro, is being
  // re-ordered to match. The prior Pro > Scale cap inversion is fixed below.
  // (Autonomy caps remain inert while Autopilot is off.)
  // --------------------------------------------------------------------------
  /** §6.2 Max Actions/Day — total governed actions per calendar day. */
  maxActionsPerDay: number;
  /** §6.2 External Actions/Day — irreversible external actions (sends/publishes) per day. */
  externalActionsPerDay: number;
  /** §6.2 Concurrent Executions — max simultaneously-executing governed actions. */
  concurrentExecutions: number;
  /** §6.2 LLM Calls/Hour. */
  llmCallsPerHour: number;
  /** §6.3 LLM Spend/Month (USD) — cost ceiling. */
  llmSpendPerMonthUsd: number;
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
    // Canon §6.2 has no "trial" column → conservative floor BELOW Starter (ASSERTED,
    // canon-silent). Trial never reaches Autopilot anyway (autopilotMode:false).
    maxActionsPerDay: 5,
    externalActionsPerDay: 1,
    concurrentExecutions: 1,
    llmCallsPerHour: 10,
    llmSpendPerMonthUsd: 25,
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
    // Canon §6.2/§6.3 Starter column (verbatim).
    maxActionsPerDay: 10,
    externalActionsPerDay: 2,
    concurrentExecutions: 1,
    llmCallsPerHour: 20,
    llmSpendPerMonthUsd: 50,
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
    // Pro CRAFT guardrails. Scale (below) now correctly exceeds these — the prior
    // Pro > Scale inversion is resolved; PLANS_LIMITS is the tier authority.
    maxActionsPerDay: 200,
    externalActionsPerDay: 50,
    concurrentExecutions: 10,
    llmCallsPerHour: 500,
    llmSpendPerMonthUsd: 1_000,
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
    // Scale sits ABOVE Pro — PLANS_LIMITS_ENTITLEMENTS is the tier authority per
    // the pricing model. Resolves the prior inversion where these caps were LOWER
    // than Pro's despite Scale being the pricier tier. Canon CRAFT §6.2/§6.3 to be
    // re-ordered to match. (Autonomy caps — inert until Autopilot ships.)
    maxActionsPerDay: 500,
    externalActionsPerDay: 100,
    concurrentExecutions: 25,
    llmCallsPerHour: 1_000,
    llmSpendPerMonthUsd: 2_000,
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
    // Canon §6.2/§6.3 Enterprise = "Unlimited*/Custom" (subject to abuse prevention).
    // 999_999 sentinel = unlimited until per-contract limits are wired (§7 admin surface).
    maxActionsPerDay: 999_999,
    externalActionsPerDay: 999_999,
    concurrentExecutions: 999_999,
    llmCallsPerHour: 999_999,
    llmSpendPerMonthUsd: 999_999,
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
    maxActionsPerDay: 999_999,
    externalActionsPerDay: 999_999,
    concurrentExecutions: 999_999,
    llmCallsPerHour: 999_999,
    llmSpendPerMonthUsd: 999_999,
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
