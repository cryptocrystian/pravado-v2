import type {
  SessionRequest,
  UserSessionResponse,
  User,
  Org,
} from '@pravado/types';
import { validateEnv, apiEnvSchema, sessionRequestSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../middleware/requireUser';

function buildWelcomeEmailHtml(dashboardUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:2px solid #00D9FF;">
  <span style="font-family:monospace;font-weight:800;font-size:20px;letter-spacing:3px;color:#1a1a2e;">PRAVADO</span>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111118;">Welcome to Pravado &mdash; you're in</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
    Your AI Visibility OS is ready. Here's how to get the most out of it:
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
      <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#00D9FF;color:#0A0A0F;font-weight:800;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">1</span>
      <span style="font-size:15px;color:#333;vertical-align:middle;"><strong>Connect Google Search Console</strong> &mdash; Import your real search data to power SAGE recommendations</span>
    </td></tr>
    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
      <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#A855F7;color:#fff;font-weight:800;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">2</span>
      <span style="font-size:15px;color:#333;vertical-align:middle;"><strong>Add your competitors</strong> &mdash; See how your AI visibility compares to theirs</span>
    </td></tr>
    <tr><td style="padding:12px 0;">
      <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#E879F9;color:#fff;font-weight:800;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">3</span>
      <span style="font-size:15px;color:#333;vertical-align:middle;"><strong>Run your first pitch</strong> &mdash; Let SAGE draft an AI-optimized journalist pitch</span>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="${dashboardUrl}/app/command-center" style="display:inline-block;background:#00D9FF;color:#0A0A0F;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Open Your Dashboard
    </a>
  </td></tr></table>
  <p style="margin:24px 0 0;font-size:13px;color:#666;line-height:1.5;">
    PS: Reply to this email anytime &mdash; you'll reach Christian directly.
  </p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9fb;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;font-size:12px;color:#aaa;">Pravado &middot; AI-Powered Visibility Platform &middot; <a href="https://pravado.io" style="color:#00D9FF;text-decoration:none;">pravado.io</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}


export async function authRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.post<{ Body: SessionRequest }>(
    '/session',
    async (request, reply) => {
      // Validate request body
      const validation = sessionRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { accessToken } = validation.data;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          },
        });
      }

      reply.setCookie('sb-access-token', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email!,
          },
        },
      };
    }
  );

  server.get<{ Reply: UserSessionResponse }>(
    '/me',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
          },
        });
      }

      const user: User = {
        id: userData.id,
        fullName: userData.full_name,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
        updatedAt: userData.created_at,
      };

      const { data: memberships } = await supabase
        .from('org_members')
        .select('org_id, orgs(*)')
        .eq('user_id', userId);

      const orgs: Org[] =
        memberships?.map((m: any) => ({
          id: m.orgs.id,
          name: m.orgs.name,
          createdAt: m.orgs.created_at,
          updatedAt: m.orgs.updated_at,
        })) || [];

      const activeOrg = orgs.length > 0 ? orgs[0] : null;

      return {
        success: true,
        data: {
          user,
          orgs,
          activeOrg,
        },
      };
    }
  );

  /**
   * POST /welcome-email
   * Send welcome email to newly created users.
   * Called by the dashboard after detecting a new account (created_at < 60s ago).
   * Idempotent: checks a flag in user_metadata to avoid duplicate sends.
   */
  server.post(
    '/welcome-email',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const userEmail = request.user!.email;

      // Get user from Supabase auth to check created_at and metadata
      const { data: { user: authUser }, error: authErr } = await supabase.auth.admin.getUserById(userId);
      if (authErr || !authUser) {
        return reply.code(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Auth user not found' },
        });
      }

      // Idempotency: skip if already sent
      if (authUser.user_metadata?.welcome_email_sent) {
        return reply.send({ success: true, data: { sent: false, reason: 'already_sent' } });
      }

      // Only send to users created within the last 5 minutes
      const createdAt = new Date(authUser.created_at);
      const ageMs = Date.now() - createdAt.getTime();
      if (ageMs > 5 * 60 * 1000) {
        return reply.send({ success: true, data: { sent: false, reason: 'not_new_user' } });
      }

      // Send the welcome email
      const dashboardUrl = env.DASHBOARD_URL || 'https://app.pravado.io';
      try {
        await server.mailer.sendMail({
          to: userEmail,
          from: 'christian@pravado.io',
          subject: "Welcome to Pravado \u2014 you're in",
          html: buildWelcomeEmailHtml(dashboardUrl),
          text: "Welcome to Pravado! Your AI Visibility OS is ready. Open your dashboard: " + dashboardUrl + "/app/command-center",
        });

        // Mark as sent in user metadata
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { ...authUser.user_metadata, welcome_email_sent: true },
        });

        console.log(`[Auth] Welcome email sent to ${userEmail}`);
        return reply.send({ success: true, data: { sent: true } });
      } catch (emailErr) {
        console.error(`[Auth] Failed to send welcome email to ${userEmail}:`, emailErr);
        return reply.code(500).send({
          success: false,
          error: { code: 'EMAIL_FAILED', message: 'Failed to send welcome email' },
        });
      }
    }
  );
}
