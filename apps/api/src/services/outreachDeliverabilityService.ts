const logger = createLogger('api:services:outreachDeliverabilityService');
/**
 * PR Outreach Deliverability Service (Sprint S45)
 * Handles email deliverability tracking, provider integration, and engagement analytics
 */

import type {
  CreateEmailMessageInput,
  DeliverabilitySummary,
  EmailMessage,
  EmailMessageListResponse,
  EmailProvider,
  EngagementMetrics,
  EngagementMetricsListResponse,
  EngagementScoreResult,
  JournalistEngagement,
  ListEmailMessagesQuery,
  ListEngagementMetricsQuery,
  ProviderConfig,
  ProviderEventType,
  SendEmailRequest,
  SendEmailResponse,
  UpdateEmailMessageInput,
  UpdateEngagementMetricResult,
  WebhookPayload,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { hashEmail } from './emailSuppression';
import { createLogger } from '../lib/logger';

// =============================================
// Database Mappers
// =============================================

function mapDbEmailMessage(row: any): EmailMessage {
  return {
    id: row.id,
    orgId: row.org_id,
    runId: row.run_id,
    sequenceId: row.sequence_id,
    stepNumber: row.step_number,
    journalistId: row.journalist_id,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    providerMessageId: row.provider_message_id,
    sendStatus: row.send_status,
    sentAt: row.sent_at ? new Date(row.sent_at) : null,
    deliveredAt: row.delivered_at ? new Date(row.delivered_at) : null,
    openedAt: row.opened_at ? new Date(row.opened_at) : null,
    clickedAt: row.clicked_at ? new Date(row.clicked_at) : null,
    bouncedAt: row.bounced_at ? new Date(row.bounced_at) : null,
    complainedAt: row.complained_at ? new Date(row.complained_at) : null,
    rawEvent: row.raw_event || {},
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapDbEngagementMetrics(row: any): EngagementMetrics {
  return {
    id: row.id,
    orgId: row.org_id,
    journalistId: row.journalist_id,
    totalSent: row.total_sent,
    totalOpened: row.total_opened,
    totalClicked: row.total_clicked,
    totalReplied: row.total_replied,
    totalBounced: row.total_bounced,
    totalComplained: row.total_complained,
    engagementScore: row.engagement_score,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapDbJournalistEngagement(row: any): JournalistEngagement {
  const metrics = mapDbEngagementMetrics(row);

  // Calculate rates
  const totalSent = metrics.totalSent || 1; // Avoid division by zero
  const openRate = metrics.totalOpened / totalSent;
  const clickRate = metrics.totalClicked / totalSent;
  const replyRate = metrics.totalReplied / totalSent;
  const bounceRate = metrics.totalBounced / totalSent;

  return {
    ...metrics,
    journalist: {
      id: row.journalist_id,
      name: row.journalist_name || 'Unknown',
      email: row.journalist_email || '',
      outlet: row.journalist_outlet || null,
    },
    openRate,
    clickRate,
    replyRate,
    bounceRate,
  };
}

// =============================================
// Email Provider Abstraction
// =============================================

/**
 * Abstract email provider interface
 */
abstract class EmailProviderBase {
  constructor(protected config: ProviderConfig) {}

  abstract send(request: SendEmailRequest): Promise<SendEmailResponse>;
  abstract validateWebhookSignature(
    payload: string,
    signature?: string,
    timestamp?: string,
    // Optional webhook id — Svix-signed providers (Resend) need it in the signed
    // content; providers that don't (SendGrid ECDSA) ignore it.
    id?: string
  ): Promise<boolean>;
  abstract normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null>;
}

/**
 * Stub provider for testing
 */
class StubEmailProvider extends EmailProviderBase {
  async send(_request: SendEmailRequest): Promise<SendEmailResponse> {
    // Simulate successful send
    const messageId = `stub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
      provider: 'stub',
    };
  }

  async validateWebhookSignature(
    _payload: string,
    _signature?: string,
    _timestamp?: string
  ): Promise<boolean> {
    return true; // Always valid for stub
  }

  async normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null> {
    if (!payload.messageId || !payload.eventType) {
      return null;
    }

    return {
      messageId: payload.messageId,
      eventType: payload.eventType,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      recipientEmail: payload.recipientEmail || 'test@example.com',
      metadata: payload.metadata || {},
    };
  }
}

/**
 * SendGrid provider (S98 - Real Implementation)
 */
class SendGridEmailProvider extends EmailProviderBase {
  async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        messageId: null,
        provider: 'sendgrid',
        error: 'SendGrid API key not configured',
      };
    }

    try {
      // Build SendGrid Mail API v3 request
      const sendgridPayload = {
        personalizations: [
          {
            to: [{ email: request.to }],
            subject: request.subject,
          },
        ],
        from: {
          // from-EMAIL stays the authenticated platform address (DKIM/SPF/DMARC);
          // only the DISPLAY NAME varies per customer.
          email: this.config.fromEmail || 'noreply@pravado.com',
          name: request.fromName || this.config.fromName || 'Pravado',
        },
        // Route journalist replies to the customer's real mailbox, not the
        // platform from-address. Omitted when no per-send reply-to is provided.
        ...(request.replyTo?.email
          ? {
              reply_to: {
                email: request.replyTo.email,
                ...(request.replyTo.name ? { name: request.replyTo.name } : {}),
              },
            }
          : {}),
        content: [
          ...(request.bodyText
            ? [{ type: 'text/plain', value: request.bodyText }]
            : []),
          ...(request.bodyHtml
            ? [{ type: 'text/html', value: request.bodyHtml }]
            : []),
        ],
        // Enable click and open tracking
        tracking_settings: {
          click_tracking: { enable: true, enable_text: false },
          open_tracking: { enable: true },
        },
        // Add custom metadata for webhook correlation. SendGrid flattens these
        // onto every event it posts back — orgId is how the webhook resolves the
        // owning org (#7) without a fragile message-id lookup.
        custom_args: {
          orgId: String(request.metadata?.orgId ?? ''),
          runId: String(request.metadata?.runId ?? ''),
          sequenceId: String(request.metadata?.sequenceId ?? ''),
          journalistId: String(request.metadata?.journalistId ?? ''),
        },
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendgridPayload),
      });

      if (response.status === 202) {
        // SendGrid returns 202 Accepted on success
        // Extract message ID from X-Message-Id header
        const messageId =
          response.headers.get('X-Message-Id') ||
          `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          success: true,
          messageId,
          provider: 'sendgrid',
        };
      } else {
        const errorBody = await response.text();
        return {
          success: false,
          messageId: null,
          provider: 'sendgrid',
          error: `SendGrid API error ${response.status}: ${errorBody}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        messageId: null,
        provider: 'sendgrid',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate SendGrid Event Webhook signature (S98)
   * SendGrid uses ECDSA signatures with their public verification key
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  async validateWebhookSignature(
    payload: string,
    signature?: string,
    timestamp?: string
  ): Promise<boolean> {
    // If no webhook verification key configured, skip validation (dev mode)
    const verificationKey = this.config.webhookKey;
    if (!verificationKey) {
      logger.warn(
        '[SendGrid] No webhook verification key configured, skipping signature validation'
      );
      return true;
    }

    // Require signature and timestamp for validation
    if (!signature || !timestamp) {
      logger.error(
        '[SendGrid] Missing signature or timestamp for webhook validation'
      );
      return false;
    }

    try {
      // Import Node.js crypto module
      const crypto = await import('crypto');

      // SendGrid signature verification:
      // 1. Concatenate timestamp + payload
      // 2. Verify ECDSA signature using SendGrid's public key
      const payloadToVerify = timestamp + payload;

      // Create verifier with the provided public key
      const verifier = crypto.createVerify('sha256');
      verifier.update(payloadToVerify);

      // Decode base64 signature and verify
      const signatureBuffer = Buffer.from(signature, 'base64');
      const isValid = verifier.verify(verificationKey, signatureBuffer);

      if (!isValid) {
        logger.error('[SendGrid] Webhook signature validation failed');
      }

      return isValid;
    } catch (error) {
      logger.error('[SendGrid] Webhook signature validation error:', error);
      return false;
    }
  }

  async normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null> {
    if (!payload.event || !payload.email) {
      return null;
    }

    // Map SendGrid event types to our standard types
    const eventTypeMap: Record<string, ProviderEventType> = {
      delivered: 'delivered',
      open: 'opened',
      click: 'clicked',
      bounce: 'bounced',
      dropped: 'bounced',
      spamreport: 'complained',
      unsubscribe: 'complained',
    };

    const eventType = eventTypeMap[payload.event];
    if (!eventType) {
      return null;
    }

    return {
      messageId: payload.sg_message_id || payload['smtp-id'],
      eventType,
      timestamp: payload.timestamp
        ? new Date(payload.timestamp * 1000)
        : new Date(),
      recipientEmail: payload.email,
      metadata: {
        sendgridEvent: payload.event,
        sgEventId: payload.sg_event_id,
      },
    };
  }
}

/**
 * Mailgun provider
 */
class MailgunEmailProvider extends EmailProviderBase {
  async send(_request: SendEmailRequest): Promise<SendEmailResponse> {
    if (!this.config.apiKey || !this.config.domain) {
      return {
        success: false,
        messageId: null,
        provider: 'mailgun',
        error: 'Mailgun API key or domain not configured',
      };
    }

    try {
      // TODO: Implement actual Mailgun API call
      // This is a placeholder for future implementation
      const messageId = `mg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        messageId,
        provider: 'mailgun',
      };
    } catch (error) {
      return {
        success: false,
        messageId: null,
        provider: 'mailgun',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateWebhookSignature(
    _payload: string,
    _signature?: string,
    _timestamp?: string
  ): Promise<boolean> {
    // TODO: Implement Mailgun webhook signature validation
    // For now, return true (implement proper validation in production)
    return true;
  }

  async normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null> {
    if (!payload.event || !payload.recipient) {
      return null;
    }

    // Map Mailgun event types to our standard types
    const eventTypeMap: Record<string, ProviderEventType> = {
      delivered: 'delivered',
      opened: 'opened',
      clicked: 'clicked',
      bounced: 'bounced',
      failed: 'failed',
      complained: 'complained',
      unsubscribed: 'complained',
    };

    const eventType = eventTypeMap[payload.event];
    if (!eventType) {
      return null;
    }

    return {
      messageId: payload['message-id'],
      eventType,
      timestamp: payload.timestamp
        ? new Date(payload.timestamp * 1000)
        : new Date(),
      recipientEmail: payload.recipient,
      metadata: {
        mailgunEvent: payload.event,
      },
    };
  }
}

/**
 * AWS SES provider
 */
class SESEmailProvider extends EmailProviderBase {
  async send(_request: SendEmailRequest): Promise<SendEmailResponse> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      return {
        success: false,
        messageId: null,
        provider: 'ses',
        error: 'AWS SES credentials not configured',
      };
    }

    try {
      // TODO: Implement actual AWS SES API call
      // This is a placeholder for future implementation
      const messageId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        messageId,
        provider: 'ses',
      };
    } catch (error) {
      return {
        success: false,
        messageId: null,
        provider: 'ses',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateWebhookSignature(
    _payload: string,
    _signature?: string,
    _timestamp?: string
  ): Promise<boolean> {
    // TODO: Implement AWS SNS signature validation
    // For now, return true (implement proper validation in production)
    return true;
  }

  async normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null> {
    if (!payload.eventType || !payload.mail) {
      return null;
    }

    // Map SES event types to our standard types
    const eventTypeMap: Record<string, ProviderEventType> = {
      Delivery: 'delivered',
      Open: 'opened',
      Click: 'clicked',
      Bounce: 'bounced',
      Complaint: 'complained',
    };

    const eventType = eventTypeMap[payload.eventType];
    if (!eventType) {
      return null;
    }

    return {
      messageId: payload.mail.messageId,
      eventType,
      timestamp: payload.mail.timestamp
        ? new Date(payload.mail.timestamp)
        : new Date(),
      recipientEmail: payload.mail.destination?.[0] || '',
      metadata: {
        sesEventType: payload.eventType,
      },
    };
  }
}

/** Resend tags allow only [A-Za-z0-9_-], max 256 chars. */
function sanitizeResendTag(v: unknown): string {
  return String(v ?? '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 256);
}

/**
 * Verify a Svix-signed webhook (Resend). Shared by the engagement webhook and
 * the inbound-reply webhook — both are signed the same way but with their own
 * per-endpoint `whsec_` secret.
 *
 * Returns true when no secret is configured (dev/CI escape hatch — the 128-bit
 * reply token is the primary capability), false on any missing header or
 * mismatch. The signed content is `${id}.${timestamp}.${rawBody}` and the
 * `svix-signature` header is a space-separated list of `v1,<base64sig>` tokens.
 */
export async function verifySvixSignature(
  secret: string | undefined,
  opts: {
    id?: string;
    timestamp?: string;
    signature?: string;
    payload: string;
  }
): Promise<boolean> {
  if (!secret) {
    logger.warn('[Svix] No webhook secret configured, skipping validation');
    return true;
  }
  if (!opts.signature || !opts.timestamp || !opts.id) {
    logger.error('[Svix] Missing svix headers for webhook validation');
    return false;
  }
  try {
    const crypto = await import('crypto');
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const signedContent = `${opts.id}.${opts.timestamp}.${opts.payload}`;
    const expected = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');
    const provided = opts.signature
      .split(' ')
      .map((s) => (s.includes(',') ? s.split(',')[1] : s));
    return provided.some((sig) => {
      try {
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    });
  } catch (error) {
    logger.error('[Svix] Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Resend provider — real send + Svix-signed webhooks.
 *
 * Resend supports `reply_to` natively per-send (our tokenized reply-to) and has a
 * true free tier. Correlation IDs ride as `tags` (echoed on webhook events) and
 * as the returned message id (stored as provider_message_id for lookup). Webhooks
 * are Svix-signed (svix-id / svix-timestamp / svix-signature headers, `whsec_` secret).
 */
class ResendEmailProvider extends EmailProviderBase {
  async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        messageId: null,
        provider: 'resend',
        error: 'Resend API key not configured',
      };
    }
    try {
      const fromEmail = this.config.fromEmail || 'onboarding@resend.dev';
      const fromName = request.fromName || this.config.fromName || 'Pravado';
      const tags = [
        { name: 'orgId', value: sanitizeResendTag(request.metadata?.orgId) },
        { name: 'runId', value: sanitizeResendTag(request.metadata?.runId) },
        {
          name: 'journalistId',
          value: sanitizeResendTag(request.metadata?.journalistId),
        },
      ].filter((t) => t.value);

      const payload: Record<string, unknown> = {
        from: `${fromName} <${fromEmail}>`,
        to: [request.to],
        subject: request.subject,
        ...(request.bodyHtml ? { html: request.bodyHtml } : {}),
        ...(request.bodyText ? { text: request.bodyText } : {}),
        // Native per-send reply-to → our tokenized <token>@reply.pravado.io.
        ...(request.replyTo?.email ? { reply_to: request.replyTo.email } : {}),
        ...(tags.length ? { tags } : {}),
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };
      if (response.ok && body.id) {
        return { success: true, messageId: body.id, provider: 'resend' };
      }
      return {
        success: false,
        messageId: null,
        provider: 'resend',
        error: `Resend API error ${response.status}: ${JSON.stringify(body)}`,
      };
    } catch (error) {
      return {
        success: false,
        messageId: null,
        provider: 'resend',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateWebhookSignature(
    payload: string,
    signature?: string,
    timestamp?: string,
    id?: string
  ): Promise<boolean> {
    return verifySvixSignature(this.config.webhookKey, {
      id,
      timestamp,
      signature,
      payload,
    });
  }

  async normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null> {
    const type = payload?.type as string | undefined;
    const data = payload?.data;
    if (!type || !data) return null;
    const eventTypeMap: Record<string, ProviderEventType> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.delivery_delayed': 'failed',
    };
    const eventType = eventTypeMap[type];
    if (!eventType) return null;
    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
    return {
      messageId: data.email_id || data.id,
      eventType,
      timestamp: data.created_at ? new Date(data.created_at) : new Date(),
      recipientEmail: recipient || '',
      metadata: { resendEvent: type },
    };
  }
}

// =============================================
// Provider Factory
// =============================================

function createEmailProvider(config: ProviderConfig): EmailProviderBase {
  switch (config.provider) {
    case 'sendgrid':
      return new SendGridEmailProvider(config);
    case 'resend':
      return new ResendEmailProvider(config);
    case 'mailgun':
      return new MailgunEmailProvider(config);
    case 'ses':
      return new SESEmailProvider(config);
    case 'stub':
      return new StubEmailProvider(config);
    default:
      throw new Error(`Unknown email provider: ${config.provider}`);
  }
}

// =============================================
// Service Class
// =============================================

export class OutreachDeliverabilityService {
  constructor(
    private supabase: SupabaseClient,
    private providerConfig?: ProviderConfig
  ) {}

  // =============================================
  // Email Message Operations
  // =============================================

  /**
   * Create a new email message record
   */
  async createEmailMessage(
    orgId: string,
    input: CreateEmailMessageInput
  ): Promise<EmailMessage> {
    const { data, error } = await this.supabase
      .from('pr_outreach_email_messages')
      .insert({
        org_id: orgId,
        run_id: input.runId,
        sequence_id: input.sequenceId,
        step_number: input.stepNumber,
        journalist_id: input.journalistId,
        subject: input.subject,
        body_html: input.bodyHtml,
        body_text: input.bodyText,
        provider_message_id: input.providerMessageId || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbEmailMessage(data);
  }

  /**
   * Get an email message by ID
   */
  async getEmailMessage(
    messageId: string,
    orgId: string
  ): Promise<EmailMessage | null> {
    const { data, error } = await this.supabase
      .from('pr_outreach_email_messages')
      .select('*')
      .eq('id', messageId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapDbEmailMessage(data);
  }

  /**
   * Get email message by provider message ID
   */
  async getEmailMessageByProviderMessageId(
    providerMessageId: string,
    orgId: string
  ): Promise<EmailMessage | null> {
    const { data, error } = await this.supabase
      .from('pr_outreach_email_messages')
      .select('*')
      .eq('provider_message_id', providerMessageId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapDbEmailMessage(data);
  }

  /**
   * List email messages
   */
  async listEmailMessages(
    orgId: string,
    query: ListEmailMessagesQuery
  ): Promise<EmailMessageListResponse> {
    let dbQuery = this.supabase
      .from('pr_outreach_email_messages')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.runId) {
      dbQuery = dbQuery.eq('run_id', query.runId);
    }
    if (query.sequenceId) {
      dbQuery = dbQuery.eq('sequence_id', query.sequenceId);
    }
    if (query.journalistId) {
      dbQuery = dbQuery.eq('journalist_id', query.journalistId);
    }
    if (query.sendStatus) {
      dbQuery = dbQuery.eq('send_status', query.sendStatus);
    }

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    return {
      messages: (data || []).map(mapDbEmailMessage),
      total: count || 0,
    };
  }

  /**
   * Update an email message
   */
  async updateEmailMessage(
    messageId: string,
    orgId: string,
    input: UpdateEmailMessageInput
  ): Promise<EmailMessage> {
    const updateData: any = {};

    if (input.providerMessageId !== undefined)
      updateData.provider_message_id = input.providerMessageId;
    if (input.sendStatus !== undefined)
      updateData.send_status = input.sendStatus;
    if (input.sentAt !== undefined) updateData.sent_at = input.sentAt;
    if (input.deliveredAt !== undefined)
      updateData.delivered_at = input.deliveredAt;
    if (input.openedAt !== undefined) updateData.opened_at = input.openedAt;
    if (input.clickedAt !== undefined) updateData.clicked_at = input.clickedAt;
    if (input.bouncedAt !== undefined) updateData.bounced_at = input.bouncedAt;
    if (input.complainedAt !== undefined)
      updateData.complained_at = input.complainedAt;
    if (input.rawEvent !== undefined) updateData.raw_event = input.rawEvent;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('pr_outreach_email_messages')
      .update(updateData)
      .eq('id', messageId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return mapDbEmailMessage(data);
  }

  /**
   * Delete an email message
   */
  async deleteEmailMessage(messageId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pr_outreach_email_messages')
      .delete()
      .eq('id', messageId)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  // =============================================
  // Engagement Metrics Operations
  // =============================================

  /**
   * Get engagement metrics for a journalist
   */
  async getEngagementMetrics(
    journalistId: string,
    orgId: string
  ): Promise<EngagementMetrics | null> {
    const { data, error } = await this.supabase
      .from('pr_outreach_engagement_metrics')
      .select('*')
      .eq('journalist_id', journalistId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapDbEngagementMetrics(data);
  }

  /**
   * List engagement metrics
   */
  async listEngagementMetrics(
    orgId: string,
    query: ListEngagementMetricsQuery
  ): Promise<EngagementMetricsListResponse> {
    let dbQuery = this.supabase
      .from('pr_outreach_engagement_metrics')
      .select(
        `
        *,
        journalists!inner (
          id,
          name,
          email,
          outlet
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', orgId);

    // Apply filters
    if (query.minScore !== undefined) {
      dbQuery = dbQuery.gte('engagement_score', query.minScore);
    }
    if (query.maxScore !== undefined) {
      dbQuery = dbQuery.lte('engagement_score', query.maxScore);
    }

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery
      .order('engagement_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    const metrics = (data || []).map((row) => {
      const journalist = Array.isArray(row.journalists)
        ? row.journalists[0]
        : row.journalists;
      return mapDbJournalistEngagement({
        ...row,
        journalist_name: journalist?.name,
        journalist_email: journalist?.email,
        journalist_outlet: journalist?.outlet,
      });
    });

    return {
      metrics,
      total: count || 0,
    };
  }

  /**
   * Update engagement metrics for a journalist
   * This is typically called by database triggers, but can be manually invoked
   */
  async updateEngagementMetrics(
    journalistId: string,
    orgId: string
  ): Promise<UpdateEngagementMetricResult> {
    // Get current metrics before update
    const currentMetrics = await this.getEngagementMetrics(journalistId, orgId);
    const previousScore = currentMetrics?.engagementScore || 0;

    // Call the database function to recalculate metrics
    const { error } = await this.supabase.rpc(
      'update_journalist_engagement_metrics',
      {
        p_org_id: orgId,
        p_journalist_id: journalistId,
      }
    );

    if (error) throw error;

    // Get updated metrics
    const updatedMetrics = await this.getEngagementMetrics(journalistId, orgId);
    const newScore = updatedMetrics?.engagementScore || 0;

    return {
      journalistId,
      previousScore,
      newScore,
      metricsUpdated: true,
    };
  }

  /**
   * Calculate engagement score for given metrics
   */
  calculateEngagementScore(
    totalSent: number,
    totalOpened: number,
    totalClicked: number,
    totalReplied: number,
    totalBounced: number
  ): EngagementScoreResult {
    if (totalSent === 0) {
      return {
        score: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
        bounceRate: 0,
      };
    }

    const openRate = totalOpened / totalSent;
    const clickRate = totalClicked / totalSent;
    const replyRate = totalReplied / totalSent;
    const bounceRate = totalBounced / totalSent;

    // Formula: (open_rate * 0.2) + (click_rate * 0.4) + (reply_rate * 0.3) - (bounce_rate * 0.3)
    let score =
      openRate * 0.2 + clickRate * 0.4 + replyRate * 0.3 - bounceRate * 0.3;

    // Clamp between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return {
      score,
      openRate,
      clickRate,
      replyRate,
      bounceRate,
    };
  }

  // =============================================
  // Email Sending
  // =============================================

  /**
   * Send an email using the configured provider
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    if (!this.providerConfig) {
      return {
        success: false,
        messageId: null,
        provider: 'stub',
        error: 'No email provider configured',
      };
    }

    const provider = createEmailProvider(this.providerConfig);
    return provider.send(request);
  }

  // =============================================
  // Webhook Processing
  // =============================================

  /**
   * Process a webhook event from an email provider (S98 - with signature validation)
   */
  async processWebhookEvent(
    orgId: string,
    providerType: EmailProvider,
    payload: any,
    signature?: string,
    timestamp?: string,
    rawBody?: string,
    id?: string
  ): Promise<{ success: boolean; messageId: string | null }> {
    // Create provider instance for validation and normalization
    const providerConfig: ProviderConfig = {
      provider: providerType,
      fromEmail: this.providerConfig?.fromEmail || 'noreply@pravado.com',
      fromName: this.providerConfig?.fromName || 'Pravado',
      ...this.providerConfig,
    };

    const provider = createEmailProvider(providerConfig);

    // Validate webhook signature (use raw body for ECDSA validation)
    const payloadForValidation = rawBody || JSON.stringify(payload);
    const isValid = await provider.validateWebhookSignature(
      payloadForValidation,
      signature,
      timestamp,
      id
    );
    if (!isValid) {
      // Webhook signature validation failed
      return { success: false, messageId: null };
    }

    // Normalize the event
    const normalized = await provider.normalizeWebhookEvent(payload);
    if (!normalized) {
      // Failed to normalize webhook event
      return { success: false, messageId: null };
    }

    // Find the email message by provider message ID
    const message = await this.getEmailMessageByProviderMessageId(
      normalized.messageId,
      orgId
    );
    if (!message) {
      // Email message not found for provider message ID
      return { success: false, messageId: null };
    }

    // Update the message based on event type
    const updateData: UpdateEmailMessageInput = {
      rawEvent: payload,
    };

    switch (normalized.eventType) {
      case 'delivered':
        updateData.deliveredAt = normalized.timestamp;
        if (!message.sentAt) {
          updateData.sentAt = normalized.timestamp;
          updateData.sendStatus = 'sent';
        }
        break;
      case 'opened':
        updateData.openedAt = normalized.timestamp;
        break;
      case 'clicked':
        updateData.clickedAt = normalized.timestamp;
        break;
      case 'bounced':
        updateData.bouncedAt = normalized.timestamp;
        updateData.sendStatus = 'bounced';
        break;
      case 'complained':
        updateData.complainedAt = normalized.timestamp;
        updateData.sendStatus = 'complained';
        break;
      case 'failed':
        updateData.sendStatus = 'failed';
        break;
    }

    // Update the message
    await this.updateEmailMessage(message.id, orgId, updateData);

    // Lane B — opt-out / bounce intake. Previously bounce & unsubscribe were
    // silently remapped onto the message send_status only; the contact was
    // NEVER suppressed. Now a bounce drives [any]->bounced and an
    // unsubscribe/complaint drives [any]->suppressed (permanent, global,
    // irreversible), each with a contact_state_transitions audit row.
    if (
      normalized.eventType === 'bounced' ||
      normalized.eventType === 'complained'
    ) {
      await this.applySuppressionFromWebhook(
        normalized.recipientEmail,
        normalized.eventType
      );
    }

    // Update engagement metrics for the journalist
    await this.updateEngagementMetrics(message.journalistId, orgId);

    return { success: true, messageId: message.id };
  }

  /**
   * Drive the contact state machine from a provider webhook (Lane B).
   * bounced   -> [any] -> 'bounced'    (trigger 'bounce')
   * complained-> [any] -> 'suppressed' (trigger 'opt_out'; covers unsubscribe
   *                                     + spam complaint — both suppress)
   * Writes a contact_state_transitions audit row and advances
   * media_contacts.contact_state. Resilient: never throws into the webhook
   * pipeline; if the firewall tables are absent (pre-migration) it no-ops.
   */
  private async applySuppressionFromWebhook(
    recipientEmail: string,
    eventType: 'bounced' | 'complained'
  ): Promise<void> {
    try {
      if (!recipientEmail) return;
      const toState = eventType === 'bounced' ? 'bounced' : 'suppressed';
      const reason = eventType === 'bounced' ? 'bounce' : 'opt_out';

      // 1. DURABLE, backfill-INDEPENDENT: record the suppression hash FIRST so
      //    an opt-out/bounce is never lost, even if no contact row exists yet
      //    (opt-out received before the 784K backfill). Canon §12.3. First
      //    reason wins (ignoreDuplicates) — a later bounce won't overwrite an
      //    earlier permanent opt-out.
      await this.supabase
        .from('suppressed_email_hashes')
        .upsert(
          { email_hash: hashEmail(recipientEmail), reason },
          { onConflict: 'email_hash', ignoreDuplicates: true }
        );

      // 2. If a contact row exists, also advance the state machine + audit.
      const { data: emailRow, error: emailErr } = await this.supabase
        .from('contact_emails')
        .select('contact_id')
        .ilike('email', recipientEmail)
        .limit(1)
        .maybeSingle();
      if (emailErr || !emailRow?.contact_id) return;

      const contactId = emailRow.contact_id as string;

      const { data: mc } = await this.supabase
        .from('media_contacts')
        .select('contact_state')
        .eq('id', contactId)
        .maybeSingle();
      const fromState = (mc?.contact_state as string | undefined) ?? null;

      // suppressed is terminal & irreversible — don't downgrade to bounced.
      if (fromState === 'suppressed') return;
      if (fromState === toState) return;

      await this.supabase.from('contact_state_transitions').insert({
        contact_id: contactId,
        from_state: fromState,
        to_state: toState,
        trigger: reason,
        actor_type: eventType === 'bounced' ? 'system' : 'journalist',
      });

      await this.supabase
        .from('media_contacts')
        .update({ contact_state: toState })
        .eq('id', contactId);
    } catch {
      // Never break the webhook pipeline on suppression bookkeeping failure.
    }
  }

  // =============================================
  // Statistics & Analytics
  // =============================================

  /**
   * Get deliverability summary statistics
   */
  async getDeliverabilitySummary(
    orgId: string
  ): Promise<DeliverabilitySummary> {
    const { data, error } = await this.supabase.rpc(
      'get_deliverability_summary',
      {
        p_org_id: orgId,
      }
    );

    if (error) throw error;

    return {
      totalMessages: data.total_messages || 0,
      totalSent: data.total_sent || 0,
      totalDelivered: data.total_delivered || 0,
      totalOpened: data.total_opened || 0,
      totalClicked: data.total_clicked || 0,
      totalBounced: data.total_bounced || 0,
      totalComplained: data.total_complained || 0,
      totalFailed: data.total_failed || 0,
      deliveryRate: data.delivery_rate || 0,
      openRate: data.open_rate || 0,
      clickRate: data.click_rate || 0,
      bounceRate: data.bounce_rate || 0,
    };
  }

  /**
   * Get top engaged journalists
   */
  async getTopEngagedJournalists(
    orgId: string,
    limit: number = 10
  ): Promise<JournalistEngagement[]> {
    const result = await this.listEngagementMetrics(orgId, {
      limit,
      offset: 0,
    });

    return result.metrics;
  }

  /**
   * Get journalist engagement with full details
   */
  async getJournalistEngagement(
    journalistId: string,
    orgId: string
  ): Promise<JournalistEngagement | null> {
    const { data, error } = await this.supabase
      .from('pr_outreach_engagement_metrics')
      .select(
        `
        *,
        journalists!inner (
          id,
          name,
          email,
          outlet
        )
      `
      )
      .eq('journalist_id', journalistId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const journalist = Array.isArray(data.journalists)
      ? data.journalists[0]
      : data.journalists;

    return mapDbJournalistEngagement({
      ...data,
      journalist_name: journalist?.name,
      journalist_email: journalist?.email,
      journalist_outlet: journalist?.outlet,
    });
  }
}

// =============================================
// Factory Function
// =============================================

export function createOutreachDeliverabilityService(deps: {
  supabase: SupabaseClient;
  providerConfig?: ProviderConfig;
}): OutreachDeliverabilityService {
  return new OutreachDeliverabilityService(deps.supabase, deps.providerConfig);
}

/**
 * Resolve the owning org for an inbound SendGrid webhook event (#7). Replaces the
 * hardcoded `'placeholder-org-id'`, which scoped the message lookup
 * (`getEmailMessageByProviderMessageId(messageId, orgId)`) to a non-existent org
 * and therefore SILENTLY DROPPED every deliverability event.
 *
 *   1. Primary — the `orgId` custom_arg SendGrid flattens onto each event object
 *      (set at send in the `custom_args` above). Reliable for all sends after #7.
 *   2. Fallback — look up `pr_outreach_email_messages.org_id` by
 *      `provider_message_id`, matching on the id PREFIX because SendGrid appends a
 *      `.recvd-<...>` suffix to `sg_message_id` on events (the stored id is the
 *      bare `X-Message-Id`). Covers messages sent before #7.
 *
 * Returns null when neither resolves — the caller MUST skip, never fall back to a
 * placeholder.
 */
export async function resolveWebhookOrgId(
  supabase: SupabaseClient,
  payload: Record<string, unknown> | null | undefined
): Promise<string | null> {
  if (!payload) return null;

  // 1. custom_args orgId (SendGrid flattens custom_args onto the event; some
  //    integrations also nest them under `custom_args`).
  const nested = payload.custom_args as Record<string, unknown> | undefined;
  const fromArgs = payload.orgId ?? nested?.orgId;
  if (typeof fromArgs === 'string' && fromArgs.length > 0) return fromArgs;

  // 2. provider_message_id prefix lookup (SendGrid).
  const rawId = payload.sg_message_id ?? payload['smtp-id'];
  if (typeof rawId === 'string' && rawId.length > 0) {
    const prefix = rawId.split('.')[0];
    const { data } = await supabase
      .from('pr_outreach_email_messages')
      .select('org_id')
      .eq('provider_message_id', prefix)
      .maybeSingle();
    const orgId = (data as { org_id?: string } | null)?.org_id;
    if (orgId) return orgId;
  }

  // 3. Resend event shape: { type, data: { email_id, tags: [{name,value}] } }.
  const data = payload.data as Record<string, unknown> | undefined;
  if (data) {
    const tags = data.tags as
      | Array<{ name?: string; value?: string }>
      | undefined;
    const tagOrg = tags?.find((t) => t?.name === 'orgId')?.value;
    if (typeof tagOrg === 'string' && tagOrg.length > 0) return tagOrg;

    const emailId = (data.email_id ?? data.id) as string | undefined;
    if (typeof emailId === 'string' && emailId.length > 0) {
      const { data: row } = await supabase
        .from('pr_outreach_email_messages')
        .select('org_id')
        .eq('provider_message_id', emailId)
        .maybeSingle();
      const orgId = (row as { org_id?: string } | null)?.org_id;
      if (orgId) return orgId;
    }
  }

  return null;
}
