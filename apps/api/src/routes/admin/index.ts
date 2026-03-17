/**
 * Admin Routes
 *
 * Internal admin panel API endpoints for platform management.
 *
 * Routes:
 * - GET  /                — Platform overview metrics
 * - GET  /platform/queues — BullMQ queue health
 * - GET  /beta/waitlist   — Beta waitlist with pagination
 * - POST /beta/approve    — Approve a beta request
 * - POST /beta/invite     — Generate invite code
 * - GET  /beta/codes      — Recent invite codes
 * - GET  /orgs            — Paginated org list with metrics
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { createLogger } from '@pravado/utils';

const logger = createLogger('api:admin');

export async function adminRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ========================================
  // Admin Auth Hook — all routes require admin
  // ========================================

  server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Bearer token required' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }

    // Check admin flag on profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.is_admin !== true) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    // Attach admin user to request for downstream use
    (request as any).adminUser = user;
  });

  // ========================================
  // Helper: log admin action
  // ========================================

  async function logAdminAction(
    adminUserId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string
  ) {
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? {},
      ip_address: ipAddress ?? null,
    });
    if (error) {
      logger.error('Failed to write admin audit log', { error: error.message, action });
    }
  }

  // ========================================
  // GET / — Platform overview
  // ========================================

  server.get('/', async (_request, reply) => {
    try {
      const [orgsResult, activeOrgsResult, onboardingResult, llmResult, sageResult, betaResult] =
        await Promise.all([
          supabase.from('orgs').select('id', { count: 'exact', head: true }),
          supabase
            .from('orgs')
            .select('id', { count: 'exact', head: true })
            .gte('updated_at', new Date(Date.now() - 7 * 86400000).toISOString()),
          supabase
            .from('orgs')
            .select('id', { count: 'exact', head: true })
            .not('completed_onboarding_at', 'is', null),
          supabase
            .from('llm_usage_ledger')
            .select('total_tokens')
            .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
          supabase
            .from('sage_proposals')
            .select('id, status')
            .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
          supabase
            .from('beta_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ]);

      // Aggregate LLM tokens
      const todayTokens = (llmResult.data ?? []).reduce(
        (sum: number, row: any) => sum + (Number(row.total_tokens) || 0),
        0
      );

      // Aggregate SAGE proposals
      const sageProposals = sageResult.data ?? [];
      const sageAccepted = sageProposals.filter((p: any) => p.status === 'accepted').length;
      const sageRejected = sageProposals.filter((p: any) => p.status === 'rejected').length;

      return reply.send({
        success: true,
        data: {
          orgs: {
            total: orgsResult.count ?? 0,
            active_7d: activeOrgsResult.count ?? 0,
            onboarded: onboardingResult.count ?? 0,
          },
          llm: {
            tokens_today: todayTokens,
          },
          sage: {
            proposals_7d: sageProposals.length,
            accepted_7d: sageAccepted,
            rejected_7d: sageRejected,
          },
          beta: {
            pending_requests: betaResult.count ?? 0,
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Admin overview failed', { error: message });
      return reply.code(500).send({
        success: false,
        error: { code: 'OVERVIEW_FAILED', message },
      });
    }
  });

  // ========================================
  // GET /platform/queues — BullMQ queue health
  // ========================================

  server.get('/platform/queues', async (_request, reply) => {
    const queueNames = [
      'evi-recalculate',
      'sage-signal-scan',
      'citemind-score',
      'citemind-monitor',
      'gsc-sync',
      'journalists-enrich-batch',
    ];

    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        return reply.send({
          success: true,
          data: { queues: [], redis_unavailable: true, reason: 'REDIS_URL not configured' },
        });
      }

      const { Queue } = await import('bullmq');

      // Parse Redis URL for connection
      const parsed = new URL(redisUrl);
      const connection: Record<string, unknown> = {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        enableOfflineQueue: false,
      };
      if (parsed.password) connection.password = parsed.password;
      if (parsed.username && parsed.username !== 'default') connection.username = parsed.username;
      if (redisUrl.startsWith('rediss://') || parsed.hostname.includes('upstash') || parsed.hostname.includes('redislabs')) {
        connection.tls = {};
      }

      const queues = [];

      for (const name of queueNames) {
        try {
          const q = new Queue(name, { connection });
          const counts = await q.getJobCounts();
          queues.push({ name, ...counts });
          await q.close();
        } catch (qErr) {
          queues.push({
            name,
            error: qErr instanceof Error ? qErr.message : String(qErr),
          });
        }
      }

      return reply.send({ success: true, data: { queues, redis_unavailable: false } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Queue stats failed', { error: message });
      return reply.send({
        success: true,
        data: { queues: [], redis_unavailable: true, reason: message },
      });
    }
  });

  // ========================================
  // GET /beta/waitlist — Paginated beta requests
  // ========================================

  server.get<{
    Querystring: { status?: string; page?: string; limit?: string };
  }>('/beta/waitlist', async (request, reply) => {
    const status = request.query.status;
    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('beta_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      return reply.code(500).send({
        success: false,
        error: { code: 'QUERY_FAILED', message: error.message },
      });
    }

    return reply.send({
      success: true,
      data: {
        requests: data ?? [],
        total: count ?? 0,
        page,
      },
    });
  });

  // ========================================
  // POST /beta/approve — Approve a beta request
  // ========================================

  server.post<{
    Body: { requestId: string };
  }>('/beta/approve', async (request, reply) => {
    const { requestId } = request.body;

    if (!requestId) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'requestId is required' },
      });
    }

    const { data, error } = await supabase
      .from('beta_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({
        success: false,
        error: { code: 'UPDATE_FAILED', message: error.message },
      });
    }

    const adminUser = (request as any).adminUser;
    await logAdminAction(
      adminUser.id,
      'beta.approve',
      'beta_request',
      requestId,
      { email: data?.email },
      request.ip
    );

    return reply.send({
      success: true,
      data: { request: data },
    });
  });

  // ========================================
  // POST /beta/invite — Generate invite code
  // ========================================

  server.post<{
    Body: { email: string; requestId?: string };
  }>('/beta/invite', async (request, reply) => {
    const { email, requestId } = request.body;

    if (!email || !email.includes('@')) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid email required' },
      });
    }

    const inviteCode = `PRAVADO-${randomBytes(4).toString('hex').toUpperCase()}`;

    // Insert invite code
    const { data: codeData, error: codeError } = await supabase
      .from('beta_invite_codes')
      .insert({
        code: inviteCode,
        email: email.toLowerCase().trim(),
      })
      .select()
      .single();

    if (codeError) {
      return reply.code(500).send({
        success: false,
        error: { code: 'INSERT_FAILED', message: codeError.message },
      });
    }

    // If requestId provided, update that beta request to 'invited'
    if (requestId) {
      await supabase
        .from('beta_requests')
        .update({ status: 'invited' })
        .eq('id', requestId);
    }

    const adminUser = (request as any).adminUser;
    await logAdminAction(
      adminUser.id,
      'beta.invite',
      'beta_invite_code',
      codeData?.id,
      { email, requestId: requestId ?? null, code: inviteCode },
      request.ip
    );

    return reply.send({
      success: true,
      data: { invite_code: inviteCode, email: email.toLowerCase().trim() },
    });
  });

  // ========================================
  // GET /beta/codes — Recent invite codes
  // ========================================

  server.get('/beta/codes', async (_request, reply) => {
    const { data, error } = await supabase
      .from('beta_invite_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return reply.code(500).send({
        success: false,
        error: { code: 'QUERY_FAILED', message: error.message },
      });
    }

    return reply.send({
      success: true,
      data: { codes: data ?? [] },
    });
  });

  // ========================================
  // GET /orgs — Paginated org list
  // ========================================

  server.get<{
    Querystring: { page?: string; limit?: string; search?: string };
  }>('/orgs', async (request, reply) => {
    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '25', 10)));
    const offset = (page - 1) * limit;
    const search = request.query.search?.trim();

    try {
      // Build org query
      let orgQuery = supabase
        .from('orgs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        orgQuery = orgQuery.ilike('name', `%${search}%`);
      }

      const { data: orgs, count, error: orgsError } = await orgQuery;

      if (orgsError) {
        return reply.code(500).send({
          success: false,
          error: { code: 'QUERY_FAILED', message: orgsError.message },
        });
      }

      // Enrich orgs with member counts and latest EVI score
      const enrichedOrgs = await Promise.all(
        (orgs ?? []).map(async (org: any) => {
          const [memberResult, eviResult] = await Promise.all([
            supabase
              .from('org_members')
              .select('id', { count: 'exact', head: true })
              .eq('org_id', org.id),
            supabase
              .from('evi_snapshots')
              .select('overall_score')
              .eq('org_id', org.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          return {
            ...org,
            member_count: memberResult.count ?? 0,
            latest_evi_score: eviResult.data?.overall_score ?? null,
          };
        })
      );

      return reply.send({
        success: true,
        data: {
          orgs: enrichedOrgs,
          total: count ?? 0,
          page,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Admin orgs list failed', { error: message });
      return reply.code(500).send({
        success: false,
        error: { code: 'QUERY_FAILED', message },
      });
    }
  });
}
