/**
 * Analytics feature-flag ledger — Wave-2 (flags only flipped for wired tabs).
 *
 * Asserts the *_WIRED flags reflect exactly which Analytics surfaces render
 * REAL data. Overview trend + PR + SEO are wired; Content/Narrative/Reports stay
 * gated because their real sources are not wired (Content rows, AI narrative
 * generator, Share-of-Model engine all absent).
 */

import { FLAGS } from '@pravado/feature-flags';
import { describe, expect, it } from 'vitest';

describe('Analytics WIRED flags', () => {
  it('flips only the tabs backed by real data', () => {
    expect(FLAGS.ANALYTICS_OVERVIEW_TREND_WIRED).toBe(true);
    expect(FLAGS.ANALYTICS_PR_WIRED).toBe(true);
    // Wave-2: Analytics-SEO wired to /api/analytics/seo (four real, honest-empty panels).
    expect(FLAGS.ANALYTICS_SEO_WIRED).toBe(true);
  });

  it('keeps unwired tabs gated (honest — no real source)', () => {
    expect(FLAGS.ANALYTICS_OVERVIEW_NARRATIVE_WIRED).toBe(false);
    expect(FLAGS.ANALYTICS_CONTENT_WIRED).toBe(false);
    expect(FLAGS.ANALYTICS_REPORTS_WIRED).toBe(false);
  });
});
