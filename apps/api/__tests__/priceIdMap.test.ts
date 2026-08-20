/**
 * PR-A — priceIdMap unit tests. The single slug↔Stripe-price-ID source
 * (env-backed). Pins that `pro` is now present (#76) and the reverse index
 * (#75 webhook resolution) returns null for unmapped IDs rather than guessing.
 *
 * Also pins the Growth→Scale rename (2026-08-20): `scale` is the canonical slug,
 * and the legacy `growth` slug + STRIPE_PRICE_GROWTH env resolve to it during the
 * Render env rollout.
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
  STRIPE_PRICE_SCALE: 'price_scale',
  STRIPE_PRICE_ENTERPRISE: undefined, // sales-led, no self-serve price
};

// Legacy rollout env: only the pre-rename STRIPE_PRICE_GROWTH is set (Render env
// not yet renamed). `scale` must still resolve via the fallback.
const LEGACY_ENV: PriceIdEnv = {
  STRIPE_PRICE_STARTER: 'price_starter',
  STRIPE_PRICE_PRO: 'price_pro',
  STRIPE_PRICE_GROWTH: 'price_growth',
  STRIPE_PRICE_ENTERPRISE: undefined,
};

describe('buildPriceIdMap', () => {
  it('includes pro (the #76 gap) and the canonical scale key', () => {
    const map = buildPriceIdMap(ENV);
    expect(map).toMatchObject({
      starter: 'price_starter',
      pro: 'price_pro',
      scale: 'price_scale',
    });
    expect(Object.keys(map)).toContain('pro');
    // The retired 'growth' slug is no longer a map key.
    expect(Object.keys(map)).not.toContain('growth');
  });

  it('falls back to STRIPE_PRICE_GROWTH for scale during the env rollout', () => {
    const map = buildPriceIdMap(LEGACY_ENV);
    expect(map.scale).toBe('price_growth');
  });
});

describe('priceIdForSlug', () => {
  it('resolves each sellable tier', () => {
    expect(priceIdForSlug(ENV, 'starter')).toBe('price_starter');
    expect(priceIdForSlug(ENV, 'pro')).toBe('price_pro');
    expect(priceIdForSlug(ENV, 'scale')).toBe('price_scale');
  });
  it('normalizes the legacy growth slug to scale', () => {
    expect(priceIdForSlug(ENV, 'growth')).toBe('price_scale');
    // And via the legacy env fallback (scale unset, growth set).
    expect(priceIdForSlug(LEGACY_ENV, 'scale')).toBe('price_growth');
    expect(priceIdForSlug(LEGACY_ENV, 'growth')).toBe('price_growth');
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
    expect(slugForPriceId(ENV, 'price_scale')).toBe('scale');
  });
  it('reverse-maps a legacy STRIPE_PRICE_GROWTH price to the scale slug', () => {
    expect(slugForPriceId(LEGACY_ENV, 'price_growth')).toBe('scale');
  });
  it('returns null for an unmapped or empty price ID (no silent fallback)', () => {
    expect(slugForPriceId(ENV, 'price_unknown')).toBeNull();
    expect(slugForPriceId(ENV, null)).toBeNull();
    expect(slugForPriceId(ENV, undefined)).toBeNull();
    // An unconfigured tier's undefined must not match another undefined env.
    expect(slugForPriceId(ENV, '')).toBeNull();
  });
});
