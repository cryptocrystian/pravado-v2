import { createLogger } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const logger = createLogger('api:auth');

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

async function authPluginImpl(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.decorateRequest('user', null);

  server.addHook('onRequest', async (request: FastifyRequest) => {
    // Skip auth for health checks
    if (request.url.includes('/health')) {
      return;
    }

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

      if (error) {
        logger.warn('[Auth] Supabase auth.getUser error', { error: error.message });
        return;
      }

      if (!user) {
        return;
      }

      logger.debug('[Auth] User authenticated', { userId: user.id });
      request.user = {
        id: user.id,
        email: user.email!,
      };
    } catch (error) {
      // Invalid token, continue without user
      logger.error('[Auth] Exception during token validation', { error: error instanceof Error ? error.message : 'Unknown error' });
      return;
    }
  });

}

/**
 * Export the auth plugin wrapped with fastify-plugin to skip encapsulation.
 * This ensures the onRequest hook is applied to ALL routes registered after this plugin,
 * not just routes within the plugin's own context.
 */
export const authPlugin = fp(authPluginImpl, {
  name: 'auth-plugin',
  fastify: '4.x',
});
