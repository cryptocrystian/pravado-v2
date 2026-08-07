/**
 * PR pitch composer (Wave-2) — turns journalist context + org brand + the SAGE
 * signal into a PERSONALIZED pitch `{subject, body}` the `pr.send_pitch` executor
 * can hand to the governed send chokepoint (`sendGuardedEmail`).
 *
 * WHY THIS EXISTS: a `pr.send_pitch` proposal usually carries a journalist + a
 * signal/title but NO pitch body. Without a body the executor self-refuses
 * (`needs_content`) and nothing is sent. This composer produces the missing body
 * — grounded in the journalist's beat/outlet/recent work so it clears the
 * server-side personalization gate (PR_PILLAR_MODEL.md:135-136 — block < 40,
 * warn < 60; PR_WORK_SURFACE_CONTRACT §7.1/§7.2).
 *
 * GOVERNANCE POSTURE (read before extending):
 *   - The composer NEVER sends. It only drafts. Every send still goes EXCLUSIVELY
 *     through `sendGuardedEmail` (the chokepoint enforces suppression, eligibility,
 *     caps, and re-computes the personalization score from the ACTUAL body). A
 *     composed pitch that reads generic is refused there — not force-sent.
 *   - HONEST DEGRADE: if the LLM is unavailable / errors / returns unusable output
 *     we return `null` (a compose FAILURE) rather than fabricating a body or
 *     shipping the router's generic stub text. The executor maps `null` → `failure`.
 *     We do NOT paper over an LLM outage with a mail-merge template that would only
 *     fail the personalization gate anyway.
 *   - COST CONTROL: Haiku-tier model (env `LLM_PITCH_MODEL`), bounded output tokens.
 *
 * IMPORTANT (brand + CAN-SPAM): composing-then-sending is only safe today because
 * prod egress is a STUB (EMAIL_PROVIDER unset). A human-review-of-the-composed-pitch
 * step is REQUIRED before SendGrid is ever provisioned — do NOT wire autonomous
 * real sending of LLM-authored copy.
 */

import type { LlmRequest, LlmResponse } from '@pravado/types';
import { LlmRouter } from '@pravado/utils';

/** Journalist/contact context used to ground the pitch (the personalization signals). */
export interface PitchJournalistContext {
  name: string | null;
  outlet: string | null;
  /** Beats / topic tags the contact covers. */
  beats: string[];
  /** A specific recent-work hook (headline/angle), when known. */
  recentWorkHook?: string | null;
}

/** Minimal org brand context — sender identity for the pitch. */
export interface PitchBrandContext {
  name?: string | null;
  /** One-line description of what the org does, if available. */
  description?: string | null;
}

/** The SAGE signal that motivated the pitch (from the proposal title/params). */
export interface PitchSignal {
  title: string;
  summary?: string | null;
  angle?: string | null;
}

export interface ComposePitchInput {
  journalist: PitchJournalistContext;
  brand: PitchBrandContext;
  signal: PitchSignal;
  /** Org id for LLM usage-ledger attribution (best effort). */
  orgId?: string;
  /** True for a follow-up — shortens + softens the ask. */
  isFollowUp?: boolean;
}

export interface ComposedPitch {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  /** Recent-work hook actually referenced, surfaced back for the personalization context. */
  recentWorkHook: string | null;
  /** The model that produced the pitch (for audit/detail). */
  model: string;
}

/** Injectable LLM seam so the composer is unit-testable without a network call. */
export interface PitchComposerDeps {
  generate?: (request: LlmRequest) => Promise<LlmResponse>;
}

/** Bounded output — a pitch is ~150-250 words; keep the completion cheap. */
const PITCH_MAX_TOKENS = 700;
const PITCH_TEMPERATURE = 0.6;

/**
 * Haiku-tier model for cost control. Env-driven so an ops change lands without a
 * code deploy; the router still safe-falls-back if the provider/key is absent.
 */
function pitchModel(): string | undefined {
  return process.env.LLM_PITCH_MODEL || undefined;
}

function defaultGenerate(
  orgId?: string
): (r: LlmRequest) => Promise<LlmResponse> {
  const router = LlmRouter.fromEnv(process.env as Record<string, unknown>);
  return (request) => router.generate({ ...request, orgId });
}

const SYSTEM_PROMPT = [
  'You are an expert PR pitch writer. You write concise, genuinely personalized',
  'media pitches that reference the journalist by name, name their outlet, and',
  'speak directly to the beat they cover and their recent work. You never use',
  'generic greetings ("Dear Journalist", "To whom it may concern") and never',
  'leave placeholder/merge tokens. Keep the pitch 130-220 words, one clear hook,',
  'one clear ask. Return ONLY valid JSON — no prose, no markdown fences — of the',
  'exact shape: {"subject": string, "body": string}. The subject is <= 70 chars',
  'and personalized. The body is plain text (no HTML), addressed to the journalist',
  'by first name, referencing their outlet and beat.',
].join(' ');

function buildUserPrompt(input: ComposePitchInput): string {
  const j = input.journalist;
  const parts: string[] = [];
  parts.push('## Journalist');
  parts.push(`Name: ${j.name ?? 'Unknown'}`);
  parts.push(`Outlet: ${j.outlet ?? 'Unknown'}`);
  parts.push(`Beats: ${j.beats.length ? j.beats.join(', ') : 'Unknown'}`);
  if (j.recentWorkHook) parts.push(`Recent work: ${j.recentWorkHook}`);

  parts.push('\n## Sender / brand');
  parts.push(`Company: ${input.brand.name ?? 'Our company'}`);
  if (input.brand.description) parts.push(`About: ${input.brand.description}`);

  parts.push('\n## Story signal');
  parts.push(`Headline/angle: ${input.signal.title}`);
  if (input.signal.summary) parts.push(`Summary: ${input.signal.summary}`);
  if (input.signal.angle) parts.push(`Angle: ${input.signal.angle}`);

  parts.push('\n## Task');
  parts.push(
    input.isFollowUp
      ? 'Write a SHORT, polite follow-up pitch (under 120 words) that references the same story and adds one new reason it matters to this journalist. Reference their name, outlet, and beat.'
      : 'Write the pitch. Reference the journalist by first name, name their outlet, tie the story to their beat (and recent work if given), give one crisp hook and one clear ask.'
  );
  parts.push('Return ONLY the JSON object described in the system prompt.');
  return parts.join('\n');
}

/** Pull the first balanced JSON object out of a completion (tolerates fences/prose). */
function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return null;
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

/**
 * Compose a personalized pitch. Returns `null` on any honest failure (LLM
 * unavailable / fell back to stub / unusable output) — the caller treats that as
 * a compose FAILURE and sends nothing. Never throws for an LLM issue.
 */
export async function composePitch(
  input: ComposePitchInput,
  deps: PitchComposerDeps = {}
): Promise<ComposedPitch | null> {
  const generate = deps.generate ?? defaultGenerate(input.orgId);

  let response: LlmResponse;
  try {
    response = await generate({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(input),
      temperature: PITCH_TEMPERATURE,
      maxTokens: PITCH_MAX_TOKENS,
      model: pitchModel(),
      orgId: input.orgId,
    });
  } catch {
    // Router already safe-degrades internally; a throw here is a hard failure.
    return null;
  }

  // HONEST DEGRADE: a real provider call that fell back to the deterministic stub
  // (missing key / timeout / provider error) cannot produce a genuine personalized
  // pitch. Do NOT ship generic stub text — signal a compose failure instead.
  if (response.fallback || response.provider === 'stub') return null;

  const jsonText = extractJsonObject(response.completion ?? '');
  if (!jsonText) return null;

  let parsed: { subject?: unknown; body?: unknown };
  try {
    parsed = JSON.parse(jsonText) as { subject?: unknown; body?: unknown };
  } catch {
    return null;
  }

  const subject =
    typeof parsed.subject === 'string' ? parsed.subject.trim() : '';
  const bodyText = typeof parsed.body === 'string' ? parsed.body.trim() : '';
  if (!subject || !bodyText) return null;

  return {
    subject,
    bodyHtml: textToHtml(bodyText),
    bodyText,
    recentWorkHook: input.journalist.recentWorkHook ?? null,
    model: response.model,
  };
}
