/**
 * Sentry Client Configuration (Sprint S-INT-08)
 *
 * Initializes Sentry error monitoring on the browser side.
 * DSN is loaded from NEXT_PUBLIC_SENTRY_DSN env var.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 10% of transactions in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay configuration — capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Don't send events if no DSN configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
