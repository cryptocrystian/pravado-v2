/**
 * Silo Tax Audit Routes — Public Acquisition Flow
 *
 * Public endpoints (no auth required):
 * - POST /scan   — Run SAGE™ audit, create account, send magic link.
 *                  Single transaction: email/name/company are required upfront,
 *                  rate-limited 1 per email per 24h.
 * - POST /claim  — DEPRECATED. Retained as an idempotent shim for any in-flight
 *                  legacy clients. New flow handles claim work inside /scan.
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

// ── Rate-limit window ─────────────────────────────────
const RATE_LIMIT_WINDOW_HOURS = 24;
const RATE_LIMIT_WINDOW_SECONDS = RATE_LIMIT_WINDOW_HOURS * 60 * 60;

// ── Email format validation ───────────────────────────
// Standard email shape — server-side floor; UI does its own check too.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ScanBody {
  brandUrl: string;
  email: string;
  name: string;
  company: string;
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

// ── EVI band logic — canonical 4-band per docs/canon/EARNED_VISIBILITY_INDEX.md
function eviBandForEmail(score: number): { label: string; hex: string } {
  if (score <= 40) return { label: 'At Risk',     hex: '#EF4444' };
  if (score <= 60) return { label: 'Emerging',    hex: '#F59E0B' };
  if (score <= 80) return { label: 'Competitive', hex: '#00D9FF' };
  return                  { label: 'Dominant',    hex: '#22C55E' };
}

function buildAuditClaimEmailHtml(name: string, eviScore: number, siloTax: number, magicLinkUrl: string): string {
  const { label: eviLabel, hex: eviColor } = eviBandForEmail(eviScore);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:2px solid #00D9FF;">
  <span style="font-family:monospace;font-weight:800;font-size:20px;letter-spacing:3px;color:#1a1a2e;">PRAVADO</span>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#13131A;">Your Silo Tax Audit is ready, ${name}.</h1>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:0;">
    <tr>
      <td width="50%" valign="top" style="padding-right:8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fc;border-radius:8px;border:1px solid #eee;">
          <tr><td style="padding:20px;text-align:center;">
            <div style="font-size:11px;color:#666;font-family:monospace;letter-spacing:0.1em;margin-bottom:8px;">EVI&trade; SCORE</div>
            <div style="font-size:36px;font-weight:900;font-family:monospace;color:${eviColor};line-height:1;">${eviScore}</div>
            <div style="font-size:12px;color:${eviColor};margin-top:4px;">${eviLabel}</div>
          </td></tr>
        </table>
      </td>
      <td width="50%" valign="top" style="padding-left:8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fc;border-radius:8px;border:1px solid #eee;">
          <tr><td style="padding:20px;text-align:center;">
            <div style="font-size:11px;color:#666;font-family:monospace;letter-spacing:0.1em;margin-bottom:8px;">SILO TAX</div>
            <div style="font-size:36px;font-weight:900;font-family:monospace;color:#00D9FF;line-height:1;">$${siloTax.toLocaleString()}</div>
            <div style="font-size:12px;color:#666;margin-top:4px;">/month lost</div>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
    <a href="${magicLinkUrl}" style="display:inline-block;background:#00D9FF;color:#0A0A0F;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Access Your Dashboard &rarr;
    </a>
  </td></tr></table>

  <div style="padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px;">
    <p style="margin:0;font-size:13px;color:#166534;">
      <strong>CiteMind&trade; 72H Window Active</strong><br>
      We're scanning 5 major AI engines (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot) for citations of your brand right now.
      You'll receive an email when results are detected.
    </p>
  </div>

  <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
    This magic link expires in 24 hours. If you have questions, reply to this email &mdash; you'll reach Christian directly.
  </p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9fb;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0;font-size:12px;color:#aaa;">Pravado &middot; Authority Orchestration Platform &middot; <a href="https://pravado.io" style="color:#00D9FF;text-decoration:none;">pravado.io</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function siloTaxAuditRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /scan — SAGE™ audit + account + magic link in one transaction
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server.post<{ Body: ScanBody }>('/scan', async (request, reply) => {
    try {
      const { brandUrl, email, name, company, competitorUrls = [] } = request.body ?? ({} as ScanBody);

      // ── Input validation ──────────────────────
      if (!brandUrl || !email || !name || !company) {
        return reply.code(400).send({ error: 'brandUrl, email, name, and company are required' });
      }

      try { new URL(brandUrl); } catch {
        return reply.code(400).send({ error: 'Invalid brandUrl format' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }

      const trimmedName = name.trim();
      const trimmedCompany = company.trim();
      if (!trimmedName || !trimmedCompany) {
        return reply.code(400).send({ error: 'name and company cannot be empty' });
      }

      // ── Rate limit: 1 scan per email per 24h ───
      // Idx: idx_audit_sessions_email_created_at (composite, B-tree).
      // TOCTOU: two truly-concurrent submissions for the same email can both
      // pass this check. Acceptable for pre-beta; tighten with a pg advisory
      // lock if abuse is observed.
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
      const { data: recent, error: recentErr } = await supabase
        .from('audit_sessions')
        .select('id, created_at')
        .eq('email', normalizedEmail)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentErr) {
        logger.error('Rate-limit lookup failed', { error: recentErr.message });
        // Fail open on lookup error — better to allow the scan than to falsely block.
      } else if (recent && recent.length > 0) {
        const last = recent[0];
        const lastTs = new Date(last.created_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - lastTs) / 1000);
        const retryAfterSeconds = Math.max(RATE_LIMIT_WINDOW_SECONDS - elapsedSeconds, 60);
        const retryAfterHours = Math.ceil(retryAfterSeconds / 3600);
        return reply.code(429)
          .header('Retry-After', String(retryAfterSeconds))
          .send({
            error: 'rate_limited',
            message: `You already ran an audit for this email. Try again in about ${retryAfterHours} hour${retryAfterHours === 1 ? '' : 's'}, or use a different email.`,
            retry_after_seconds: retryAfterSeconds,
          });
      }

      // ── Run Claude Haiku (LLM scan) ───────────
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
            const data = await res.json() as { content?: Array<{ text?: string }> };
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

      // ── Silo Tax calculation ──────────────────
      const authority_leakage = Math.round(llmResult.unlinked_mentions_estimate * AVG_CPM);
      const ppc_replacement = Math.round(llmResult.citation_gap_queries * AVG_CPC * 120);
      const hallucination_overhead = Math.round(
        (MONTHLY_QUERY_VOL * llmResult.entity_collision_risk_pct / 100) * BRI_RECOVERY_COST
      );
      const silo_tax_monthly = authority_leakage + ppc_replacement + hallucination_overhead;
      const monthly_cash_loss = authority_leakage + ppc_replacement;
      const risk_premium = hallucination_overhead;

      // ── Find or create auth user ──────────────
      let userId: string;
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = listData?.users?.find((u: { email?: string }) => u.email === normalizedEmail);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: { full_name: trimmedName, company: trimmedCompany },
        });
        if (createErr || !newUser.user) {
          logger.error('Failed to create user', { error: createErr?.message });
          return reply.code(500).send({ error: 'Failed to create account' });
        }
        userId = newUser.user.id;
      }

      // ── Find or create org ────────────────────
      const slug = trimmedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
      let orgId: string;

      const { data: existingOrg } = await supabase
        .from('orgs')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: orgErr } = await supabase
          .from('orgs')
          .insert({ name: trimmedCompany, slug })
          .select('id')
          .single();

        if (orgErr || !newOrg) {
          logger.error('Failed to create org', { error: orgErr?.message });
          return reply.code(500).send({ error: 'Failed to create organization' });
        }
        orgId = newOrg.id;

        await supabase.from('org_members').insert({
          org_id: orgId,
          user_id: userId,
          role: 'owner',
        });
      }

      // ── Persist audit session (already account-linked) ─
      const trialExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      let auditId: string | null = null;
      try {
        const { data: session } = await supabase
          .from('audit_sessions')
          .insert({
            org_id: orgId,
            email: normalizedEmail,
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
            stage: 'account_created',
            trial_expires_at: trialExpiresAt,
          })
          .select('id')
          .single();
        auditId = session?.id ?? null;
      } catch (dbErr) {
        logger.error('Failed to store audit session', { error: (dbErr as Error).message });
      }

      // ── Generate magic link ───────────────────
      let magicLinkUrl = 'https://app.pravado.io/login';
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: normalizedEmail,
          options: {
            redirectTo: 'https://app.pravado.io/app/command-center',
          },
        });
        if (linkData?.properties?.action_link) {
          magicLinkUrl = linkData.properties.action_link;
        }
      } catch (linkErr) {
        logger.error('Failed to generate magic link', { error: (linkErr as Error).message });
      }

      // ── Send welcome email with results + magic link ─
      let magicLinkSent = false;
      try {
        await server.mailer.sendMail({
          to: normalizedEmail,
          from: 'christian@pravado.io',
          subject: `Your EVI score and Silo Tax breakdown — ${trimmedName}`,
          html: buildAuditClaimEmailHtml(trimmedName, llmResult.evi_score, silo_tax_monthly, magicLinkUrl),
          text: `Hi ${trimmedName}, your Silo Tax Audit is complete. EVI Score: ${llmResult.evi_score}/100. Estimated Silo Tax: $${silo_tax_monthly.toLocaleString()}/mo. Access your dashboard: ${magicLinkUrl}`,
        });
        magicLinkSent = true;
        logger.info('Audit email sent', { email: normalizedEmail });
      } catch (emailErr) {
        logger.error('Failed to send audit email', { error: (emailErr as Error).message });
      }

      logger.info('Audit scan completed', { email: normalizedEmail, audit_id: auditId, org_id: orgId });

      return reply.send({
        audit_id: auditId,
        evi_score: llmResult.evi_score,
        silo_tax_monthly, monthly_cash_loss, risk_premium,
        authority_leakage, ppc_replacement, hallucination_overhead,
        gaps: llmResult.gaps,
        top_competitor_advantage: llmResult.top_competitor_advantage,
        total_authority_void: llmResult.total_authority_void,
        org_id: orgId,
        trial_expires_at: trialExpiresAt,
        magic_link_sent: magicLinkSent,
      });
    } catch (err) {
      logger.error('Silo tax scan failed', { error: (err as Error).message });
      return reply.code(500).send({ error: 'Scan failed' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /claim — DEPRECATED. Idempotent shim for in-flight legacy clients.
  // The new /scan does account creation + magic link in one transaction;
  // this endpoint exists only so older client bundles in the wild don't 4xx
  // mid-flow. Safe to remove once browser caches age out.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server.post<{ Body: ClaimBody }>('/claim', async (request, reply) => {
    logger.warn('POST /claim hit — endpoint is deprecated; new clients use /scan exclusively');
    try {
      const { email, audit_id } = request.body ?? ({} as ClaimBody);

      if (!email || !audit_id) {
        return reply.code(400).send({ error: 'email and audit_id are required' });
      }

      const { data: session } = await supabase
        .from('audit_sessions')
        .select('id, org_id, trial_expires_at, stage')
        .eq('id', audit_id)
        .single();

      if (!session) {
        return reply.code(404).send({ error: 'Audit session not found' });
      }

      // /scan now handles account creation; legacy /claim is a no-op success.
      return reply.send({
        success: true,
        org_id: session.org_id,
        trial_expires_at: session.trial_expires_at,
        deprecated: true,
      });
    } catch (err) {
      logger.error('Audit claim failed', { error: (err as Error).message });
      return reply.code(500).send({ error: 'Claim failed' });
    }
  });
}
