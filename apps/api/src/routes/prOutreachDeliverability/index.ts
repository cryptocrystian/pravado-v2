/**
 * PR Outreach Deliverability Routes (Sprint S45)
 * API routes for email deliverability tracking and engagement analytics
 */

import { FLAGS } from '@pravado/feature-flags';
import type { ProviderConfig } from '@pravado/types';
import {
  apiEnvSchema,
  emailProviderSchema,
  listEmailMessagesQuerySchema,
  listEngagementMetricsQuerySchema,
  sendEmailRequestSchema,
  updateEmailMessageInputSchema,
  validateEnv,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { captureRawBody } from '../../lib/captureRawBody';
import { parseMultipartFields } from '../../lib/parseMultipartFields';
import { requireUser } from '../../middleware/requireUser';
import { createSupabaseGovernanceGateways } from '../../services/governanceGateways';
import {
  createOutreachDeliverabilityService,
  resolveWebhookOrgId,
} from '../../services/outreachDeliverabilityService';
import {
  extractMessageId,
  isAutoResponder,
  parseTokenFromRecipients,
  recordInboundReply,
  resolveReplyToken,
} from '../../services/pr/replyCapture';
import {
  deliverabilityRawSend,
  sendGuardedEmail,
} from '../../services/sendGuardedEmail';

/**
 * Get provider configuration from environment (S98)
 * Supports SendGrid, Mailgun, or Stub providers
 */
function getProviderConfig(): ProviderConfig {
  const provider = (process.env.EMAIL_PROVIDER as any) || 'stub';

  // SendGrid configuration (primary for S98)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail =
    process.env.SENDGRID_FROM_EMAIL || 'noreply@pravado.com';
  const sendgridFromName = process.env.SENDGRID_FROM_NAME || 'Pravado';
  const sendgridWebhookKey = process.env.SENDGRID_WEBHOOK_KEY;

  // Mailgun configuration (fallback)
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunFromEmail =
    process.env.MAILGUN_FROM_EMAIL || 'noreply@pravado.com';

  // Select config based on provider
  if (provider === 'sendgrid') {
    return {
      provider: 'sendgrid',
      apiKey: sendgridApiKey,
      fromEmail: sendgridFromEmail,
      fromName: sendgridFromName,
      webhookKey: sendgridWebhookKey,
    };
  } else if (provider === 'mailgun') {
    return {
      provider: 'mailgun',
      apiKey: mailgunApiKey,
      domain: mailgunDomain,
      fromEmail: mailgunFromEmail,
      fromName: 'Pravado',
    };
  }

  // Default to stub
  return {
    provider: 'stub',
    fromEmail: 'noreply@pravado.com',
    fromName: 'Pravado',
  };
}

export default async function prOutreachDeliverabilityRoutes(
  fastify: FastifyInstance
) {
  // Check feature flag
  if (!FLAGS.ENABLE_PR_OUTREACH_DELIVERABILITY) {
    fastify.log.info(
      'PR outreach deliverability routes disabled by feature flag'
    );
    return;
  }

  // Create Supabase client
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const providerConfig = getProviderConfig();

  /**
   * Helper to get user's org ID
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    return userOrgs?.[0]?.org_id || null;
  }

  // =============================================
  // Email Messages
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/messages
   * List email messages
   */
  fastify.get(
    '/messages',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listEmailMessagesQuerySchema.parse(request.query);

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const result = await service.listEmailMessages(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/messages/:id
   * Get a single email message
   */
  fastify.get<{
    Params: { id: string };
  }>(
    '/messages/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const message = await service.getEmailMessage(id, orgId);

      if (!message) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Email message not found' },
        });
      }

      return reply.send({
        success: true,
        data: message,
      });
    }
  );

  /**
   * PATCH /api/pr-outreach-deliverability/messages/:id
   * Update an email message
   */
  fastify.patch<{
    Params: { id: string };
  }>(
    '/messages/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;
      const input = updateEmailMessageInputSchema.parse(request.body);

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const message = await service.updateEmailMessage(id, orgId, input);

      return reply.send({
        success: true,
        data: message,
      });
    }
  );

  /**
   * DELETE /api/pr-outreach-deliverability/messages/:id
   * Delete an email message
   */
  fastify.delete<{
    Params: { id: string };
  }>(
    '/messages/:id',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { id } = request.params;

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      await service.deleteEmailMessage(id, orgId);

      return reply.send({
        success: true,
        data: null,
      });
    }
  );

  // =============================================
  // Engagement Metrics
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/engagement
   * List engagement metrics
   */
  fastify.get(
    '/engagement',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const query = listEngagementMetricsQuerySchema.parse(request.query);

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const result = await service.listEngagementMetrics(orgId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/engagement/:journalistId
   * Get engagement metrics for a journalist
   */
  fastify.get<{
    Params: { journalistId: string };
  }>(
    '/engagement/:journalistId',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { journalistId } = request.params;

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const engagement = await service.getJournalistEngagement(
        journalistId,
        orgId
      );

      if (!engagement) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Engagement metrics not found' },
        });
      }

      return reply.send({
        success: true,
        data: engagement,
      });
    }
  );

  /**
   * POST /api/pr-outreach-deliverability/engagement/:journalistId/recalculate
   * Recalculate engagement metrics for a journalist
   */
  fastify.post<{
    Params: { journalistId: string };
  }>(
    '/engagement/:journalistId/recalculate',
    {
      onRequest: [requireUser],
    },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { journalistId } = request.params;

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const result = await service.updateEngagementMetrics(journalistId, orgId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // =============================================
  // Statistics
  // =============================================

  /**
   * GET /api/pr-outreach-deliverability/stats/deliverability
   * Get deliverability summary statistics
   */
  fastify.get(
    '/stats/deliverability',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const summary = await service.getDeliverabilitySummary(orgId);

      return reply.send({
        success: true,
        data: summary,
      });
    }
  );

  /**
   * GET /api/pr-outreach-deliverability/stats/top-engaged
   * Get top engaged journalists
   */
  fastify.get(
    '/stats/top-engaged',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const { limit } = request.query as any;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });
      const topEngaged = await service.getTopEngagedJournalists(
        orgId,
        limitNum
      );

      return reply.send({
        success: true,
        data: topEngaged,
      });
    }
  );

  // =============================================
  // Webhooks
  // =============================================

  /**
   * POST /api/pr-outreach-deliverability/webhooks/:provider
   * Process webhook events from email providers (S98 - with signature validation)
   */
  fastify.post<{ Params: { provider: string } }>(
    '/webhooks/:provider',
    {
      // Raw body is required for HMAC signature verification (SendGrid /
      // Mailgun). Plan 06d replaced the `fastify-raw-body` plugin (Fastify
      // ^5.x peer dep, repo on 4.29.1) with this per-route preParsing hook —
      // see apps/api/src/lib/captureRawBody.ts. The hook decorates
      // `request.rawBody` with the byte-exact Buffer that arrived on the
      // wire, then re-streams it so Fastify body parsing continues normally.
      preParsing: captureRawBody,
    },
    async (request, reply: FastifyReply) => {
      const { provider } = request.params;

      // Validate provider
      const parseResult = emailProviderSchema.safeParse(provider);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: 'Invalid email provider',
          },
        });
      }

      // Get signature and timestamp from headers (provider-specific)
      // SendGrid uses X-Twilio-Email-Event-Webhook-Signature and X-Twilio-Email-Event-Webhook-Timestamp
      const signature =
        (request.headers['x-twilio-email-event-webhook-signature'] as string) ||
        (request.headers['x-mailgun-signature'] as string) ||
        (request.headers['x-amz-sns-message-id'] as string);

      const timestamp = request.headers[
        'x-twilio-email-event-webhook-timestamp'
      ] as string;

      // Raw body required for HMAC signature verification. The route's
      // `preParsing: captureRawBody` hook (above) decorates `request.rawBody`
      // with the byte-exact Buffer that arrived on the wire. If `rawBody` is
      // missing here, the hook didn't run — REJECT the webhook with 500.
      // NEVER fall back to JSON.stringify(request.body): re-serialized bytes
      // do not match the bytes SendGrid signed, so HMAC verification would
      // silently fail and the event would be ack'd while being dropped here.
      // (Track 0D Group 1 B1 hardening principle; DECISIONS_LOG 2026-05-15,
      // 2026-06-05.)
      const rawBody = request.rawBody?.toString();
      if (!rawBody) {
        fastify.log.error(
          { provider, hasRawBody: false, requestId: request.id },
          'Webhook rejected: raw body unavailable. captureRawBody preParsing hook did not decorate request.rawBody.'
        );
        return reply.status(500).send({
          success: false,
          error: {
            code: 'RAW_BODY_UNAVAILABLE',
            message:
              'Webhook signature validation requires raw body; preParsing hook misconfigured.',
          },
        });
      }

      // Resolve the owning org from the event (#7): custom_args `orgId` (set at
      // send), else a provider_message_id lookup. The former hardcoded
      // 'placeholder-org-id' scoped the message lookup to a non-existent org, so
      // every deliverability event was silently dropped.
      const payload = request.body as Record<string, unknown>;

      const orgId = await resolveWebhookOrgId(supabase, payload);
      if (!orgId) {
        // Ack (200) so the provider does not retry a permanently-unresolvable
        // event, but record that we could not attribute it.
        fastify.log.warn(
          { provider, requestId: request.id },
          'Webhook org unresolved (no custom_args orgId + provider_message_id lookup miss) — skipping event.'
        );
        return reply.send({
          success: false,
          data: { processed: false, reason: 'org_unresolved' },
        });
      }

      try {
        const service = createOutreachDeliverabilityService({
          supabase,
          providerConfig,
        });

        // Process the webhook with raw body for signature validation
        const result = await service.processWebhookEvent(
          orgId,
          parseResult.data,
          payload,
          signature,
          timestamp,
          rawBody
        );

        return reply.send({
          success: result.success,
          data: result,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Webhook processing error');
        return reply.status(500).send({
          success: false,
          error: {
            code: 'WEBHOOK_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  // ===========================================================================
  // Inbound reply capture — SendGrid Inbound Parse (Phase 1: capture + forward)
  // POST /api/v1/pr-outreach-deliverability/inbound/sendgrid
  //
  // A journalist reply to a tokenized reply-to (<token>@reply.pravado.io) lands
  // here. We resolve the token → org/journalist/run + the customer inbox, dedupe
  // on Message-ID, store the reply, score it (a reply is the strongest positive
  // relationship signal), and forward it to the customer via the TRANSACTIONAL
  // mailer (NOT the outreach provider — a forward is not a governed pitch). We
  // ack 2xx on resolvable AND unresolvable input so SendGrid does not retry;
  // 5xx only on an unexpected fault (so a transient error IS retried).
  // ===========================================================================
  fastify.post('/inbound/sendgrid', async (request, reply) => {
    if (!FLAGS.PR_OUTREACH_INBOUND_WIRED) {
      return reply
        .status(404)
        .send({ success: false, error: { code: 'NOT_WIRED' } });
    }
    // Optional shared-secret gate (defense-in-depth; the 128-bit token is the
    // primary capability — an unsigned POST cannot forge a reply for a token it
    // does not know).
    const inboundSecret = process.env.PR_OUTREACH_INBOUND_SECRET;
    if (
      inboundSecret &&
      (request.query as { key?: string } | undefined)?.key !== inboundSecret
    ) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED' } });
    }

    try {
      const raw = request.body;
      const buf = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from(typeof raw === 'string' ? raw : '');
      const fields = parseMultipartFields(buf, request.headers['content-type']);

      const token = parseTokenFromRecipients(fields.to);
      if (!token) {
        return reply.send({
          success: false,
          data: { processed: false, reason: 'no_token' },
        });
      }
      const tokenRow = await resolveReplyToken(supabase, token);
      if (!tokenRow) {
        return reply.send({
          success: false,
          data: { processed: false, reason: 'token_unresolved' },
        });
      }

      // Auto-responders / bounces / vacation replies are not genuine replies.
      if (isAutoResponder(fields)) {
        return reply.send({
          success: true,
          data: { processed: false, reason: 'auto_responder' },
        });
      }

      const inboundMessageId = extractMessageId(fields.headers);
      const rec = await recordInboundReply(supabase, {
        orgId: tokenRow.org_id,
        tokenId: tokenRow.id,
        journalistId: tokenRow.journalist_id,
        runId: tokenRow.run_id,
        fromEmail: fields.from ?? null,
        subject: fields.subject ?? null,
        bodyText: fields.text ?? null,
        bodyHtml: fields.html ?? null,
        inboundMessageId,
      });
      if (!rec.inserted) {
        return reply.send({
          success: true,
          data: { processed: false, reason: 'duplicate' },
        });
      }

      // Score the reply: mark the run replied (feeds total_replied) then recompute
      // the journalist engagement score. The CRAFT single-pitch path has no run,
      // so its reply is captured + forwarded but not run-scored (Phase 1 limit).
      if (tokenRow.run_id) {
        await supabase
          .from('pr_outreach_runs')
          .update({
            replied_at: new Date().toISOString(),
            stop_reason: 'journalist_replied',
          })
          .eq('id', tokenRow.run_id)
          .eq('org_id', tokenRow.org_id)
          .is('replied_at', null);
      }
      if (tokenRow.journalist_id) {
        try {
          const svc = createOutreachDeliverabilityService({
            supabase,
            providerConfig,
          });
          await svc.updateEngagementMetrics(
            tokenRow.journalist_id,
            tokenRow.org_id
          );
        } catch (err) {
          fastify.log.warn(
            { err },
            'reply engagement update failed (non-fatal)'
          );
        }
      }

      // Forward to the customer via the transactional mailer (guard-clean:
      // `sendMail`, not the outreach provider). Non-fatal — the reply is already
      // captured + scored even if the forward fails.
      let forwarded = false;
      if (tokenRow.forward_to) {
        try {
          const journalistFrom = fields.from?.trim() || 'the journalist';
          const baseSubject =
            fields.subject?.trim() ||
            (tokenRow.subject ? `Re: ${tokenRow.subject}` : 'Re: your pitch');
          const noticeHtml = `<p style="color:#667;font-size:12px;margin:0 0 8px">A journalist replied to your Pravado pitch — reply directly to <b>${journalistFrom}</b>.</p><hr style="border:none;border-top:1px solid #ddd"/>`;
          const noticeText = `A journalist replied to your Pravado pitch — reply directly to ${journalistFrom}.\n\n`;
          await request.server.mailer.sendMail({
            to: tokenRow.forward_to,
            subject: baseSubject,
            html:
              noticeHtml + (fields.html || `<pre>${fields.text || ''}</pre>`),
            text: noticeText + (fields.text || ''),
          });
          forwarded = true;
          if (inboundMessageId) {
            await supabase
              .from('pr_outreach_inbound_replies')
              .update({ forwarded_at: new Date().toISOString() })
              .eq('org_id', tokenRow.org_id)
              .eq('inbound_message_id', inboundMessageId);
          }
        } catch (err) {
          fastify.log.warn({ err }, 'reply forward failed (non-fatal)');
        }
      }

      return reply.send({
        success: true,
        data: { processed: true, forwarded },
      });
    } catch (error) {
      fastify.log.error({ error }, 'Inbound reply processing error');
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INBOUND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // =============================================
  // Testing & Development
  // =============================================

  /**
   * POST /api/pr-outreach-deliverability/test-send
   * Test email sending (development only)
   */
  fastify.post(
    '/test-send',
    {
      onRequest: [requireUser],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const emailRequest = sendEmailRequestSchema.parse(request.body);

      const service = createOutreachDeliverabilityService({
        supabase,
        providerConfig,
      });

      // Even the test-send path routes through the governed chokepoint so it
      // can NEVER egress to a suppressed/bounced recipient. purpose:'test'
      // bypasses eligibility/caps/personalization but NOT suppression.
      const gateways = createSupabaseGovernanceGateways(supabase);
      const guarded = await sendGuardedEmail({
        request: emailRequest,
        context: {
          orgId,
          recipientEmail: emailRequest.to,
          actorId: user.id,
          isFollowUp: false,
          purpose: 'test',
          personalization: { name: null, outlet: null, beats: [] },
        },
        gateways,
        rawSend: deliverabilityRawSend(service),
        logger: fastify.log,
      });

      if (guarded.refusal) {
        return reply.status(422).send({
          success: false,
          error: {
            code: `SEND_BLOCKED_${guarded.refusal.governor.toUpperCase()}`,
            message: guarded.refusal.reason,
            details: guarded.refusal.details,
          },
        });
      }

      return reply.send({
        success: true,
        data: guarded.providerResponse,
      });
    }
  );
}
