/**
 * Follow-ups to #121 (money-code):
 *   (a) plan-limit denials return 402 Payment Required, not 403.
 *   (b) onboarding URL imports (metadata.source='onboarding') are exempt from
 *       the contentDocumentsPerMonth counter.
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

import { PLAN_LIMIT_STATUS } from '../src/services/billing/planLimitReply';
import { checkPlanLimit } from '../src/services/billing/planLimitsService';

describe('(a) plan-limit denials use 402 Payment Required', () => {
  it('PLAN_LIMIT_STATUS is 402', () => {
    expect(PLAN_LIMIT_STATUS).toBe(402);
  });
});

describe('(b) contentDocumentsPerMonth exempts onboarding imports', () => {
  it('applies the source!=onboarding (null-safe) filter to the count query', async () => {
    const orClauses: string[] = [];

    // Records the `.or(...)` predicate handed to the content_items count query.
    const countQuery = () => {
      const q: any = {
        eq: () => q,
        gte: () => q,
        or: (clause: string) => {
          orClauses.push(clause);
          return Promise.resolve({ count: 3 });
        },
      };
      return q;
    };

    const singleRow = (data: unknown) => ({
      select: () => ({ eq: () => ({ single: async () => ({ data }) }) }),
    });

    const supabase = {
      from: (table: string) => {
        if (table === 'org_billing_state') {
          return singleRow({
            plan_id: 'plan-uuid',
            subscription_status: 'active',
          });
        }
        if (table === 'billing_plans') {
          return singleRow({ slug: 'starter' });
        }
        // content_items count path
        return { select: () => countQuery() };
      },
    } as unknown as SupabaseClient;

    const result = await checkPlanLimit(
      supabase,
      'org-1',
      'contentDocumentsPerMonth'
    );

    // The onboarding-exemption predicate was applied…
    expect(orClauses).toEqual([
      'metadata->>source.is.null,metadata->>source.neq.onboarding',
    ]);
    // …and the (exempted) count drives the decision: 3 + 1 <= starter's 10.
    expect(result.current).toBe(3);
    expect(result.allowed).toBe(true);
  });
});
