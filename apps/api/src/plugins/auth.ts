import { createLogger } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance, FastifyRequest } from 'fastify';

const logger = createLogger('api:auth');

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
  }
}

export async function authPlugin(server: FastifyInstance) {
  logger.info('[Auth Plugin] Initializing auth plugin...');

  const env = validateEnv(apiEnvSchema);

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.decorateRequest('user', null);

  logger.info('[Auth Plugin] Adding onRequest hook...');

  server.addHook('onRequest', async (request: FastifyRequest) => {
    // Skip logging for health checks to reduce noise
    if (request.url.includes('/health')) {
      return;
    }

    const authHeader = request.headers.authorization;
    logger.info('[Auth] Hook started', { url: request.url, hasAuthHeader: !!authHeader });

    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies?.['sb-access-token'];

    if (!token) {
      logger.info('[Auth] No token provided', { url: request.url });
      return;
    }

    // Log token metadata (not the full token for security)
    const tokenPreview = token.substring(0, 20) + '...' + token.substring(token.length - 10);
    logger.info('[Auth] Token received', { url: request.url, tokenPreview, tokenLength: token.length });

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        logger.warn('[Auth] Supabase auth.getUser error', { url: request.url, error: error.message, errorCode: (error as any).code });
        return;
      }

      if (!user) {
        logger.warn('[Auth] No user returned from Supabase', { url: request.url });
        return;
      }

      logger.info('[Auth] User authenticated', { url: request.url, userId: user.id, email: user.email });
      request.user = {
        id: user.id,
        email: user.email!,
      };
    } catch (error) {
      // Invalid token, continue without user
      logger.error('[Auth] Exception during token validation', { url: request.url, error: error instanceof Error ? error.message : 'Unknown error' });
      return;
    }
  });

  logger.info('[Auth Plugin] Auth plugin initialized successfully');
}
