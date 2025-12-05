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
import { LlmRouter } from '@pravado/utils';
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

import { editorEventBus } from '../../events/editor/editorEventBus';
import type { EditorEvent, GraphPatch, CursorPosition, NodeSelection, UserPresence } from '../../events/editor/editorEventTypes';
import { editorSessionManager } from '../../events/editor/editorSessionManager';
import { requireUser } from '../../middleware/requireUser';
import { BillingService } from '../../services/billingService';
import * as branchService from '../../services/playbookBranchService';
import * as commitService from '../../services/playbookCommitService';
import { PlaybookExecutionEngine } from '../../services/playbookExecutionEngine';
import { PlaybookExecutionEngineV2 } from '../../services/playbookExecutionEngineV2';
import { playbookToGraph, validateGraph, graphToPlaybook, type PlaybookGraph } from '../../services/playbookGraphService';
import * as mergeService from '../../services/playbookMergeService';
import { PlaybookService } from '../../services/playbookService';
import * as versioningService from '../../services/playbookVersioningService';
// S22: Editor collaboration imports
// S23: Branch management imports

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

  // S28+S29: Initialize billing service
  const billingService = new BillingService(supabase, env.BILLING_DEFAULT_PLAN_SLUG);

  // S16+S29: Initialize LLM router with billing enforcer
  const llmRouter = new LlmRouter({
    provider: env.LLM_PROVIDER as any,
    openaiApiKey: env.LLM_OPENAI_API_KEY,
    openaiModel: env.LLM_OPENAI_MODEL,
    anthropicApiKey: env.LLM_ANTHROPIC_API_KEY,
    anthropicModel: env.LLM_ANTHROPIC_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS,
    maxTokens: env.LLM_MAX_TOKENS,
    supabase,
    billingEnforcer: async (orgId: string, tokensToConsume: number) => {
      await billingService.enforceOrgQuotaOrThrow(orgId, { tokensToConsume });
    },
  });

  // Services
  const playbookService = new PlaybookService(supabase);
  const executionEngine = new PlaybookExecutionEngine(supabase, llmRouter);

  // S18+S29: Initialize V2 execution engine with billing service
  const executionEngineV2 = new PlaybookExecutionEngineV2(supabase, billingService, {
    maxConcurrency: parseInt(process.env.QUEUE_MAX_CONCURRENCY || '5', 10),
    enableWebhooks: true,
    enableLogging: true,
  });

  // Start the V2 execution engine
  executionEngineV2.start();

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

  // ========================================
  // Sprint S8: Extended Playbook Routes
  // ========================================

  // GET /api/v1/playbooks/templates - List playbook templates
  server.get<{
    Reply: import('@pravado/types').ListPlaybookTemplatesResponse;
  }>(
    '/templates',
    {
      preHandler: requireUser,
    },
    async (_request, reply) => {
      try {
        const { listPlaybookTemplates } = await import('../../services/playbookTemplates');
        const templates = listPlaybookTemplates();

        return {
          success: true,
          data: {
            items: templates,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list templates',
          },
        });
      }
    }
  );

  // NOTE: GET /api/v1/playbooks/:id/versions route removed from Sprint S8
  // This functionality is now handled by Sprint S20's implementation (line 1594)
  // which uses versioningService instead of playbookService

  // POST /api/v1/playbooks/:id/clone - Clone playbook version
  server.post<{
    Params: { id: string };
    Reply: import('@pravado/types').ClonePlaybookResponse;
  }>(
    '/:id/clone',
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
        const cloned = await playbookService.clonePlaybookVersion(
          orgId,
          request.params.id,
          request.user.id
        );

        return reply.code(201).send({
          success: true,
          data: {
            item: cloned,
          },
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to clone playbook',
          },
        });
      }
    }
  );

  // POST /api/v1/playbooks/:id/status - Update playbook status
  server.post<{
    Params: { id: string };
    Body: unknown;
    Reply: import('@pravado/types').UpdatePlaybookStatusResponse;
  }>(
    '/:id/status',
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
      const { updatePlaybookStatusSchema } = await import('@pravado/validators');
      const validation = updatePlaybookStatusSchema.safeParse(request.body);

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
        const updated = await playbookService.setPlaybookStatus(
          orgId,
          request.params.id,
          validation.data.status
        );

        return {
          success: true,
          data: {
            item: updated,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to update playbook status',
          },
        });
      }
    }
  );

  // POST /api/v1/playbooks/:id/simulate - Execute playbook in simulation mode
  server.post<{
    Params: { id: string };
    Body: unknown;
    Reply: import('@pravado/types').ExecutePlaybookResponse;
  }>(
    '/:id/simulate',
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

      // Validate request body (same schema as execute)
      const { executePlaybookSchema } = await import('@pravado/validators');
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
          request.user.id,
          { isSimulation: true }
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
            message: error.message || 'Failed to simulate playbook',
          },
        });
      }
    }
  );

  // ========================================
  // SPRINT S9: COLLABORATION ENDPOINTS
  // ========================================

  /**
   * POST /api/v1/playbooks/:id/simulate/collaboration
   * Execute playbook in simulation mode with collaboration debugging
   */
  server.post<{
    Params: { id: string };
    Body: unknown;
    Reply: import('@pravado/types').ExecutePlaybookResponse;
  }>(
    '/:id/simulate/collaboration',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      try {
        const { executePlaybookCollaborationSchema } = await import('@pravado/validators');

        // Validate request body
        const validation = executePlaybookCollaborationSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: validation.error.message,
            },
          });
        }

        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Execute playbook with collaboration debugging enabled
        const run = await executionEngine.startPlaybookRun(
          orgId,
          request.params.id,
          validation.data.input,
          request.user!.id || undefined,
          { isSimulation: true } // Always simulation mode for collaboration debugging
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
            message: error.message || 'Failed to execute collaboration simulation',
          },
        });
      }
    }
  );

  // ========================================
  // SPRINT S10: MEMORY ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/memory/search
   * Search semantic memory store
   */
  server.get<{
    Querystring: {
      q?: string;
      embedding?: string;
      limit?: number;
      minRelevance?: number;
      memoryType?: string;
    };
  }>(
    '/memory/search',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const { memorySearchQuerySchema } = await import('@pravado/validators');

        // Parse embedding if provided as JSON string
        const queryParams = {
          ...request.query,
          embedding: request.query.embedding ? JSON.parse(request.query.embedding) : undefined,
        };

        const validation = memorySearchQuerySchema.safeParse(queryParams);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_INPUT', message: validation.error.message },
          });
        }

        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Import memory services
        const { MemoryRetrievalService } = await import('../../services/memory/memoryRetrieval');
        const memoryRetrieval = new MemoryRetrievalService(supabase);

        // If text query, use text search; if embedding, use vector search
        let result;
        if (validation.data.embedding) {
          result = await memoryRetrieval.retrieveSemanticMemory(orgId, validation.data.embedding, {
            limit: validation.data.limit,
            minRelevance: validation.data.minRelevance,
            memoryType: validation.data.memoryType as any,
          });
        } else if (validation.data.q) {
          result = await memoryRetrieval.searchMemoriesByText(orgId, validation.data.q, {
            limit: validation.data.limit,
            memoryType: validation.data.memoryType as any,
          });
        } else {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Either q or embedding must be provided' },
          });
        }

        return {
          success: true,
          data: {
            memories: result.items,
            relevance: result.relevance,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to search memories',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbook-runs/:id/memory
   * Get memory data for a specific playbook run
   */
  server.get<{
    Params: { id: string };
  }>(
    '/playbook-runs/:id/memory',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Import memory services
        const { MemoryStore } = await import('../../services/memory/memoryStore');
        const memoryStore = new MemoryStore(supabase);

        // Fetch episodic traces for the run
        const episodicTraces = await memoryStore.getEpisodicTracesForRun(orgId, request.params.id);

        return {
          success: true,
          data: {
            episodicTraces,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch run memory',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/graph
   * Get graph representation of a playbook for visual editor (S17)
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id/graph',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Get playbook
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

        // Convert to graph
        const graph = playbookToGraph(playbook);

        // Validate graph
        const validation = validateGraph(graph);

        return {
          success: true,
          data: {
            graph,
            validation,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to generate graph',
          },
        });
      }
    }
  );

  // ========================================
  // SPRINT S18: ASYNC EXECUTION ENDPOINTS
  // ========================================

  /**
   * POST /api/v1/playbooks/:id/execute-async
   * Execute a playbook asynchronously (returns immediately with run ID)
   */
  server.post<{
    Params: { id: string };
    Body: {
      input?: unknown;
      webhookUrl?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    };
  }>(
    '/:id/execute-async',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        const { input = {}, webhookUrl, priority = 'medium' } = request.body || {};

        // Start async execution
        const runId = await executionEngineV2.executePlaybook(
          request.params.id,
          orgId,
          request.user!.id!,
          {
            input,
            webhookUrl,
            priority,
          }
        );

        return {
          success: true,
          data: {
            runId,
            message: 'Playbook execution started',
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error.message || 'Failed to start playbook execution',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/runs/:id/state
   * Get detailed execution state for a playbook run (S18)
   */
  server.get<{
    Params: { id: string };
  }>(
    '/runs/:id/state',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        const status = await executionEngineV2.getExecutionStatus(request.params.id);

        if (!status) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        // Verify org access
        if (status.run.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to this playbook run',
            },
          });
        }

        return {
          success: true,
          data: status,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch execution state',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/runs/:id/cancel
   * Cancel a running playbook execution (S18)
   */
  server.post<{
    Params: { id: string };
  }>(
    '/runs/:id/cancel',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Verify run belongs to user's org
        const { data: run } = await supabase
          .from('playbook_runs')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!run || run.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        await executionEngineV2.cancelExecution(request.params.id);

        return {
          success: true,
          data: {
            message: 'Playbook execution cancelled',
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to cancel execution',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/runs/:id/resume
   * Resume a failed playbook execution (S18)
   */
  server.post<{
    Params: { id: string };
  }>(
    '/runs/:id/resume',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Verify run belongs to user's org
        const { data: run } = await supabase
          .from('playbook_runs')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!run || run.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        await executionEngineV2.resumeExecution(request.params.id);

        return {
          success: true,
          data: {
            message: 'Playbook execution resumed',
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to resume execution',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/queue/stats
   * Get queue and worker statistics (S18 - admin/monitoring)
   */
  server.get(
    '/queue/stats',
    { preHandler: requireUser },
    async (_request, reply) => {
      try {
        const queueStats = executionEngineV2.getQueueStats();
        const workerStats = executionEngineV2.getWorkerStats();

        return {
          success: true,
          data: {
            queue: queueStats,
            workers: workerStats,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch queue stats',
          },
        });
      }
    }
  );

  // ========================================
  // Sprint S20: Editor Integration Endpoints
  // ========================================

  /**
   * POST /api/v1/playbooks/:id/validate-graph
   * Validate graph structure before execution (Sprint S20)
   */
  server.post<{
    Params: { id: string };
    Body: {
      graph: PlaybookGraph;
      validateOnly?: boolean;
    };
  }>(
    '/:id/validate-graph',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Validate graph
        const validation = validateGraph(request.body.graph);

        return {
          success: true,
          data: {
            valid: validation.valid,
            errors: validation.errors,
            issues: validation.issues,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to validate graph',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/execute-from-graph
   * Execute playbook directly from editor graph (Sprint S20)
   */
  server.post<{
    Params: { id: string };
    Body: {
      graph: PlaybookGraph;
      input?: Record<string, unknown>;
      webhookUrl?: string;
      personalityOverride?: string;
      saveVersion?: boolean;
      commitMessage?: string;
    };
  }>(
    '/:id/execute-from-graph',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('*')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Step 1: Validate graph
        const validation = validateGraph(request.body.graph);
        if (!validation.valid) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_GRAPH',
              message: 'Graph validation failed',
              details: {
                errors: validation.errors,
                issues: validation.issues,
              },
            },
          });
        }

        // Step 2: Convert graph to playbook steps
        const steps = graphToPlaybook(request.body.graph);

        // Step 3: Optionally save version
        if (request.body.saveVersion) {
          await versioningService.saveVersion(
            supabase,
            request.params.id,
            request.body.graph,
            { steps },
            request.user.id,
            request.body.commitMessage
          );
        }

        // Step 4: Update playbook steps in database
        // Delete existing steps
        await supabase
          .from('playbook_steps')
          .delete()
          .eq('playbook_id', request.params.id);

        // Insert new steps
        const stepsToInsert = steps.map((step) => ({
          playbook_id: request.params.id,
          org_id: orgId,
          key: step.key,
          name: step.name,
          type: step.type,
          config: step.config,
          position: step.position || 0,
          next_step_key: step.nextStepKey,
        }));

        await supabase.from('playbook_steps').insert(stepsToInsert);

        // Step 5: Trigger execution via V2 engine
        const runId = await executionEngineV2.executePlaybook(
          request.params.id,
          orgId,
          request.user.id,
          {
            input: request.body.input || {},
            webhookUrl: request.body.webhookUrl,
          }
        );

        return {
          success: true,
          data: {
            runId,
            navigationUrl: `/app/playbooks/runs/${runId}`,
            message: 'Playbook queued for execution',
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to execute from graph',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/versions
   * Get version history for a playbook (Sprint S20)
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id/versions',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Fetch versions
        const versions = await versioningService.getVersions(supabase, request.params.id);

        return {
          success: true,
          data: {
            versions,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch versions',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/versions/:versionId
   * Get details of a specific version (Sprint S20)
   */
  server.get<{
    Params: { id: string; versionId: string };
  }>(
    '/:id/versions/:versionId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Fetch version details
        const version = await versioningService.getVersionDetails(
          supabase,
          request.params.versionId
        );

        if (!version || version.playbookId !== request.params.id) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Version not found',
            },
          });
        }

        // Verify org access
        if (version.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        return {
          success: true,
          data: version,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch version details',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/diff
   * Compare current graph with latest saved version (Sprint S20)
   */
  server.post<{
    Params: { id: string };
    Body: {
      currentGraph: PlaybookGraph;
    };
  }>(
    '/:id/diff',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Get latest version
        const latestVersion = await versioningService.getLatestVersion(
          supabase,
          request.params.id
        );

        if (!latestVersion) {
          // No saved version yet, everything is new
          const validation = validateGraph(request.body.currentGraph);
          return {
            success: true,
            data: {
              diff: {
                addedNodes: request.body.currentGraph.nodes.map((n) => ({
                  id: n.id,
                  label: n.data.label,
                  type: n.type,
                })),
                removedNodes: [],
                modifiedNodes: [],
                addedEdges: request.body.currentGraph.edges,
                removedEdges: [],
                hasChanges: request.body.currentGraph.nodes.length > 0,
              },
              validation,
            },
          };
        }

        // Compute diff
        const diff = versioningService.diffGraphs(
          latestVersion.graph,
          request.body.currentGraph
        );

        // Validate current graph
        const validation = validateGraph(request.body.currentGraph);

        return {
          success: true,
          data: {
            diff,
            validation,
            latestVersion: {
              id: latestVersion.id,
              version: latestVersion.version,
              createdAt: latestVersion.createdAt,
              commitMessage: latestVersion.commitMessage,
            },
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to compute diff',
          },
        });
      }
    }
  );

  // ============================================================================
  // EDITOR COLLABORATION ENDPOINTS (S22)
  // ============================================================================

  /**
   * SSE Stream for Editor Collaboration Events
   * GET /api/v1/playbooks/:id/editor/stream
   */
  server.get<{ Params: { id: string } }>(
    '/:id/editor/stream',
    { preHandler: requireUser },
    async (request, reply) => {
      const playbookId = request.params.id;
      const userId = request.user!.id!;

      try {
        // Verify user has access to this playbook
        const orgId = await getUserOrgId(userId, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'User not in any organization' },
          });
        }

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('id, org_id')
          .eq('id', playbookId)
          .eq('org_id', orgId)
          .single();

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Playbook not found' },
          });
        }

        // Get user info for presence
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', userId)
          .single();

        if (!user) {
          return reply.code(401).send({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'User not found' },
          });
        }

        // Set SSE headers
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        // Generate user color (simple hash-based color)
        const colorHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = colorHash % 360;
        const color = `hsl(${hue}, 70%, 50%)`;

        // Create user presence
        const presence: UserPresence = {
          userId: user.id,
          userName: user.full_name || user.email.split('@')[0],
          userEmail: user.email,
          color,
          joinedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        };

        // Join editing session
        editorSessionManager.join(playbookId, presence);

        // Send initial connected event
        reply.raw.write('event: connected\n');
        reply.raw.write('data: {"message":"Connected to editor stream"}\n\n');

        // Send presence.join event to all other users
        editorEventBus.publish({
          type: 'presence.join',
          playbookId,
          userId,
          timestamp: new Date().toISOString(),
          payload: { user: presence },
        });

        // Send current presence list to new user
        const currentUsers = editorSessionManager.listUsers(playbookId);
        reply.raw.write('event: presence.list\n');
        reply.raw.write(`data: ${JSON.stringify({ users: currentUsers })}\n\n`);

        // Heartbeat interval (20 seconds)
        const heartbeatInterval = setInterval(() => {
          reply.raw.write(': heartbeat\n\n');
        }, 20000);

        // Subscribe to editor events
        const unsubscribe = editorEventBus.subscribe(playbookId, (event: EditorEvent) => {
          // Don't echo events back to sender
          if (event.userId === userId) {
            return;
          }

          reply.raw.write(`event: ${event.type}\n`);
          reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        // Cleanup on disconnect
        request.raw.on('close', () => {
          clearInterval(heartbeatInterval);
          unsubscribe();

          // Leave session and broadcast presence.leave
          editorSessionManager.leave(playbookId, userId);
          editorEventBus.publish({
            type: 'presence.leave',
            playbookId,
            userId,
            timestamp: new Date().toISOString(),
            payload: { userId, reason: 'disconnect' },
          });
        });

        // 30-minute timeout (longer than execution stream)
        setTimeout(() => {
          clearInterval(heartbeatInterval);
          unsubscribe();
          editorSessionManager.leave(playbookId, userId);
          reply.raw.end();
        }, 1800000); // 30 minutes
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to establish editor stream',
          },
        });
      }
    }
  );

  /**
   * Update Cursor Position
   * POST /api/v1/playbooks/:id/editor/cursor
   */
  server.post<{
    Params: { id: string };
    Body: { position: CursorPosition };
  }>(
    '/:id/editor/cursor',
    { preHandler: requireUser },
    async (request, reply) => {
      const playbookId = request.params.id;
      const userId = request.user!.id!;
      const { position } = request.body;

      try {
        // Verify access
        const orgId = await getUserOrgId(userId, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'User not in any organization' },
          });
        }

        const { data: playbook } = await supabase
          .from('playbooks')
          .select('id')
          .eq('id', playbookId)
          .eq('org_id', orgId)
          .single();

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Playbook not found' },
          });
        }

        // Update cursor in session manager
        editorSessionManager.updateCursor(playbookId, userId, position);

        // Broadcast cursor update
        editorEventBus.publish({
          type: 'cursor.update',
          playbookId,
          userId,
          timestamp: new Date().toISOString(),
          payload: { position },
        });

        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to update cursor',
          },
        });
      }
    }
  );

  /**
   * Update Node Selection
   * POST /api/v1/playbooks/:id/editor/selection
   */
  server.post<{
    Params: { id: string };
    Body: { selection: NodeSelection; lock?: boolean };
  }>(
    '/:id/editor/selection',
    { preHandler: requireUser },
    async (request, reply) => {
      const playbookId = request.params.id;
      const userId = request.user!.id!;
      const { selection, lock = false } = request.body;

      try {
        // Verify access
        const orgId = await getUserOrgId(userId, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'User not in any organization' },
          });
        }

        const { data: playbook } = await supabase
          .from('playbooks')
          .select('id')
          .eq('id', playbookId)
          .eq('org_id', orgId)
          .single();

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Playbook not found' },
          });
        }

        // Update selection in session manager
        editorSessionManager.updateSelection(playbookId, userId, selection, lock);

        // Broadcast selection update
        editorEventBus.publish({
          type: 'selection.update',
          playbookId,
          userId,
          timestamp: new Date().toISOString(),
          payload: { selection, lock },
        });

        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to update selection',
          },
        });
      }
    }
  );

  /**
   * Apply Graph Patch
   * POST /api/v1/playbooks/:id/editor/graph/patch
   */
  server.post<{
    Params: { id: string };
    Body: { patch: GraphPatch; graphVersion?: number };
  }>(
    '/:id/editor/graph/patch',
    { preHandler: requireUser },
    async (request, reply) => {
      const playbookId = request.params.id;
      const userId = request.user!.id!;
      const { patch, graphVersion } = request.body;

      try {
        // Verify access
        const orgId = await getUserOrgId(userId, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'User not in any organization' },
          });
        }

        const { data: playbook } = await supabase
          .from('playbooks')
          .select('id')
          .eq('id', playbookId)
          .eq('org_id', orgId)
          .single();

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Playbook not found' },
          });
        }

        // Broadcast graph patch (no DB persistence - handled by S20 versioning)
        editorEventBus.publish({
          type: 'graph.patch',
          playbookId,
          userId,
          timestamp: new Date().toISOString(),
          payload: { patch, graphVersion },
        });

        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to apply graph patch',
          },
        });
      }
    }
  );

  /**
   * Replace Entire Graph
   * POST /api/v1/playbooks/:id/editor/graph/replace
   */
  server.post<{
    Params: { id: string };
    Body: { nodes: any[]; edges: any[]; graphVersion: number };
  }>(
    '/:id/editor/graph/replace',
    { preHandler: requireUser },
    async (request, reply) => {
      const playbookId = request.params.id;
      const userId = request.user!.id!;
      const { nodes, edges, graphVersion } = request.body;

      try {
        // Verify access
        const orgId = await getUserOrgId(userId, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'User not in any organization' },
          });
        }

        const { data: playbook } = await supabase
          .from('playbooks')
          .select('id')
          .eq('id', playbookId)
          .eq('org_id', orgId)
          .single();

        if (!playbook) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Playbook not found' },
          });
        }

        // Broadcast full graph replacement
        editorEventBus.publish({
          type: 'graph.replace',
          playbookId,
          userId,
          timestamp: new Date().toISOString(),
          payload: { nodes, edges, graphVersion },
        });

        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to replace graph',
          },
        });
      }
    }
  );

  // ============================================================================
  // SPRINT S23: BRANCHING & VERSION CONTROL
  // ============================================================================

  /**
   * GET /api/v1/playbooks/:id/branches
   * List all branches for a playbook
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id/branches',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // List branches
        const branches = await branchService.listBranches(supabase, request.params.id);

        return {
          success: true,
          data: {
            branches,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list branches',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/branches
   * Create a new branch
   */
  server.post<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/:id/branches',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Validate request body
        const { createBranchSchema } = await import('@pravado/validators');
        const validation = createBranchSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: validation.error.errors,
            },
          });
        }

        // Create branch
        const branch = await branchService.createBranch(
          supabase,
          request.params.id,
          validation.data.name,
          request.user.id,
          validation.data.parentBranchId
        );

        return reply.code(201).send({
          success: true,
          data: {
            branch,
          },
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create branch',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/branches/:branchId
   * Get details of a specific branch
   */
  server.get<{
    Params: { id: string; branchId: string };
  }>(
    '/:id/branches/:branchId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Get branch
        const branch = await branchService.getBranch(supabase, request.params.branchId);

        if (!branch) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Branch not found',
            },
          });
        }

        // Verify branch belongs to the playbook and user's org
        if (branch.playbookId !== request.params.id || branch.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        return {
          success: true,
          data: {
            branch,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get branch',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/branches/:branchId/switch
   * Switch playbook to a different branch
   */
  server.post<{
    Params: { id: string; branchId: string };
  }>(
    '/:id/branches/:branchId/switch',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Switch branch
        await branchService.switchBranch(supabase, request.params.id, request.params.branchId);

        return {
          success: true,
          data: {
            message: 'Branch switched successfully',
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to switch branch',
          },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/playbooks/:id/branches/:branchId
   * Delete a branch
   */
  server.delete<{
    Params: { id: string; branchId: string };
  }>(
    '/:id/branches/:branchId',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Get branch to verify ownership
        const branch = await branchService.getBranch(supabase, request.params.branchId);

        if (!branch) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Branch not found',
            },
          });
        }

        // Verify branch belongs to the playbook and user's org
        if (branch.playbookId !== request.params.id || branch.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        // Delete branch
        await branchService.deleteBranch(supabase, request.params.branchId);

        return {
          success: true,
          data: {
            message: 'Branch deleted successfully',
          },
        };
      } catch (error: any) {
        // Handle specific error cases
        if (error.message.includes('protected branch')) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'PROTECTED_BRANCH',
              message: error.message,
            },
          });
        }
        if (error.message.includes('active branch')) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'BRANCH_IN_USE',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to delete branch',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/branches/:branchId/commits
   * Create a new commit on a branch
   */
  server.post<{
    Params: { id: string; branchId: string };
    Body: unknown;
  }>(
    '/:id/branches/:branchId/commits',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Get branch to verify ownership
        const branch = await branchService.getBranch(supabase, request.params.branchId);

        if (!branch) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Branch not found',
            },
          });
        }

        // Verify branch belongs to the playbook and user's org
        if (branch.playbookId !== request.params.id || branch.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        // Validate request body
        const { createCommitSchema } = await import('@pravado/validators');
        const validation = createCommitSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: validation.error.errors,
            },
          });
        }

        // Create commit
        const commit = await commitService.createCommit(
          supabase,
          request.params.branchId,
          validation.data.graph as PlaybookGraph,
          validation.data.playbookJson as Record<string, unknown>,
          validation.data.message,
          request.user.id
        );

        return reply.code(201).send({
          success: true,
          data: {
            commit,
          },
        });
      } catch (error: any) {
        // Handle specific error cases
        if (error.message.includes('protected branch')) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'PROTECTED_BRANCH',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create commit',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/branches/:branchId/commits
   * List commits for a branch
   */
  server.get<{
    Params: { id: string; branchId: string };
    Querystring: {
      limit?: string;
      offset?: string;
    };
  }>(
    '/:id/branches/:branchId/commits',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Get branch to verify ownership
        const branch = await branchService.getBranch(supabase, request.params.branchId);

        if (!branch) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Branch not found',
            },
          });
        }

        // Verify branch belongs to the playbook and user's org
        if (branch.playbookId !== request.params.id || branch.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        // Parse query params
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
        const offset = request.query.offset ? parseInt(request.query.offset, 10) : 0;

        // List commits
        const commits = await commitService.listCommits(supabase, request.params.branchId, limit, offset);

        return {
          success: true,
          data: {
            commits,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list commits',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/commits/:commitId/diff
   * Get diff between a commit and its parent
   */
  server.get<{
    Params: { id: string; commitId: string };
  }>(
    '/:id/commits/:commitId/diff',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Get commit
        const commit = await commitService.getCommit(supabase, request.params.commitId);

        if (!commit) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Commit not found',
            },
          });
        }

        // Verify commit belongs to the playbook and user's org
        if (commit.playbookId !== request.params.id || commit.orgId !== orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied',
            },
          });
        }

        // Get diff
        const diff = await commitService.getCommitDiff(supabase, request.params.commitId);

        return {
          success: true,
          data: {
            diff,
            commit: {
              id: commit.id,
              message: commit.message,
              version: commit.version,
              createdAt: commit.createdAt,
              createdBy: commit.createdBy,
            },
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get commit diff',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbooks/:id/commits/dag
   * Get commit DAG for visualization
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id/commits/dag',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Get commit DAG
        const dag = await commitService.getCommitDAG(supabase, request.params.id);

        return {
          success: true,
          data: {
            nodes: dag,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get commit DAG',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/playbooks/:id/merge
   * Merge two branches
   */
  server.post<{
    Params: { id: string };
    Body: unknown;
  }>(
    '/:id/merge',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
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

        // Verify playbook exists and belongs to user's org
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('org_id')
          .eq('id', request.params.id)
          .single();

        if (!playbook || playbook.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook not found',
            },
          });
        }

        // Validate request body
        const { mergeBranchesSchema } = await import('@pravado/validators');
        const validation = mergeBranchesSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: validation.error.errors,
            },
          });
        }

        // Verify both branches exist and belong to the playbook
        const sourceBranch = await branchService.getBranch(supabase, validation.data.sourceBranchId);
        const targetBranch = await branchService.getBranch(supabase, validation.data.targetBranchId);

        if (!sourceBranch || sourceBranch.playbookId !== request.params.id) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Source branch not found',
            },
          });
        }

        if (!targetBranch || targetBranch.playbookId !== request.params.id) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Target branch not found',
            },
          });
        }

        // Perform merge
        const mergeResult = await mergeService.mergeBranches(
          supabase,
          validation.data.sourceBranchId,
          validation.data.targetBranchId,
          request.user.id,
          validation.data.message,
          validation.data.resolveConflicts
        );

        // If merge has conflicts, return 409 Conflict
        if (!mergeResult.success) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'MERGE_CONFLICT',
              message: 'Merge conflicts detected. Please resolve conflicts and retry.',
            },
            data: {
              conflicts: mergeResult.conflicts,
            },
          });
        }

        return {
          success: true,
          data: {
            message: 'Branches merged successfully',
            mergeCommitId: mergeResult.mergeCommitId,
            mergedGraph: mergeResult.mergedGraph,
          },
        };
      } catch (error: any) {
        // Handle specific error cases
        if (error.message.includes('unrelated branches')) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'UNRELATED_BRANCHES',
              message: error.message,
            },
          });
        }
        if (error.message.includes('missing commits')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'MISSING_COMMITS',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to merge branches',
          },
        });
      }
    }
  );
}
