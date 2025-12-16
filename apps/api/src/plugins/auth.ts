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
    // Use console.log to bypass any logger buffering issues
    console.log('[AUTH HOOK] ===== HOOK INVOKED =====', request.url);

    // Skip logging for health checks to reduce noise
    if (request.url.includes('/health')) {
      return;
    }

    const authHeader = request.headers.authorization;
    console.log('[AUTH HOOK] Processing request', { url: request.url, hasAuthHeader: !!authHeader });
    logger.info('[Auth] Hook started', { url: request.url, hasAuthHeader: !!authHeader });

    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies?.['sb-access-token'];

    if (!token) {
      console.log('[AUTH HOOK] No token provided for', request.url);
      logger.info('[Auth] No token provided', { url: request.url });
      return;
    }

    // Log token metadata (not the full token for security)
    const tokenPreview = token.substring(0, 20) + '...' + token.substring(token.length - 10);
    console.log('[AUTH HOOK] Token received', { url: request.url, tokenPreview, tokenLength: token.length });
    logger.info('[Auth] Token received', { url: request.url, tokenPreview, tokenLength: token.length });

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.log('[AUTH HOOK] Supabase error:', error.message, (error as any).code);
        logger.warn('[Auth] Supabase auth.getUser error', { url: request.url, error: error.message, errorCode: (error as any).code });
        return;
      }

      if (!user) {
        console.log('[AUTH HOOK] No user returned from Supabase');
        logger.warn('[Auth] No user returned from Supabase', { url: request.url });
        return;
      }

      console.log('[AUTH HOOK] User authenticated!', user.id, user.email);
      logger.info('[Auth] User authenticated', { url: request.url, userId: user.id, email: user.email });
      request.user = {
        id: user.id,
        email: user.email!,
      };
    } catch (error) {
      // Invalid token, continue without user
      console.log('[AUTH HOOK] Exception:', error instanceof Error ? error.message : 'Unknown error');
      logger.error('[Auth] Exception during token validation', { url: request.url, error: error instanceof Error ? error.message : 'Unknown error' });
      return;
    }
  });

  logger.info('[Auth Plugin] Auth plugin initialized successfully');
}
