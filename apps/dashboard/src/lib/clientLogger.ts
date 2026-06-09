/**
 * Browser-side structured logger.
 *
 * Phase 0.5 Plan 02. Emits JSON to `console.*` so Vercel + the browser
 * devtools both see structured records, and routes `warn`+ events to
 * Sentry (Plan 01) when its runtime hook is loaded — guarded so this
 * module works whether or not Plan 01 has merged.
 *
 * Usage:
 *
 *   const log = clientLogger.child('content:editor');
 *   log.info('Asset loaded', { assetId });
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/02-logging.md
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = unknown;

interface SentryLike {
  captureMessage?: (message: string, level?: string) => void;
  captureException?: (error: unknown) => void;
}

// Best-effort, conditional Sentry hook. Plan 01 sets a global
// `window.__sentry__` (or `globalThis.Sentry`) that this module reads
// without a hard import — so the dashboard never errors out if Plan
// 01 hasn't merged yet. Once Plan 01 lands, replace the body of
// `getSentry()` with a real `@sentry/nextjs` import.
function getSentry(): SentryLike | null {
  if (typeof globalThis === 'undefined') return null;
  const candidate = (globalThis as Record<string, unknown>).Sentry as
    | SentryLike
    | undefined;
  return candidate ?? null;
}

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
    const sentry = getSentry();
    if (sentry) {
      if (meta instanceof Error && sentry.captureException) {
        sentry.captureException(meta);
      } else if (sentry.captureMessage) {
        sentry.captureMessage(`[${context}] ${message}`, level);
      }
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
