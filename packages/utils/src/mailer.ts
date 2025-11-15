/**
 * Mailer abstraction with Mailgun and console implementations
 */

import type { MailPayload } from '@pravado/types';
import { createLogger } from './logger';

const logger = createLogger('mailer');

export interface Mailer {
  sendMail(payload: MailPayload): Promise<void>;
}

export interface MailerConfig {
  mailgunApiKey?: string;
  mailgunDomain?: string;
  mailgunFromEmail?: string;
}

/**
 * Console mailer - logs emails instead of sending them
 * Used when Mailgun is not configured or in development
 */
export function createConsoleMailer(): Mailer {
  return {
    async sendMail(payload: MailPayload): Promise<void> {
      logger.info('📧 [Console Mailer] Email would be sent:', {
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
 * Mailgun mailer - sends real emails via Mailgun API
 */
export function createMailgunMailer(config: Required<MailerConfig>): Mailer {
  const { mailgunApiKey, mailgunDomain, mailgunFromEmail } = config;

  return {
    async sendMail(payload: MailPayload): Promise<void> {
      const formData = new URLSearchParams();
      formData.append('from', payload.from || mailgunFromEmail);

      if (Array.isArray(payload.to)) {
        payload.to.forEach(email => formData.append('to', email));
      } else {
        formData.append('to', payload.to);
      }

      formData.append('subject', payload.subject);
      formData.append('html', payload.html);

      if (payload.text) {
        formData.append('text', payload.text);
      }

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
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`Mailgun API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as { id?: string };
        logger.info('Email sent successfully via Mailgun:', {
          to: payload.to,
          subject: payload.subject,
          id: result.id,
        });
      } catch (error) {
        logger.error('Failed to send email via Mailgun:', error instanceof Error ? { error: error.message } : { error });
        throw error;
      }
    },
  };
}

/**
 * Check if Mailgun configuration is complete
 */
export function hasMailgunConfig(config: MailerConfig): config is Required<MailerConfig> {
  return !!(
    config.mailgunApiKey &&
    config.mailgunDomain &&
    config.mailgunFromEmail
  );
}

/**
 * Create appropriate mailer based on configuration
 * Falls back to console mailer if Mailgun is not configured
 */
export function createMailer(config: MailerConfig): Mailer {
  if (hasMailgunConfig(config)) {
    logger.info('Initializing Mailgun mailer', {
      domain: config.mailgunDomain,
      from: config.mailgunFromEmail,
    });
    return createMailgunMailer(config);
  }

  logger.warn('Mailgun not configured, using console mailer (emails will be logged only)');
  return createConsoleMailer();
}
