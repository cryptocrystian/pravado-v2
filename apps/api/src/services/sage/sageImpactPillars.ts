/**
 * SAGE proposal cross-pillar attribution — `impact_pillars` derivation.
 *
 * Canon (SAGE_v2 Outputs): every proposal MUST carry `impact_pillars` (string[]) —
 * all pillars impacted beyond the primary pillar, "required for cross-pillar
 * attribution in Analytics and Entity Map progressive disclosure."
 *
 * This slice ships a CONSERVATIVE, deterministic derivation seeded by the canonical
 * cross-pillar reinforcement directions (SAGE_OPERATING_MODEL reinforcement matrix:
 * PR→Content, Content→SEO, SEO→AEO via CiteMind). The weighted coefficient matrix
 * and decay-driven live attribution are a LATER slice; here we only need the SET of
 * impacted pillars so attribution is present and non-empty. The primary pillar is
 * always included and always first.
 *
 * Pure function — no I/O — so it is trivially unit-testable and safe to call in the
 * proposal generation hot path.
 */

export type PrimaryPillar = 'PR' | 'Content' | 'SEO';

/**
 * Canonical secondary reinforcement targets per primary pillar. Directional and
 * conservative: only well-established, canon-backed reinforcement edges are
 * included. 'AEO' is surfaced as a distinct downstream surface of SEO/Content per
 * the SAGE_v2 example (`["SEO", "AEO"]`).
 */
const REINFORCEMENT_TARGETS: Record<PrimaryPillar, readonly string[]> = {
  // PR coverage reinforces owned Content narrative (matrix PR→Content).
  PR: ['Content'],
  // Content authority reinforces SEO ranking and AEO answer inclusion.
  Content: ['SEO', 'AEO'],
  // SEO ingestibility reinforces AEO (AI answer) visibility via CiteMind.
  SEO: ['AEO'],
};

/**
 * Signal types whose action is intrinsically CiteMind/AEO-facing, regardless of
 * originating pillar (e.g. citation gaps, share-of-model). These add 'AEO' as an
 * impacted pillar even when the primary is PR.
 */
const AEO_SIGNAL_MARKERS: readonly string[] = [
  'citation',
  'share_of_model',
  'aeo',
  'answer',
  'entity_sentiment',
];

/**
 * Derive `impact_pillars` for a proposal from its primary pillar + signal type.
 * Always returns a de-duplicated array with the primary pillar first and at least
 * one element (the primary). Order is stable: primary, then reinforcement targets,
 * then signal-driven AEO.
 */
export function deriveImpactPillars(
  primaryPillar: string,
  signalType: string
): string[] {
  const primary = primaryPillar as PrimaryPillar;
  const result: string[] = [primaryPillar];

  const targets = REINFORCEMENT_TARGETS[primary] ?? [];
  for (const t of targets) {
    if (!result.includes(t)) result.push(t);
  }

  const st = (signalType || '').toLowerCase();
  if (
    AEO_SIGNAL_MARKERS.some((m) => st.includes(m)) &&
    !result.includes('AEO')
  ) {
    result.push('AEO');
  }

  return result;
}
