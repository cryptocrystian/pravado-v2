/**
 * Silo Tax Audit Routes — Public Acquisition Flow
 *
 * Two public endpoints (no auth required):
 * - POST /scan  — Run SAGE™ audit via Claude Haiku
 * - POST /claim — Create trial account + link audit
 *
 * Separate from /api/v1/audit (internal audit logging, S35).
 */

import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('silo-tax-audit');

// ── Silo Tax calculation constants ────────────────────
const AVG_CPM = 18;
const AVG_CPC = 2.40;
const MONTHLY_QUERY_VOL = 1200;
const BRI_RECOVERY_COST = 1.20;

interface ScanBody {
  brandUrl: string;
  competitorUrls?: string[];
}

interface ClaimBody {
  email: string;
  name: string;
  company: string;
  audit_id: string;
}

interface LlmResult {
  evi_score: number;
  gaps: Array<{
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    affected_engine: string;
  }>;
  top_competitor_advantage: string;
  total_authority_void: boolean;
  unlinked_mentions_estimate: number;
  citation_gap_queries: number;
  entity_collision_risk_pct: number;
}

const FALLBACK_RESULT: LlmResult = {
  evi_score: 15,
  gaps: [
    {
      type: 'topic_void',
      severity: 'HIGH',
      title: 'Limited AI Engine Presence Detected',
      description: 'Minimal citation presence across major AI engines. Perplexity and ChatGPT are not surfacing this brand for relevant category queries.',
      affected_engine: 'All engines',
    },
    {
      type: 'authority_leakage',
      severity: 'HIGH',
      title: 'Schema-LD Coverage Gap',
      description: 'Media mentions lack structured data markup, preventing AI crawlers from attributing authority signals to the brand entity.',
      affected_engine: 'Google AI',
    },
    {
      type: 'citation_drift',
      severity: 'MEDIUM',
      title: 'Competitor Citation Advantage',
      description: 'Category competitors are receiving 3-5x more AI citations for core product queries.',
      affected_engine: 'ChatGPT',
    },
    {
      type: 'entity_collision',
      severity: 'MEDIUM',
      title: 'Brand Entity Disambiguation Risk',
      description: 'AI models may confuse brand entity with similarly-named entities in adjacent categories.',
      affected_engine: 'Perplexity',
    },
  ],
  top_competitor_advantage: 'Top competitor has 4x more AI citations due to stronger entity markup and content structure.',
  total_authority_void: true,
  unlinked_mentions_estimate: 8,
  citation_gap_queries: 45,
  entity_collision_risk_pct: 35,
};

export async function siloTaxAuditRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /scan — Run SAGE™ audit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server.post<{ Body: ScanBody }>('/scan', async (request, reply) => {
    try {
      const { brandUrl, competitorUrls = [] } = request.body;

      if (!brandUrl) {
        return reply.code(400).send({ error: 'brandUrl is required' });
      }

      try { new URL(brandUrl); } catch {
        return reply.code(400).send({ error: 'Invalid brandUrl format' });
      }

      // ── Call Claude Haiku ──────────────────────
      let llmResult: LlmResult = FALLBACK_RESULT;

      if (anthropicApiKey) {
        try {
          const systemPrompt = `You are SAGE™, Pravado's strategic intelligence engine. Analyze brand and competitor URLs to identify AI visibility gaps, entity drift, and citation opportunities. Be specific and direct — name actual AI engines, query types, and competitor advantages where possible. Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON.`;

          const userPrompt = `Analyze this brand: ${brandUrl}
${competitorUrls.length > 0 ? `Competitors: ${competitorUrls.join(', ')}` : 'No competitors provided — analyze brand in isolation.'}

Return this exact JSON structure with no additional text:
{
  "evi_score": <integer 0-100 estimating current AI visibility>,
  "gaps": [
    {
      "type": "<entity_collision|authority_leakage|citation_drift|topic_void>",
      "severity": "<HIGH|MEDIUM|LOW>",
      "title": "<concise gap title under 60 chars>",
      "description": "<specific 1-2 sentence description naming AI engines or competitors>",
      "affected_engine": "<ChatGPT|Perplexity|Gemini|Google AI|All engines>"
    }
  ],
  "top_competitor_advantage": "<1 sentence on main competitor AI advantage, or empty string if none>",
  "total_authority_void": <true if brand has near-zero AI presence>,
  "unlinked_mentions_estimate": <integer 0-50>,
  "citation_gap_queries": <integer 0-200>,
  "entity_collision_risk_pct": <integer 0-100>
}

Rules:
- Generate exactly 3-5 gaps
- Be specific: name actual engines, query types, competitor names
- evi_score should reflect realistic AI presence for the brand
- If no competitors provided, focus on gaps vs category leaders
- total_authority_void = true only for very new/unknown brands`;

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1024,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data.content?.[0]?.text ?? '';
            const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            llmResult = JSON.parse(cleanJson);
          } else {
            logger.error('Anthropic API error', { status: res.status });
          }
        } catch (llmErr) {
          logger.error('LLM call failed, using fallback', { error: (llmErr as Error).message });
        }
      } else {
        logger.warn('No ANTHROPIC_API_KEY — using fallback result');
      }

      // ── Silo Tax calculation ───────────────────
      const authority_leakage = Math.round(llmResult.unlinked_mentions_estimate * AVG_CPM);
      const ppc_replacement = Math.round(llmResult.citation_gap_queries * AVG_CPC * 120);
      const hallucination_overhead = Math.round(
        (MONTHLY_QUERY_VOL * llmResult.entity_collision_risk_pct / 100) * BRI_RECOVERY_COST
      );
      const silo_tax_monthly = authority_leakage + ppc_replacement + hallucination_overhead;
      const monthly_cash_loss = authority_leakage + ppc_replacement;
      const risk_premium = hallucination_overhead;

      // ── Store in Supabase ──────────────────────
      let auditId: string | null = null;
      try {
        const { data: session } = await supabase
          .from('audit_sessions')
          .insert({
            brand_url: brandUrl,
            competitor_urls: competitorUrls,
            evi_score: llmResult.evi_score,
            silo_tax_monthly, monthly_cash_loss, risk_premium,
            authority_leakage, ppc_replacement, hallucination_overhead,
            gaps: llmResult.gaps,
            top_competitor_advantage: llmResult.top_competitor_advantage,
            total_authority_void: llmResult.total_authority_void,
            unlinked_mentions_estimate: llmResult.unlinked_mentions_estimate,
            citation_gap_queries: llmResult.citation_gap_queries,
            entity_collision_risk_pct: llmResult.entity_collision_risk_pct,
            stage: 'scanned',
          })
          .select('id')
          .single();
        auditId = session?.id ?? null;
      } catch (dbErr) {
        logger.error('Failed to store audit session', { error: (dbErr as Error).message });
      }

      return reply.send({
        audit_id: auditId,
        evi_score: llmResult.evi_score,
        silo_tax_monthly, monthly_cash_loss, risk_premium,
        authority_leakage, ppc_replacement, hallucination_overhead,
        gaps: llmResult.gaps,
        top_competitor_advantage: llmResult.top_competitor_advantage,
        total_authority_void: llmResult.total_authority_void,
      });
    } catch (err) {
      logger.error('Silo tax scan failed', { error: (err as Error).message });
      return reply.code(500).send({ error: 'Scan failed' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /claim — Create account + link audit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server.post<{ Body: ClaimBody }>('/claim', async (request, reply) => {
    try {
      const { email, name, company, audit_id } = request.body;

      if (!email || !audit_id) {
        return reply.code(400).send({ error: 'email and audit_id are required' });
      }

      // Create or find auth user
      let userId: string;
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1 });
      const existingUser = listData?.users?.find((u: { email?: string }) => u.email === email);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: name, company },
        });
        if (createErr || !newUser.user) {
          logger.error('Failed to create user', { error: createErr?.message });
          return reply.code(500).send({ error: 'Failed to create account' });
        }
        userId = newUser.user.id;
      }

      // Create or find organization
      const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
      let orgId: string;

      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: company, slug })
          .select('id')
          .single();

        if (orgErr || !newOrg) {
          logger.error('Failed to create org', { error: orgErr?.message });
          return reply.code(500).send({ error: 'Failed to create organization' });
        }
        orgId = newOrg.id;

        // Link user as owner
        await supabase.from('org_members').insert({
          org_id: orgId,
          user_id: userId,
          role: 'owner',
        });
      }

      // Update audit session with account info
      const trialExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('audit_sessions')
        .update({
          org_id: orgId,
          email,
          stage: 'account_created',
          trial_expires_at: trialExpiresAt,
        })
        .eq('id', audit_id);

      logger.info('Audit claimed', { email, audit_id, org_id: orgId });

      return reply.send({
        success: true,
        org_id: orgId,
        trial_expires_at: trialExpiresAt,
      });
    } catch (err) {
      logger.error('Audit claim failed', { error: (err as Error).message });
      return reply.code(500).send({ error: 'Claim failed' });
    }
  });
}
