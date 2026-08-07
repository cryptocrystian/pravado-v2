/**
 * SAGE structured-action vocabulary (Wave-2 — SAGE proposals that ACT).
 *
 * The single TS source of truth for the per-pillar action vocabulary. MUST stay
 * in lockstep with the CHECK enum on `sage_proposals.action_type` (migration 108)
 * — a test asserts the two match so drift fails CI rather than silently at runtime.
 *
 * Only Content `create_brief` is IMPLEMENTED this slice (a concrete executor is
 * registered). The rest are DEFINED/reserved: the vocabulary is fixed so future
 * per-pillar executors register against a stable contract, but until an executor
 * is registered they degrade to the governed no-op (no fabricated effect).
 */

// Per-pillar vocabulary. Grouped for readability; the flat union below is the type.
export const SAGE_ACTION_TYPES = [
  // Content
  'content.create_brief',
  'content.generate_draft',
  'content.publish',
  // PR
  'pr.send_pitch',
  'pr.add_to_list',
  // SEO
  'seo.generate_schema',
] as const;

export type SageActionType = (typeof SAGE_ACTION_TYPES)[number];

/** Pillar → the vocabulary emitted for that pillar (mirrors the CHECK grouping). */
export const SAGE_ACTION_TYPES_BY_PILLAR: Record<
  'Content' | 'PR' | 'SEO',
  readonly SageActionType[]
> = {
  Content: [
    'content.create_brief',
    'content.generate_draft',
    'content.publish',
  ],
  PR: ['pr.send_pitch', 'pr.add_to_list'],
  SEO: ['seo.generate_schema'],
};

/**
 * Actions with a concrete executor registered in THIS slice. Everything else in
 * the vocabulary is reserved and degrades to the governed no-op. Keep in sync with
 * the executor registry (a test cross-checks it).
 */
export const IMPLEMENTED_ACTION_TYPES: readonly SageActionType[] = [
  'content.create_brief',
];

/**
 * Safe per-pillar default action_type used when a signal can't be mapped to a
 * more specific action. Mirrors the backfill in migration 108. Content defaults to
 * the one implemented action; PR/SEO default to their (reserved) primary action so
 * the dispatcher always has a concrete action_type to route on.
 */
export const DEFAULT_ACTION_BY_PILLAR: Record<
  'Content' | 'PR' | 'SEO',
  SageActionType
> = {
  Content: 'content.create_brief',
  PR: 'pr.send_pitch',
  SEO: 'seo.generate_schema',
};

export function isSageActionType(value: unknown): value is SageActionType {
  return (
    typeof value === 'string' &&
    (SAGE_ACTION_TYPES as readonly string[]).includes(value)
  );
}

/** Whether a concrete executor exists for this action in the current slice. */
export function isImplementedActionType(
  value: unknown
): value is SageActionType {
  return (
    isSageActionType(value) &&
    (IMPLEMENTED_ACTION_TYPES as readonly string[]).includes(value)
  );
}

export function defaultActionTypeForPillar(
  pillar: string
): SageActionType | null {
  if (pillar === 'Content' || pillar === 'PR' || pillar === 'SEO') {
    return DEFAULT_ACTION_BY_PILLAR[pillar];
  }
  return null;
}
