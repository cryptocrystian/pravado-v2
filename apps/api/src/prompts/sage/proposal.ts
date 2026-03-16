/**
 * SAGE Proposal Prompt Template (Sprint S-INT-03)
 *
 * Generates structured proposal prompts for the LLM.
 * Input: signal data + org context
 * Output: structured JSON { title, rationale, suggested_action }
 */

export interface ProposalPromptContext {
  signal_type: string;
  pillar: string;
  priority: string;
  signal_data: Record<string, unknown>;
  evi_impact_estimate: number;
  confidence: number;
  org_name: string;
}

export function buildProposalSystemPrompt(orgName: string): string {
  return `You are SAGE, the strategic intelligence engine for ${orgName} on the Pravado visibility platform.

Your role is to analyze signals from PR, Content, and SEO data and generate actionable proposals.

Rules:
- Be specific and actionable — never vague
- Reference concrete data from the signal (names, numbers, dates)
- Keep the title under 80 characters
- Keep the rationale to 2-3 sentences explaining WHY this matters
- Keep the suggested_action to 1 sentence describing the exact next step
- Use the brand's perspective (first person plural: "we", "our")

You MUST respond with valid JSON matching this exact schema:
{
  "title": "string — concise action title",
  "rationale": "string — 2-3 sentences explaining why this signal matters and the opportunity cost of inaction",
  "suggested_action": "string — 1 sentence describing the specific next step"
}`;
}

export function buildProposalUserPrompt(ctx: ProposalPromptContext): string {
  return `Generate a SAGE proposal for this signal.

Signal Type: ${ctx.signal_type}
Pillar: ${ctx.pillar}
Priority: ${ctx.priority}
EVI Impact Estimate: ${ctx.evi_impact_estimate} points
Confidence: ${Math.round(ctx.confidence * 100)}%

Signal Data:
${JSON.stringify(ctx.signal_data, null, 2)}

Organization: ${ctx.org_name}

Respond with a JSON object containing title, rationale, and suggested_action.`;
}

/**
 * Generate a deterministic stub proposal when LLM is unavailable.
 * Uses signal data to produce a reasonable-looking proposal.
 */
export function generateStubProposal(ctx: ProposalPromptContext): {
  title: string;
  rationale: string;
  suggested_action: string;
} {
  const templates: Record<string, { title: string; rationale: string; action: string }> = {
    pr_stale_followup: {
      title: `Follow up on unanswered pitch (${ctx.signal_data.days_since_sent ?? '?'} days)`,
      rationale: `A pitch sent ${ctx.signal_data.days_since_sent ?? 'several'} days ago has not received a reply. Following up within the first week significantly increases response rates. Letting this slip risks losing the journalist's attention window.`,
      action: 'Send a concise follow-up email referencing the original pitch angle.',
    },
    pr_high_value_unpitched: {
      title: `Pitch high-engagement journalist (score: ${ctx.signal_data.engagement_score ?? '?'})`,
      rationale: `This journalist has a high engagement score of ${ctx.signal_data.engagement_score ?? 'N/A'} but has never been pitched by ${ctx.org_name}. High-engagement journalists are more likely to cover stories and amplify brand visibility.`,
      action: 'Research their recent coverage and craft a personalized pitch aligned with their beat.',
    },
    pr_pitch_window: {
      title: `Pitch window: positive relationship event detected`,
      rationale: `A recent ${ctx.signal_data.event_type ?? 'relationship'} event with positive sentiment creates a natural opening for outreach. Timing pitches around positive interactions increases success probability.`,
      action: 'Send a warm outreach referencing the recent interaction.',
    },
    content_stale_draft: {
      title: `Revive stale draft: "${(ctx.signal_data.title as string)?.substring(0, 40) ?? 'Untitled'}..."`,
      rationale: `This draft has been idle for ${ctx.signal_data.days_stale ?? '14+'} days. Stale drafts represent wasted effort and missed publishing opportunities that could improve authority scores.`,
      action: 'Review the draft and either complete it or archive it to keep the content pipeline clean.',
    },
    content_low_quality: {
      title: `Improve low-quality published content (score: ${ctx.signal_data.quality_score ?? '?'})`,
      rationale: `Published content with a quality score of ${ctx.signal_data.quality_score ?? '<50'} is hurting authority metrics. Low-quality published pages reduce overall domain authority and are less likely to be cited by AI models.`,
      action: 'Review and update the content to improve quality score above 60.',
    },
    content_coverage_gap: {
      title: `Fill content gap: "${ctx.signal_data.topic_name ?? 'Unknown topic'}"`,
      rationale: `The topic "${ctx.signal_data.topic_name ?? 'Unknown'}" exists in our taxonomy but has no published content. Content gaps represent missed authority-building opportunities.`,
      action: 'Create and publish authoritative content for this topic.',
    },
    seo_position_drop: {
      title: `Recover ranking: "${(ctx.signal_data.keyword as string)?.substring(0, 30) ?? '?'}" dropped ${ctx.signal_data.position_gap ?? '?'} positions`,
      rationale: `The keyword "${ctx.signal_data.keyword ?? 'Unknown'}" has dropped from target position, creating a gap of ${ctx.signal_data.position_gap ?? '?'} positions. Each position lost represents declining visibility and traffic.`,
      action: 'Analyze competitor content for this keyword and update our page with fresher, more comprehensive content.',
    },
    seo_opportunity_keyword: {
      title: `SEO opportunity: "${(ctx.signal_data.keyword as string)?.substring(0, 30) ?? '?'}" (${ctx.signal_data.search_volume ?? '?'} vol)`,
      rationale: `High-volume keyword "${ctx.signal_data.keyword ?? 'Unknown'}" with ${ctx.signal_data.search_volume ?? 'high'} monthly searches has our page ranking at position ${ctx.signal_data.current_position ?? '20+'}. Significant traffic opportunity exists.`,
      action: 'Create targeted content or optimize existing page to capture this search volume.',
    },
    seo_content_gap: {
      title: `Create content for target keyword: "${(ctx.signal_data.keyword as string)?.substring(0, 30) ?? '?'}"`,
      rationale: `Keyword "${ctx.signal_data.keyword ?? 'Unknown'}" has a target position in the top 10 but no matching content exists. This gap prevents us from ranking for a strategically important term.`,
      action: 'Create a dedicated page targeting this keyword with comprehensive, authoritative content.',
    },
    content_low_citemind: {
      title: `Low CiteMind score blocks publish (score: ${ctx.signal_data.score ?? '?'})`,
      rationale: `Content scored ${ctx.signal_data.score ?? 'below threshold'}/100 on CiteMind analysis, which means AI engines are unlikely to cite it. Publishing low-scoring content reduces overall brand authority in AI-generated answers.`,
      action: 'Review CiteMind recommendations and improve the content before publishing.',
    },
    content_low_citation_rate: {
      title: `AI engines citing brand in only ${((ctx.signal_data.mention_rate as number ?? 0) * 100).toFixed(1)}% of queries`,
      rationale: `Out of ${ctx.signal_data.total_queries ?? '?'} relevant AI queries, ${ctx.org_name} was mentioned only ${ctx.signal_data.total_mentions ?? 0} times. Low citation rates indicate the brand lacks structured, authoritative content that AI models rely on for answers.`,
      action: 'Improve entity markup, add structured data, and ensure content directly answers common queries in the topic space.',
    },
    competitor_citation_gap: {
      title: `${ctx.signal_data.engine ?? 'AI engine'} cites competitors but not ${ctx.org_name}`,
      rationale: `${ctx.signal_data.engine ?? 'An AI engine'} responded to ${ctx.signal_data.queries_without_mention ?? '?'} relevant queries without mentioning ${ctx.org_name}. Competitors are being cited in these answers instead, which means the brand is losing mindshare in AI-generated results.`,
      action: `Analyze what competitors are doing differently in content structure and create targeted content optimized for AI citation on this engine.`,
    },
  };

  const template = templates[ctx.signal_type] || {
    title: `${ctx.pillar} opportunity detected (${ctx.priority} priority)`,
    rationale: `A ${ctx.priority}-priority signal was detected in the ${ctx.pillar} pillar with an estimated EVI impact of ${ctx.evi_impact_estimate} points. Review the signal data for details.`,
    action: `Review the ${ctx.pillar} signal and take appropriate action.`,
  };

  return {
    title: template.title,
    rationale: template.rationale,
    suggested_action: template.action,
  };
}
