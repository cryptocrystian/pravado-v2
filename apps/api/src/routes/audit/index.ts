/**
 * Audit Routes (Sprint S35 + S36)
 * REST endpoints for audit log viewing, querying, and exports
 *
 * Endpoints:
 * - GET /api/v1/audit - List audit logs with filters
 * - GET /api/v1/audit/events - List available event types
 * - GET /api/v1/audit/stats - Get audit statistics
 * - GET /api/v1/audit/:id - Get a single audit log entry
 * - POST /api/v1/audit/export - Create export job (S36)
 * - GET /api/v1/audit/export/:id - Get export job status (S36)
 * - GET /api/v1/audit/export/:id/download - Download export file (S36)
 */

import * as fs from 'fs';

import { FLAGS } from '@pravado/feature-flags';
import type { ActorType, AuditEventType, AuditQueryFilters, AuditSeverity } from '@pravado/types';
import {
  apiEnvSchema,
  getAuditEventTypesQuerySchema,
  getAuditLogParamsSchema,
  getAuditLogsQuerySchema,
  validateEnv,
} from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { AuditExportService } from '../../services/auditExportService';
import { AuditService } from '../../services/auditService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: SupabaseClient): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

/**
 * Register audit routes
 */
export async function auditRoutes(server: FastifyInstance): Promise<void> {
  // Check if audit logging feature is enabled
  if (!FLAGS.ENABLE_AUDIT_LOGGING) {
    server.get('/', { preHandler: requireUser }, async (_request, reply) => {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Audit logging feature is not enabled',
        },
      });
    });
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const auditService = new AuditService(supabase);
  const exportService = new AuditExportService(supabase, auditService, env.AUDIT_EXPORT_STORAGE_DIR);

  /**
   * GET /api/v1/audit
   * List audit logs with filters and pagination
   */
  server.get(
    '/',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        // Parse and validate query params
        const parseResult = getAuditLogsQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: parseResult.error.errors,
            },
          });
        }

        const query = parseResult.data;

        // Build filters
        const filters: Partial<AuditQueryFilters> = {
          limit: query.limit,
          offset: query.offset,
          cursor: query.cursor,
          searchTerm: query.search,
        };

        // Parse event type (can be comma-separated)
        if (query.eventType) {
          const types = query.eventType.split(',').map((t) => t.trim() as AuditEventType);
          filters.eventType = types.length === 1 ? types[0] : types;
        }

        // Parse severity (can be comma-separated)
        if (query.severity) {
          const severities = query.severity.split(',').map((s) => s.trim() as AuditSeverity);
          filters.severity = severities.length === 1 ? severities[0] : severities;
        }

        // Parse actor type (can be comma-separated)
        if (query.actorType) {
          const actors = query.actorType.split(',').map((a) => a.trim() as ActorType);
          filters.actorType = actors.length === 1 ? actors[0] : actors;
        }

        if (query.userId) {
          filters.userId = query.userId;
        }

        if (query.startDate) {
          filters.startDate = query.startDate;
        }

        if (query.endDate) {
          filters.endDate = query.endDate;
        }

        const result = await auditService.queryAuditLog(orgId, filters);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to query audit logs', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to query audit logs',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/events
   * List available event types with metadata
   */
  server.get(
    '/events',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        // Parse and validate query params
        const parseResult = getAuditEventTypesQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: parseResult.error.errors,
            },
          });
        }

        const { category } = parseResult.data;
        const eventTypes = auditService.getEventTypes(category);
        const categories = auditService.getEventCategories();

        return reply.send({
          success: true,
          data: {
            eventTypes,
            categories,
          },
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to list event types', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list event types',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/stats
   * Get audit statistics for the organization
   */
  server.get<{
    Querystring: { days?: string };
  }>(
    '/stats',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const days = request.query.days ? parseInt(request.query.days, 10) : 30;
        const stats = await auditService.getAuditStats(orgId, days);

        return reply.send({
          success: true,
          data: stats,
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to get audit stats', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get audit statistics',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/:id
   * Get a single audit log entry by ID
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        // Validate params
        const parseResult = getAuditLogParamsSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid parameters',
              details: parseResult.error.errors,
            },
          });
        }

        const { id } = parseResult.data;
        const entry = await auditService.getAuditEntry(orgId, id);

        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Audit log entry not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: entry,
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to get audit entry', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get audit log entry',
          },
        });
      }
    }
  );

  // ===== Sprint S36: Export Routes =====

  /**
   * Helper to check if user is admin
   */
  async function isUserAdmin(userId: string, orgId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .single();

    return data?.role === 'admin' || data?.role === 'owner';
  }

  /**
   * POST /api/v1/audit/export
   * Create a new audit export job (admin only)
   */
  server.post<{
    Body: { filters?: AuditQueryFilters };
  }>(
    '/export',
    { preHandler: requireUser },
    async (request, reply) => {
      // Check if exports are enabled
      if (!FLAGS.ENABLE_AUDIT_EXPORTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Audit exports are not enabled',
          },
        });
      }

      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        // RBAC: Only admins can create exports
        const isAdmin = await isUserAdmin(userId, orgId);
        if (!isAdmin) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only admins can export audit logs',
            },
          });
        }

        const filters = request.body?.filters || {};
        const job = await exportService.createExportJob({
          orgId,
          userId,
          filters,
        });

        if (!job) {
          return reply.code(500).send({
            success: false,
            error: {
              code: 'EXPORT_FAILED',
              message: 'Failed to create export job',
            },
          });
        }

        // Trigger async processing (in production, this would go to a queue)
        setImmediate(() => {
          exportService.processExportJob(job.id).catch((err) => {
            console.error('[Audit] Export job processing failed', { err, jobId: job.id });
          });
        });

        return reply.code(201).send({
          success: true,
          data: {
            jobId: job.id,
            status: job.status,
          },
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to create export job', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create export job',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/export/:id
   * Get export job status
   */
  server.get<{
    Params: { id: string };
  }>(
    '/export/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_AUDIT_EXPORTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Audit exports are not enabled',
          },
        });
      }

      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const job = await exportService.getExportJob(orgId, request.params.id);

        if (!job) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Export job not found',
            },
          });
        }

        const downloadUrl = exportService.getDownloadPath(job);

        return reply.send({
          success: true,
          data: {
            job,
            downloadUrl,
          },
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to get export status', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get export status',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/export/:id/download
   * Download export file
   */
  server.get<{
    Params: { id: string };
  }>(
    '/export/:id/download',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_AUDIT_EXPORTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Audit exports are not enabled',
          },
        });
      }

      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const job = await exportService.getExportJob(orgId, request.params.id);

        if (!job) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Export job not found',
            },
          });
        }

        if (job.status !== 'success' || !job.filePath) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'EXPORT_NOT_READY',
              message: 'Export is not ready for download',
            },
          });
        }

        // Check if file exists
        if (!fs.existsSync(job.filePath)) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'FILE_NOT_FOUND',
              message: 'Export file not found',
            },
          });
        }

        const fileName = `audit_export_${job.id}.csv`;
        const stream = fs.createReadStream(job.filePath);

        return reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="${fileName}"`)
          .send(stream);
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to download export', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to download export',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/exports
   * List export jobs for the organization
   */
  server.get<{
    Querystring: { limit?: string };
  }>(
    '/exports',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_AUDIT_EXPORTS) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Audit exports are not enabled',
          },
        });
      }

      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found for user',
            },
          });
        }

        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
        const jobs = await exportService.listExportJobs(orgId, limit);

        return reply.send({
          success: true,
          data: {
            exports: jobs,
          },
        });
      } catch (err) {
        const error = err as Error;
        console.error('[Audit] Failed to list exports', { error });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list exports',
          },
        });
      }
    }
  );
}
