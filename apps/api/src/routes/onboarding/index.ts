/**
 * Onboarding Routes (Sprint S-INT-07)
 *
 * Activation-critical onboarding flow endpoints:
 * - Competitor management during onboarding
 * - Onboarding status tracking
 * - Onboarding completion
 * - Brand profile update
 *
 * Prefix: /api/v1/onboarding
 */

import type { FastifyInstance } from 'fastify';

import { getSupabaseClient } from '../../lib/supabase';
import { requireUser } from '../../middleware/requireUser';

export async function onboardingRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  // Helper to get user's org ID
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    return data?.org_id ?? null;
  }

  // ========================================================================
  // POST /brand — Create or update org with brand profile info
  // Called at Step 1 of onboarding (Brand Setup)
  // ========================================================================
  server.post<{
    Body: {
      name: string;
      domain?: string;
      industry?: string;
      company_size?: string;
    };
  }>(
    '/brand',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const { name, domain, industry, company_size } = request.body;

      if (!name || name.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Organization name is required' },
        });
      }

      // Check if user already has an org
      const existingOrgId = await getUserOrgId(userId);

      if (existingOrgId) {
        // Update existing org
        const { data: org, error } = await supabase
          .from('orgs')
          .update({
            name: name.trim(),
            domain: domain?.trim() || null,
            industry: industry?.trim() || null,
            company_size: company_size?.trim() || null,
            onboarding_step: 1,
          })
          .eq('id', existingOrgId)
          .select()
          .single();

        if (error || !org) {
          return reply.code(500).send({
            success: false,
            error: { code: 'ORG_UPDATE_FAILED', message: 'Failed to update organization' },
          });
        }

        return reply.send({
          success: true,
          data: { org_id: org.id, created: false },
        });
      }

      // Create new org
      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .insert({
          name: name.trim(),
          domain: domain?.trim() || null,
          industry: industry?.trim() || null,
          company_size: company_size?.trim() || null,
          onboarding_step: 1,
        })
        .select()
        .single();

      if (orgError || !org) {
        return reply.code(500).send({
          success: false,
          error: { code: 'ORG_CREATE_FAILED', message: 'Failed to create organization' },
        });
      }

      // Create membership
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) {
        // Rollback org creation
        await supabase.from('orgs').delete().eq('id', org.id);
        return reply.code(500).send({
          success: false,
          error: { code: 'MEMBERSHIP_CREATE_FAILED', message: 'Failed to create organization membership' },
        });
      }

      return reply.send({
        success: true,
        data: { org_id: org.id, created: true },
      });
    }
  );

  // ========================================================================
  // GET /status — Get onboarding progress
  // ========================================================================
  server.get(
    '/status',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.send({
          success: true,
          data: {
            has_org: false,
            onboarding_step: 0,
            completed: false,
          },
        });
      }

      const { data: org } = await supabase
        .from('orgs')
        .select('id, name, domain, industry, company_size, onboarding_step, completed_onboarding_at, onboarding_skips')
        .eq('id', orgId)
        .single();

      if (!org) {
        return reply.send({
          success: true,
          data: { has_org: false, onboarding_step: 0, completed: false },
        });
      }

      // Count entities for progress indicators
      const [competitorsRes, journalistsRes, contentRes] = await Promise.all([
        supabase.from('org_competitors').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('journalists').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      ]);

      return reply.send({
        success: true,
        data: {
          has_org: true,
          org_id: org.id,
          org_name: org.name,
          domain: org.domain,
          industry: org.industry,
          company_size: org.company_size,
          onboarding_step: org.onboarding_step ?? 0,
          completed: !!org.completed_onboarding_at,
          completed_at: org.completed_onboarding_at,
          skips: org.onboarding_skips ?? {},
          counts: {
            competitors: competitorsRes.count ?? 0,
            journalists: journalistsRes.count ?? 0,
            content: contentRes.count ?? 0,
          },
        },
      });
    }
  );

  // ========================================================================
  // POST /step — Update current onboarding step
  // ========================================================================
  server.post<{ Body: { step: number; skipped?: boolean } }>(
    '/step',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found. Complete brand setup first.' },
        });
      }

      const { step, skipped } = request.body;

      const updateData: Record<string, unknown> = { onboarding_step: step };

      if (skipped) {
        // Fetch current skips and merge
        const { data: org } = await supabase
          .from('orgs')
          .select('onboarding_skips')
          .eq('id', orgId)
          .single();

        const currentSkips = (org?.onboarding_skips as Record<string, boolean>) ?? {};
        updateData.onboarding_skips = { ...currentSkips, [`step_${step}`]: true };
      }

      await supabase.from('orgs').update(updateData).eq('id', orgId);

      return reply.send({ success: true, data: { step } });
    }
  );

  // ========================================================================
  // POST /competitors — Save competitor list
  // ========================================================================
  server.post<{ Body: { competitors: Array<{ domain: string; name?: string }> } }>(
    '/competitors',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      const { competitors } = request.body;

      if (!Array.isArray(competitors)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'competitors must be an array' },
        });
      }

      // Upsert competitors (ignore conflicts on org_id + domain)
      const rows = competitors
        .filter((c) => c.domain?.trim())
        .map((c) => ({
          org_id: orgId,
          domain: c.domain.trim().toLowerCase(),
          name: c.name?.trim() || null,
        }));

      if (rows.length === 0) {
        return reply.send({ success: true, data: { saved: 0 } });
      }

      const { error } = await supabase
        .from('org_competitors')
        .upsert(rows, { onConflict: 'org_id,domain', ignoreDuplicates: true });

      if (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'COMPETITOR_SAVE_FAILED', message: error.message },
        });
      }

      return reply.send({ success: true, data: { saved: rows.length } });
    }
  );

  // ========================================================================
  // GET /competitors — Get saved competitors
  // ========================================================================
  server.get(
    '/competitors',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.send({ success: true, data: { competitors: [] } });
      }

      const { data: competitors } = await supabase
        .from('org_competitors')
        .select('id, domain, name, added_at')
        .eq('org_id', orgId)
        .order('added_at', { ascending: true });

      return reply.send({
        success: true,
        data: { competitors: competitors ?? [] },
      });
    }
  );

  // ========================================================================
  // DELETE /competitors/:id — Remove a competitor
  // ========================================================================
  server.delete<{ Params: { id: string } }>(
    '/competitors/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      await supabase
        .from('org_competitors')
        .delete()
        .eq('id', request.params.id)
        .eq('org_id', orgId);

      return reply.send({ success: true, data: { deleted: true } });
    }
  );

  // ========================================================================
  // POST /journalists — Save journalists during onboarding
  // ========================================================================
  server.post<{
    Body: {
      journalists: Array<{
        name: string;
        email?: string;
        outlet_name?: string;
        beat?: string;
      }>;
    };
  }>(
    '/journalists',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      const { journalists } = request.body;

      if (!Array.isArray(journalists)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'journalists must be an array' },
        });
      }

      let saved = 0;

      for (const j of journalists) {
        if (!j.name?.trim()) continue;

        // Create or find media outlet if provided
        let mediaOutletId: string | null = null;
        if (j.outlet_name?.trim()) {
          const { data: existing } = await supabase
            .from('media_outlets')
            .select('id')
            .eq('org_id', orgId)
            .eq('name', j.outlet_name.trim())
            .limit(1)
            .single();

          if (existing) {
            mediaOutletId = existing.id;
          } else {
            const { data: newOutlet } = await supabase
              .from('media_outlets')
              .insert({ org_id: orgId, name: j.outlet_name.trim() })
              .select('id')
              .single();
            mediaOutletId = newOutlet?.id ?? null;
          }
        }

        const { error } = await supabase.from('journalists').insert({
          org_id: orgId,
          name: j.name.trim(),
          email: j.email?.trim() || null,
          media_outlet_id: mediaOutletId,
          beat: j.beat?.trim() || null,
          metadata: { source: 'onboarding' },
        });

        if (!error) saved++;
      }

      return reply.send({ success: true, data: { saved } });
    }
  );

  // ========================================================================
  // POST /content — Save content URLs during onboarding
  // ========================================================================
  server.post<{
    Body: { urls: string[] };
  }>(
    '/content',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      const { urls } = request.body;

      if (!Array.isArray(urls)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'urls must be an array' },
        });
      }

      let saved = 0;

      for (const url of urls) {
        if (!url?.trim()) continue;

        // Extract a title from the URL path for now
        const urlObj = new URL(url.trim());
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const slug = pathSegments[pathSegments.length - 1] || 'untitled';
        const title = slug.replace(/[-_]/g, ' ').replace(/\.\w+$/, '');

        const { error } = await supabase.from('content_items').insert({
          org_id: orgId,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          type: 'article',
          status: 'published',
          metadata: { source: 'onboarding', original_url: url.trim() },
        });

        if (!error) saved++;
      }

      return reply.send({ success: true, data: { saved } });
    }
  );

  // ========================================================================
  // POST /complete — Mark onboarding as complete
  // Triggers SAGE activation: EVI snapshot + signal scan
  // ========================================================================
  server.post(
    '/complete',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      // Mark onboarding complete
      const { error: updateError } = await supabase
        .from('orgs')
        .update({
          completed_onboarding_at: new Date().toISOString(),
          onboarding_step: 7,
        })
        .eq('id', orgId);

      if (updateError) {
        console.error('[Onboarding] Failed to mark complete:', updateError.message);
        return reply.code(500).send({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to mark onboarding complete' },
        });
      }

      // Trigger SAGE activation pipeline:
      // 1. EVI snapshot
      // 2. SAGE signal scan
      try {
        const { enqueueEVIRecalculate, enqueueSageSignalScan } = await import('../../queue/bullmqQueue');
        await enqueueEVIRecalculate(orgId);
        await enqueueSageSignalScan(orgId);
      } catch {
        // BullMQ not available — skip background jobs
      }

      return reply.send({
        success: true,
        data: { completed: true, org_id: orgId },
      });
    }
  );

  // ========================================================================
  // POST /activate — Trigger SAGE activation (EVI + signals)
  // Called from Step 6 progress screen
  // ========================================================================
  server.post(
    '/activate',
    { preHandler: requireUser },
    async (request, reply) => {
      const userId = request.user!.id;
      const orgId = await getUserOrgId(userId);

      if (!orgId) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      // Trigger EVI calculation and SAGE signal scan
      try {
        const { enqueueEVIRecalculate, enqueueSageSignalScan } = await import('../../queue/bullmqQueue');
        await enqueueEVIRecalculate(orgId);
        await enqueueSageSignalScan(orgId);
        return reply.send({ success: true, data: { queued: true } });
      } catch {
        // Direct fallback if BullMQ not available
        return reply.send({ success: true, data: { queued: false, reason: 'Background jobs unavailable' } });
      }
    }
  );
}
