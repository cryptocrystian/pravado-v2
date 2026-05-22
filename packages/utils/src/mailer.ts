/**
 * Mailer abstraction with Resend and console implementations
 */

import type { MailPayload } from '@pravado/types';
import { createLogger } from './logger';

const logger = createLogger('mailer');

export interface Mailer {
  sendMail(payload: MailPayload): Promise<void>;
}

export interface MailerConfig {
  resendApiKey?: string;
  resendFromEmail?: string;
  // Legacy Mailgun (kept for backward compat, unused if Resend is configured)
  mailgunApiKey?: string;
  mailgunDomain?: string;
  mailgunFromEmail?: string;
}

/**
 * Console mailer - logs emails instead of sending them
 * Used when no email provider is configured or in development
 */
export function createConsoleMailer(): Mailer {
  return {
    async sendMail(payload: MailPayload): Promise<void> {
      logger.info('[Console Mailer] Email would be sent:', {
        to: payload.to,
        subject: payload.subject,
        from: payload.from,
        htmlLength: payload.html.length,
      });

      logger.debug('Email content:', {
        html: payload.html,
        text: payload.text,
      });
    },
  };
}

/**
 * Resend mailer - sends real emails via Resend API
 * https://resend.com/docs/api-reference/emails/send-email
 */
export function createResendMailer(
  apiKey: string,
  defaultFrom: string
): Mailer {
  return {
    async sendMail(payload: MailPayload): Promise<void> {
      const to = Array.isArray(payload.to) ? payload.to : [payload.to];

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: payload.from || defaultFrom,
            to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text || undefined,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          logger.error('Resend API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
          throw new Error(
            `Resend API error: ${response.status} ${response.statusText}`
          );
        }

        const result = (await response.json()) as { id?: string };
        logger.info('Email sent successfully via Resend:', {
          to: payload.to,
          subject: payload.subject,
          id: result.id,
        });
      } catch (error) {
        logger.error(
          'Failed to send email via Resend:',
          error instanceof Error ? { error: error.message } : { error }
        );
        throw error;
      }
    },
  };
}

/**
 * Mailgun mailer (legacy) - sends real emails via Mailgun API
 */
export function createMailgunMailer(config: {
  mailgunApiKey: string;
  mailgunDomain: string;
  mailgunFromEmail: string;
}): Mailer {
  const { mailgunApiKey, mailgunDomain, mailgunFromEmail } = config;

  return {
    async sendMail(payload: MailPayload): Promise<void> {
      const formData = new URLSearchParams();
      formData.append('from', payload.from || mailgunFromEmail);

      if (Array.isArray(payload.to)) {
        payload.to.forEach((email) => formData.append('to', email));
      } else {
        formData.append('to', payload.to);
      }

      formData.append('subject', payload.subject);
      formData.append('html', payload.html);
      if (payload.text) formData.append('text', payload.text);

      const url = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Mailgun API error:', {
            status: response.status,
            body: errorText,
          });
          throw new Error(`Mailgun API error: ${response.status}`);
        }

        const result = (await response.json()) as { id?: string };
        logger.info('Email sent via Mailgun:', {
          to: payload.to,
          id: result.id,
        });
      } catch (error) {
        logger.error(
          'Failed to send email via Mailgun:',
          error instanceof Error ? { error: error.message } : { error }
        );
        throw error;
      }
    },
  };
}

/**
 * Check if Mailgun configuration is complete (legacy)
 */
export function hasMailgunConfig(config: MailerConfig): boolean {
  return !!(
    config.mailgunApiKey &&
    config.mailgunDomain &&
    config.mailgunFromEmail
  );
}

/**
 * Create appropriate mailer based on configuration
 * Priority: Resend > Mailgun > Console
 */
export function createMailer(config: MailerConfig): Mailer {
  // Resend takes priority
  if (config.resendApiKey) {
    const from = config.resendFromEmail || 'hello@pravado.io';
    logger.info('Initializing Resend mailer', { from });
    return createResendMailer(config.resendApiKey, from);
  }

  // Fall back to Mailgun if configured
  if (config.mailgunApiKey && config.mailgunDomain && config.mailgunFromEmail) {
    logger.info('Initializing Mailgun mailer (legacy)', {
      domain: config.mailgunDomain,
    });
    return createMailgunMailer({
      mailgunApiKey: config.mailgunApiKey,
      mailgunDomain: config.mailgunDomain,
      mailgunFromEmail: config.mailgunFromEmail,
    });
  }

  logger.warn(
    'No email provider configured, using console mailer (emails will be logged only)'
  );
  return createConsoleMailer();
}
