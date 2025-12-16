/**
 * Risk Radar Routes (Sprint S60)
 * REST endpoints for executive risk radar & predictive crisis forecasting engine
 *
 * Endpoints:
 * - Snapshots: CRUD for risk snapshots
 * - Indicators: List and rebuild indicators
 * - Forecasts: Create and manage forecasts
 * - Drivers: List and identify drivers
 * - Notes: CRUD for collaboration notes
 * - Dashboard: Real-time risk visibility
 */

import { FLAGS } from '@pravado/feature-flags';
import {
  createRiskRadarSnapshotInputSchema,
  updateRiskRadarSnapshotInputSchema,
  createRiskRadarForecastInputSchema,
  regenerateRiskRadarForecastInputSchema,
  createRiskRadarNoteInputSchema,
  updateRiskRadarNoteInputSchema,
  riskRadarSnapshotsQuerySchema,
  riskRadarIndicatorsQuerySchema,
  riskRadarForecastsQuerySchema,
  riskRadarDriversQuerySchema,
  riskRadarNotesQuerySchema,
  riskRadarDashboardQuerySchema,
  riskRadarSnapshotIdParamSchema,
  riskRadarForecastIdParamSchema,
  riskRadarNoteIdParamSchema,
  apiEnvSchema,
  validateEnv,
} from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { RiskRadarService } from '../../services/riskRadarService';

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
 * Helper to convert null values to undefined for type compatibility
 */
function stripNulls<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: Exclude<T[K], null> } {
  const result = {} as { [K in keyof T]: Exclude<T[K], null> };
  for (const key in obj) {
    const value = obj[key];
    result[key] = (value === null ? undefined : value) as Exclude<T[typeof key], null>;
  }
  return result;
}

/**
 * Register risk radar routes
 */
export async function riskRadarRoutes(server: FastifyInstance): Promise<void> {
  // Check if risk radar feature is enabled
  if (!FLAGS.ENABLE_RISK_RADAR) {
    server.get('/', { preHandler: requireUser }, async (_request, reply) => {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Risk Radar feature is not enabled',
        },
      });
    });
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const riskRadarService = new RiskRadarService(supabase);

  // ========================================
  // Dashboard Route
  // ========================================

  /**
   * GET /api/v1/risk-radar/dashboard
   * Get risk radar dashboard
   */
  server.get(
    '/dashboard',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = riskRadarDashboardQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await riskRadarService.getDashboard(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to get dashboard', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Snapshot Routes
  // ========================================

  /**
   * GET /api/v1/risk-radar/snapshots
   * List risk snapshots
   */
  server.get(
    '/snapshots',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = riskRadarSnapshotsQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await riskRadarService.listSnapshots(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to list snapshots', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots
   * Create a new risk snapshot
   */
  server.post(
    '/snapshots',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = createRiskRadarSnapshotInputSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const result = await riskRadarService.createSnapshot(orgId, stripNulls(parseResult.data), userId);
        return reply.code(201).send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to create snapshot', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/risk-radar/snapshots/active
   * Get the currently active snapshot
   */
  server.get(
    '/snapshots/active',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const result = await riskRadarService.getActiveSnapshot(orgId);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'SNAPSHOT_NOT_FOUND', message: 'No active snapshot found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to get active snapshot', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/risk-radar/snapshots/:id
   * Get a specific snapshot
   */
  server.get(
    '/snapshots/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const result = await riskRadarService.getSnapshot(orgId, paramResult.data.id);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Snapshot not found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to get snapshot', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/risk-radar/snapshots/:id/detail
   * Get snapshot with full details
   */
  server.get(
    '/snapshots/:id/detail',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const result = await riskRadarService.getSnapshotDetail(orgId, paramResult.data.id);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Snapshot not found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to get snapshot detail', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/risk-radar/snapshots/:id
   * Update a snapshot
   */
  server.patch(
    '/snapshots/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const bodyResult = updateRiskRadarSnapshotInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const result = await riskRadarService.updateSnapshot(
          orgId,
          paramResult.data.id,
          stripNulls(bodyResult.data),
          userId
        );
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to update snapshot', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots/:id/archive
   * Archive a snapshot
   */
  server.post(
    '/snapshots/:id/archive',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        await riskRadarService.archiveSnapshot(orgId, paramResult.data.id, userId);
        return reply.send({ success: true, message: 'Snapshot archived' });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to archive snapshot', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Indicator Routes
  // ========================================

  /**
   * GET /api/v1/risk-radar/snapshots/:id/indicators
   * List indicators for a snapshot
   */
  server.get(
    '/snapshots/:id/indicators',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const queryResult = riskRadarIndicatorsQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.errors },
          });
        }

        const result = await riskRadarService.listIndicators(orgId, paramResult.data.id, queryResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to list indicators', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots/:id/indicators/rebuild
   * Rebuild indicators for a snapshot
   */
  server.post(
    '/snapshots/:id/indicators/rebuild',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const result = await riskRadarService.rebuildIndicators(orgId, paramResult.data.id, userId);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to rebuild indicators', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Forecast Routes
  // ========================================

  /**
   * GET /api/v1/risk-radar/snapshots/:id/forecasts
   * List forecasts for a snapshot
   */
  server.get(
    '/snapshots/:id/forecasts',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const queryResult = riskRadarForecastsQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.errors },
          });
        }

        const result = await riskRadarService.listForecasts(orgId, paramResult.data.id, queryResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to list forecasts', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots/:id/forecasts
   * Create a new forecast for a snapshot
   */
  server.post(
    '/snapshots/:id/forecasts',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const bodyResult = createRiskRadarForecastInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const result = await riskRadarService.createForecast(
          orgId,
          paramResult.data.id,
          stripNulls(bodyResult.data),
          userId
        );
        return reply.code(201).send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to create forecast', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/risk-radar/forecasts/:forecastId
   * Get a specific forecast
   */
  server.get(
    '/forecasts/:forecastId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarForecastIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid forecast ID', details: paramResult.error.errors },
          });
        }

        const result = await riskRadarService.getForecast(orgId, paramResult.data.forecastId);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'FORECAST_NOT_FOUND', message: 'Forecast not found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to get forecast', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/forecasts/:forecastId/regenerate
   * Regenerate a forecast
   */
  server.post(
    '/forecasts/:forecastId/regenerate',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarForecastIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid forecast ID', details: paramResult.error.errors },
          });
        }

        const bodyResult = regenerateRiskRadarForecastInputSchema.safeParse(request.body || {});
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const result = await riskRadarService.regenerateForecast(
          orgId,
          paramResult.data.forecastId,
          stripNulls(bodyResult.data),
          userId
        );
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to regenerate forecast', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Driver Routes
  // ========================================

  /**
   * GET /api/v1/risk-radar/snapshots/:id/drivers
   * List drivers for a snapshot
   */
  server.get(
    '/snapshots/:id/drivers',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const queryResult = riskRadarDriversQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.errors },
          });
        }

        const result = await riskRadarService.listDrivers(orgId, paramResult.data.id, queryResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to list drivers', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots/:id/drivers/identify
   * Identify drivers from indicators
   */
  server.post(
    '/snapshots/:id/drivers/identify',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const result = await riskRadarService.identifyDriversFromIndicators(orgId, paramResult.data.id);
        return reply.send({ success: true, data: { drivers: result, count: result.length } });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to identify drivers', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Note Routes
  // ========================================

  /**
   * GET /api/v1/risk-radar/snapshots/:id/notes
   * List notes for a snapshot
   */
  server.get(
    '/snapshots/:id/notes',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const queryResult = riskRadarNotesQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.errors },
          });
        }

        const result = await riskRadarService.listNotes(orgId, paramResult.data.id, queryResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to list notes', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/risk-radar/snapshots/:id/notes
   * Create a new note for a snapshot
   */
  server.post(
    '/snapshots/:id/notes',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarSnapshotIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid snapshot ID', details: paramResult.error.errors },
          });
        }

        const bodyResult = createRiskRadarNoteInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const result = await riskRadarService.createNote(
          orgId,
          paramResult.data.id,
          stripNulls(bodyResult.data),
          userId
        );
        return reply.code(201).send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to create note', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/risk-radar/notes/:noteId
   * Update a note
   */
  server.patch(
    '/notes/:noteId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarNoteIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID', details: paramResult.error.errors },
          });
        }

        const bodyResult = updateRiskRadarNoteInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const result = await riskRadarService.updateNote(
          orgId,
          paramResult.data.noteId,
          stripNulls(bodyResult.data),
          userId
        );
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to update note', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/risk-radar/notes/:noteId
   * Delete a note
   */
  server.delete(
    '/notes/:noteId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramResult = riskRadarNoteIdParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID', details: paramResult.error.errors },
          });
        }

        await riskRadarService.deleteNote(orgId, paramResult.data.noteId);
        return reply.send({ success: true, message: 'Note deleted' });
      } catch (err) {
        const error = err as Error;
        console.error('[RiskRadar] Failed to delete note', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );
}
