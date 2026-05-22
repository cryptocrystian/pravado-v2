/**
 * Mailer plugin for Fastify
 *
 * Two things this plugin does that matter:
 *   1. Reads from process.env directly (NOT validateEnv). The shipped
 *      @pravado/validators dist on Render was built before RESEND_API_KEY
 *      existed in the Zod schema, so validateEnv() strips it.
 *   2. Wrapped with fastify-plugin so server.mailer is visible to sibling
 *      route plugins (silo-tax /claim, etc). Without fp, decoration is
 *      trapped in this plugin's encapsulated scope.
 *
 * Priority: Resend > Mailgun > Console (log only)
 */

import { createMailer, type Mailer } from '@pravado/utils';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Mailer;
  }
}

async function mailerPluginImpl(server: FastifyInstance) {
  const mailer = createMailer({
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL
      || 'hello@pravado.io',
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL,
  });
  server.decorate('mailer', mailer);
}

export const mailerPlugin = fp(mailerPluginImpl, {
  name: 'mailer',
});
