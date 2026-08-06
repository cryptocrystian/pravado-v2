/**
 * Server-side personalization scorer tests (Lane B).
 * Canon: PR_WORK_SURFACE_CONTRACT §7 / PR_PILLAR_MODEL:135-136 (block <40, warn <60).
 */

import { describe, it, expect } from 'vitest';

import {
  PERSONALIZATION_BLOCK_THRESHOLD,
  PERSONALIZATION_WARN_THRESHOLD,
  scorePersonalization,
} from '../src/services/personalizationScore';

const recipient = {
  name: 'Sarah Chen',
  outlet: 'TechCrunch',
  beats: ['enterprise ai', 'startups'],
  recentWorkHook: 'Your recent piece on generative AI adoption in the enterprise',
};

describe('scorePersonalization', () => {
  it('blocks a generic template with no personalization (score < 40)', () => {
    const r = scorePersonalization({
      subject: 'Story idea',
      bodyText: 'Dear Journalist, we have a great product you should cover. Thanks.',
      recipient,
    });
    expect(r.score).toBeLessThan(PERSONALIZATION_BLOCK_THRESHOLD);
    expect(r.blocked).toBe(true);
    expect(r.penalties).toContain('generic_greeting');
  });

  it('hard-caps a pitch that still contains unfilled merge tokens', () => {
    const r = scorePersonalization({
      subject: 'Hi {{first_name}}',
      bodyText:
        'Hi {{first_name}}, I saw your enterprise ai coverage at TechCrunch and your generative work. '.repeat(
          3
        ),
      recipient,
    });
    expect(r.penalties).toContain('unfilled_merge_tokens');
    expect(r.score).toBeLessThanOrEqual(25);
    expect(r.blocked).toBe(true);
  });

  it('warns in the 40-60 band for partial personalization', () => {
    // Name + outlet only -> 25 + 20 = 45 (warn band), no beat/hook/substance.
    const r = scorePersonalization({
      subject: 'Quick note for Sarah',
      bodyText: 'Hi Sarah, I wanted to quickly reach out about TechCrunch and share a quick idea today.',
      recipient,
    });
    expect(r.score).toBeGreaterThanOrEqual(PERSONALIZATION_BLOCK_THRESHOLD);
    expect(r.score).toBeLessThan(PERSONALIZATION_WARN_THRESHOLD);
    expect(r.warned).toBe(true);
    expect(r.blocked).toBe(false);
  });

  it('scores a fully personalized pitch above the warn threshold', () => {
    const body =
      'Hi Sarah, I really valued your recent piece on generative AI adoption in the ' +
      'enterprise for TechCrunch. Given your focus on enterprise ai and startups, I ' +
      'thought you might want an exclusive look at how mid-market teams are actually ' +
      'measuring model citations. Happy to share data and a customer intro this week ' +
      'if useful — no pressure at all, and thanks for the consistently sharp coverage.';
    const r = scorePersonalization({ subject: 'Exclusive for Sarah on enterprise AI', bodyText: body, recipient });
    expect(r.score).toBeGreaterThanOrEqual(PERSONALIZATION_WARN_THRESHOLD);
    expect(r.blocked).toBe(false);
    expect(r.warned).toBe(false);
    expect(r.signals).toEqual(
      expect.arrayContaining(['recipient_name', 'outlet_reference', 'beat_reference', 'recent_work_hook'])
    );
  });

  it('caps a stub body regardless of context', () => {
    const r = scorePersonalization({ subject: 'hey', bodyText: 'Sarah TechCrunch', recipient });
    expect(r.penalties).toContain('stub_body');
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.blocked).toBe(true);
  });
});
