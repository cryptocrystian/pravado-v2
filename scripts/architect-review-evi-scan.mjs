#!/usr/bin/env node
/**
 * Architect review harness for Phase 1A three-pillar EVI scan.
 *
 * Calls Anthropic directly with the same SYSTEM_PROMPT and user-prompt
 * shape as apps/api/src/routes/siloTaxAudit/index.ts, runs the same
 * schema validation, and reports per-brand quality metrics. No DB
 * writes, no email side effects, no rate limit interaction.
 *
 * Usage:
 *   node scripts/architect-review-evi-scan.mjs
 *
 * Output: prints a per-brand summary + aggregate stats. Non-zero exit
 * if any brand fails validation after retry, OR if aggregate retry rate
 * exceeds 10% (work order stop condition for switching to Sonnet).
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set. Source .env.local first.');
  process.exit(2);
}

// Sample brands span B2B SaaS, D2C, agency, niche — per work-order
// architect-review note. Add or remove URLs to taste.
const BRANDS = [
  { url: 'https://stripe.com',     category_hint: 'B2B SaaS payments' },
  { url: 'https://figma.com',      category_hint: 'B2B SaaS design' },
  { url: 'https://notion.so',      category_hint: 'B2B SaaS productivity' },
  { url: 'https://allbirds.com',   category_hint: 'D2C apparel' },
  { url: 'https://hubspot.com',    category_hint: 'B2B SaaS marketing' },
  { url: 'https://wellsteadhome.com', category_hint: 'D2C home services' },
  { url: 'https://muckrack.com',   category_hint: 'B2B SaaS PR' },
];

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

function buildUserPrompt(brandUrl, competitorUrls = []) {
  const competitorBlock = competitorUrls.length > 0
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

function tryParseJson(raw) {
  const stripped = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch { return null; }
}

function isValidPillar(value) {
  if (!value || typeof value !== 'object') return { ok: false, reason: 'pillar not object' };
  const p = value;
  if (typeof p.score !== 'number' || p.score < 0 || p.score > 100) return { ok: false, reason: 'score out of range' };
  if (!p.signals || typeof p.signals !== 'object' || Array.isArray(p.signals)) return { ok: false, reason: 'signals not object' };
  if (!Array.isArray(p.gaps) || p.gaps.length < 1) return { ok: false, reason: 'gaps not array or empty' };
  for (const gap of p.gaps) {
    if (!gap || typeof gap !== 'object') return { ok: false, reason: 'gap not object' };
    if (typeof gap.title !== 'string' || gap.title.trim().length === 0) return { ok: false, reason: 'gap.title invalid' };
    if (typeof gap.description !== 'string' || gap.description.trim().length === 0) return { ok: false, reason: 'gap.description invalid' };
    if (gap.severity !== 'high' && gap.severity !== 'medium' && gap.severity !== 'low') return { ok: false, reason: 'gap.severity invalid' };
    if (typeof gap.remediation !== 'string' || gap.remediation.trim().length === 0) return { ok: false, reason: 'gap.remediation invalid' };
  }
  return { ok: true };
}

function isValidLlmOutput(value) {
  if (!value || typeof value !== 'object') return { ok: false, reason: 'root not object' };
  const v = value;
  if (!v.pillars || typeof v.pillars !== 'object') return { ok: false, reason: 'pillars missing' };
  for (const key of ['pr', 'content', 'ai']) {
    const r = isValidPillar(v.pillars[key]);
    if (!r.ok) return { ok: false, reason: `pillar.${key}: ${r.reason}` };
  }
  if (typeof v.orchestration_opportunity !== 'string' || v.orchestration_opportunity.trim().length === 0) {
    return { ok: false, reason: 'orchestration_opportunity invalid' };
  }
  if (!v.benchmark || typeof v.benchmark !== 'object') return { ok: false, reason: 'benchmark missing' };
  const b = v.benchmark;
  const quartileOk = b.category_quartile === null
    || (typeof b.category_quartile === 'number' && Number.isInteger(b.category_quartile)
        && b.category_quartile >= 1 && b.category_quartile <= 4);
  const labelOk = b.category_label === null || typeof b.category_label === 'string';
  if (!quartileOk) return { ok: false, reason: 'benchmark.category_quartile invalid' };
  if (!labelOk) return { ok: false, reason: 'benchmark.category_label invalid' };
  return { ok: true };
}

async function callAnthropic(brandUrl) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(brandUrl) }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// Forbidden patterns per system prompt — flag if LLM violates
const FORBIDDEN_PATTERNS = [
  { pattern: /\$[\d,]+/, label: 'dollar figure' },
  { pattern: /silo tax/i, label: 'silo tax phrase' },
  { pattern: /losing \$|leaking \$|\$.* per month|\$.* per year|\$.*\/mo|\$.*\/yr/i, label: 'time-bounded loss claim' },
];

function detectForbidden(parsed) {
  const text = JSON.stringify(parsed);
  return FORBIDDEN_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label);
}

async function reviewBrand(brand) {
  const start = Date.now();
  let attempts = 0;
  let result = null;
  let validation = null;
  let raw = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    attempts++;
    try {
      raw = await callAnthropic(brand.url);
      const parsed = tryParseJson(raw);
      const v = isValidLlmOutput(parsed);
      if (v.ok) {
        result = parsed;
        validation = v;
        break;
      } else {
        validation = v;
      }
    } catch (err) {
      validation = { ok: false, reason: `api error: ${err.message}` };
    }
  }

  const elapsedMs = Date.now() - start;
  const forbidden = result ? detectForbidden(result) : [];

  return {
    url: brand.url,
    category_hint: brand.category_hint,
    attempts,
    valid: validation?.ok ?? false,
    failure_reason: validation?.ok ? null : validation?.reason,
    forbidden_violations: forbidden,
    elapsed_ms: elapsedMs,
    result,
  };
}

function summarizeResult(r) {
  if (!r.valid) {
    return `❌ ${r.url} — INVALID after ${r.attempts} attempt(s): ${r.failure_reason}`;
  }
  const p = r.result.pillars;
  const evi = Math.round(p.pr.score * 0.40 + p.content.score * 0.35 + p.ai.score * 0.25);
  const fwarn = r.forbidden_violations.length > 0 ? ` ⚠️  forbidden: ${r.forbidden_violations.join(', ')}` : '';
  const retryWarn = r.attempts > 1 ? ` ⚠️  retry` : '';
  return `✅ ${r.url} — EVI ${evi} (PR ${p.pr.score} / Content ${p.content.score} / AI ${p.ai.score}) · ${r.elapsed_ms}ms${retryWarn}${fwarn}`;
}

function printPillarSample(r) {
  if (!r.valid) return;
  const p = r.result.pillars;
  console.log(`\n  Sample gap (PR pillar):`);
  console.log(`    title:       ${p.pr.gaps[0].title}`);
  console.log(`    description: ${p.pr.gaps[0].description}`);
  console.log(`    remediation: ${p.pr.gaps[0].remediation}`);
  console.log(`\n  orchestration_opportunity:`);
  console.log(`    ${r.result.orchestration_opportunity}`);
  console.log(`\n  benchmark: quartile=${r.result.benchmark.category_quartile} label=${r.result.benchmark.category_label}`);
}

(async () => {
  console.log(`\nArchitect review — Phase 1A three-pillar EVI scan`);
  console.log(`Model: claude-haiku-4-5-20251001`);
  console.log(`Brands: ${BRANDS.length}\n`);

  const results = [];
  for (const brand of BRANDS) {
    process.stdout.write(`→ ${brand.url} ... `);
    const r = await reviewBrand(brand);
    results.push(r);
    console.log(summarizeResult(r).replace(/^[✅❌]\s*\S+\s*—\s*/, ''));
  }

  const valid = results.filter(r => r.valid).length;
  const retried = results.filter(r => r.valid && r.attempts > 1).length;
  const forbiddenHits = results.filter(r => r.forbidden_violations.length > 0).length;
  const retryRate = (retried / results.length) * 100;

  console.log(`\n────────────────────────────────────────`);
  console.log(`RESULTS:`);
  for (const r of results) console.log(`  ${summarizeResult(r)}`);

  console.log(`\nDETAILED SAMPLES (first 2 valid results):`);
  let shown = 0;
  for (const r of results) {
    if (r.valid && shown < 2) {
      console.log(`\n[${r.url}]`);
      printPillarSample(r);
      shown++;
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`AGGREGATE:`);
  console.log(`  Valid:           ${valid} / ${results.length}`);
  console.log(`  Required retry:  ${retried} (${retryRate.toFixed(1)}%)`);
  console.log(`  Forbidden hits:  ${forbiddenHits}`);
  console.log(`────────────────────────────────────────\n`);

  // Stop condition per work order: retry rate > 10% suggests model unreliability
  if (valid < results.length) {
    console.log(`STATUS: ❌ ${results.length - valid} brand(s) failed validation. Architect review required before Phase 1B.`);
    process.exit(1);
  }
  if (retryRate > 10) {
    console.log(`STATUS: ⚠️  retry rate ${retryRate.toFixed(1)}% exceeds 10% threshold. Consider Sonnet or function-calling.`);
    process.exit(1);
  }
  if (forbiddenHits > 0) {
    console.log(`STATUS: ⚠️  ${forbiddenHits} brand(s) violated forbidden-pattern policy. Review prompt strictness.`);
    process.exit(1);
  }
  console.log(`STATUS: ✅ All brands valid, retry rate within tolerance, no forbidden-pattern violations.`);
  process.exit(0);
})();
