/**
 * Playbook API routes (Sprint S7 - Real Implementation)
 * CRUD operations and execution for AI playbooks
 */

import type {
  CreatePlaybookResponse,
  ExecutePlaybookResponse,
  GetPlaybookResponse,
  GetPlaybookRunResponse,
  ListPlaybooksRuntimeResponse,
  UpdatePlaybookResponse,
} from '@pravado/types';
import {
  createPlaybookSchema,
  executePlaybookSchema,
  listPlaybooksQuerySchema,
  updatePlaybookSchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { PlaybookExecutionEngine } from '../../services/playbookExecutionEngine';
import { PlaybookService } from '../../services/playbookService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

export async function playbooksRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Services
  const playbookService = new PlaybookService(supabase);
  const executionEngine = new PlaybookExecutionEngine(supabase);

  // ========================================
  // GET /api/v1/playbooks - List playbooks
  // ========================================
  server.get<{
    Querystring: {
      status?: string;
      limit?: string;
      offset?: string;
      tags?: string;
    };
    Reply: ListPlaybooksRuntimeResponse;
  }>(
    '/',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Parse query params
      const validation = listPlaybooksQuerySchema.safeParse({
        status: request.query.status,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
        tags: request.query.tags ? request.query.tags.split(',') : undefined,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      try {
        const playbooks = await playbookService.listPlaybooks(orgId, validation.data);

        return {
          success: true,
          data: {
            items: playbooks,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list playbooks',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/playbooks/:id - Get playbook
  // ========================================
  server.get<{
    Params: { id: string };
    Reply: GetPlaybookResponse;
  }>(
    '/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      try {
        const playbook = await playbookService.getPlaybookById(orgId, request.params.id);

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        return {
          success: true,
          data: {
            item: playbook,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get playbook',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/playbooks - Create playbook
  // ========================================
  server.post<{
    Body: unknown;
    Reply: CreatePlaybookResponse;
  }>(
    '/',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = createPlaybookSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      try {
        const playbook = await playbookService.createPlaybook(
          orgId,
          request.user.id,
          validation.data
        );

        return reply.code(201).send({
          success: true,
          data: {
            item: playbook,
          },
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create playbook',
          },
        });
      }
    }
  );

  // ========================================
  // PUT /api/v1/playbooks/:id - Update playbook
  // ========================================
  server.put<{
    Params: { id: string };
    Body: unknown;
    Reply: UpdatePlaybookResponse;
  }>(
    '/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = updatePlaybookSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      try {
        const playbook = await playbookService.updatePlaybook(
          orgId,
          request.params.id,
          validation.data
        );

        return {
          success: true,
          data: {
            item: playbook,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to update playbook',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/playbooks/:id/execute - Execute playbook
  // ========================================
  server.post<{
    Params: { id: string };
    Body: unknown;
    Reply: ExecutePlaybookResponse;
  }>(
    '/:id/execute',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = executePlaybookSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      try {
        const run = await executionEngine.startPlaybookRun(
          orgId,
          request.params.id,
          validation.data.input,
          request.user.id
        );

        return {
          success: true,
          data: {
            run,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to execute playbook',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/playbook-runs/:id - Get playbook run
  // ========================================
  server.get<{
    Params: { id: string };
    Reply: GetPlaybookRunResponse;
  }>(
    '/runs/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      try {
        // Fetch run directly from database
        const { data: run, error: runError } = await supabase
          .from('playbook_runs')
          .select('*')
          .eq('id', request.params.id)
          .eq('org_id', orgId)
          .single();

        if (runError || !run) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        // Fetch step runs
        const { data: stepRuns } = await supabase
          .from('playbook_step_runs')
          .select('*')
          .eq('run_id', request.params.id)
          .eq('org_id', orgId)
          .order('created_at', { ascending: true });

        return {
          success: true,
          data: {
            run: {
              run: {
                id: run.id,
                playbookId: run.playbook_id,
                orgId: run.org_id,
                status: run.status,
                triggeredBy: run.triggered_by,
                input: run.input,
                output: run.output,
                error: run.error,
                startedAt: run.started_at,
                completedAt: run.completed_at,
                createdAt: run.created_at,
                updatedAt: run.updated_at,
              },
              steps:
                stepRuns?.map((sr) => ({
                  id: sr.id,
                  runId: sr.run_id,
                  playbookId: sr.playbook_id,
                  orgId: sr.org_id,
                  stepId: sr.step_id,
                  stepKey: sr.step_key,
                  status: sr.status,
                  input: sr.input,
                  output: sr.output,
                  error: sr.error,
                  startedAt: sr.started_at,
                  completedAt: sr.completed_at,
                  createdAt: sr.created_at,
                  updatedAt: sr.updated_at,
                })) || [],
            },
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get playbook run',
          },
        });
      }
    }
  );
}
