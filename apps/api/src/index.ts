/**
 * Pravado v2 API
 * Fastify backend server
 */

import { createLogger } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';

import { createServer } from './server';

const logger = createLogger('api:main');

async function main() {
  try {
    // Validate environment variables
    const env = validateEnv(apiEnvSchema);

    logger.info('Starting Pravado API', {
      environment: env.NODE_ENV,
      port: env.API_PORT,
    });

    // Create and start server
    const server = await createServer();

    await server.listen({
      port: env.API_PORT,
      host: env.API_HOST,
    });

    logger.info('Server started successfully', {
      url: `http://${env.API_HOST}:${env.API_PORT}`,
    });

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully`);
        await server.close();
        process.exit(0);
      });
    }
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

main();
