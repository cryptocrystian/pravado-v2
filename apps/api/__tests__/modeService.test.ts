/**
 * PR-1 Keystone — modeService unit tests.
 *
 * Covers D026 plan-default compliance (per pillar/tier), plan ceiling gating,
 * the resolve hierarchy (user → plan_default → fallback), ceiling clamp, and
 * setPillarMode upsert + enum validation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

// planLimitsService (imported transitively) loads the pino logger at import time,
// whose transport crashes under vitest — stub it.
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

import {
  getPlanDefaultMode,
  getPlanCeiling,
  resolveOrgModeState,
  setPillarMode,
} from '../src/services/mode/modeService';

function makeSupabase(opts: {
  planId?: string | null;
  planSlug?: string | null;
  prefs?: Array<{ pillar: string; mode: string }>;
  upsertError?: unknown;
}) {
  const upsertSpy = vi.fn();
  const client = {
    from(table: string) {
      if (table === 'org_billing_state') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.planId ? { plan_id: opts.planId } : null,
              }),
            }),
          }),
        };
      }
      if (table === 'billing_plans') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.planSlug ? { slug: opts.planSlug } : null,
              }),
            }),
          }),
        };
      }
      // user_mode_preferences
      return {
        select: () => ({
          eq: () => ({ eq: async () => ({ data: opts.prefs ?? [] }) }),
        }),
        upsert: (payload: unknown, options: unknown) => {
          upsertSpy(payload, options);
          return Promise.resolve({ error: opts.upsertError ?? null });
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, upsertSpy };
}

describe('getPlanDefaultMode — D026 compliance', () => {
  it('defaults every non-enterprise tier to copilot', () => {
    for (const slug of ['starter', 'growth', 'pro', 'trial']) {
      expect(getPlanDefaultMode(slug)).toBe('copilot');
    }
  });
  it('defaults enterprise to manual', () => {
    expect(getPlanDefaultMode('enterprise')).toBe('manual');
  });
});

describe('getPlanCeiling — autopilot gated on plan capability', () => {
  // PR-4a: pro (H1) and enterprise (H2) now carry autopilotMode=true.
  it('growth / pro / enterprise (autopilotMode=true) → autopilot ceiling', () => {
    for (const slug of ['growth', 'pro', 'enterprise']) {
      expect(getPlanCeiling(slug)).toBe('autopilot');
    }
  });
  it('starter / trial (autopilotMode=false) → copilot ceiling', () => {
    for (const slug of ['starter', 'trial']) {
      expect(getPlanCeiling(slug)).toBe('copilot');
    }
  });
});

describe('resolveOrgModeState — resolution hierarchy', () => {
  it('uses the explicit user preference when set (source=user)', async () => {
    const { client } = makeSupabase({
      planId: 'plan-growth',
      planSlug: 'growth',
      prefs: [{ pillar: 'pr', mode: 'autopilot' }],
    });
    const state = await resolveOrgModeState(client, 'user-1', 'org-1');
    expect(state.pillars.pr).toMatchObject({
      mode: 'autopilot',
      source: 'user',
      floor: 'manual',
      ceiling: 'autopilot',
      lockedByAdmin: false,
    });
    // untouched pillars fall back to the plan default
    expect(state.pillars.content).toMatchObject({
      mode: 'copilot',
      source: 'plan_default',
    });
  });

  it('falls back to the plan default (D026) when no user pref', async () => {
    // starter: copilot default (D026) + copilot ceiling (no autopilot capability).
    const { client } = makeSupabase({
      planId: 'plan-starter',
      planSlug: 'starter',
    });
    const state = await resolveOrgModeState(client, 'user-1', 'org-1');
    expect(state.pillars.seo).toMatchObject({
      mode: 'copilot',
      source: 'plan_default',
      ceiling: 'copilot',
    });
  });

  it('falls back to copilot when the org has no plan (source=fallback)', async () => {
    const { client } = makeSupabase({ planId: null });
    const state = await resolveOrgModeState(client, 'user-1', 'org-1');
    expect(state.pillars.pr).toMatchObject({
      mode: 'copilot',
      source: 'fallback',
      ceiling: 'copilot',
    });
  });

  it('clamps a user preference that exceeds the plan ceiling', async () => {
    // starter has no autopilot → ceiling copilot; a stored autopilot clamps down.
    const { client } = makeSupabase({
      planId: 'plan-starter',
      planSlug: 'starter',
      prefs: [{ pillar: 'content', mode: 'autopilot' }],
    });
    const state = await resolveOrgModeState(client, 'user-1', 'org-1');
    expect(state.pillars.content).toMatchObject({
      mode: 'copilot', // clamped
      source: 'user',
      ceiling: 'copilot',
    });
  });
});

describe('setPillarMode', () => {
  it('upserts on the composite key and returns the new state', async () => {
    const { client, upsertSpy } = makeSupabase({
      planId: 'plan-growth',
      planSlug: 'growth',
    });
    const result = await setPillarMode(
      client,
      'user-1',
      'org-1',
      'pr',
      'autopilot'
    );
    expect(result.ok).toBe(true);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        org_id: 'org-1',
        pillar: 'pr',
        mode: 'autopilot',
      }),
      { onConflict: 'user_id,org_id,pillar' }
    );
    if (result.ok) {
      expect(result.state).toMatchObject({ mode: 'autopilot', source: 'user' });
    }
  });

  it('rejects an invalid pillar', async () => {
    const { client, upsertSpy } = makeSupabase({});
    const result = await setPillarMode(client, 'u', 'o', 'calendar', 'copilot');
    expect(result).toEqual({ ok: false, reason: 'invalid_pillar' });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('rejects an invalid mode', async () => {
    const { client, upsertSpy } = makeSupabase({});
    const result = await setPillarMode(client, 'u', 'o', 'pr', 'turbo');
    expect(result).toEqual({ ok: false, reason: 'invalid_mode' });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('returns write_failed when the upsert errors', async () => {
    const { client } = makeSupabase({ upsertError: { message: 'db down' } });
    const result = await setPillarMode(client, 'u', 'o', 'pr', 'copilot');
    expect(result).toEqual({ ok: false, reason: 'write_failed' });
  });
});

describe('setPillarMode — plan-tier ceiling enforcement (PR-4a, money-code)', () => {
  const PILLARS = ['pr', 'content', 'seo'] as const;

  // Tier → whether Autopilot is within the plan ceiling (PLAN_LIMITS.autopilotMode).
  // starter/trial: false (ceiling Copilot). pro (H1) / growth / enterprise (H2): true.
  const AUTOPILOT_ALLOWED: Record<string, boolean> = {
    starter: false,
    trial: false,
    pro: true,
    growth: true,
    enterprise: true,
  };

  for (const slug of Object.keys(AUTOPILOT_ALLOWED)) {
    for (const pillar of PILLARS) {
      it(`${slug} requesting autopilot on ${pillar} → ${
        AUTOPILOT_ALLOWED[slug] ? 'allowed' : 'clamped to copilot'
      }`, async () => {
        const { client, upsertSpy } = makeSupabase({
          planId: `plan-${slug}`,
          planSlug: slug,
        });
        const result = await setPillarMode(
          client,
          'u',
          'o',
          pillar,
          'autopilot'
        );
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        if (AUTOPILOT_ALLOWED[slug]) {
          // Within ceiling: persisted + returned as requested, source `user`.
          expect(result.state).toMatchObject({
            mode: 'autopilot',
            source: 'user',
            ceiling: 'autopilot',
          });
          expect(result.state.requestedMode).toBeUndefined();
          expect(upsertSpy).toHaveBeenCalledWith(
            expect.objectContaining({ pillar, mode: 'autopilot' }),
            { onConflict: 'user_id,org_id,pillar' }
          );
        } else {
          // Above ceiling: clamped down, source `clamped`, requestedMode echoed.
          expect(result.state).toMatchObject({
            mode: 'copilot',
            source: 'clamped',
            ceiling: 'copilot',
            requestedMode: 'autopilot',
          });
          // Fail-closed: DB is written with the CLAMPED value, never `autopilot`.
          expect(upsertSpy).toHaveBeenCalledWith(
            expect.objectContaining({ pillar, mode: 'copilot' }),
            { onConflict: 'user_id,org_id,pillar' }
          );
        }
      });
    }
  }

  it('a request at/below the ceiling is NOT flagged clamped (copilot on starter)', async () => {
    const { client, upsertSpy } = makeSupabase({
      planId: 'plan-starter',
      planSlug: 'starter',
    });
    const result = await setPillarMode(client, 'u', 'o', 'pr', 'copilot');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state).toMatchObject({ mode: 'copilot', source: 'user' });
    expect(result.state.requestedMode).toBeUndefined();
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'copilot' }),
      { onConflict: 'user_id,org_id,pillar' }
    );
  });

  it('no plan (null plan_id) → copilot ceiling clamps an autopilot request', async () => {
    const { client, upsertSpy } = makeSupabase({ planId: null });
    const result = await setPillarMode(client, 'u', 'o', 'seo', 'autopilot');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state).toMatchObject({
      mode: 'copilot',
      source: 'clamped',
      ceiling: 'copilot',
      requestedMode: 'autopilot',
    });
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'copilot' }),
      { onConflict: 'user_id,org_id,pillar' }
    );
  });
});
