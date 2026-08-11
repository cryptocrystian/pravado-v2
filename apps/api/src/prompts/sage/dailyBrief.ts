/**
 * SAGE Daily Brief Prompt Template (D039 — SAGE_DAILY_BRIEF.md)
 *
 * Renders the REAL gathered signals (§2 inputs) into a 2–4 sentence org-level
 * cross-pillar narrative. The prompt is deliberately constrained: the model may
 * ONLY summarize the structured facts it is given — it must not introduce facts,
 * numbers, or trends that are not present in the input (canon §4.1 grounded-only).
 *
 * The deterministic stub (`buildStubBrief`) is the honest fallback: it assembles
 * the SAME real signals into a template. Both paths consume only real rows.
 */

/** A single prioritized proposal summarized in the brief. */
export interface BriefProposalInput {
  id: string;
  title: string;
  pillar: string;
  priority: string;
  evi_impact_estimate: number | null;
}

/** The single surfaced top action (the action-stream lead item). */
export interface BriefTopAction {
  proposal_id: string;
  title: string;
  pillar: string;
  priority: string;
  deep_link: { href: string; label: string } | null;
}

/** EVI current-vs-prior delta (evi_snapshots). */
export interface BriefEviDelta {
  current_snapshot_id: string;
  prior_snapshot_id: string | null;
  current_score: number;
  prior_score: number | null;
  /** current_score - prior_score, or null when there is no prior snapshot. */
  delta: number | null;
}

/** Citation movement (citation_summaries). */
export interface BriefCitationMovement {
  summary_id: string;
  mention_rate: number | null;
  total_mentions: number;
  total_queries: number;
}

/** The fully-gathered, real-only inputs for one org's brief. */
export interface BriefInputs {
  org_name: string;
  proposals: BriefProposalInput[];
  top_action: BriefTopAction | null;
  evi_delta: BriefEviDelta | null;
  citation: BriefCitationMovement | null;
}

export function buildBriefSystemPrompt(orgName: string): string {
  return `You are SAGE, the strategic intelligence engine for ${orgName} on the Pravado visibility platform.

You write the DAILY BRIEF: a 2-4 sentence, org-level, cross-pillar orientation answering "what changed, what's emerging, and the single highest-leverage move today" across PR, Content, and SEO.

CRITICAL HONESTY RULES:
- You may ONLY summarize the structured signals provided in the user message.
- NEVER invent facts, numbers, percentages, dates, or trends that are not present in the provided data.
- If a number is not in the data, do not state a number.
- Write in the brand's voice (first person plural: "we", "our"). Be concise and concrete.
- 2-4 sentences total. No preamble, no headings.

You MUST respond with valid JSON matching this exact schema:
{
  "brief_text": "string — the 2-4 sentence daily brief, grounded only in the provided signals"
}`;
}

export function buildBriefUserPrompt(inputs: BriefInputs): string {
  // Only real, gathered facts are serialized. The model sees nothing else.
  const facts = {
    organization: inputs.org_name,
    prioritized_opportunities: inputs.proposals.map((p) => ({
      title: p.title,
      pillar: p.pillar,
      priority: p.priority,
      evi_impact_estimate: p.evi_impact_estimate,
    })),
    top_action_today: inputs.top_action
      ? {
          title: inputs.top_action.title,
          pillar: inputs.top_action.pillar,
          priority: inputs.top_action.priority,
        }
      : null,
    evi_movement: inputs.evi_delta
      ? {
          current_score: inputs.evi_delta.current_score,
          prior_score: inputs.evi_delta.prior_score,
          delta: inputs.evi_delta.delta,
        }
      : null,
    citation_movement: inputs.citation
      ? {
          mention_rate: inputs.citation.mention_rate,
          total_mentions: inputs.citation.total_mentions,
          total_queries: inputs.citation.total_queries,
        }
      : null,
  };

  return `Write today's SAGE daily brief for ${inputs.org_name}, grounded ONLY in these real signals. Do not introduce any fact or number not present below.

Signals:
${JSON.stringify(facts, null, 2)}

Respond with a JSON object containing a single "brief_text" field (2-4 sentences).`;
}

/**
 * Deterministic, GROUNDED stub brief (canon §4.2 fallback). Assembled purely
 * from the real gathered inputs — it contains no value that is not present in
 * `inputs`. This is the honest fallback when the LLM is unavailable, the monthly
 * token budget is exceeded, or the LLM response fails to parse.
 *
 * Pure function — no I/O — so it is directly unit-testable for grounding.
 */
export function buildStubBrief(inputs: BriefInputs): {
  brief_text: string;
  top_action: BriefTopAction | null;
} {
  const parts: string[] = [];

  // 1. Opportunity/proposal sentence (only when proposals exist).
  if (inputs.proposals.length > 0) {
    const count = inputs.proposals.length;
    const pillars = Array.from(
      new Set(inputs.proposals.map((p) => p.pillar))
    ).join(', ');
    const noun = count === 1 ? 'opportunity' : 'opportunities';
    parts.push(
      `${inputs.org_name} has ${count} active ${noun} across ${pillars}.`
    );
  }

  // 2. EVI movement sentence (only when a snapshot exists).
  if (inputs.evi_delta) {
    const cur = inputs.evi_delta.current_score.toFixed(1);
    if (
      inputs.evi_delta.delta !== null &&
      inputs.evi_delta.prior_score !== null
    ) {
      const d = inputs.evi_delta.delta;
      const dir = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
      const mag = Math.abs(d).toFixed(1);
      parts.push(
        d === 0 ? `EVI is flat at ${cur}.` : `EVI is ${dir} ${mag} to ${cur}.`
      );
    } else {
      parts.push(`EVI is at ${cur}.`);
    }
  }

  // 3. Citation movement sentence (only when a summary exists).
  if (inputs.citation && inputs.citation.mention_rate !== null) {
    const rate = (inputs.citation.mention_rate * 100).toFixed(1);
    parts.push(
      `AI engines cited us in ${rate}% of ${inputs.citation.total_queries} tracked queries.`
    );
  }

  // 4. Top action sentence (only when one exists).
  if (inputs.top_action) {
    parts.push(`Top move today: ${inputs.top_action.title}.`);
  }

  return {
    brief_text: parts.join(' '),
    top_action: inputs.top_action,
  };
}

/**
 * Parse the LLM completion into a brief. Strict: returns null on any parse
 * failure or missing/empty `brief_text` so the caller falls back to the
 * grounded stub (canon §4.2 "parse failure" trigger). Never fabricates.
 */
export function parseBriefResponse(
  completion: string
): { brief_text: string } | null {
  try {
    const jsonMatch = completion.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { brief_text?: unknown };
    if (typeof parsed.brief_text !== 'string') return null;
    const text = parsed.brief_text.trim();
    if (!text) return null;
    return { brief_text: text };
  } catch {
    return null;
  }
}
