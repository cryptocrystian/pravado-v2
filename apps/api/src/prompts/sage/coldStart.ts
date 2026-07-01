/**
 * SAGE Cold-Start Proposal Prompt Template (F13 Tier 2 remediation)
 *
 * Generates the first N proposals for an org that has just completed
 * onboarding but skipped all optional data collection (GSC, content
 * URLs, journalists). Inputs are limited to brand-registration data
 * captured during Steps 1 + 3 of the wizard: org name, industry,
 * company size, and 1–5 competitor domains.
 *
 * Design principles enforced by the prompt:
 *
 *   - Grounded: every proposal names WHICH input drove it (which
 *     competitor, which industry vertical). Refuses the "generic PR
 *     strategy" failure mode.
 *
 *   - Concrete: each proposal names a specific target publication
 *     appropriate to the industry, a specific angle, and a specific
 *     next action the user can take today.
 *
 *   - Bounded: the LLM is instructed to return 3–5 proposals. If it
 *     returns more, callers must truncate to top-5 by confidence.
 *
 *   - Pillar-diverse: at least one proposal per pillar (PR, Content,
 *     SEO) when 3+ proposals are requested — so the cold-start user
 *     sees the full three-pillar surface immediately, not just one.
 *
 *   - Same JSON output shape as the signal-driven path so downstream
 *     writers into sage_proposals need no branching.
 *
 * Stakes: Stage 3's output QA rubric scores these. Bland output makes
 * Pravado look like a GPT wrapper. Sharp output makes Pravado look like
 * the visibility OS it claims to be. Prompt-engineering effort here
 * disproportionately affects pilot outcome.
 */

export interface ColdStartCompetitor {
  domain: string;
  name: string | null;
}

export interface ColdStartPromptContext {
  org_name: string;
  industry: string | null;
  company_size: string | null;
  competitors: ColdStartCompetitor[];
}

export interface ColdStartProposalDraft {
  title: string;
  rationale: string;
  suggested_action: string;
  pillar: 'PR' | 'Content' | 'SEO';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0..1
  evi_impact_estimate: number; // 0..100
  grounded_in: string; // human-readable citation of the driving input
}

export function buildColdStartSystemPrompt(orgName: string): string {
  return `You are SAGE, the strategic intelligence engine for ${orgName} on the Pravado visibility platform.

Your role RIGHT NOW is to generate the first 3–5 baseline SAGE proposals for a newly-onboarded org. This org has provided their brand name, industry, size, and 1–5 competitor domains — but has NOT yet connected Google Search Console, added content URLs, or added journalist contacts. That means you have NO signal-scan data to draw from. You are generating the cold-start proposals that fill the Command Center on Day 0.

Your job is to produce proposals that make ${orgName}'s team say "SAGE actually looked at us" — not "this looks like generic marketing advice." The difference is in specificity.

Hard rules:

1. GROUNDED — every proposal MUST cite which input drove it. Reference a specific competitor by name/domain, or a specific industry vertical, or a specific company-size dynamic. Never say "the market" or "your industry" without naming the input.

2. CONCRETE — every proposal MUST name a specific target publication appropriate to the industry, a specific angle, or a specific next action ${orgName} can do this week. Vague verbs ("consider", "explore", "think about") are banned.

3. PILLAR DIVERSITY — return proposals distributed across PR, Content, and SEO. When you return 3+ proposals, at least one must be from each pillar. When you return 4–5, distribute reasonably (2 PR / 2 Content / 1 SEO is fine; 5 PR / 0 Content is not).

4. BOUNDED — return between 3 and 5 proposals. Never fewer than 3; never more than 5.

5. VOICE — use ${orgName}'s perspective: first-person plural ("we", "our position", "our competitors"). Not third-person about ${orgName}.

6. HONEST CONFIDENCE — cold-start proposals inherently have less signal backing than signal-driven ones. Confidence values should typically fall in 0.5–0.75. Don't inflate.

You MUST respond with valid JSON matching this exact schema:
{
  "proposals": [
    {
      "title": "string — concise action title, under 80 chars",
      "rationale": "string — 2 sentences: (1) why this matters given the specific input, (2) what ${orgName} loses if they don't act",
      "suggested_action": "string — 1 sentence naming the specific next step, ideally including a target publication or measurable outcome",
      "pillar": "PR" | "Content" | "SEO",
      "priority": "high" | "medium" (never critical or low for cold-start — nothing here is P0, nothing is throwaway)",
      "confidence": number in [0.50, 0.75],
      "evi_impact_estimate": number in [5, 25] (small — cold-start proposals are foundational, not moonshots),
      "grounded_in": "string — the specific input that drove this proposal (e.g. 'competitor: project44.com' or 'industry: B2B SaaS + company_size: 11-50')"
    }
  ]
}`;
}

export function buildColdStartUserPrompt(ctx: ColdStartPromptContext): string {
  const competitorList =
    ctx.competitors.length > 0
      ? ctx.competitors
          .map((c, i) => `${i + 1}. ${c.name ?? '(unnamed)'} (${c.domain})`)
          .join('\n')
      : '(no competitors provided — proposals must lean on industry + size)';

  return `Generate 3–5 cold-start SAGE proposals for the following newly-onboarded org.

Organization: ${ctx.org_name}
Industry: ${ctx.industry ?? '(not provided)'}
Company size: ${ctx.company_size ?? '(not provided)'}

Competitors:
${competitorList}

For each competitor, briefly consider what publications cover them, what topics they own, and where ${ctx.org_name} could differentiate. Then generate 3–5 grounded, concrete proposals per the rules in the system prompt.

Respond with a JSON object matching the schema.`;
}

/**
 * Parse the LLM's JSON response into a validated draft list.
 *
 * Tolerates common LLM output quirks (leading prose, code fences,
 * trailing commas) via a permissive extract-then-parse strategy.
 *
 * On any parse failure or schema mismatch, returns null so the caller
 * can fall back to the stub proposals below.
 */
export function parseColdStartResponse(
  completion: string
): ColdStartProposalDraft[] | null {
  try {
    // Strip common code-fence wrappers before parsing
    const stripped = completion
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    // Fall back to finding the first { ... last }
    let jsonText = stripped;
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonText = stripped.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonText) as {
      proposals?: unknown[];
    };

    if (!parsed?.proposals || !Array.isArray(parsed.proposals)) {
      return null;
    }

    const validated: ColdStartProposalDraft[] = [];
    for (const raw of parsed.proposals) {
      if (!raw || typeof raw !== 'object') continue;
      const p = raw as Record<string, unknown>;
      const title = typeof p.title === 'string' ? p.title.trim() : '';
      const rationale =
        typeof p.rationale === 'string' ? p.rationale.trim() : '';
      const action =
        typeof p.suggested_action === 'string' ? p.suggested_action.trim() : '';
      const pillar = p.pillar;
      const priority = p.priority;
      const confidence = typeof p.confidence === 'number' ? p.confidence : 0.5;
      const evi =
        typeof p.evi_impact_estimate === 'number' ? p.evi_impact_estimate : 10;
      const grounded =
        typeof p.grounded_in === 'string' ? p.grounded_in.trim() : '';

      if (!title || !rationale || !action) continue;
      if (pillar !== 'PR' && pillar !== 'Content' && pillar !== 'SEO') continue;
      if (priority !== 'high' && priority !== 'medium') continue;

      validated.push({
        title,
        rationale,
        suggested_action: action,
        pillar,
        priority,
        confidence: Math.max(0, Math.min(1, confidence)),
        evi_impact_estimate: Math.max(0, Math.min(100, evi)),
        grounded_in: grounded,
      });
    }

    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

/**
 * Deterministic stub cold-start proposals for the LLM-unavailable path.
 *
 * These are meant to be *credible last-resort* output — still grounded
 * in the org's actual competitor list — not the "consider a PR strategy"
 * generic that we want to shame the LLM out of returning. Uses the
 * first competitor concretely; if no competitor was provided, uses
 * industry-only framing.
 *
 * Confidence intentionally lower than the LLM's typical output so the
 * downstream UI can visually distinguish stubs when we want to.
 */
export function generateStubColdStartProposals(
  ctx: ColdStartPromptContext
): ColdStartProposalDraft[] {
  const primaryCompetitor = ctx.competitors[0];
  const competitorLabel = primaryCompetitor
    ? (primaryCompetitor.name ?? primaryCompetitor.domain)
    : null;
  const industryLabel = ctx.industry ?? 'your industry';

  const proposals: ColdStartProposalDraft[] = [];

  // PR pillar — grounded in competitor presence
  if (competitorLabel) {
    proposals.push({
      title: `Position against ${competitorLabel} in top-tier trade press`,
      rationale: `${competitorLabel} is one of the primary voices in ${industryLabel}, which means every earned mention they get is a mention we don't. Building a differentiated pitch angle now (before we have a citation footprint) is easier than reclaiming share of voice later.`,
      suggested_action: `Identify 2–3 target publications in ${industryLabel} that have covered ${competitorLabel} in the last 90 days and draft a differentiated pitch angle for one this week.`,
      pillar: 'PR',
      priority: 'high',
      confidence: 0.55,
      evi_impact_estimate: 12,
      grounded_in: `competitor: ${primaryCompetitor?.domain ?? competitorLabel}`,
    });
  } else {
    proposals.push({
      title: `Establish first earned-media beachhead in ${industryLabel}`,
      rationale: `We have no competitor context on file yet, so PR strategy has to lean on category positioning. Getting one strong published mention early is worth more than five later — it establishes the citation record.`,
      suggested_action: `Add 2–3 competitors under Settings → Competitors so SAGE can generate targeted PR angles. In the meantime, pitch one ${industryLabel} publication this week with a positioning story.`,
      pillar: 'PR',
      priority: 'medium',
      confidence: 0.5,
      evi_impact_estimate: 8,
      grounded_in: `industry: ${industryLabel}`,
    });
  }

  // Content pillar — grounded in the competitor comparison space
  if (competitorLabel) {
    proposals.push({
      title: `Publish "${ctx.org_name} vs ${competitorLabel}" comparison content`,
      rationale: `Comparison queries are among the highest-intent traffic in ${industryLabel} — buyers who search for "${ctx.org_name} vs ${competitorLabel}" are already in evaluation. Owning our side of that comparison prevents ${competitorLabel} from framing it.`,
      suggested_action: `Publish an honest side-by-side comparison page focused on the 3–4 areas where we differ meaningfully from ${competitorLabel}. Include structured data so AI engines can cite it.`,
      pillar: 'Content',
      priority: 'high',
      confidence: 0.6,
      evi_impact_estimate: 15,
      grounded_in: `competitor: ${primaryCompetitor?.domain ?? competitorLabel}`,
    });
  } else {
    proposals.push({
      title: `Publish a foundational category primer for ${industryLabel}`,
      rationale: `Without content on file, we have no authority signal for AI engines to cite. A category-level primer that clearly defines our positioning gives every future mention a canonical reference point.`,
      suggested_action: `Publish one long-form category piece this month at ${ctx.org_name}'s primary domain, structured with clear FAQ-style headers so AI engines can pull answers.`,
      pillar: 'Content',
      priority: 'medium',
      confidence: 0.55,
      evi_impact_estimate: 10,
      grounded_in: `industry: ${industryLabel}`,
    });
  }

  // SEO pillar — grounded in the fact that GSC isn't connected yet
  proposals.push({
    title: `Connect Google Search Console to unlock SEO signals`,
    rationale: `We can't produce SEO-driven proposals until we can see which keywords we're ranking for and where. GSC connection takes 5 minutes and lets SAGE start scoring position drops, opportunity keywords, and content gaps within a day.`,
    suggested_action: `Go to Settings → Integrations → Google Search Console and authorize the connection. First SEO proposals will appear within 24 hours.`,
    pillar: 'SEO',
    priority: 'high',
    confidence: 0.7,
    evi_impact_estimate: 18,
    grounded_in: `missing_integration: gsc`,
  });

  return proposals;
}
