/**
 * Sentry PII scrubbing — shared `beforeSend` builder for the three
 * Sentry config files (sentry.client.config.ts, sentry.server.config.ts,
 * sentry.edge.config.ts).
 *
 * Phase 0.5 Plan 01. Per architect refinement, the scrubber:
 *
 *   - redacts `event.user.email`, `event.user.username`, `event.user.ip_address`
 *   - redacts `event.request.cookies` + `event.request.headers.cookie`
 *   - redacts `event.request.headers.authorization`
 *   - walks `event.extra` + `event.tags` recursively and redacts any
 *     value matching an email regex
 *   - drops `event.request.data` entirely on `/webhooks/*` routes
 *     (webhooks carry signed payloads that may contain customer PII)
 *   - drops the event entirely when the exception value contains
 *     `JWT` or `Bearer ` (token-leak guard)
 *
 * Implementation note: the scrubber MUST be defensive — Sentry events
 * arrive with `unknown`-shaped payloads, and a throw here would block
 * legitimate error reporting. Every branch is null/undefined-safe.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/01-sentry.md
 */

const REDACTED = '[redacted]';

// Practical email regex — looser than RFC 5322 on purpose. Optimized
// for catching addresses embedded in error messages and meta blobs, not
// for accepting/rejecting form input.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Sentry's published Event/SentryRequest types vary across versions and
// runtime targets (browser / Node / edge). Treat the event as an opaque
// bag and access fields defensively rather than importing a concrete
// type. Returning `null` from beforeSend drops the event.
//
// Internal shape we walk over. We accept Sentry's ErrorEvent at the
// public boundary and cast to this internal shape — see
// `scrubSentryEvent` below.
interface SentryEventLike {
  request?: {
    url?: string;
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, unknown>;
  };
  user?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  exception?: {
    values?: Array<{ value?: string }>;
  };
}

function redactEmailsInString(s: string): string {
  return s.replace(EMAIL_RE, REDACTED);
}

/**
 * Walk an arbitrary value, replacing string occurrences that match the
 * email regex. Mutates in place for objects/arrays so the caller's
 * reference stays valid for the rest of `beforeSend`.
 *
 * Depth cap (8) prevents pathological / cyclic structures from running
 * away — Sentry payloads are typically depth 2-3.
 */
function walkRedactEmails(value: unknown, depth = 0): unknown {
  if (depth > 8) return value;
  if (typeof value === 'string') return redactEmailsInString(value);
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = walkRedactEmails(value[i], depth + 1);
    }
    return value;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      obj[key] = walkRedactEmails(obj[key], depth + 1);
    }
    return obj;
  }
  return value;
}

/**
 * Apply the architect-mandated PII scrubbing rules to a Sentry event.
 *
 * Accepts and returns Sentry's `ErrorEvent` shape so callers can wire
 * this directly into `Sentry.init({ beforeSend: scrubSentryEvent })`.
 * Returns `null` to drop the event entirely (used for token-leak guard).
 *
 * Internally we treat the event as a permissive `SentryEventLike` bag
 * so we can defensively access nested fields without leaning on
 * Sentry's evolving union types.
 */
export function scrubSentryEvent<T extends object>(
  rawEvent: T | null | undefined
): T | null {
  if (!rawEvent) return null;
  const event = rawEvent as unknown as SentryEventLike;

  // === Token-leak guard ===
  // Drop the whole event if its exception message references a JWT or
  // Bearer token. Sentry will surface the URL/route via breadcrumb so
  // we don't lose all context — we just refuse to ship the secret.
  const firstExceptionValue = event.exception?.values?.[0]?.value;
  if (
    typeof firstExceptionValue === 'string' &&
    (/\bJWT\b/.test(firstExceptionValue) ||
      /Bearer\s+\S+/.test(firstExceptionValue))
  ) {
    return null;
  }

  // === user.* ===
  if (event.user && typeof event.user === 'object') {
    if ('email' in event.user) event.user.email = REDACTED;
    if ('username' in event.user) event.user.username = REDACTED;
    if ('ip_address' in event.user) event.user.ip_address = REDACTED;
  }

  // === request.cookies + request.headers.cookie + request.headers.authorization ===
  if (event.request) {
    if ('cookies' in event.request && event.request.cookies !== undefined) {
      event.request.cookies = REDACTED;
    }
    const headers = event.request.headers;
    if (headers && typeof headers === 'object') {
      // Headers may be cased inconsistently across runtimes. Walk all
      // keys to catch Cookie / cookie / COOKIE etc.
      for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower === 'cookie' || lower === 'authorization') {
          headers[key] = REDACTED;
        }
      }
    }

    // === webhooks/*: drop request.data entirely ===
    const url = typeof event.request.url === 'string' ? event.request.url : '';
    if (url.includes('/webhooks/')) {
      delete event.request.data;
    }
  }

  // === extra + tags: recursive email redact ===
  if (event.extra) walkRedactEmails(event.extra);
  if (event.tags) walkRedactEmails(event.tags);

  return rawEvent;
}
