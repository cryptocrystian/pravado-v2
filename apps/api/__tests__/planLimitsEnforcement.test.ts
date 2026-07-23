/**
 * Guardrail build #1 — billing quota enforcement gaps.
 *
 * Covers the two limits that were *defined but not load-bearing*:
 *   - `seats`                    → hard-block on the invite/join paths
 *   - `contentDocumentsPerMonth` → hard-block on content-item create
 * plus the `competitors` wire-up and the shared denial body.
 *
 * These assert the enforcement decision (`enforcePlanLimit` throws / does not
 * throw for a given plan + usage), which is where the logic lives. Route-level
 * integration is NOT asserted here: every Fastify route-inject suite is in the
 * vitest.config.ts exclude list, so that harness is unusable in this repo.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

// planLimitsService loads the pino logger at import time (crashes under vitest).
vi.mock('../src/lib/logger', () => {
  const l = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => l,
  };
  return { createLogger: () => l, serviceLogger: l, fastifyLoggerOptions: {} };
});

import { planLimitError } from '../src/services/billing/planLimitReply';
import {
  enforcePlanLimit,
  checkPlanLimit,
  PlanLimitExceededError,
} from '../src/services/billing/planLimitsService';

/**
 * Minimal Supabase stand-in.
 *
 * `enforcePlanLimit` makes exactly three shapes of call:
 *   org_billing_state → .select().eq().single()          → { plan_id }
 *   billing_plans     → .select().eq().single()          → { slug }
 *   <usage table>     → .select(_, {count,head}).eq()    → { count }
 */
function makeSupabase(opts: { planSlug: string | null; count: number }) {
  const PLAN_ID = 'plan-uuid';

  const singleRow = (data: unknown) => ({
    select: () => ({ eq: () => ({ single: async () => ({ data }) }) }),
  });

  // Count queries take three shapes off eq():
  //   seats / competitors        → awaited directly            (thenable)
  //   contentDocumentsPerMonth   → .gte().or()  → { count }
  //   llmTokensPerMonth          → .gte().single() → { tokens_consumed }
  // so eq() returns a thenable that also exposes gte()/or()/single().
  const countQuery = () => {
    const q: any = Promise.resolve({ count: opts.count });
    q.gte = () => q;
    q.or = () => Promise.resolve({ count: opts.count });
    q.single = async () => ({ data: { tokens_consumed: opts.count } });
    return q;
  };

  return {
    from: (table: string) => {
      if (table === 'org_billing_state') {
        return singleRow(
          opts.planSlug
            ? { plan_id: PLAN_ID, subscription_status: 'active' }
            : { plan_id: null, subscription_status: 'canceled' }
        );
      }
      if (table === 'billing_plans') {
        return singleRow({ slug: opts.planSlug });
      }
      // Usage tables: org_members / content_items / org_competitors / …
      return { select: () => ({ eq: () => countQuery() }) };
    },
  } as unknown as SupabaseClient;
}

describe('seats — hard-block on the invite/join paths', () => {
  it('blocks a Starter org that already has its 1 seat filled', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 1 });
    await expect(enforcePlanLimit(supabase, 'org-1', 'seats')).rejects.toThrow(
      PlanLimitExceededError
    );
  });

  it('blocks a Pro org at 5/5 seats', async () => {
    const supabase = makeSupabase({ planSlug: 'pro', count: 5 });
    await expect(enforcePlanLimit(supabase, 'org-1', 'seats')).rejects.toThrow(
      PlanLimitExceededError
    );
  });

  it('allows a Pro org at 4/5 seats (the 5th member fits)', async () => {
    const supabase = makeSupabase({ planSlug: 'pro', count: 4 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'seats')
    ).resolves.toBeUndefined();
  });

  it('allows Growth up to 15 and blocks the 16th', async () => {
    await expect(
      enforcePlanLimit(
        makeSupabase({ planSlug: 'growth', count: 14 }),
        'o',
        'seats'
      )
    ).resolves.toBeUndefined();
    await expect(
      enforcePlanLimit(
        makeSupabase({ planSlug: 'growth', count: 15 }),
        'o',
        'seats'
      )
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('carries the plan + numbers on the thrown error (for the upgrade body)', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 1 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'seats')
    ).rejects.toMatchObject({
      resource: 'seats',
      current: 1,
      limit: 1,
      planSlug: 'starter',
    });
  });

  it('an org with no plan_id falls back to starter limits (still blocks)', async () => {
    const supabase = makeSupabase({ planSlug: null, count: 1 });
    await expect(enforcePlanLimit(supabase, 'org-1', 'seats')).rejects.toThrow(
      PlanLimitExceededError
    );
  });
});

describe('contentDocumentsPerMonth — hard-block on content-item create', () => {
  it('blocks Starter at 10 CRAFT docs this month', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 10 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'contentDocumentsPerMonth')
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('allows Starter at 9 (the 10th doc fits)', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 9 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'contentDocumentsPerMonth')
    ).resolves.toBeUndefined();
  });

  it('blocks Pro at 50 and allows it at 49', async () => {
    await expect(
      enforcePlanLimit(
        makeSupabase({ planSlug: 'pro', count: 50 }),
        'o',
        'contentDocumentsPerMonth'
      )
    ).rejects.toThrow(PlanLimitExceededError);
    await expect(
      enforcePlanLimit(
        makeSupabase({ planSlug: 'pro', count: 49 }),
        'o',
        'contentDocumentsPerMonth'
      )
    ).resolves.toBeUndefined();
  });

  it('does not block Growth (CRAFT unlimited on the live page)', async () => {
    const supabase = makeSupabase({ planSlug: 'growth', count: 5_000 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'contentDocumentsPerMonth')
    ).resolves.toBeUndefined();
  });
});

describe('competitors — enforced on the new-domain delta', () => {
  it('blocks Starter adding a 6th tracked competitor', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 5 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'competitors', 1)
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('blocks a bulk add that would overshoot (3 existing + 3 new > 5)', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 3 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'competitors', 3)
    ).rejects.toThrow(PlanLimitExceededError);
  });

  it('allows a bulk add that exactly fills the plan (3 existing + 2 new = 5)', async () => {
    const supabase = makeSupabase({ planSlug: 'starter', count: 3 });
    await expect(
      enforcePlanLimit(supabase, 'org-1', 'competitors', 2)
    ).resolves.toBeUndefined();
  });
});

describe('checkPlanLimit reports without throwing', () => {
  it('returns the allowed flag and the numbers behind it', async () => {
    const supabase = makeSupabase({ planSlug: 'pro', count: 5 });
    await expect(checkPlanLimit(supabase, 'org-1', 'seats')).resolves.toEqual({
      allowed: false,
      current: 5,
      limit: 5,
      resource: 'seats',
      planSlug: 'pro',
    });
  });
});

describe('planLimitError — shared denial body', () => {
  it('conforms to ApiError and carries upgrade context in details', () => {
    const err = new PlanLimitExceededError({
      allowed: false,
      current: 1,
      limit: 1,
      resource: 'seats',
      planSlug: 'starter',
    });

    const body = planLimitError(err);

    expect(body.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(body.message).toContain('/app/billing');
    expect(body.details).toEqual({
      resource: 'seats',
      current: 1,
      limit: 1,
      planSlug: 'starter',
      upgradeUrl: '/app/billing',
    });
    // ApiError permits only code/message/details — nothing leaks to the top level.
    expect(Object.keys(body).sort()).toEqual(['code', 'details', 'message']);
  });
});
