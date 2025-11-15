/**
 * Fastify server setup
 */

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { createLogger } from '@pravado/utils';
import Fastify from 'fastify';

import { authPlugin } from './plugins/auth';
import { mailerPlugin } from './plugins/mailer';
import { agentsRoutes } from './routes/agents';
import { authRoutes } from './routes/auth';
import { contentRoutes } from './routes/content';
import { healthRoutes } from './routes/health';
import { invitesRoutes } from './routes/invites';
import { orgsRoutes } from './routes/orgs';
import { playbooksRoutes } from './routes/playbooks';
import { prRoutes } from './routes/pr';
import { seoRoutes } from './routes/seo';

const logger = createLogger('api:server');

export async function createServer() {
  const server = Fastify({
    logger: false, // We use our custom logger
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  });

  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'pravado-cookie-secret',
  });

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await server.register(authPlugin);
  await server.register(mailerPlugin);

  // Add request logging
  server.addHook('onRequest', async (request) => {
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      requestId: request.id,
    });
  });

  // Add response logging
  server.addHook('onResponse', async (request, reply) => {
    logger.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: request.id,
    });
  });

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(orgsRoutes, { prefix: '/api/v1/orgs' });
  await server.register(invitesRoutes, { prefix: '/api/v1/invites' });

  // Pillar routes (S3)
  await server.register(prRoutes, { prefix: '/api/v1/pr' });
  await server.register(contentRoutes, { prefix: '/api/v1/content' });
  await server.register(seoRoutes, { prefix: '/api/v1/seo' });
  await server.register(playbooksRoutes, { prefix: '/api/v1/playbooks' });
  await server.register(agentsRoutes, { prefix: '/api/v1/agents' });

  // Root endpoint
  server.get('/', async () => {
    return {
      name: 'Pravado API',
      version: '0.0.1-s1',
      status: 'running',
    };
  });

  // 404 handler
  server.setNotFoundHandler(async () => {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    };
  });

  // Error handler
  server.setErrorHandler(async (error, request, reply) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    });

    const statusCode = (error as any).statusCode || 500;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: (error as any).code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  });

  return server;
}
