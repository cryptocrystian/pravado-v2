/**
 * Mailer plugin for Fastify
 * Adds mailer instance to Fastify server
 */

import { createMailer, type Mailer } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Mailer;
  }
}

export async function mailerPlugin(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);

  const mailer = createMailer({
    mailgunApiKey: env.MAILGUN_API_KEY,
    mailgunDomain: env.MAILGUN_DOMAIN,
    mailgunFromEmail: env.MAILGUN_FROM_EMAIL,
  });

  server.decorate('mailer', mailer);
}
