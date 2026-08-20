/**
 * LLM cost-router policy tests (canon: LLM_COST_ROUTER).
 * Verifies task→tier mapping, env-driven model resolution, and the premium
 * fail-safe (no configured premium → falls back to standard, never a bad id).
 */

import { describe, it, expect, afterEach } from 'vitest';

import {
  TASK_TIER_MAP,
  modelForTier,
  getEconomyModel,
  getPremiumModel,
  getAnthropicModel,
} from '../src/llmRouter';

const ENV_KEYS = [
  'LLM_ANTHROPIC_MODEL',
  'LLM_MODEL_ECONOMY',
  'LLM_MODEL_PREMIUM',
] as const;

function clearEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

afterEach(clearEnv);

describe('TASK_TIER_MAP', () => {
  it('routes high-volume routine tasks to economy', () => {
    expect(TASK_TIER_MAP.citation_scan).toBe('economy');
    expect(TASK_TIER_MAP.brand_mention).toBe('economy');
    expect(TASK_TIER_MAP.classification).toBe('economy');
    expect(TASK_TIER_MAP.extraction).toBe('economy');
    expect(TASK_TIER_MAP.entity_tagging).toBe('economy');
  });

  it('routes generation + reasoning to standard', () => {
    expect(TASK_TIER_MAP.content_generation).toBe('standard');
    expect(TASK_TIER_MAP.brief_generation).toBe('standard');
    expect(TASK_TIER_MAP.pitch_composition).toBe('standard');
    expect(TASK_TIER_MAP.strategy_reasoning).toBe('standard');
  });

  it('routes complex synthesis to premium', () => {
    expect(TASK_TIER_MAP.complex_synthesis).toBe('premium');
  });
});

describe('env-driven tier models', () => {
  it('economy defaults to a Haiku-class model, overridable by env', () => {
    clearEnv();
    expect(getEconomyModel()).toMatch(/haiku/i);
    process.env.LLM_MODEL_ECONOMY = 'self-hosted-economy-v1';
    expect(getEconomyModel()).toBe('self-hosted-economy-v1');
  });

  it('standard defaults to a Sonnet-class model, overridable by env', () => {
    clearEnv();
    expect(getAnthropicModel()).toMatch(/sonnet/i);
    process.env.LLM_ANTHROPIC_MODEL = 'pinned-standard';
    expect(getAnthropicModel()).toBe('pinned-standard');
  });

  it('premium FAILS SAFE to the standard model when unconfigured', () => {
    clearEnv();
    // No LLM_MODEL_PREMIUM → must equal the standard model, never a bad Opus id.
    expect(getPremiumModel()).toBe(getAnthropicModel());
    process.env.LLM_MODEL_PREMIUM = 'opus-when-explicitly-set';
    expect(getPremiumModel()).toBe('opus-when-explicitly-set');
  });
});

describe('modelForTier', () => {
  it('resolves each tier to its env-driven model', () => {
    clearEnv();
    process.env.LLM_ANTHROPIC_MODEL = 'STD';
    process.env.LLM_MODEL_ECONOMY = 'ECO';
    expect(modelForTier('economy')).toBe('ECO');
    expect(modelForTier('standard')).toBe('STD');
    // premium unconfigured → standard fail-safe
    expect(modelForTier('premium')).toBe('STD');
  });
});
