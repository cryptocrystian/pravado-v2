/**
 * PR-A — priceIdMap unit tests. The single slug↔Stripe-price-ID source
 * (env-backed). Pins that `pro` is now present (#76) and the reverse index
 * (#75 webhook resolution) returns null for unmapped IDs rather than guessing.
 */

import { describe, it, expect } from 'vitest';

import {
  buildPriceIdMap,
  priceIdForSlug,
  slugForPriceId,
  type PriceIdEnv,
} from '../src/services/billing/priceIdMap';

const ENV: PriceIdEnv = {
  STRIPE_PRICE_STARTER: 'price_starter',
  STRIPE_PRICE_PRO: 'price_pro',
  STRIPE_PRICE_GROWTH: 'price_growth',
  STRIPE_PRICE_ENTERPRISE: undefined, // sales-led, no self-serve price
};

describe('buildPriceIdMap', () => {
  it('includes pro (the #76 gap)', () => {
    const map = buildPriceIdMap(ENV);
    expect(map).toMatchObject({
      starter: 'price_starter',
      pro: 'price_pro',
      growth: 'price_growth',
    });
    expect(Object.keys(map)).toContain('pro');
  });
});

describe('priceIdForSlug', () => {
  it('resolves each sellable tier', () => {
    expect(priceIdForSlug(ENV, 'starter')).toBe('price_starter');
    expect(priceIdForSlug(ENV, 'pro')).toBe('price_pro');
    expect(priceIdForSlug(ENV, 'growth')).toBe('price_growth');
  });
  it('returns undefined for enterprise (not self-serve) and unknown slugs', () => {
    expect(priceIdForSlug(ENV, 'enterprise')).toBeUndefined();
    expect(priceIdForSlug(ENV, 'nope')).toBeUndefined();
  });
});

describe('slugForPriceId (reverse — webhook resolution)', () => {
  it('maps a known price ID back to its slug', () => {
    expect(slugForPriceId(ENV, 'price_starter')).toBe('starter');
    expect(slugForPriceId(ENV, 'price_pro')).toBe('pro');
    expect(slugForPriceId(ENV, 'price_growth')).toBe('growth');
  });
  it('returns null for an unmapped or empty price ID (no silent fallback)', () => {
    expect(slugForPriceId(ENV, 'price_unknown')).toBeNull();
    expect(slugForPriceId(ENV, null)).toBeNull();
    expect(slugForPriceId(ENV, undefined)).toBeNull();
    // An unconfigured tier's undefined must not match another undefined env.
    expect(slugForPriceId(ENV, '')).toBeNull();
  });
});
