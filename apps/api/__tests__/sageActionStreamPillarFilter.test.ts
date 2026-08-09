/**
 * Regression — sageActionStreamService pillar-filter normalization.
 *
 * Guards the bug where `pillar='seo'` was char-cased to 'Seo' (S + "eo") and
 * therefore matched ZERO `sage_proposals` rows (which store 'SEO'), making the
 * SEO Recommendations surface a permanent false-empty. Asserts each supported
 * pillar filter issues `.eq('pillar', <canonical DB value>)`:
 *   seo → 'SEO'  ·  pr → 'PR'  ·  content → 'Content'
 * The `seo → 'SEO'` case is the load-bearing assertion.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { getActionStreamForOrg } from '../src/services/sage/sageActionStreamService';

const ORG = 'org-1';

/**
 * Chainable Supabase mock that records every `.eq(column, value)` call made on
 * the `sage_proposals` query builder. All builder methods return the same chain,
 * which is thenable and resolves to an empty result (no rows needed — we only
 * inspect the filter arguments).
 */
function makeRecordingSupabase(): {
  supabase: SupabaseClient;
  proposalEqCalls: Array<[string, unknown]>;
} {
  const proposalEqCalls: Array<[string, unknown]> = [];

  const supabase = {
    from(table: string) {
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'order', 'limit']) {
        chain[m] = (...args: unknown[]) => {
          if (table === 'sage_proposals' && m === 'eq') {
            proposalEqCalls.push([args[0] as string, args[1]]);
          }
          return chain;
        };
      }
      (chain as { then: unknown }).then = (
        resolve: (r: { data: unknown; error: unknown }) => unknown
      ) => resolve({ data: [], error: null });
      return chain;
    },
  } as unknown as SupabaseClient;

  return { supabase, proposalEqCalls };
}

describe('getActionStreamForOrg — pillar filter normalization', () => {
  it('maps seo → .eq("pillar", "SEO") (load-bearing)', async () => {
    const { supabase, proposalEqCalls } = makeRecordingSupabase();
    await getActionStreamForOrg(supabase, ORG, { pillar: 'seo' });
    expect(proposalEqCalls).toContainEqual(['pillar', 'SEO']);
    // And never the broken title-cased value.
    expect(proposalEqCalls).not.toContainEqual(['pillar', 'Seo']);
  });

  it('maps pr → .eq("pillar", "PR")', async () => {
    const { supabase, proposalEqCalls } = makeRecordingSupabase();
    await getActionStreamForOrg(supabase, ORG, { pillar: 'pr' });
    expect(proposalEqCalls).toContainEqual(['pillar', 'PR']);
  });

  it('maps content → .eq("pillar", "Content")', async () => {
    const { supabase, proposalEqCalls } = makeRecordingSupabase();
    await getActionStreamForOrg(supabase, ORG, { pillar: 'content' });
    expect(proposalEqCalls).toContainEqual(['pillar', 'Content']);
  });

  it('is case-insensitive on input (SEO → "SEO")', async () => {
    const { supabase, proposalEqCalls } = makeRecordingSupabase();
    await getActionStreamForOrg(supabase, ORG, { pillar: 'SEO' });
    expect(proposalEqCalls).toContainEqual(['pillar', 'SEO']);
  });

  it('does not add a pillar filter when none is provided', async () => {
    const { supabase, proposalEqCalls } = makeRecordingSupabase();
    await getActionStreamForOrg(supabase, ORG);
    expect(proposalEqCalls.some(([col]) => col === 'pillar')).toBe(false);
  });
});
