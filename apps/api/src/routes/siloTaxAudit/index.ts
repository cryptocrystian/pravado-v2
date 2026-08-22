/**
 * Audit Routes — Public Acquisition Flow (Three-Path EVI Scorecard)
 *
 * Per docs/canon/DECISIONS_LOG.md D027 — Audit Funnel Repositioning:
 * Silo Tax → Three-Path EVI Scorecard. Phase 1A scope: backend rewrite.
 * See docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md for the full work
 * order. The customer-facing path (`/api/v1/silo-tax/scan`) is preserved
 * to avoid breaking deployed clients; the route handler now produces a
 * three-pillar EVI scorecard instead of a single-pillar Silo Tax score.
 *
 * Public endpoints (no auth required):
 * - POST /scan   — Run three-pillar EVI audit, create account, send
 *                  magic link. Single transaction: email/name/company
 *                  required upfront, rate-limited 1 per email per 24h.
 * - POST /claim  — DEPRECATED. Idempotent shim retained for any
 *                  in-flight legacy clients. New flow handles claim
 *                  work inside /scan.
 *
 * Composite EVI in this audit uses the same 40/35/25 weighting as
 * the in-product EVI defined in docs/canon/EVI_MATHEMATICS.md:
 *   in-product EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
 *   audit EVI      = (PR        × 0.40) + (Content   × 0.35) + (AI       × 0.25)
 * The bands (At Risk / Emerging / Competitive / Dominant) are
 * canonical and shared across both surfaces. Pillar weights map to
 * V/A/M weights deliberately: PR drives Visibility, Content drives
 * Authority, AI Citation drives Momentum (where citation velocity
 * lives in the in-product model).
 *
 * Separate from /api/v1/audit (internal audit logging, S35).
 */

import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { createLogger } from '../../lib/logger';

const logger = createLogger('audit-scorecard');

// ── Rate-limit window ─────────────────────────────────
const RATE_LIMIT_WINDOW_HOURS = 24;
const RATE_LIMIT_WINDOW_SECONDS = RATE_LIMIT_WINDOW_HOURS * 60 * 60;

// ── Email format validation ───────────────────────────
// Standard email shape — server-side floor; UI does its own check too.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Engines the AI Citation pillar reasons about ──────
// The LLM simulates citation behavior across these surfaces. Stored
// in scan_metadata so the results page can show "scanned across"
// transparency.
const ENGINES_CONSULTED = [
  'ChatGPT',
  'Perplexity',
  'Gemini',
  'Claude',
  'Bing Copilot',
] as const;

// ── EVI canonical bands ───────────────────────────────
// Source of truth: docs/canon/EARNED_VISIBILITY_INDEX.md §4.
type EVIBand = 'At Risk' | 'Emerging' | 'Competitive' | 'Dominant';

function eviBand(score: number): EVIBand {
  if (score <= 40) return 'At Risk';
  if (score <= 60) return 'Emerging';
  if (score <= 80) return 'Competitive';
  return 'Dominant';
}

// Hex used in email rendering only — keeps the canonical band logic
// in one place while allowing the email template to colour the score.
function eviBandHex(score: number): string {
  if (score <= 40) return '#EF4444';
  if (score <= 60) return '#F59E0B';
  if (score <= 80) return '#00D9FF';
  return '#22C55E';
}

// ── ScanBody / response types ─────────────────────────
type EntryPath = 'pr' | 'content' | 'ai' | 'generic';
type PillarKey = 'pr' | 'content' | 'ai';
type Severity = 'high' | 'medium' | 'low';

interface ScanBody {
  brandUrl: string;
  email: string;
  name: string;
  company: string;
  competitorUrls?: string[];
  entry_path?: EntryPath;
}

interface ClaimBody {
  email: string;
  name: string;
  company: string;
  audit_id: string;
}

interface PillarGap {
  title: string;
  description: string;
  severity: Severity;
  remediation: string;
}

interface PillarScore {
  score: number; // 0–100
  band: EVIBand;
  signals: Record<string, string>;
  gaps: PillarGap[];
}

interface Variance {
  spread: number; // max pillar score minus min pillar score
  leading_pillar: PillarKey;
  lagging_pillar: PillarKey;
  orchestration_opportunity: string;
}

interface Benchmark {
  category_quartile: 1 | 2 | 3 | 4 | null;
  category_label: string | null;
}

interface ScanMetadata {
  brand_url: string;
  competitor_urls: string[];
  scanned_at: string; // ISO 8601
  engines_consulted: string[];
}

interface ScanResult {
  evi_score: number;
  evi_band: EVIBand;
  pillars: { pr: PillarScore; content: PillarScore; ai: PillarScore };
  variance: Variance;
  benchmark: Benchmark;
  scan_metadata: ScanMetadata;
  magic_link_sent: boolean;
}

// API response wraps ScanResult with onboarding context (audit_id,
// org_id, trial_expires_at) the dashboard needs for the magic-link
// landing experience. These wrap the pure ScanResult and are not
// part of the public scorecard contract.
interface ScanResponse extends ScanResult {
  audit_id: string | null;
  org_id: string;
  trial_expires_at: string;
  entry_path: EntryPath;
}

// ── LLM-side schema (subset of ScanResult) ────────────
// The LLM produces qualitative pillar assessments and the
// orchestration narrative. The route computes the deterministic
// pieces (composite EVI, bands, variance numerics) so audit math is
// not at the mercy of model arithmetic.
interface LlmPillarOutput {
  score: number;
  signals: Record<string, string>;
  gaps: PillarGap[];
}

interface LlmAuditOutput {
  pillars: {
    pr: LlmPillarOutput;
    content: LlmPillarOutput;
    ai: LlmPillarOutput;
  };
  orchestration_opportunity: string;
  benchmark: {
    category_quartile: number | null;
    category_label: string | null;
  };
}

// Dev / no-key fallback. Mid-band scores with generic gaps so the
// response shape is well-formed for local development. NEVER reached
// when ANTHROPIC_API_KEY is set — production scans always go through
// the LLM, with a 502 on repeated malformed output.
const FALLBACK_LLM_OUTPUT: LlmAuditOutput = {
  pillars: {
    pr: {
      score: 50,
      signals: {
        earned_media_frequency:
          'Insufficient signal — homepage shows no named-journalist quotes or press archive.',
        domain_authority_estimate:
          'Mixed — likely citing sites are mid-tier industry blogs.',
      },
      gaps: [
        {
          title: 'No earned media archive surfaced',
          description:
            'No press page, no journalist-attributed quotes, no awards section detected. Without surfaced earned coverage, AI engines cannot infer authority transfer from media to brand.',
          severity: 'high',
          remediation:
            "CRAFT routes a weekly press release through Pravado's 283K-profile media database with named-journalist matching and pitches the resulting coverage as schema-marked authority signals.",
        },
        {
          title: 'No named-spokesperson coverage',
          description:
            'Brand mentions in inferred coverage are brand-name only, not attributed to a person. Named-quote coverage is heavier-weighted in citation graphs.',
          severity: 'medium',
          remediation:
            'CRAFT operationalizes named-spokesperson positioning across the pitch pipeline, prioritizing journalists who quote founders and executives.',
        },
      ],
    },
    content: {
      score: 55,
      signals: {
        topical_coverage:
          'Narrow — surface content covers product features, not category authority.',
        schema_completeness:
          'Partial — basic Organization schema present, no Article/HowTo coverage.',
      },
      gaps: [
        {
          title: 'Topic cluster gaps in primary category',
          description:
            "No deep-coverage hubs detected for the brand's strategic topics. Authority infrastructure requires hub-and-spoke topic ownership.",
          severity: 'high',
          remediation:
            'CRAFT generates topic-pillar content with structured FAQ and HowTo schema, governed by CiteMind for AEO citation worthiness before publish.',
        },
      ],
    },
    ai: {
      score: 45,
      signals: {
        citation_rate_estimate:
          'Low — buyer-intent queries surface category leaders, not this brand.',
        entity_disambiguation:
          'Some risk — brand name overlaps with other entities in adjacent categories.',
      },
      gaps: [
        {
          title: 'Buyer-intent queries surface competitors',
          description:
            'Representative buyer questions in this category cite competitors, not this brand. AI engines learn category leadership from training data and crawl signals.',
          severity: 'high',
          remediation:
            "CRAFT runs CiteMind's share-of-model program: weekly query monitoring, entity disambiguation pages, and orchestrated content + PR pushes targeting the gaps.",
        },
      ],
    },
  },
  orchestration_opportunity:
    'Pillar scores are close enough that no single discipline is the obvious culprit. The compounding loop is broken in both directions: PR mentions are not echoing into AI answers, and content pieces are not being cited as supporting evidence in either earned media or AI responses. Closing the loop requires shared schema across all three pillars.',
  benchmark: { category_quartile: null, category_label: null },
};

// ── Pillar weights (canonical, mirror EVI_MATHEMATICS V/A/M) ──
const PILLAR_WEIGHTS = { pr: 0.4, content: 0.35, ai: 0.25 } as const;

// ── Email rendering ───────────────────────────────────
// Phase 1E renders the three-pillar EVI scorecard. Layout mirrors the
// live results page (apps/dashboard/src/components/marketing/
// EVIScorecardResults.tsx): top-line EVI hero, three stacked pillar
// mini-cards (each with score, band, top gap, remediation preview),
// variance summary with leading/lagging pillars, magic-link CTA.
//
// Pillars are stacked rather than gridded to stay Outlook-safe at
// 520px container width — Outlook's table-cell width math is brittle
// for three side-by-side cards inside a 456px content well.
//
// Pillar accent palette mirrors dashboard PILLAR_CONFIG (keeps the
// email visually continuous with the live scorecard the user lands on
// via the magic link).
//
// HTML escaping: gap titles, remediation strings, and the orchestration
// narrative come from the LLM. Apostrophes, ampersands, and angle
// brackets must be entity-escaped before interpolation.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PILLAR_EMAIL_META: Record<
  PillarKey,
  { label: string; accent: string; bgAccent: string }
> = {
  pr: { label: 'PR Authority', accent: '#E879F9', bgAccent: '#fdf4ff' },
  content: {
    label: 'Content Authority',
    accent: '#A855F7',
    bgAccent: '#faf5ff',
  },
  ai: {
    label: 'AI Citation Authority',
    accent: '#00D9FF',
    bgAccent: '#ecfeff',
  },
};

function buildAuditClaimEmailHtml(
  name: string,
  scanResult: ScanResult,
  magicLinkUrl: string
): string {
  const eviLabel = scanResult.evi_band;
  const eviColor = eviBandHex(scanResult.evi_score);
  const safeName = escapeHtml(name);

  const pillarOrder: PillarKey[] = ['pr', 'content', 'ai'];
  const pillarBlocks = pillarOrder
    .map((key) => {
      const pillar = scanResult.pillars[key];
      const meta = PILLAR_EMAIL_META[key];
      const bandColor = eviBandHex(pillar.score);
      const topGap = pillar.gaps[0];
      const gapMarkup = topGap
        ? `<tr><td colspan="2" style="padding-top:12px;font-size:13px;font-weight:600;color:#13131A;line-height:1.4;">${escapeHtml(topGap.title)}</td></tr>
              <tr><td colspan="2" style="padding-top:6px;font-size:12px;color:#666;line-height:1.55;">
                <span style="color:${meta.accent};font-weight:600;">Pravado would:</span> ${escapeHtml(topGap.remediation)}
              </td></tr>`
        : '';
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;background:${meta.bgAccent};border-radius:8px;border:1px solid #eee;border-left:3px solid ${meta.accent};">
          <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#13131A;letter-spacing:0.01em;">${meta.label}</td>
                <td align="right" style="white-space:nowrap;">
                  <span style="font-size:22px;font-weight:800;color:${meta.accent};font-family:monospace;line-height:1;vertical-align:middle;">${pillar.score}</span><span style="font-size:13px;color:#999;font-family:monospace;vertical-align:middle;">/100</span>
                  &nbsp;<span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;color:${bandColor};background-color:${bandColor}1A;letter-spacing:0.04em;vertical-align:middle;">${pillar.band}</span>
                </td>
              </tr>
              ${gapMarkup}
            </table>
          </td></tr>
        </table>`;
    })
    .join('');

  const variance = scanResult.variance;
  const leadingMeta = PILLAR_EMAIL_META[variance.leading_pillar];
  const laggingMeta = PILLAR_EMAIL_META[variance.lagging_pillar];
  const leadingScore = scanResult.pillars[variance.leading_pillar].score;
  const laggingScore = scanResult.pillars[variance.lagging_pillar].score;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:2px solid #00D9FF;">
  <span style="font-family:monospace;font-weight:800;font-size:20px;letter-spacing:3px;color:#1a1a2e;">PRAVADO</span>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#13131A;line-height:1.3;">Your earned visibility scorecard is ready, ${safeName}.</h1>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f8f8fc;border-radius:8px;border:1px solid #eee;">
    <tr><td style="padding:24px;text-align:center;">
      <div style="font-size:11px;color:#666;font-family:monospace;letter-spacing:0.1em;margin-bottom:8px;">EVI&trade; SCORE</div>
      <div style="font-size:52px;font-weight:900;font-family:monospace;color:${eviColor};line-height:1;">${scanResult.evi_score}<span style="font-size:22px;color:#999;font-weight:700;">/100</span></div>
      <div style="margin-top:10px;">
        <span style="display:inline-block;padding:4px 12px;border-radius:5px;font-size:12px;font-weight:700;color:${eviColor};background-color:${eviColor}1A;letter-spacing:0.04em;">${eviLabel}</span>
      </div>
      <div style="font-size:11px;color:#888;margin-top:14px;line-height:1.5;">
        Composite of three pillars &mdash; PR &times;&nbsp;0.40, Content &times;&nbsp;0.35, AI Citation &times;&nbsp;0.25.
      </div>
    </td></tr>
  </table>

  <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Pillar Breakdown</div>
  ${pillarBlocks}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 24px;background:#fafafa;border-radius:8px;border:1px solid #eee;">
    <tr><td style="padding:18px 18px 16px;">
      <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">The Orchestration Opportunity</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td style="font-size:12px;color:#666;line-height:1.5;">
            <span style="color:${leadingMeta.accent};font-weight:700;">Leading:</span> ${leadingMeta.label} (${leadingScore})
            &nbsp;&middot;&nbsp;
            <span style="color:${laggingMeta.accent};font-weight:700;">Lagging:</span> ${laggingMeta.label} (${laggingScore})
            &nbsp;&middot;&nbsp;
            <span style="color:#444;font-weight:700;">Spread:</span> ${variance.spread} pts
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#444;line-height:1.65;">${escapeHtml(variance.orchestration_opportunity)}</p>
    </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
    <a href="${magicLinkUrl}" style="display:inline-block;background:#00D9FF;color:#0A0A0F;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Open your full scorecard &rarr;
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

// ── LLM prompt construction ───────────────────────────
const SYSTEM_PROMPT = `You are SAGE, Pravado's strategic intelligence engine. You produce three-pillar earned visibility scorecards.

You score three pillars on a 0–100 scale:
  • PR Authority — domain authority of likely citing sites, frequency/recency of earned media, named-spokesperson coverage vs brand-only mentions, awards / press archive presence.
  • Content Authority — topical coverage breadth and depth, schema completeness, content freshness, topic cluster integrity, structured-data hygiene.
  • AI Citation Authority — citation rate across major AI engines for representative buyer-intent queries, entity disambiguation risk versus competitors, share-of-model in category answers.

For each pillar produce 3–5 specific gaps. Each gap pairs with a "remediation" string describing what Pravado's CRAFT execution layer would do — operational and concrete (not a generic product pitch).

You also produce one "orchestration_opportunity" narrative — 2–3 sentences in buyer's language explaining what the variance across pillar scores reveals about why the brand's earned visibility isn't compounding.

Optionally, you produce a category benchmark only when the brand's category is unambiguous from the URL.

Output rules — these are absolute:
  • Return ONLY valid JSON. No markdown, no preamble, no code fences, no commentary outside the JSON.
  • Do NOT include dollar figures, monetary loss claims, monthly tax, projected revenue impact, or any number with a currency symbol.
  • Do NOT use the phrase "Silo Tax" or any time-bounded loss framing ("losing $X per month", "$X/year leaking", etc.).
  • Do NOT use scareware framing or panic language. The audit is diagnostic, not alarmist.
  • Be specific — name actual AI engines, query types, competitor names where reasonable. Generic statements fail the bar.`;

function buildUserPrompt(brandUrl: string, competitorUrls: string[]): string {
  const competitorBlock =
    competitorUrls.length > 0
      ? `Competitor URLs: ${competitorUrls.join(', ')}`
      : 'No competitor URLs provided — analyze this brand against likely category leaders inferred from the brand URL.';

  return `Brand URL: ${brandUrl}
${competitorBlock}

Engines to reason about for AI Citation Authority: ChatGPT, Perplexity, Gemini, Claude, Bing Copilot.

Return this exact JSON structure with no additional text:
{
  "pillars": {
    "pr": {
      "score": <integer 0-100>,
      "signals": { "<key>": "<short evidence, max 20 words>", "<key2>": "<...>" },
      "gaps": [
        {
          "title": "<concise gap title under 70 chars>",
          "description": "<1-2 sentences, max 35 words; name specific outlets, journalists, query types, or competitors>",
          "severity": "<high|medium|low>",
          "remediation": "<1 sentence, max 30 words; name what CRAFT would execute operationally>"
        }
      ]
    },
    "content": {
      "score": <integer 0-100>,
      "signals": { "<key>": "<short evidence, max 20 words>", "<key2>": "<...>" },
      "gaps": [ <same shape, 3-5 gaps> ]
    },
    "ai": {
      "score": <integer 0-100>,
      "signals": { "<key>": "<short evidence, max 20 words>", "<key2>": "<...>" },
      "gaps": [ <same shape, 3-5 gaps> ]
    }
  },
  "orchestration_opportunity": "<2-3 sentence narrative; buyer's language; explains variance across pillars and why earned visibility isn't compounding>",
  "benchmark": {
    "category_quartile": <integer 1-4 OR null if category cannot be confidently inferred>,
    "category_label": "<e.g., 'B2B SaaS', 'D2C wellness'> OR null"
  }
}

Each pillar must produce 3–5 gaps. Each pillar must include 2–3 signals (not more). Severity values are lowercase strings: "high", "medium", "low". Use null (not the string "null") when category cannot be inferred.`;
}

// ── LLM output validation ─────────────────────────────
function isValidLlmOutput(value: unknown): value is LlmAuditOutput {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  if (!v.pillars || typeof v.pillars !== 'object') return false;
  const pillars = v.pillars as Record<string, unknown>;
  for (const key of ['pr', 'content', 'ai'] as const) {
    if (!isValidPillar(pillars[key])) return false;
  }

  if (
    typeof v.orchestration_opportunity !== 'string' ||
    v.orchestration_opportunity.trim().length === 0
  ) {
    return false;
  }

  if (!v.benchmark || typeof v.benchmark !== 'object') return false;
  const b = v.benchmark as Record<string, unknown>;
  const quartileOk =
    b.category_quartile === null ||
    (typeof b.category_quartile === 'number' &&
      Number.isInteger(b.category_quartile) &&
      b.category_quartile >= 1 &&
      b.category_quartile <= 4);
  const labelOk =
    b.category_label === null || typeof b.category_label === 'string';
  if (!quartileOk || !labelOk) return false;

  return true;
}

function isValidPillar(value: unknown): value is LlmPillarOutput {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (typeof p.score !== 'number' || p.score < 0 || p.score > 100) return false;
  if (!p.signals || typeof p.signals !== 'object' || Array.isArray(p.signals))
    return false;
  if (!Array.isArray(p.gaps) || p.gaps.length < 1) return false;
  for (const gap of p.gaps) {
    if (!gap || typeof gap !== 'object') return false;
    const g = gap as Record<string, unknown>;
    if (typeof g.title !== 'string' || g.title.trim().length === 0)
      return false;
    if (typeof g.description !== 'string' || g.description.trim().length === 0)
      return false;
    if (
      g.severity !== 'high' &&
      g.severity !== 'medium' &&
      g.severity !== 'low'
    )
      return false;
    if (typeof g.remediation !== 'string' || g.remediation.trim().length === 0)
      return false;
  }
  return true;
}

async function callAnthropic(
  apiKey: string,
  brandUrl: string,
  competitorUrls: string[]
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(brandUrl, competitorUrls) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API returned ${res.status}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text ?? '';
}

function tryParseJson(raw: string): unknown {
  // Tolerate accidental code-fence wrapping. Reject anything that
  // can't parse outright — we will retry once.
  const stripped = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

async function runLlmScan(
  apiKey: string,
  brandUrl: string,
  competitorUrls: string[]
): Promise<LlmAuditOutput> {
  let lastFailure: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callAnthropic(apiKey, brandUrl, competitorUrls);
      const parsed = tryParseJson(raw);
      if (isValidLlmOutput(parsed)) {
        return parsed;
      }
      lastFailure =
        parsed === null ? 'JSON parse failed' : 'schema validation failed';
      logger.warn('LLM produced invalid output', {
        attempt,
        reason: lastFailure,
      });
    } catch (err) {
      lastFailure = (err as Error).message;
      logger.error('LLM call failed', { attempt, error: lastFailure });
    }
  }
  throw new Error(`LLM_INVALID_OUTPUT: ${lastFailure ?? 'unknown'}`);
}

// ── Pillar-score → ScanResult assembly ────────────────
function assemblePillar(p: LlmPillarOutput): PillarScore {
  const score = Math.round(p.score);
  return {
    score,
    band: eviBand(score),
    signals: p.signals,
    gaps: p.gaps,
  };
}

function computeVariance(
  pillars: { pr: PillarScore; content: PillarScore; ai: PillarScore },
  orchestrationOpportunity: string
): Variance {
  const entries: Array<[PillarKey, number]> = [
    ['pr', pillars.pr.score],
    ['content', pillars.content.score],
    ['ai', pillars.ai.score],
  ];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const leading_pillar = sorted[0][0];
  const lagging_pillar = sorted[sorted.length - 1][0];
  const spread = sorted[0][1] - sorted[sorted.length - 1][1];
  return {
    spread,
    leading_pillar,
    lagging_pillar,
    orchestration_opportunity: orchestrationOpportunity,
  };
}

function buildScanResult(
  llm: LlmAuditOutput,
  brandUrl: string,
  competitorUrls: string[],
  magicLinkSent: boolean
): ScanResult {
  const pillars = {
    pr: assemblePillar(llm.pillars.pr),
    content: assemblePillar(llm.pillars.content),
    ai: assemblePillar(llm.pillars.ai),
  };

  // Composite EVI matches docs/canon/EVI_MATHEMATICS.md weighting.
  // PR : Visibility :: Content : Authority :: AI : Momentum.
  const evi_score = Math.round(
    pillars.pr.score * PILLAR_WEIGHTS.pr +
      pillars.content.score * PILLAR_WEIGHTS.content +
      pillars.ai.score * PILLAR_WEIGHTS.ai
  );

  const variance = computeVariance(pillars, llm.orchestration_opportunity);

  const benchmark: Benchmark = {
    category_quartile:
      llm.benchmark.category_quartile === 1 ||
      llm.benchmark.category_quartile === 2 ||
      llm.benchmark.category_quartile === 3 ||
      llm.benchmark.category_quartile === 4
        ? llm.benchmark.category_quartile
        : null,
    category_label: llm.benchmark.category_label,
  };

  return {
    evi_score,
    evi_band: eviBand(evi_score),
    pillars,
    variance,
    benchmark,
    scan_metadata: {
      brand_url: brandUrl,
      competitor_urls: competitorUrls,
      scanned_at: new Date().toISOString(),
      engines_consulted: [...ENGINES_CONSULTED],
    },
    magic_link_sent: magicLinkSent,
  };
}

export async function siloTaxAuditRoutes(server: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST /scan — Three-pillar EVI audit + account + magic link in one transaction
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server.post<{ Body: ScanBody }>('/scan', async (request, reply) => {
    try {
      const body = request.body ?? ({} as ScanBody);
      const { brandUrl, email, name, company, competitorUrls = [] } = body;
      const entry_path: EntryPath =
        body.entry_path === 'pr' ||
        body.entry_path === 'content' ||
        body.entry_path === 'ai' ||
        body.entry_path === 'generic'
          ? body.entry_path
          : 'generic';

      // ── Input validation ──────────────────────
      if (!brandUrl || !email || !name || !company) {
        return reply
          .code(400)
          .send({ error: 'brandUrl, email, name, and company are required' });
      }

      try {
        new URL(brandUrl);
      } catch {
        return reply.code(400).send({ error: 'Invalid brandUrl format' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }

      const trimmedName = name.trim();
      const trimmedCompany = company.trim();
      if (!trimmedName || !trimmedCompany) {
        return reply
          .code(400)
          .send({ error: 'name and company cannot be empty' });
      }

      // ── Rate limit: 1 scan per email per 24h ───
      // Idx: idx_audit_sessions_email_created_at (composite, B-tree).
      // TOCTOU: two truly-concurrent submissions for the same email can both
      // pass this check. Acceptable for pre-beta; tighten with a pg advisory
      // lock if abuse is observed.
      const windowStart = new Date(
        Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000
      ).toISOString();
      const { data: recent, error: recentErr } = await supabase
        .from('audit_sessions')
        .select('id, created_at')
        .eq('email', normalizedEmail)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentErr) {
        // Sanitized log: code/message/details/hint only — never the full
        // error object (may contain row payloads or auth tokens) and never
        // the request payload (PII).
        logger.error('Rate-limit lookup failed', {
          code: recentErr.code,
          message: recentErr.message,
          details: recentErr.details ?? null,
          hint: recentErr.hint ?? null,
        });
        // Fail open on lookup error — better to allow the scan than to falsely block.
      } else if (recent && recent.length > 0) {
        const last = recent[0];
        const lastTs = new Date(last.created_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - lastTs) / 1000);
        const retryAfterSeconds = Math.max(
          RATE_LIMIT_WINDOW_SECONDS - elapsedSeconds,
          60
        );
        const retryAfterHours = Math.ceil(retryAfterSeconds / 3600);
        return reply
          .code(429)
          .header('Retry-After', String(retryAfterSeconds))
          .send({
            error: 'rate_limited',
            message: `You already ran an audit for this email. Try again in about ${retryAfterHours} hour${retryAfterHours === 1 ? '' : 's'}, or use a different email.`,
            retry_after_seconds: retryAfterSeconds,
          });
      }

      // ── Run Claude Haiku scan (with retry on malformed JSON) ──
      let llm: LlmAuditOutput;
      if (anthropicApiKey) {
        try {
          llm = await runLlmScan(anthropicApiKey, brandUrl, competitorUrls);
        } catch (err) {
          logger.error('Three-pillar scan failed after retry', {
            error: (err as Error).message,
          });
          return reply.code(502).send({
            error: 'scan_unavailable',
            message:
              "We couldn't generate your scorecard right now. Please try again in a few minutes.",
          });
        }
      } else {
        logger.warn(
          'No ANTHROPIC_API_KEY — using fallback scan output (dev mode)'
        );
        llm = FALLBACK_LLM_OUTPUT;
      }

      // ── Find or create auth user ──────────────
      let userId: string;
      const { data: listData, error: listErr } =
        await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        logger.error('auth.admin.listUsers failed', {
          name: listErr.name ?? 'AuthError',
          status: (listErr as { status?: number }).status ?? null,
          message: listErr.message,
        });
      }
      const existingUser = listData?.users?.find(
        (u: { email?: string }) => u.email === normalizedEmail
      );

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: createErr } =
          await supabase.auth.admin.createUser({
            email: normalizedEmail,
            email_confirm: true,
            user_metadata: { full_name: trimmedName, company: trimmedCompany },
          });
        if (createErr || !newUser.user) {
          logger.error('auth.admin.createUser failed', {
            name: createErr?.name ?? 'AuthError',
            status: (createErr as { status?: number } | null)?.status ?? null,
            message: createErr?.message ?? 'no error returned but user is null',
          });
          return reply.code(500).send({ error: 'Failed to create account' });
        }
        userId = newUser.user.id;
      }

      // ── Find or create org ────────────────────
      const slug = trimmedCompany
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      let orgId: string;

      const { data: existingOrg, error: existingOrgErr } = await supabase
        .from('orgs')
        .select('id')
        .eq('slug', slug)
        .single();

      // PGRST116 = no rows matched — expected branch, falls through to insert.
      // Anything else (RLS, auth, table missing) is a real error worth surfacing.
      if (existingOrgErr && existingOrgErr.code !== 'PGRST116') {
        logger.error('Org existence check failed', {
          code: existingOrgErr.code,
          message: existingOrgErr.message,
          details: existingOrgErr.details ?? null,
          hint: existingOrgErr.hint ?? null,
        });
      }

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: orgErr } = await supabase
          .from('orgs')
          .insert({ name: trimmedCompany, slug })
          .select('id')
          .single();

        if (orgErr || !newOrg) {
          logger.error('Failed to create org', {
            code: orgErr?.code,
            message: orgErr?.message,
            details: orgErr?.details ?? null,
            hint: orgErr?.hint ?? null,
          });
          return reply
            .code(500)
            .send({ error: 'Failed to create organization' });
        }
        orgId = newOrg.id;

        await supabase.from('org_members').insert({
          org_id: orgId,
          user_id: userId,
          role: 'owner',
        });
      }

      // ── Assemble ScanResult (math + bands + variance) ──
      // Magic-link send status is patched in below once we have it;
      // assemble first so the persistence layer has the full shape.
      const scanResult = buildScanResult(llm, brandUrl, competitorUrls, false);

      // ── Persist audit session (already account-linked) ─
      // The Supabase JS client returns { data, error } on Postgres-level
      // failures (FK violations, RLS blocks, type mismatches, schema drift)
      // rather than throwing — so the surrounding try/catch only catches
      // network throws. The destructure must capture `error` and log it
      // through the sanitized logger; otherwise audit_id falls through to
      // null with no production-log signal of what went wrong (this
      // exact pattern is what hid the audit_sessions persistence regression
      // surfaced in Phase 1E live testing).
      const trialExpiresAt = new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ).toISOString();
      let auditId: string | null = null;
      try {
        const { data: session, error: insertError } = await supabase
          .from('audit_sessions')
          .insert({
            org_id: orgId,
            email: normalizedEmail,
            brand_url: brandUrl,
            competitor_urls: competitorUrls,
            evi_score: scanResult.evi_score,
            // Three-pillar scorecard columns (migration 94)
            pr_score: scanResult.pillars.pr.score,
            pr_band: scanResult.pillars.pr.band,
            pr_signals: scanResult.pillars.pr.signals,
            pr_gaps: scanResult.pillars.pr.gaps,
            content_score: scanResult.pillars.content.score,
            content_band: scanResult.pillars.content.band,
            content_signals: scanResult.pillars.content.signals,
            content_gaps: scanResult.pillars.content.gaps,
            ai_score: scanResult.pillars.ai.score,
            ai_band: scanResult.pillars.ai.band,
            ai_signals: scanResult.pillars.ai.signals,
            ai_gaps: scanResult.pillars.ai.gaps,
            variance_spread: scanResult.variance.spread,
            leading_pillar: scanResult.variance.leading_pillar,
            lagging_pillar: scanResult.variance.lagging_pillar,
            orchestration_opportunity:
              scanResult.variance.orchestration_opportunity,
            category_quartile: scanResult.benchmark.category_quartile,
            category_label: scanResult.benchmark.category_label,
            entry_path,
            stage: 'account_created',
            trial_expires_at: trialExpiresAt,
          })
          .select('id')
          .single();

        if (insertError) {
          // Sanitized log: code/message/details/hint only. Never the
          // full error object and never the insert payload (PII).
          logger.error('Failed to insert audit_session', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details ?? null,
            hint: insertError.hint ?? null,
          });
          auditId = null;
        } else {
          auditId = session?.id ?? null;
        }
      } catch (dbErr) {
        // Network-level throw, not a Postgres error. Kept for completeness.
        logger.error('Failed to store audit session (network)', {
          error: (dbErr as Error).message,
        });
      }

      // ── Generate magic link ───────────────────
      let magicLinkUrl = 'https://app.pravado.io/login';
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          // Route through /callback (the canonical magic-link convergence, same
          // as login) so the server-authoritative onboarding gate runs. The
          // audit pre-creates the org + membership, so landing directly on
          // /app/command-center previously SKIPPED onboarding and dropped the
          // user into an unseeded dashboard (EVI 0). /callback → session-check
          // now routes incomplete orgs into /onboarding/ai-intro for real SAGE
          // activation. See DECISIONS_LOG (audit→onboarding handoff).
          email: normalizedEmail,
          options: {
            redirectTo: 'https://app.pravado.io/callback',
          },
        });
        if (linkData?.properties?.action_link) {
          magicLinkUrl = linkData.properties.action_link;
        }
      } catch (linkErr) {
        logger.error('Failed to generate magic link', {
          error: (linkErr as Error).message,
        });
      }

      // ── Send welcome email with three-pillar EVI scorecard + magic link
      // Phase 1E: full three-pillar body (top-line EVI + per-pillar
      // mini-cards + variance summary), mirroring the live results page.
      let magicLinkSent = false;
      try {
        await server.mailer.sendMail({
          to: normalizedEmail,
          from: 'christian@pravado.io',
          subject: `Your EVI score and earned visibility breakdown — ${trimmedName}`,
          html: buildAuditClaimEmailHtml(trimmedName, scanResult, magicLinkUrl),
          text: `Hi ${trimmedName}, your earned visibility scorecard is ready. EVI Score: ${scanResult.evi_score}/100 (${scanResult.evi_band}). PR ${scanResult.pillars.pr.score}/100 · Content ${scanResult.pillars.content.score}/100 · AI Citation ${scanResult.pillars.ai.score}/100. Open your full scorecard: ${magicLinkUrl}`,
        });
        magicLinkSent = true;
        logger.info('Audit email sent', { email: normalizedEmail });
      } catch (emailErr) {
        logger.error('Failed to send audit email', {
          error: (emailErr as Error).message,
        });
      }

      logger.info('Audit scan completed', {
        email: normalizedEmail,
        audit_id: auditId,
        org_id: orgId,
        entry_path,
      });

      const response: ScanResponse = {
        ...scanResult,
        magic_link_sent: magicLinkSent,
        audit_id: auditId,
        org_id: orgId,
        trial_expires_at: trialExpiresAt,
        entry_path,
      };
      return reply.send(response);
    } catch (err) {
      logger.error('Audit scan failed', { error: (err as Error).message });
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
    logger.warn(
      'POST /claim hit — endpoint is deprecated; new clients use /scan exclusively'
    );
    try {
      const { email, audit_id } = request.body ?? ({} as ClaimBody);

      if (!email || !audit_id) {
        return reply
          .code(400)
          .send({ error: 'email and audit_id are required' });
      }

      const { data: session, error: lookupErr } = await supabase
        .from('audit_sessions')
        .select('id, org_id, trial_expires_at, stage')
        .eq('id', audit_id)
        .single();

      // PGRST116 = no rows matched — handled by the 404 below. Anything
      // else is a real Postgres-level error worth surfacing.
      if (lookupErr && lookupErr.code !== 'PGRST116') {
        logger.error('audit_session lookup failed', {
          code: lookupErr.code,
          message: lookupErr.message,
          details: lookupErr.details ?? null,
          hint: lookupErr.hint ?? null,
        });
      }

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
