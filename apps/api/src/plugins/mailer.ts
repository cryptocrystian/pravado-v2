import { createMailer, type Mailer } from '@pravado/utils';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Mailer;
  }
}

export async function mailerPlugin(server: FastifyInstance) {
  // Read directly from process.env — bypass validateEnv so
  // RESEND_API_KEY is not stripped by the Zod schema
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
