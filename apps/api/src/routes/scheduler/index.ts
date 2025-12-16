/**
 * Scheduler Routes (Sprint S42)
 * API endpoints for scheduled task management
 */

import { FLAGS } from '@pravado/feature-flags';
import type { UpdateSchedulerTaskInput } from '@pravado/types';
import {
  apiEnvSchema,
  listSchedulerTasksSchema,
  listTaskRunsSchema,
  updateSchedulerTaskSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../middleware/requireAdmin';
import { requireUser } from '../../middleware/requireUser';
import { createMediaCrawlerService } from '../../services/mediaCrawlerService';
import { createMediaMonitoringService } from '../../services/mediaMonitoringService';
import { createSchedulerService } from '../../services/schedulerService';

/**
 * Register scheduler routes
 */
export async function schedulerRoutes(server: FastifyInstance): Promise<void> {
  // Check feature flag
  if (!FLAGS.ENABLE_SCHEDULER) {
    server.log.info('Scheduler routes disabled by feature flag');
    return;
  }

  // Create Supabase client (S100.3 fix)
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Initialize dependencies
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const monitoringService = createMediaMonitoringService({
    supabase,
    openaiApiKey,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  const mediaCrawlerService = createMediaCrawlerService({
    supabase,
    monitoringService,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  const schedulerService = createSchedulerService({
    supabase,
    mediaCrawlerService,
    debugMode: process.env.NODE_ENV !== 'production',
  });

  // ============================================================================
  // SCHEDULER TASK ENDPOINTS
  // ============================================================================

  // GET /api/v1/scheduler/tasks - List all scheduled tasks
  server.get(
    '/api/v1/scheduler/tasks',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      try {
        const validation = listSchedulerTasksSchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid query parameters',
              details: validation.error.errors,
            },
          });
        }

        const result = await schedulerService.listTasks(validation.data);

        return reply.status(200).send({
          success: true,
          data: result,
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to list scheduler tasks');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to list scheduler tasks',
          },
        });
      }
    }
  );

  // POST /api/v1/scheduler/tasks/:id/toggle - Toggle task enabled status
  server.post<{
    Params: { id: string };
    Body: UpdateSchedulerTaskInput;
  }>(
    '/api/v1/scheduler/tasks/:id/toggle',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const validation = updateSchedulerTaskSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid input',
              details: validation.error.errors,
            },
          });
        }

        // Check if task exists
        const task = await schedulerService.getTask(id);
        if (!task) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: 'Scheduler task not found',
            },
          });
        }

        await schedulerService.updateTaskStatus(id, validation.data);

        // Fetch updated task
        const updatedTask = await schedulerService.getTask(id);

        return reply.status(200).send({
          success: true,
          data: { task: updatedTask },
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to toggle scheduler task');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to toggle scheduler task',
          },
        });
      }
    }
  );

  // POST /api/v1/scheduler/tasks/:name/run - Run a task immediately
  server.post<{
    Params: { name: string };
  }>(
    '/api/v1/scheduler/tasks/:name/run',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      try {
        const { name } = request.params;

        // Check if task exists
        const task = await schedulerService.getTaskByName(name);
        if (!task) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: 'Scheduler task not found',
            },
          });
        }

        const result = await schedulerService.runTaskNow(name);

        return reply.status(200).send({
          success: true,
          data: { result },
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to run scheduler task');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to run scheduler task',
          },
        });
      }
    }
  );

  // ============================================================================
  // TASK RUN ENDPOINTS
  // ============================================================================

  // GET /api/v1/scheduler/runs - List task run history
  server.get(
    '/api/v1/scheduler/runs',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      try {
        const validation = listTaskRunsSchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.errors[0]?.message || 'Invalid query parameters',
              details: validation.error.errors,
            },
          });
        }

        const result = await schedulerService.listTaskRuns(validation.data);

        return reply.status(200).send({
          success: true,
          data: result,
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to list task runs');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to list task runs',
          },
        });
      }
    }
  );

  // ============================================================================
  // STATISTICS ENDPOINT
  // ============================================================================

  // GET /api/v1/scheduler/stats - Get scheduler statistics
  server.get(
    '/api/v1/scheduler/stats',
    { preHandler: [requireUser, requireAdmin] },
    async (_request, reply) => {
      try {
        const stats = await schedulerService.getStats();

        return reply.status(200).send({
          success: true,
          data: { stats },
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to get scheduler stats');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get scheduler stats',
          },
        });
      }
    }
  );

  // ============================================================================
  // CRON TRIGGER ENDPOINT (S98)
  // External cron service calls this to trigger scheduled tasks
  // ============================================================================

  // POST /api/v1/scheduler/cron - Execute all due tasks (called by external cron)
  server.post<{
    Headers: { 'x-cron-secret'?: string };
  }>(
    '/api/v1/scheduler/cron',
    async (request, reply) => {
      try {
        // Verify cron secret (for security - prevents unauthorized triggering)
        const cronSecret = process.env.CRON_SECRET;
        const providedSecret = request.headers['x-cron-secret'];

        if (cronSecret && providedSecret !== cronSecret) {
          server.log.warn('Invalid cron secret provided');
          return reply.status(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid cron secret',
            },
          });
        }

        server.log.info('Cron trigger received, executing due tasks...');

        const results = await schedulerService.executeDueTasks();

        const summary = {
          executed: results.length,
          successful: results.filter((r) => r.status === 'success').length,
          failed: results.filter((r) => r.status === 'failure').length,
          tasks: results.map((r) => ({
            name: r.taskName,
            status: r.status,
            duration: r.duration,
            error: r.error,
          })),
        };

        server.log.info({ summary }, 'Cron execution completed');

        return reply.status(200).send({
          success: true,
          data: summary,
        });
      } catch (error) {
        server.log.error({ error }, 'Failed to execute cron tasks');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to execute cron tasks',
          },
        });
      }
    }
  );

  // GET /api/v1/scheduler/cron - Health check for cron service
  server.get(
    '/api/v1/scheduler/cron',
    async (_request, reply) => {
      return reply.status(200).send({
        success: true,
        data: {
          status: 'ready',
          message: 'Cron endpoint is healthy. POST to trigger scheduled tasks.',
        },
      });
    }
  );
}
