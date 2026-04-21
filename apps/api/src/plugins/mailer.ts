/**
 * Mailer plugin for Fastify
 * Adds mailer instance to Fastify server
 *
 * Wrapped with fastify-plugin to skip encapsulation — makes
 * server.mailer visible to all child route plugins.
 *
 * Priority: Resend > Mailgun > Console (log only)
 */

import fp from 'fastify-plugin';
import { createMailer, type Mailer } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Mailer;
  }
}

async function mailerPluginImpl(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);

  const mailer = createMailer({
    // Resend (primary)
    resendApiKey: env.RESEND_API_KEY,
    resendFromEmail: env.RESEND_FROM_EMAIL,
    // Mailgun (legacy fallback)
    mailgunApiKey: env.MAILGUN_API_KEY,
    mailgunDomain: env.MAILGUN_DOMAIN,
    mailgunFromEmail: env.MAILGUN_FROM_EMAIL,
  });

  server.decorate('mailer', mailer);
}

export const mailerPlugin = fp(mailerPluginImpl, {
  name: 'mailer',
});
