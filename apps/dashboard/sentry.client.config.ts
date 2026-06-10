/**
 * Sentry Client Configuration
 *
 * Initializes Sentry error monitoring on the browser side.
 * DSN is loaded from NEXT_PUBLIC_SENTRY_DSN env var.
 *
 * Phase 0.5 Plan 01: PII scrubbing via shared `scrubSentryEvent` so
 * the same redaction rules apply client / server / edge.
 */

import * as Sentry from '@sentry/nextjs';

import { scrubSentryEvent } from './sentry.scrub';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isValidDsn = dsn?.startsWith('https://');

if (isValidDsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: true,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}
