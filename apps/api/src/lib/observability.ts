/**
 * Observability Helpers (Sprint S76)
 *
 * Provides standardized logging wrappers for critical operations.
 * Uses the existing @pravado/utils logger under the hood.
 */

import { createLogger, type Logger } from '@pravado/utils';

/**
 * Operation context for logging
 */
export interface OperationContext {
  orgId?: string;
  userId?: string;
  operationId?: string;
  [key: string]: unknown;
}

/**
 * Wrap an async operation with start/end logging
 */
export async function withOperationLogging<T>(
  logger: Logger,
  operationName: string,
  context: OperationContext,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const operationId = context.operationId || Math.random().toString(36).slice(2, 10);

  logger.info(`Starting: ${operationName}`, {
    operationId,
    ...context,
  });

  try {
    const result = await operation();
    const durationMs = Date.now() - startTime;

    logger.info(`Completed: ${operationName}`, {
      operationId,
      durationMs,
      ...context,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logger.error(`Failed: ${operationName}`, {
      operationId,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
      ...context,
    });

    throw error;
  }
}

/**
 * Create a logger for a specific service
 */
export function createServiceLogger(serviceName: string): Logger {
  return createLogger(`api:service:${serviceName}`);
}

/**
 * Pre-configured loggers for critical services
 */
export const serviceLoggers = {
  unifiedNarrative: createServiceLogger('unified-narrative'),
  insightConflict: createServiceLogger('insight-conflict'),
  realityMap: createServiceLogger('reality-map'),
  crisisResponse: createServiceLogger('crisis-response'),
  unifiedGraph: createServiceLogger('unified-graph'),
  scenarioSimulation: createServiceLogger('scenario-simulation'),
} as const;
