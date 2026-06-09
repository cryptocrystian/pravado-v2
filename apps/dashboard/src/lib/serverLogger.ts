/**
 * Server-side structured logger for Next.js (Route Handlers, Server
 * Components, server actions).
 *
 * Phase 0.5 Plan 02. Vercel parses JSON logs natively, so this module
 * emits compact JSON records and tags each line with `requestId` if
 * the caller passes one (or if `next/headers` exposes it).
 *
 * Usage:
 *
 *   import { serverLogger } from '@/lib/serverLogger';
 *   const log = serverLogger.child('auth:callback');
 *   log.info('Magic link verified', { userId });
 *
 * For per-request correlation, prefer:
 *
 *   const log = await serverLogger.forRequest('auth:callback');
 *   log.info('Magic link verified', { userId });
 *
 * `forRequest` reads the `x-request-id` header set by the dashboard
 * middleware (see apps/dashboard/src/middleware.ts) so logs across
 * the dashboard server tier carry the same ID as the api side.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/02-logging.md
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = unknown;

function normalize(meta: unknown): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined;
  if (meta instanceof Error) {
    return {
      err: { name: meta.name, message: meta.message, stack: meta.stack },
    };
  }
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return { data: meta };
}

function emit(
  level: LogLevel,
  context: string,
  message: string,
  bindings: Record<string, unknown>,
  meta?: LogMeta
): void {
  const record: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...bindings,
    ...normalize(meta),
  };
  const line = JSON.stringify(record);
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
}

export interface ServerLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  child(subContext: string): ServerLogger;
  forRequest(subContext?: string): Promise<ServerLogger>;
}

function makeLogger(
  context: string,
  bindings: Record<string, unknown> = {}
): ServerLogger {
  const log: ServerLogger = {
    debug: (m, meta) => emit('debug', context, m, bindings, meta),
    info: (m, meta) => emit('info', context, m, bindings, meta),
    warn: (m, meta) => emit('warn', context, m, bindings, meta),
    error: (m, meta) => emit('error', context, m, bindings, meta),
    child: (sub) => makeLogger(`${context}:${sub}`, bindings),
    async forRequest(sub?: string) {
      const ctx = sub ? `${context}:${sub}` : context;
      try {
        // Imported dynamically so this module stays usable from server
        // utilities that aren't inside the Next request lifecycle.
        const { headers } = await import('next/headers');
        const h = await headers();
        const reqId = h.get('x-request-id') ?? undefined;
        return makeLogger(
          ctx,
          reqId ? { ...bindings, requestId: reqId } : bindings
        );
      } catch {
        // Not inside a Next request scope — fall back to the static
        // bindings (no requestId).
        return makeLogger(ctx, bindings);
      }
    },
  };
  return log;
}

/**
 * Root server logger. Namespace with `serverLogger.child('feature:area')`
 * or use `forRequest()` to pick up the per-request `x-request-id`.
 */
export const serverLogger: ServerLogger = makeLogger('dashboard:server');

/**
 * Drop-in replacement for `@pravado/utils.createLogger` on the dashboard
 * server side. Returns a `ServerLogger` bound to the given context.
 */
export function createServerLogger(context: string): ServerLogger {
  return makeLogger(context);
}
