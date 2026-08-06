/**
 * Server-side pitch personalization scorer (Lane B).
 *
 * Canon: PR_WORK_SURFACE_CONTRACT.md §7.1/§7.2 — personalization gate
 *   (> 40% to send; block < 40, warn 40-60) and PR_PILLAR_MODEL.md:135-136
 *   (score < 60 warns, score < 40 blocks; generic templates are not sendable).
 *
 * WHY SERVER-SIDE: today's personalization value is a bypassable client-side
 * heuristic. The send chokepoint must NOT trust the client. This module
 * recomputes the score from the actual outbound content + recipient context
 * so the gate is trustworthy. It is deterministic and pure (no I/O), which
 * makes it directly unit-testable.
 *
 * The score is a 0-100 integer. It rewards concrete personalization signals
 * (recipient name, outlet, beat, a specific recent-work hook, adequate
 * substance) and hard-caps generic/templated pitches (unfilled merge tokens,
 * "Dear Journalist", empty bodies).
 */

export interface PersonalizationInput {
  subject: string;
  bodyText: string;
  /** Recipient identity/context used to detect genuine personalization. */
  recipient: {
    name?: string | null;
    outlet?: string | null;
    /** Beats / topic tags the contact covers. */
    beats?: string[] | null;
    /** A specific recent-work hook (article title, headline, angle). */
    recentWorkHook?: string | null;
  };
}

export interface PersonalizationResult {
  /** 0-100 integer. */
  score: number;
  /** True when score < 40 — hard block. */
  blocked: boolean;
  /** True when 40 <= score < 60 — warn but allow. */
  warned: boolean;
  /** Human-readable signals that fired, for logging + improvement UI. */
  signals: string[];
  /** Reasons the score was capped/penalized. */
  penalties: string[];
}

export const PERSONALIZATION_BLOCK_THRESHOLD = 40;
export const PERSONALIZATION_WARN_THRESHOLD = 60;

/** Merge-token / generic-greeting patterns that indicate an unpersonalized template. */
const UNFILLED_TOKEN_RE =
  /\{\{?\s*[a-z0-9_.]+\s*\}?\}|\[\s*[A-Z_ ]+\s*\]|%[A-Z_]+%/g;
const GENERIC_GREETING_RE =
  /\b(dear (journalist|editor|reporter|sir\/madam|sir or madam)|to whom it may concern|hi there|hello there)\b/i;

function normalize(s: string | null | undefined): string {
  return (s ?? '').toLowerCase();
}

function firstName(name?: string | null): string {
  const n = (name ?? '').trim();
  if (!n) return '';
  return n.split(/\s+/)[0].toLowerCase();
}

/**
 * Compute the server-side personalization score.
 *
 * Scoring (max 100):
 *   +25  recipient first name present in subject or body
 *   +20  outlet referenced in body
 *   +20  at least one of the contact's beats referenced
 *   +25  a specific recent-work hook referenced
 *   +10  adequate substance (body >= 40 words)
 * Hard caps (applied after summing):
 *   - unfilled merge tokens present            -> score capped at 25
 *   - generic greeting and no name match       -> score capped at 30
 *   - body < 8 words (stub)                     -> score capped at 20
 */
export function scorePersonalization(
  input: PersonalizationInput
): PersonalizationResult {
  const subject = normalize(input.subject);
  const body = normalize(input.bodyText);
  const combined = `${subject}\n${body}`;
  const signals: string[] = [];
  const penalties: string[] = [];

  const words = body.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let score = 0;

  // +25 recipient first name
  const fn = firstName(input.recipient.name);
  const nameMatched =
    fn.length >= 2 && new RegExp(`\\b${escapeRe(fn)}\\b`).test(combined);
  if (nameMatched) {
    score += 25;
    signals.push('recipient_name');
  }

  // +20 outlet referenced
  const outlet = normalize(input.recipient.outlet);
  const outletMatched = outlet.length >= 3 && body.includes(outlet);
  if (outletMatched) {
    score += 20;
    signals.push('outlet_reference');
  }

  // +20 beat referenced
  const beats = (input.recipient.beats ?? [])
    .map(normalize)
    .filter((b) => b.length >= 3);
  const beatMatched = beats.some((b) => combined.includes(b));
  if (beatMatched) {
    score += 20;
    signals.push('beat_reference');
  }

  // +25 specific recent-work hook. Require a meaningful token overlap so a
  // generic mention doesn't count — at least one distinctive word (len>=5)
  // from the hook must appear in the body.
  const hook = normalize(input.recipient.recentWorkHook);
  if (hook) {
    const hookTokens = hook.split(/\s+/).filter((t) => t.length >= 5);
    const hookMatched = hookTokens.some((t) => body.includes(t));
    if (hookMatched) {
      score += 25;
      signals.push('recent_work_hook');
    }
  }

  // +10 adequate substance
  if (wordCount >= 40) {
    score += 10;
    signals.push('adequate_substance');
  }

  // ---- Hard caps for template / generic tells ----
  if (UNFILLED_TOKEN_RE.test(combined)) {
    penalties.push('unfilled_merge_tokens');
    score = Math.min(score, 25);
  }
  UNFILLED_TOKEN_RE.lastIndex = 0;

  if (GENERIC_GREETING_RE.test(combined) && !nameMatched) {
    penalties.push('generic_greeting');
    score = Math.min(score, 30);
  }

  if (wordCount < 8) {
    penalties.push('stub_body');
    score = Math.min(score, 20);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    blocked: score < PERSONALIZATION_BLOCK_THRESHOLD,
    warned:
      score >= PERSONALIZATION_BLOCK_THRESHOLD &&
      score < PERSONALIZATION_WARN_THRESHOLD,
    signals,
    penalties,
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
