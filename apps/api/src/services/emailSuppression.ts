/**
 * Shared email normalization + hashing for durable suppression (Lane B).
 *
 * Canon §12.3: opt-out emails are hashed and stored in
 * `suppressed_email_hashes`; the hash is checked before any send/enrichment so
 * suppression is durable and backfill-independent (an opt-out received before
 * the 784K backfill must never be lost). Both the send chokepoint (read path)
 * and the webhook intake (write path) use these helpers so the hashes match.
 */

import { createHash } from 'crypto';

/** Canonical email normalization: trim + lowercase. */
export function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}

/** SHA-256 of the normalized email — the suppression key. */
export function hashEmail(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}
