/**
 * Sentry Server Configuration
 *
 * Initializes Sentry error monitoring on the server side (Node.js
 * runtime for Route Handlers + Server Components + server actions).
 *
 * Phase 0.5 Plan 01:
 *   - DSN now reads SENTRY_DSN (the server-only env), not the public
 *     NEXT_PUBLIC_SENTRY_DSN — so the server can be configured against
 *     a different / dedicated project if needed.
 *   - Shared `scrubSentryEvent` enforces the same PII redaction the
 *     client uses.
 */

import * as Sentry from '@sentry/nextjs';

import { scrubSentryEvent } from './sentry.scrub';

const dsn = process.env.SENTRY_DSN;
const isValidDsn = dsn?.startsWith('https://');

if (isValidDsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: true,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}
