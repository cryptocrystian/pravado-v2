/**
 * Personality API routes (Sprint S11)
 * CRUD operations for agent personalities and assignments
 */

import type { AgentPersonality } from '@pravado/types';
import {
  assignPersonalitySchema,
  createPersonalitySchema,
  listPersonalitiesQuerySchema,
  updatePersonalitySchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { getAllSystemPersonalities } from '../../services/personality/personalityRegistry';
import { PersonalityStore } from '../../services/personality/personalityStore';

/**
 * API Response Types
 */
interface ListPersonalitiesResponse {
  success: boolean;
  data?: {
    items: AgentPersonality[];
  };
  error?: {
    code: string;
    message: string;
  };
}

interface GetPersonalityResponse {
  success: boolean;
  data?: {
    item: AgentPersonality;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface CreatePersonalityResponse {
  success: boolean;
  data?: {
    item: AgentPersonality;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface UpdatePersonalityResponse {
  success: boolean;
  data?: {
    item: AgentPersonality;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface AssignPersonalityResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

interface ListSystemPersonalitiesResponse {
  success: boolean;
  data?: {
    items: Array<{
      slug: string;
      name: string;
      description: string;
      configuration: unknown;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

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

export async function personalitiesRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Services
  const personalityStore = new PersonalityStore(supabase, { debugMode: false });

  // ========================================
  // GET /api/v1/personalities - List custom personalities
  // ========================================
  server.get<{
    Querystring: {
      limit?: string;
      offset?: string;
    };
    Reply: ListPersonalitiesResponse;
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
      const validation = listPersonalitiesQuerySchema.safeParse({
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
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
        const personalities = await personalityStore.listPersonalities(
          orgId,
          validation.data.limit,
          validation.data.offset
        );

        return {
          success: true,
          data: {
            items: personalities,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list personalities',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/personalities/system - List system personalities
  // ========================================
  server.get<{
    Reply: ListSystemPersonalitiesResponse;
  }>(
    '/system',
    {
      preHandler: requireUser,
    },
    async (_request, reply) => {
      try {
        const systemPersonalities = getAllSystemPersonalities();

        return {
          success: true,
          data: {
            items: systemPersonalities,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to list system personalities',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/personalities/:id - Get personality by ID
  // ========================================
  server.get<{
    Params: { id: string };
    Reply: GetPersonalityResponse;
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
        const personality = await personalityStore.getPersonality(orgId, request.params.id);

        if (!personality) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Personality not found',
            },
          });
        }

        return {
          success: true,
          data: {
            item: personality,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get personality',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/personalities - Create personality
  // ========================================
  server.post<{
    Body: unknown;
    Reply: CreatePersonalityResponse;
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
      const validation = createPersonalitySchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid request body',
          },
        });
      }

      try {
        const personality = await personalityStore.createPersonality(
          orgId,
          request.user.id,
          validation.data
        );

        return reply.code(201).send({
          success: true,
          data: {
            item: personality,
          },
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to create personality',
          },
        });
      }
    }
  );

  // ========================================
  // PUT /api/v1/personalities/:id - Update personality
  // ========================================
  server.put<{
    Params: { id: string };
    Body: unknown;
    Reply: UpdatePersonalityResponse;
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
      const validation = updatePersonalitySchema.safeParse(request.body);

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
        const personality = await personalityStore.updatePersonality(
          orgId,
          request.params.id,
          validation.data
        );

        return {
          success: true,
          data: {
            item: personality,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to update personality',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/personalities/assign - Assign personality to agent
  // ========================================
  server.post<{
    Body: unknown;
    Reply: AssignPersonalityResponse;
  }>(
    '/assign',
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
      const validation = assignPersonalitySchema.safeParse(request.body);

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
        await personalityStore.assignPersonalityToAgent(
          orgId,
          validation.data.agentId,
          validation.data.personalityId
        );

        return {
          success: true,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to assign personality',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/personalities/agent/:agentId - Get assigned personality for agent
  // ========================================
  server.get<{
    Params: { agentId: string };
    Reply: GetPersonalityResponse;
  }>(
    '/agent/:agentId',
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
        const personality = await personalityStore.getPersonalityForAgent(
          orgId,
          request.params.agentId
        );

        if (!personality) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'No personality assigned to this agent',
            },
          });
        }

        return {
          success: true,
          data: {
            item: personality,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to get agent personality',
          },
        });
      }
    }
  );

  // ========================================
  // DELETE /api/v1/personalities/agent/:agentId - Remove personality from agent
  // ========================================
  server.delete<{
    Params: { agentId: string };
    Reply: AssignPersonalityResponse;
  }>(
    '/agent/:agentId',
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
        await personalityStore.removePersonalityFromAgent(orgId, request.params.agentId);

        return {
          success: true,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to remove personality assignment',
          },
        });
      }
    }
  );
}
