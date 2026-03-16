/**
 * Beta Request Routes (Sprint S-INT-09)
 *
 * Routes:
 * - POST /request          — Public: submit beta access request
 * - GET  /requests         — Admin: list all beta requests
 * - POST /approve/:id      — Admin: approve request + generate invite code
 * - POST /validate-invite  — Public: validate an invite code for signup
 */

import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

import { requireUser } from '../../middleware/requireUser';
import { requireAdmin } from '../../middleware/requireAdmin';

function generateInviteCode(): string {
  return `PRAVADO-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function betaRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    };
  }>('/request', async (request, reply) => {
    const { email, companyName, companySize, useCase, referralSource } = request.body;

    if (!email || !email.includes('@')) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid email required' },
      });
    }

    // Check for existing request
    const { data: existing } = await supabase
      .from('beta_requests')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
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
        email: email.toLowerCase().trim(),
        company_name: companyName ?? null,
        company_size: companySize ?? null,
        use_case: useCase ?? null,
        referral_source: referralSource ?? null,
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
  // POST /approve/:id — Admin: approve + generate invite code
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

      // TODO: Send invite email via mailer plugin when email service is configured

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
