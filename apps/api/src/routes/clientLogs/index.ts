/**
 * Client Logs Endpoint (Sprint S79)
 *
 * Lightweight logging endpoint for client-side error boundary.
 * Logs to console with structured formatting.
 * No database schema required - purely for runtime stability monitoring.
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { createLogger } from '@pravado/utils';

const logger = createLogger('api:client-logs');

/**
 * Schema for client log entries
 */
const clientLogSchema = z.object({
  errorMessage: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

type ClientLogEntry = z.infer<typeof clientLogSchema>;

/**
 * In-memory log buffer for recent client errors
 * Keeps last 100 entries for debugging
 */
const clientLogBuffer: Array<ClientLogEntry & { receivedAt: string }> = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Add entry to buffer, maintaining max size
 */
function addToBuffer(entry: ClientLogEntry): void {
  clientLogBuffer.push({
    ...entry,
    receivedAt: new Date().toISOString(),
  });

  // Trim buffer if over max size
  while (clientLogBuffer.length > MAX_BUFFER_SIZE) {
    clientLogBuffer.shift();
  }
}

/**
 * Client Logs Routes
 */
export async function clientLogsRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  /**
   * POST /api/v1/logs/client
   *
   * Receives client-side error logs from the ErrorBoundary.
   * Logs to console and stores in memory buffer.
   */
  fastify.post('/client', async (request, reply) => {
    try {
      // Parse and validate the log entry
      const parseResult = clientLogSchema.safeParse(request.body);

      if (!parseResult.success) {
        logger.warn('Invalid client log entry received', {
          errors: parseResult.error.format(),
        });
        return reply.status(400).send({
          ok: false,
          error: 'Invalid log entry format',
        });
      }

      const logEntry = parseResult.data;

      // Log to console with structured format
      logger.error('Client-side error reported', {
        errorMessage: logEntry.errorMessage,
        url: logEntry.url,
        userAgent: logEntry.userAgent,
        timestamp: logEntry.timestamp,
        hasStack: !!logEntry.stack,
        hasComponentStack: !!logEntry.componentStack,
      });

      // Log full stack trace at debug level
      if (logEntry.stack) {
        logger.debug('Client error stack trace', {
          stack: logEntry.stack,
        });
      }

      if (logEntry.componentStack) {
        logger.debug('Client error component stack', {
          componentStack: logEntry.componentStack,
        });
      }

      // Add to in-memory buffer
      addToBuffer(logEntry);

      return reply.send({ ok: true });
    } catch (error) {
      logger.error('Error processing client log', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return reply.status(500).send({
        ok: false,
        error: 'Failed to process log entry',
      });
    }
  });

  /**
   * GET /api/v1/logs/client/recent
   *
   * Returns recent client error logs from the buffer.
   * Useful for debugging and monitoring.
   * Protected - requires authentication.
   */
  fastify.get('/client/recent', async (request, reply) => {
    // Check if user is authenticated (basic protection)
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({
        ok: false,
        error: 'Authentication required',
      });
    }

    return reply.send({
      ok: true,
      count: clientLogBuffer.length,
      logs: clientLogBuffer.slice(-20), // Return last 20 entries
    });
  });

  /**
   * GET /api/v1/logs/client/health
   *
   * Health check for the logging endpoint.
   */
  fastify.get('/client/health', async (_request, reply) => {
    return reply.send({
      ok: true,
      bufferSize: clientLogBuffer.length,
      maxBufferSize: MAX_BUFFER_SIZE,
    });
  });
}

export default clientLogsRoutes;
