/**
 * F36 webhook fix — signature verification against the byte-exact raw body.
 *
 * The bug: the route passed `JSON.stringify(request.body)` (a re-serialized
 * parse of the payload) to Stripe's `constructEvent`, which never byte-matches
 * the payload Stripe signed → StripeSignatureVerificationError. The fix passes
 * `request.rawBody` (captured by the `captureRawBody` preParsing hook).
 *
 * These tests use Stripe's own `generateTestHeaderString` to sign a payload,
 * then prove: (a) the raw payload verifies, (b) `JSON.stringify(JSON.parse(...))`
 * of the same payload FAILS (the exact regression), (c) a Buffer raw body — what
 * captureRawBody actually decorates — verifies. All local HMAC; no network.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { describe, it, expect, vi } from 'vitest';

// stripeService.ts loads the pino logger at import time, whose transport
// crashes under vitest — stub it so the service is importable.
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

import { StripeService } from '../src/services/stripeService';

const SECRET = 'whsec_test_secret';
// Deliberately non-canonical (extra spaces + key order) so it differs from
// JSON.stringify(JSON.parse(payload)).
const RAW_PAYLOAD =
  '{"id":"evt_1",  "type":"checkout.session.completed",  "data":{"object":{"id":"cs_1"}}}';

function makeService() {
  return new StripeService(
    {} as unknown as SupabaseClient,
    'sk_test_fake',
    SECRET
  );
}

function signHeader(payload: string): string {
  const stripe = new Stripe('sk_test_fake');
  return stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
}

describe('verifyWebhookSignature — raw body (F36)', () => {
  it('verifies when passed the byte-exact raw payload Stripe signed', () => {
    const event = makeService().verifyWebhookSignature(
      RAW_PAYLOAD,
      signHeader(RAW_PAYLOAD)
    );
    expect(event.type).toBe('checkout.session.completed');
    expect(event.id).toBe('evt_1');
  });

  it('FAILS when passed JSON.stringify(parsed) instead of the raw body (the bug)', () => {
    const reStringified = JSON.stringify(JSON.parse(RAW_PAYLOAD));
    // Sanity: the old approach really does produce different bytes.
    expect(reStringified).not.toBe(RAW_PAYLOAD);
    expect(() =>
      makeService().verifyWebhookSignature(
        reStringified,
        signHeader(RAW_PAYLOAD)
      )
    ).toThrow();
  });

  it('accepts a Buffer raw body (what captureRawBody decorates)', () => {
    const event = makeService().verifyWebhookSignature(
      Buffer.from(RAW_PAYLOAD, 'utf8'),
      signHeader(RAW_PAYLOAD)
    );
    expect(event.type).toBe('checkout.session.completed');
  });
});
