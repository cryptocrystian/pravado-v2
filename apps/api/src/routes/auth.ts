import type {
  SessionRequest,
  UserSessionResponse,
  User,
  Org,
} from '@pravado/types';
import { validateEnv, apiEnvSchema, sessionRequestSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../middleware/requireUser';


export async function authRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.post<{ Body: SessionRequest }>(
    '/session',
    async (request, reply) => {
      // Validate request body
      const validation = sessionRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { accessToken } = validation.data;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          },
        });
      }

      reply.setCookie('sb-access-token', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email!,
          },
        },
      };
    }
  );

  server.get<{ Reply: UserSessionResponse }>(
    '/me',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
          },
        });
      }

      const user: User = {
        id: userData.id,
        fullName: userData.full_name,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
        updatedAt: userData.created_at,
      };

      const { data: memberships } = await supabase
        .from('org_members')
        .select('org_id, orgs(*)')
        .eq('user_id', userId);

      const orgs: Org[] =
        memberships?.map((m: any) => ({
          id: m.orgs.id,
          name: m.orgs.name,
          createdAt: m.orgs.created_at,
          updatedAt: m.orgs.updated_at,
        })) || [];

      const activeOrg = orgs.length > 0 ? orgs[0] : null;

      return {
        success: true,
        data: {
          user,
          orgs,
          activeOrg,
        },
      };
    }
  );
}
