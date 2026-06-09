/**
 * Pino-backed structured logging for apps/api.
 *
 * Phase 0.5 Plan 02. Three surfaces:
 *
 *   1. `request.log` — Pino child automatically populated by Fastify
 *      (see `apps/api/src/server.ts` `logger` config). Use inside any
 *      route handler / hook:
 *
 *        request.log.info({ user_id }, 'foo lookup');
 *
 *      `request.log` already carries `requestId`, so callers don't
 *      need to repeat it. This is the idiomatic Pino API.
 *
 *   2. `createLogger(context)` — backward-compatible drop-in for the
 *      `@pravado/utils` Logger. Same `(message, meta?)` signature as
 *      before, but emits via Pino under the hood. Use for boot-time
 *      and non-request-scoped service code:
 *
 *        const logger = createLogger('api:scheduler');
 *        logger.info('Scheduler tick', { tick: 1 });
 *
 *   3. `serviceLogger` — the raw Pino instance, for new code that
 *      prefers Pino's `(obj, msg)` signature directly:
 *
 *        const logger = serviceLogger.child({ context: 'api:foo' });
 *        logger.info({ user_id }, 'foo lookup');
 *
 * Format: production emits raw JSON to stdout (Render parses it
 * natively). Development uses pino-pretty for readable colored output.
 *
 * Level: `LOG_LEVEL` env var; defaults to `info`.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/02-logging.md
 */

import { pino } from 'pino';
import type { Logger, LoggerOptions } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? 'info';

const baseOptions: LoggerOptions = {
  level,
  // `base: null` removes Pino's default `pid`/`hostname` — Render
  // surfaces those at the platform level already.
  base: null,
  // ISO timestamp at the top level — matches the existing structured
  // log convention from packages/utils Logger so log parsers don't
  // need to re-learn the shape.
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

const transport: LoggerOptions['transport'] = isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    };

/**
 * Shared Fastify logger options. Pass to `Fastify({ logger })` so
 * `request.log` becomes a Pino child carrying `requestId` automatically.
 */
export const fastifyLoggerOptions: LoggerOptions = {
  ...baseOptions,
  transport,
};

/**
 * Raw Pino instance — for code that prefers the `(obj, msg)` signature
 * directly. Most callers should prefer `createLogger(context)` below.
 */
export const serviceLogger: Logger = pino({ ...baseOptions, transport });

// ----------------------------------------------------------------------------
// Backward-compat shim — drop-in replacement for `@pravado/utils.createLogger`.
// Preserves the (message, meta?) call signature so the per-directory
// console.* → logger.* sweep doesn't have to also migrate 450+ call sites
// from (msg, meta) to Pino's native (obj, msg). Each "context" string
// becomes a Pino child binding.
// ----------------------------------------------------------------------------

/**
 * Compat meta is intentionally `unknown` so existing call sites — many of
 * which pass `Error` from a `catch (err) {}` block or a `PostgrestError`
 * from Supabase — type-check without per-call narrowing. The wrapper
 * methods below normalize into a shape Pino understands.
 */
type LogMeta = unknown;

export interface CompatLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

function normalizeMeta(meta: unknown): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined;
  if (meta instanceof Error) {
    return { err: meta };
  }
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    // Object-like (POJOs, Supabase errors, etc.) — Pino spreads these
    // into the log record, matching the previous utils.Logger shape.
    return meta as Record<string, unknown>;
  }
  // Primitive / array — wrap so Pino still emits a structured record.
  return { data: meta };
}

class CompatLoggerImpl implements CompatLogger {
  constructor(private readonly child: Logger) {}

  debug(message: string, meta?: LogMeta): void {
    const m = normalizeMeta(meta);
    if (m) this.child.debug(m, message);
    else this.child.debug(message);
  }
  info(message: string, meta?: LogMeta): void {
    const m = normalizeMeta(meta);
    if (m) this.child.info(m, message);
    else this.child.info(message);
  }
  warn(message: string, meta?: LogMeta): void {
    const m = normalizeMeta(meta);
    if (m) this.child.warn(m, message);
    else this.child.warn(message);
  }
  error(message: string, meta?: LogMeta): void {
    const m = normalizeMeta(meta);
    if (m) this.child.error(m, message);
    else this.child.error(message);
  }
}

/**
 * Drop-in replacement for `@pravado/utils.createLogger`. Returns a
 * `(message, meta?)`-shaped wrapper around a Pino child bound to
 * `{ context }`. Existing call sites:
 *
 *   const logger = createLogger('api:foo');
 *   logger.info('Did the thing', { user_id });
 *
 * continue to work unchanged.
 */
export function createLogger(context: string): CompatLogger {
  return new CompatLoggerImpl(serviceLogger.child({ context }));
}
