/**
 * Beta Request Routes (Sprint S-INT-09)
 *
 * Routes:
 * - POST /request          — Public: submit beta access request
 * - GET  /requests         — Admin: list all beta requests
 * - POST /approve/:id      — Admin: approve request + generate invite code + send email
 * - POST /validate-invite  — Public: validate an invite code for signup
 * - POST /mark-used        — Internal: mark invite as used after signup
 */

import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

import { requireUser } from '../../middleware/requireUser';
import { requireAdmin } from '../../middleware/requireAdmin';

function generateInviteCode(): string {
  return `PRAVADO-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// ── Email HTML builders ──────────────────────────────────────

function buildWaitlistConfirmationHtml(_email: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:2px solid #00D9FF;">
  <span style="font-family:monospace;font-weight:800;font-size:20px;letter-spacing:3px;color:#1a1a2e;">PRAVADO</span>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111118;">You're on the waitlist!</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
    Thank you for applying for early access to Pravado. We're reviewing applications and will get back to you within 48 hours.
  </p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
    When approved, you'll receive an invite code to create your account and start building your AI visibility strategy.
  </p>
  <p style="margin:0;font-size:13px;color:#888;">
    Questions? Reply to this email or reach us at hello@pravado.io
  </p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9fb;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;font-size:12px;color:#aaa;">Pravado &middot; AI-Powered Visibility Platform &middot; <a href="https://pravado.io" style="color:#00D9FF;text-decoration:none;">pravado.io</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function buildInviteCodeEmailHtml(_email: string, inviteCode: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:2px solid #00D9FF;">
  <span style="font-family:monospace;font-weight:800;font-size:20px;letter-spacing:3px;color:#1a1a2e;">PRAVADO</span>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111118;">You're in! 🎉</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
    Your application has been approved. Use the invite code below to create your Pravado account.
  </p>
  <div style="background:#f0f0f5;border:2px dashed #00D9FF;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px;">
    <span style="font-family:monospace;font-size:24px;font-weight:800;letter-spacing:2px;color:#1a1a2e;">${inviteCode}</span>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://app.pravado.io/login" style="display:inline-block;background:#00D9FF;color:#0A0A0F;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Create Your Account
    </a>
  </td></tr></table>
  <p style="margin:24px 0 0;font-size:13px;color:#888;">
    This invite code is single-use. If you have questions, reply to this email.
  </p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9fb;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;font-size:12px;color:#aaa;">Pravado &middot; AI-Powered Visibility Platform &middot; <a href="https://pravado.io" style="color:#00D9FF;text-decoration:none;">pravado.io</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ── Routes ───────────────────────────────────────────────────

export async function betaRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'cdibrell@saipienlabs.com';

  // ========================================
  // POST /request — Public beta access request
  // ========================================

  server.post<{
    Body: {
      email: string;
      companyName?: string;
      companySize?: string;
      useCase?: string;
      referralSource?: string;
      jobTitle?: string;
      companyWebsite?: string;
      currentTools?: string[];
      feedbackCall?: string;
    };
  }>('/request', async (request, reply) => {
    const { email, companyName, companySize, useCase, referralSource, jobTitle, companyWebsite, currentTools, feedbackCall } = request.body;

    if (!email || !email.includes('@')) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid email required' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing request
    const { data: existing } = await supabase
      .from('beta_requests')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return reply.send({
        success: true,
        data: {
          message: 'Your request is already in our queue.',
          status: existing.status,
        },
      });
    }

    const { data, error } = await supabase
      .from('beta_requests')
      .insert({
        email: normalizedEmail,
        company_name: companyName ?? null,
        company_size: companySize ?? null,
        use_case: useCase ?? null,
        referral_source: referralSource ?? null,
        job_title: jobTitle ?? null,
        company_website: companyWebsite ?? null,
        current_tools: currentTools ?? null,
        feedback_call: feedbackCall ?? null,
        status: 'pending',
      })
      .select('id, status')
      .single();

    if (error) {
      return reply.code(500).send({
        success: false,
        error: { code: 'INSERT_FAILED', message: error.message },
      });
    }

    // Send waitlist confirmation email
    try {
      await server.mailer.sendMail({
        to: normalizedEmail,
        from: 'hello@pravado.io',
        subject: "You're on the Pravado waitlist",
        html: buildWaitlistConfirmationHtml(normalizedEmail),
        text: `You're on the Pravado waitlist! We're reviewing applications and will get back to you within 48 hours. Questions? hello@pravado.io`,
      });
      console.log(`[Beta] Waitlist confirmation sent to ${normalizedEmail}`);
    } catch (emailErr) {
      // Non-blocking — log but don't fail the request
      console.error(`[Beta] Failed to send confirmation to ${normalizedEmail}:`, emailErr instanceof Error ? emailErr.message : emailErr);
    }

    // Notify admin of new application
    try {
      await server.mailer.sendMail({
        to: adminNotifyEmail,
        from: 'hello@pravado.io',
        subject: `[Pravado Beta] New application: ${normalizedEmail}`,
        html: `<p>New beta request from <strong>${normalizedEmail}</strong></p>
          <ul>
            <li>Company: ${companyName || 'N/A'}</li>
            <li>Size: ${companySize || 'N/A'}</li>
            <li>Title: ${jobTitle || 'N/A'}</li>
            <li>Website: ${companyWebsite || 'N/A'}</li>
            <li>Use case: ${useCase || 'N/A'}</li>
            <li>Source: ${referralSource || 'N/A'}</li>
          </ul>
          <p><a href="https://app.pravado.io/app/admin/beta">Review in Admin →</a></p>`,
        text: `New beta request from ${normalizedEmail}. Company: ${companyName || 'N/A'}. Review at https://app.pravado.io/app/admin/beta`,
      });
    } catch {
      // Non-critical
    }

    console.log(`[Beta] New request: ${normalizedEmail} (${companyName || 'no company'})`);

    return reply.code(201).send({
      success: true,
      data: {
        id: data.id,
        message: "You're on the list! We'll email you when your spot opens up.",
        status: data.status,
      },
    });
  });

  // ========================================
  // GET /requests — Admin: list beta requests
  // ========================================

  server.get<{
    Querystring: { status?: string; limit?: string; offset?: string };
  }>(
    '/requests',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      let query = supabase
        .from('beta_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (request.query.status) {
        query = query.eq('status', request.query.status);
      }

      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
      const offset = request.query.offset ? parseInt(request.query.offset, 10) : 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'QUERY_FAILED', message: error.message },
        });
      }

      return reply.send({
        success: true,
        data: { items: data ?? [] },
      });
    }
  );

  // ========================================
  // POST /approve/:id — Admin: approve + generate invite code + send email
  // ========================================

  server.post<{
    Params: { id: string };
    Body: { adminNotes?: string };
  }>(
    '/approve/:id',
    { preHandler: [requireUser, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params;
      const { adminNotes } = request.body || {};

      // Fetch request
      const { data: betaReq, error: fetchErr } = await supabase
        .from('beta_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !betaReq) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Beta request not found' },
        });
      }

      if (betaReq.status === 'approved' || betaReq.status === 'invited') {
        return reply.send({
          success: true,
          data: {
            message: 'Already approved',
            invite_code: betaReq.invite_code,
          },
        });
      }

      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from('beta_requests')
        .update({
          status: 'approved',
          invite_code: inviteCode,
          invited_at: new Date().toISOString(),
          admin_notes: adminNotes ?? betaReq.admin_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'UPDATE_FAILED', message: error.message },
        });
      }

      // Send invite code email to the user
      try {
        await server.mailer.sendMail({
          to: betaReq.email,
          from: 'hello@pravado.io',
          subject: "You're approved for Pravado beta!",
          html: buildInviteCodeEmailHtml(betaReq.email, inviteCode),
          text: `You're approved for Pravado beta! Your invite code: ${inviteCode}. Create your account at https://app.pravado.io/login`,
        });
        console.log(`[Beta] Invite code sent to ${betaReq.email}: ${inviteCode}`);
      } catch (emailErr) {
        console.error(`[Beta] Failed to send invite to ${betaReq.email}:`, emailErr instanceof Error ? emailErr.message : emailErr);
        // Don't fail the approve — the code is generated even if email fails
      }

      return reply.send({
        success: true,
        data: {
          id: data.id,
          email: data.email,
          invite_code: inviteCode,
          status: 'approved',
        },
      });
    }
  );

  // ========================================
  // POST /validate-invite — Public: validate invite code
  // ========================================

  server.post<{
    Body: { inviteCode: string };
  }>('/validate-invite', async (request, reply) => {
    const { inviteCode } = request.body;

    if (!inviteCode) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invite code required' },
      });
    }

    const { data, error } = await supabase
      .from('beta_requests')
      .select('id, email, status, signed_up_at')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      return reply.code(404).send({
        success: false,
        error: { code: 'INVALID_INVITE', message: 'Invalid invite code' },
      });
    }

    if (data.signed_up_at) {
      return reply.code(409).send({
        success: false,
        error: { code: 'ALREADY_USED', message: 'This invite code has already been used' },
      });
    }

    if (data.status !== 'approved') {
      return reply.code(403).send({
        success: false,
        error: { code: 'NOT_APPROVED', message: 'This invite is not active' },
      });
    }

    return reply.send({
      success: true,
      data: {
        valid: true,
        email: data.email,
      },
    });
  });

  // ========================================
  // POST /mark-used — Internal: mark invite as used after signup
  // ========================================

  server.post<{
    Body: { inviteCode: string };
  }>('/mark-used', async (request, reply) => {
    const { inviteCode } = request.body;

    if (!inviteCode) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invite code required' },
      });
    }

    const { error } = await supabase
      .from('beta_requests')
      .update({
        status: 'invited',
        signed_up_at: new Date().toISOString(),
      })
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .eq('status', 'approved');

    if (error) {
      return reply.code(500).send({
        success: false,
        error: { code: 'UPDATE_FAILED', message: error.message },
      });
    }

    return reply.send({ success: true, data: { marked: true } });
  });
}
