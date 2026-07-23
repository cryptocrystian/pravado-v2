/**
 * Shared reply body for plan-limit denials.
 *
 * Every enforcement point returns an identical body so the dashboard can render
 * one upgrade affordance regardless of which limit was hit.
 *
 * Shape conforms to `ApiError` (packages/types/src/common.ts): the limit
 * specifics live in `details`, not at the top level of `error`. The two
 * enforcement points that shipped first (citeMind `/score`, sage `/proposals`)
 * put them at the top level, which does not type-check against `ApiResponse`;
 * they are migrated onto this helper here. No client reads PLAN_LIMIT_EXCEEDED
 * yet (grep: zero dashboard consumers), so this is not a breaking change.
 *
 * Status is **403**, matching those first two. 402 Payment Required is arguably
 * the better code for a paywall — deliberately NOT changed here, since that is
 * a contract decision for the architect, not a side effect of this PR.
 */

import type { ApiError } from '@pravado/types';

import type { PlanLimitExceededError } from './planLimitsService';

export const PLAN_LIMIT_STATUS = 403;

const UPGRADE_URL = '/app/billing';

/**
 * Build the canonical denial error. Callers send it as
 * `reply.code(PLAN_LIMIT_STATUS).send({ success: false, error: planLimitError(e) })`.
 */
export function planLimitError(error: PlanLimitExceededError): ApiError {
  return {
    code: 'PLAN_LIMIT_EXCEEDED',
    message: `${error.message}. Upgrade at ${UPGRADE_URL} to continue.`,
    details: {
      resource: error.resource,
      current: error.current,
      limit: error.limit,
      planSlug: error.planSlug,
      upgradeUrl: UPGRADE_URL,
    },
  };
}
