/**
 * PR-C — name-bound entitlement value reconciliation (D030).
 *
 * Re-runs the crosswalk on the dimensions in scope (seats / tokens / CRAFT docs)
 * and asserts ZERO violations vs the live pricing page + canon, plus monotonicity
 * by the ratified tier order Starter < Pro < Growth. Rate-limit dimensions
 * (sageProposalsPerMonth, citemindScoresPerMonth) are OUT of scope here and
 * intentionally NOT asserted.
 */

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

import {
  getPlanLimits,
  PLAN_LIMITS,
} from '../src/services/billing/planLimitsService';
import { getPlanCeiling } from '../src/services/mode/modeService';

describe('PR-C — reconciled name-bound values (D030)', () => {
  it('seats match the live pricing page (1 / 5 / 15)', () => {
    expect(getPlanLimits('starter').seats).toBe(1);
    expect(getPlanLimits('pro').seats).toBe(5);
    expect(getPlanLimits('growth').seats).toBe(15);
  });

  it('CRAFT docs/mo match the page (10 / 50 / Unlimited)', () => {
    expect(getPlanLimits('starter').contentDocumentsPerMonth).toBe(10);
    expect(getPlanLimits('pro').contentDocumentsPerMonth).toBe(50);
    expect(getPlanLimits('growth').contentDocumentsPerMonth).toBe(999_999);
  });

  it('LLM tokens/mo are the canon values billing_plans mirrors (2.5M / 5M / 50M)', () => {
    expect(getPlanLimits('starter').llmTokensPerMonth).toBe(2_500_000);
    expect(getPlanLimits('pro').llmTokensPerMonth).toBe(5_000_000);
    expect(getPlanLimits('growth').llmTokensPerMonth).toBe(50_000_000);
  });

  it('is monotonic by ratified tier rank (Starter < Pro < Growth)', () => {
    const s = getPlanLimits('starter');
    const p = getPlanLimits('pro');
    const g = getPlanLimits('growth');
    expect(s.seats).toBeLessThan(p.seats);
    expect(p.seats).toBeLessThan(g.seats);
    expect(s.llmTokensPerMonth).toBeLessThan(p.llmTokensPerMonth);
    expect(p.llmTokensPerMonth).toBeLessThan(g.llmTokensPerMonth);
    expect(s.contentDocumentsPerMonth).toBeLessThanOrEqual(
      p.contentDocumentsPerMonth
    );
    expect(p.contentDocumentsPerMonth).toBeLessThan(g.contentDocumentsPerMonth);
  });

  it('parked dimensions are UNCHANGED (out of scope — guardrail workstream)', () => {
    // autopilotMode is to-spec (D029) and must stay; ceiling reads it.
    expect(getPlanCeiling('pro')).toBe('autopilot');
    expect(getPlanCeiling('growth')).toBe('autopilot');
    expect(getPlanCeiling('starter')).toBe('copilot');
    // journalistContacts was parked here at PR-C time and has since been
    // RETIRED (guardrail build #1): the stored-contact count model is replaced
    // by §10.3 daily caps, and its counter read a table that does not exist.
    expect('journalistContacts' in PLAN_LIMITS.pro).toBe(false);
  });
});
