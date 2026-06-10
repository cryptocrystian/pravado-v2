/**
 * Browser-side structured logger.
 *
 * Phase 0.5 Plan 02 (logger). Plan 01 (Sentry) replaced the original
 * `globalThis.Sentry` lookup with a real `@sentry/nextjs` import — the
 * `beforeSend` hook in `sentry.client.config.ts` applies the architect-
 * mandated PII scrubbing before anything leaves the browser.
 *
 * Emits JSON to `console.*` so Vercel + the browser devtools both see
 * structured records, and routes `warn`+ events to Sentry directly.
 *
 * Usage:
 *
 *   const log = clientLogger.child('content:editor');
 *   log.info('Asset loaded', { assetId });
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/02-logging.md
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = unknown;

// SeverityLevel string union per @sentry/nextjs. We narrow here so the
// `captureMessage` call below stays typed without pulling Sentry's
// internal types into our public API.
type SentrySeverity = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

const LEVEL_TO_SEVERITY: Record<LogLevel, SentrySeverity> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

function normalize(meta: unknown): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined;
  if (meta instanceof Error) return { err: meta };
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return { data: meta };
}

function emit(
  level: LogLevel,
  context: string,
  message: string,
  meta?: LogMeta
): void {
  const record: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...normalize(meta),
  };
  const line = JSON.stringify(record);
  // Browser devtools render the JSON cleanly; Vercel ingests it as
  // structured logs from the SSR / RSC side.
  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }

  if (level === 'warn' || level === 'error') {
    // Sentry runs even when its SDK isn't initialized — its public API
    // is no-op-safe (captureException/captureMessage return immediately
    // when there is no client). No conditional guard needed; the
    // `beforeSend` hook in sentry.client.config.ts applies PII scrubbing.
    if (meta instanceof Error) {
      Sentry.captureException(meta);
    } else {
      Sentry.captureMessage(
        `[${context}] ${message}`,
        LEVEL_TO_SEVERITY[level]
      );
    }
  }
}

export interface ClientLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  child(context: string): ClientLogger;
}

function makeLogger(context: string): ClientLogger {
  return {
    debug: (m, meta) => emit('debug', context, m, meta),
    info: (m, meta) => emit('info', context, m, meta),
    warn: (m, meta) => emit('warn', context, m, meta),
    error: (m, meta) => emit('error', context, m, meta),
    child: (sub) => makeLogger(`${context}:${sub}`),
  };
}

/**
 * Root client logger. Most callers should namespace with
 * `clientLogger.child('feature:area')` so log lines are easy to filter.
 */
export const clientLogger: ClientLogger = makeLogger('dashboard');

/**
 * Drop-in replacement for `@pravado/utils.createLogger` on the dashboard
 * side. Returns a `ClientLogger` bound to the given context — the same
 * `(message, meta?)` signature as the previous utils.Logger.
 */
export function createLogger(context: string): ClientLogger {
  return makeLogger(context);
}
