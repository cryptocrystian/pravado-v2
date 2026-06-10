/**
 * Sentry Edge Configuration
 *
 * Initializes Sentry for edge runtime (middleware, edge API routes).
 *
 * Phase 0.5 Plan 01:
 *   - DSN now reads SENTRY_DSN — matches the server config, since the
 *     edge runtime is also server-side from the user's perspective.
 *   - Shared `scrubSentryEvent` enforces the same PII redaction.
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
