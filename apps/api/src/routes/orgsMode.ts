/**
 * PR-1 Keystone — per-pillar automation mode API.
 *
 *   GET   /api/v1/orgs/:id/mode        → { success, pillars: { pr, content, seo } }
 *   PATCH /api/v1/orgs/:id/mode        body { pillar, mode } → { success, pillar, state }
 *
 * Registered under the same `/api/v1/orgs` prefix as orgsRoutes, in its own module
 * so the F46 orgs.ts stays untouched. Auth: requireUser + requireOrg (membership of
 * :id). Resolution + persistence live in services/mode/modeService.ts.
 */

import type { PillarModeState, OrgModeState } from '@pravado/types';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { createLogger } from '../lib/logger';
import { requireOrg } from '../middleware/requireOrg';
import { requireUser } from '../middleware/requireUser';
import {
  resolveOrgModeState,
  setPillarMode,
} from '../services/mode/modeService';

const logger = createLogger('api:orgs-mode');

interface GetModeReply {
  success: true;
  pillars: OrgModeState['pillars'];
}
interface SetModeReply {
  success: true;
  pillar: string;
  state: PillarModeState;
}
interface ErrorReply {
  success: false;
  error: { code: string; message: string };
}

export async function orgsModeRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // GET current per-pillar mode state for the caller in this org.
  server.get<{ Params: { id: string }; Reply: GetModeReply | ErrorReply }>(
    '/:id/mode',
    { preHandler: [requireUser, requireOrg] },
    async (request, reply) => {
      const orgId = request.orgId!;
      const userId = request.user!.id;
      try {
        const state = await resolveOrgModeState(supabase, userId, orgId);
        return reply.send({ success: true, pillars: state.pillars });
      } catch (error) {
        logger.error('Failed to resolve org mode state', {
          orgId,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MODE_RESOLVE_FAILED',
            message: 'Failed to resolve mode',
          },
        });
      }
    }
  );

  // PATCH one pillar's mode for the caller in this org.
  server.patch<{
    Params: { id: string };
    Body: { pillar?: string; mode?: string };
    Reply: SetModeReply | ErrorReply;
  }>(
    '/:id/mode',
    { preHandler: [requireUser, requireOrg] },
    async (request, reply) => {
      const orgId = request.orgId!;
      const userId = request.user!.id;
      const { pillar, mode } = request.body ?? {};

      if (typeof pillar !== 'string' || typeof mode !== 'string') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Body must include { pillar, mode }',
          },
        });
      }

      const result = await setPillarMode(supabase, userId, orgId, pillar, mode);
      if (!result.ok) {
        const status = result.reason === 'write_failed' ? 500 : 400;
        return reply.code(status).send({
          success: false,
          error: { code: result.reason.toUpperCase(), message: result.reason },
        });
      }

      logger.info('Set pillar mode', {
        orgId,
        pillar,
        mode: result.state.mode,
        source: result.state.source,
      });
      return reply.send({ success: true, pillar, state: result.state });
    }
  );
}
