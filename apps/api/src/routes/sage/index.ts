/**
 * SAGE Signal Intelligence routes (Sprint S-INT-02 + S-INT-03)
 *
 * POST /scan — Trigger a SAGE signal scan for the user's org
 * POST /generate-proposals — Generate proposals from signals
 * GET  /signals — Get scored signals for the user's org
 * GET  /opportunities — Get ranked opportunities for the user's org
 * GET  /action-stream — Get action stream (proposals as ActionItems)
 * GET  /strategy-panel — Get strategy panel data (EVI + top movers)
 * GET  /orchestration-calendar — Get scheduled items
 * GET  /entity-map — Get entity map graph
 * GET  /intelligence-canvas — Get intelligence canvas
 */

import { FLAGS } from '@pravado/feature-flags';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { getSupabaseClient } from '../../lib/supabase';
import { runSignalScan } from '../../services/sage/sageSignalIngestor';
import { scoreOpportunities } from '../../services/sage/sageOpportunityScorer';
import { generateProposals } from '../../services/sage/sageProposalGenerator';
import { getActionStreamForOrg } from '../../services/sage/sageActionStreamService';
import { calculateEVI } from '../../services/evi/eviCalculationService';
import { getEVIDelta } from '../../services/evi/eviDeltaService';
import { enforcePlanLimit, PlanLimitExceededError } from '../../services/billing/planLimitsService';

async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return (data as { org_id: string } | null)?.org_id || null;
}

export async function sageRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  /**
   * POST /scan
   * Trigger a full SAGE signal scan for the authenticated user's org.
   * This is an admin/test endpoint for Sprint S-INT-02 verification.
   */
  server.post(
    '/scan',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_SAGE_SIGNALS) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'SAGE signals not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        const result = await runSignalScan(supabase, orgId);
        return reply.send({ success: true, data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'SAGE scan failed';
        console.error('[SAGE /scan] Error:', message);
        return reply.code(500).send({
          success: false,
          error: { code: 'SAGE_SCAN_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /signals
   * Get recent signals for the user's org.
   * Query: ?limit=50&pillar=PR|Content|SEO
   */
  server.get<{ Querystring: { limit?: string; pillar?: string } }>(
    '/signals',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_SAGE_SIGNALS) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'SAGE signals not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const limit = Math.min(parseInt(request.query.limit || '50', 10), 200);
      const pillar = request.query.pillar;

      let query = supabase
        .from('sage_signals')
        .select('*')
        .eq('org_id', orgId)
        .order('scored_at', { ascending: false })
        .limit(limit);

      if (pillar && ['PR', 'Content', 'SEO'].includes(pillar)) {
        query = query.eq('pillar', pillar);
      }

      const { data, error } = await query;

      if (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'QUERY_ERROR', message: error.message },
        });
      }

      return reply.send({ success: true, data });
    }
  );

  /**
   * GET /opportunities
   * Get ranked opportunities for the user's org.
   * Query: ?limit=20
   */
  server.get<{ Querystring: { limit?: string } }>(
    '/opportunities',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_SAGE_SIGNALS) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'SAGE signals not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);

      try {
        const opportunities = await scoreOpportunities(supabase, orgId, limit);
        return reply.send({ success: true, data: opportunities });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Opportunity scoring failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'SCORING_ERROR', message },
        });
      }
    }
  );

  // =========================================================================
  // Sprint S-INT-03: Proposal Generator + Command Center Data Endpoints
  // =========================================================================

  /**
   * POST /generate-proposals
   * Generate SAGE proposals from scored signals via LLM.
   */
  server.post(
    '/generate-proposals',
    { preHandler: requireUser, config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (request, reply) => {
      if (!FLAGS.ENABLE_SAGE_SIGNALS) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'SAGE signals not enabled' },
        });
      }

      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // S-INT-09: Enforce SAGE proposal plan limits
        await enforcePlanLimit(supabase, orgId, 'sageProposalsPerMonth');

        const result = await generateProposals(supabase, orgId);
        return reply.send({ success: true, data: result });
      } catch (error) {
        if (error instanceof PlanLimitExceededError) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'PLAN_LIMIT_EXCEEDED',
              message: error.message,
              resource: error.resource,
              current: error.current,
              limit: error.limit,
            },
          });
        }
        const message = error instanceof Error ? error.message : 'Proposal generation failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'PROPOSAL_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /action-stream
   * Returns active proposals as ActionItems for the Command Center.
   * Query: ?pillar=pr|content|seo&priority=critical|high|medium|low
   */
  server.get<{ Querystring: { pillar?: string; priority?: string } }>(
    '/action-stream',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        const result = await getActionStreamForOrg(supabase, orgId, {
          pillar: request.query.pillar,
          priority: request.query.priority,
        });
        return reply.send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action stream failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'ACTION_STREAM_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /strategy-panel
   * Returns EVI score + top movers + narratives for the Strategy Panel.
   */
  server.get(
    '/strategy-panel',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // Get real EVI data
        const eviBreakdown = await calculateEVI(supabase, orgId);
        const eviDelta = await getEVIDelta(supabase, orgId);

        // Get top 3 proposals as "top movers"
        const { data: topProposals } = await supabase
          .from('sage_proposals')
          .select('id, pillar, title, evi_impact_estimate, signal_type, deep_link, created_at')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .order('evi_impact_estimate', { ascending: false })
          .limit(3);

        const eviStatus = eviBreakdown.evi_score >= 81 ? 'dominant'
          : eviBreakdown.evi_score >= 61 ? 'competitive'
          : eviBreakdown.evi_score >= 41 ? 'emerging'
          : 'at_risk';

        const trend = eviDelta.direction === 'up' ? 'up' : eviDelta.direction === 'down' ? 'down' : 'flat';

        const pillarMap: Record<string, string> = { PR: 'pr', Content: 'content', SEO: 'seo' };
        const driverMap: Record<string, string> = {
          pr_stale_followup: 'visibility', pr_high_value_unpitched: 'visibility', pr_pitch_window: 'visibility',
          content_stale_draft: 'momentum', content_low_quality: 'authority', content_coverage_gap: 'authority',
          seo_position_drop: 'authority', seo_opportunity_keyword: 'momentum', seo_content_gap: 'authority',
        };

        const topMovers = (topProposals ?? []).map((p: any) => ({
          id: `mover_${p.id}`,
          driver: driverMap[p.signal_type] || 'momentum',
          delta_points: Number(p.evi_impact_estimate) || 0,
          reason: p.title,
          evidence_type: 'metric' as const,
          deep_link: p.deep_link || { label: 'View', href: '/app' },
          action_id: p.id,
          pillar: pillarMap[p.pillar] || 'content',
          trend: 'up' as const,
        }));

        const strategyPanel = {
          generated_at: new Date().toISOString(),
          evi: {
            score: eviBreakdown.evi_score,
            previous_score: eviBreakdown.evi_score - (eviDelta.delta || 0),
            delta_7d: eviDelta.delta || 0,
            delta_30d: eviDelta.delta || 0,
            status: eviStatus,
            trend,
            sparkline: [eviBreakdown.evi_score],
            drivers: [
              {
                type: 'visibility',
                label: 'Visibility',
                score: eviBreakdown.visibility_score,
                weight: 0.40,
                delta_7d: 0,
                trend: 'flat',
                metrics: [],
              },
              {
                type: 'authority',
                label: 'Authority',
                score: eviBreakdown.authority_score,
                weight: 0.35,
                delta_7d: 0,
                trend: 'flat',
                metrics: [],
              },
              {
                type: 'momentum',
                label: 'Momentum',
                score: eviBreakdown.momentum_score,
                weight: 0.25,
                delta_7d: 0,
                trend: 'flat',
                metrics: [],
              },
            ],
          },
          narratives: [],
          upgrade_hooks: [],
          top_movers: topMovers,
        };

        return reply.send(strategyPanel);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Strategy panel failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'STRATEGY_PANEL_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /orchestration-calendar
   * Returns scheduled content items and pitch activities.
   */
  server.get<{ Querystring: { start?: string; end?: string; pillar?: string } }>(
    '/orchestration-calendar',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // Get content items with dates
        const { data: contentItems } = await supabase
          .from('content_items')
          .select('id, title, status, updated_at, created_at')
          .eq('org_id', orgId)
          .order('updated_at', { ascending: false })
          .limit(50);

        // Build calendar items from content
        const items = (contentItems ?? []).map((item: any) => ({
          id: `cal_${item.id}`,
          date: (item.updated_at || item.created_at || new Date().toISOString()).split('T')[0],
          time: '09:00',
          pillar: 'content' as const,
          title: item.title || 'Untitled',
          status: item.status === 'published' ? 'published'
            : item.status === 'draft' ? 'drafting'
            : 'planned',
          mode: 'copilot' as const,
          linked: { action_id: null, campaign_id: null },
          details: {
            summary: `Content item: ${item.title || 'Untitled'}`,
            owner: 'User' as const,
            risk: 'low' as const,
            estimated_duration: null,
            dependencies: [],
          },
        }));

        // Apply filters
        let filtered = items;
        if (request.query.start) {
          filtered = filtered.filter((i: any) => i.date >= request.query.start!);
        }
        if (request.query.end) {
          filtered = filtered.filter((i: any) => i.date <= request.query.end!);
        }
        if (request.query.pillar) {
          filtered = filtered.filter((i: any) => i.pillar === request.query.pillar);
        }

        const summary = {
          total_items: filtered.length,
          by_status: filtered.reduce((acc: Record<string, number>, i: any) => {
            acc[i.status] = (acc[i.status] || 0) + 1;
            return acc;
          }, {}),
          by_pillar: filtered.reduce((acc: Record<string, number>, i: any) => {
            acc[i.pillar] = (acc[i.pillar] || 0) + 1;
            return acc;
          }, {}),
          by_mode: filtered.reduce((acc: Record<string, number>, i: any) => {
            acc[i.mode] = (acc[i.mode] || 0) + 1;
            return acc;
          }, {}),
        };

        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        return reply.send({
          range: {
            start: request.query.start || now.toISOString().split('T')[0],
            end: request.query.end || twoWeeksLater.toISOString().split('T')[0],
          },
          views: ['day', 'week', 'month'],
          default_view: 'week',
          items: filtered,
          filters: {
            pillars: ['pr', 'content', 'seo'],
            statuses: ['planned', 'drafting', 'awaiting_approval', 'scheduled', 'published', 'failed'],
            modes: ['manual', 'copilot', 'autopilot'],
            owners: ['AI', 'User'],
          },
          summary,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Calendar failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'CALENDAR_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /entity-map
   * Returns entity map graph built from real data.
   * Ring 1 (Owned): content_topics, Ring 2 (Earned): journalist_profiles
   */
  server.get(
    '/entity-map',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // Get org for brand node
        const { data: org } = await supabase.from('orgs').select('name').eq('id', orgId).single();
        const orgName = (org as { name: string } | null)?.name || 'Brand';

        // Ring 1 (Owned): content topics
        const { data: topics } = await supabase
          .from('content_topics')
          .select('id, name, content_items!inner (org_id)')
          .eq('content_items.org_id', orgId)
          .limit(20);

        // Ring 2 (Earned): journalist profiles
        const { data: journalists } = await supabase
          .from('journalist_profiles')
          .select('id, journalist_id, engagement_score, relevance_score')
          .eq('org_id', orgId)
          .limit(20);

        // Get journalist names from the journalists table
        const journalistIds = (journalists ?? []).map((j: any) => j.journalist_id).filter(Boolean);
        const { data: journalistNames } = journalistIds.length > 0
          ? await supabase.from('journalists').select('id, name').in('id', journalistIds)
          : { data: [] };
        const nameMap = new Map((journalistNames ?? []).map((j: any) => [j.id, j.name]));

        // Build nodes
        const nodes: any[] = [];
        const edges: any[] = [];

        // Brand core node
        nodes.push({
          id: `n_brand_${orgId}`,
          kind: 'brand',
          label: orgName,
          zone: 'authority',
          pillar: null,
          meta: {},
        });

        // Topic nodes (Ring 1)
        const seenTopics = new Set<string>();
        for (const topic of (topics ?? [])) {
          if (seenTopics.has(topic.name)) continue;
          seenTopics.add(topic.name);
          const nodeId = `n_topic_${topic.id}`;
          nodes.push({
            id: nodeId,
            kind: 'topic',
            label: topic.name,
            zone: 'growth',
            pillar: 'content',
            meta: {},
          });
          edges.push({
            id: `e_brand_${topic.id}`,
            from: `n_brand_${orgId}`,
            to: nodeId,
            rel: 'authority_on',
            strength: 0.7,
            pillar: 'content',
          });
        }

        // Journalist nodes (Ring 2)
        for (const jp of (journalists ?? [])) {
          const nodeId = `n_journalist_${jp.id}`;
          const name = nameMap.get(jp.journalist_id) || `Journalist ${jp.id.substring(0, 6)}`;
          nodes.push({
            id: nodeId,
            kind: 'journalist',
            label: name,
            zone: 'signal',
            pillar: 'pr',
            meta: {
              engagement_score: jp.engagement_score,
              relevance_score: jp.relevance_score,
            },
          });
          edges.push({
            id: `e_journalist_brand_${jp.id}`,
            from: nodeId,
            to: `n_brand_${orgId}`,
            rel: 'covers',
            strength: (jp.engagement_score || 50) / 100,
            pillar: 'pr',
          });
        }

        // Ring 3 (Perceived): AI engine citation nodes (S-INT-05)
        const AI_ENGINES = [
          { id: 'chatgpt', label: 'ChatGPT', color: '#10A37F' },
          { id: 'perplexity', label: 'Perplexity', color: '#20B2AA' },
          { id: 'claude', label: 'Claude', color: '#D97706' },
          { id: 'gemini', label: 'Gemini', color: '#4285F4' },
        ];

        // Get citation counts per engine for this org (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: citationCounts } = await supabase
          .from('citation_monitor_results')
          .select('engine, brand_mentioned')
          .eq('org_id', orgId)
          .gte('monitored_at', thirtyDaysAgo);

        const engineStats: Record<string, { total: number; mentions: number }> = {};
        for (const c of (citationCounts ?? [])) {
          const eng = (c as { engine: string; brand_mentioned: boolean }).engine;
          if (!engineStats[eng]) engineStats[eng] = { total: 0, mentions: 0 };
          engineStats[eng].total++;
          if ((c as { brand_mentioned: boolean }).brand_mentioned) engineStats[eng].mentions++;
        }

        for (const engine of AI_ENGINES) {
          const stats = engineStats[engine.id] || { total: 0, mentions: 0 };
          const hasCited = stats.mentions > 0;

          nodes.push({
            id: `n_ai_${engine.id}`,
            kind: 'ai_engine',
            label: engine.label,
            zone: 'signal',
            pillar: 'seo',
            meta: {
              color: engine.color,
              citation_count_30d: stats.mentions,
              total_queries_30d: stats.total,
              has_cited: hasCited,
            },
          });

          edges.push({
            id: `e_ai_${engine.id}_brand`,
            from: `n_ai_${engine.id}`,
            to: `n_brand_${orgId}`,
            rel: 'cites_brand',
            strength: stats.total > 0 ? stats.mentions / stats.total : 0,
            pillar: 'seo',
            state: hasCited ? 'verified_solid' : 'gap',
          });
        }

        return reply.send({
          generated_at: new Date().toISOString(),
          layout_seed: `${orgId}-${new Date().toISOString().split('T')[0]}`,
          nodes,
          edges,
          action_impacts: {},
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Entity map failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'ENTITY_MAP_ERROR', message },
        });
      }
    }
  );

  /**
   * GET /intelligence-canvas
   * Returns intelligence canvas (entity map + citation feed).
   * Citation feed is empty until Sprint S-INT-05 (CiteMind).
   */
  server.get(
    '/intelligence-canvas',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      try {
        // Reuse entity map data for nodes/edges
        const { data: org } = await supabase.from('orgs').select('name').eq('id', orgId).single();
        const orgName = (org as { name: string } | null)?.name || 'Brand';

        const { data: topics } = await supabase
          .from('content_topics')
          .select('id, name, content_items!inner (org_id)')
          .eq('content_items.org_id', orgId)
          .limit(10);

        const nodes: any[] = [
          { id: `n_brand_${orgId}`, kind: 'brand', label: orgName, meta: {} },
        ];
        const edges: any[] = [];

        const seenTopics = new Set<string>();
        for (const topic of (topics ?? [])) {
          if (seenTopics.has(topic.name)) continue;
          seenTopics.add(topic.name);
          const nodeId = `n_topic_${topic.id}`;
          nodes.push({ id: nodeId, kind: 'topic_cluster', label: topic.name, meta: {} });
          edges.push({
            id: `e_${topic.id}`,
            from: `n_brand_${orgId}`,
            to: nodeId,
            rel: 'authority_on',
            strength: 0.7,
          });
        }

        // S-INT-05: Populate citation_feed from real data
        const { data: citations } = await supabase
          .from('citation_monitor_results')
          .select('id, engine, query_prompt, query_topic, response_excerpt, brand_mentioned, monitored_at')
          .eq('org_id', orgId)
          .eq('brand_mentioned', true)
          .order('monitored_at', { ascending: false })
          .limit(20);

        const citation_feed = (citations ?? []).map((c: any) => ({
          engine: c.engine,
          query: c.query_prompt,
          excerpt: (c.response_excerpt || '').substring(0, 200),
          mentioned: c.brand_mentioned,
          timestamp: c.monitored_at,
          topic: c.query_topic,
        }));

        return reply.send({
          generated_at: new Date().toISOString(),
          nodes,
          edges,
          citation_feed,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Intelligence canvas failed';
        return reply.code(500).send({
          success: false,
          error: { code: 'INTELLIGENCE_CANVAS_ERROR', message },
        });
      }
    }
  );
}
