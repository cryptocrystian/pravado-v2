import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

export async function authPlugin(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.decorateRequest('user', null);

  server.addHook('onRequest', async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies?.['sb-access-token'];

    if (!token) {
      return;
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return;
      }

      request.user = {
        id: user.id,
        email: user.email!,
      };
    } catch (error) {
      // Invalid token, continue without user
      return;
    }
  });
}
