/**
 * SAGE Signal Decay (Wave-2 — SAGE mesh: signal DECAY).
 *
 * SAGE is a Foundational Model (Charter D033). Signal strength is not static: it
 * FADES continuously. Canon SAGE_OPERATING_MODEL §2.1 (line 71):
 *
 *   "Signal strength decays exponentially: `S(t) = S₀ × e^(-λt)` where λ varies by
 *    signal type"
 *
 * The per-category decay rates (λ) are canon-verbatim from the Signal Categories
 * table, SAGE_OPERATING_MODEL §2.1 (lines 76-82), corroborated by the Decay
 * Functions table §5.4 (lines 348-354):
 *
 *   | Category    | Decay Rate (λ) |  (SAGE_OPERATING_MODEL §2.1 L78-82)
 *   | ----------- | -------------- |
 *   | Crisis      | 0.5/hour       |
 *   | Opportunity | 0.1/day        |
 *   | Gap         | 0.02/week      |
 *   | Competitive | 0.05/day       |
 *   | Technical   | 0.01/day       |
 *
 * NO λ VALUE IS INVENTED. Every constant below is transcribed from canon and
 * normalised to a per-HOUR rate (the common unit we integrate against) by dividing
 * the canon rate by the number of hours in its stated period. The classification of
 * a concrete `signal_type` into one of the five canon categories follows canon's own
 * "Examples" + "Pillar Affinity" columns (§2.1) — the λ NUMBERS are canon; only the
 * type→category routing is engineering, and it is documented per row below.
 *
 * Pure functions, no I/O — trivially unit-testable and safe in the scorer hot path.
 */

export type SignalCategory =
  | 'Crisis'
  | 'Opportunity'
  | 'Gap'
  | 'Competitive'
  | 'Technical';

const HOURS_PER_DAY = 24;
const HOURS_PER_WEEK = 24 * 7;

/**
 * Canon decay rate λ per CATEGORY, normalised to per-HOUR. Canon rates
 * (SAGE_OPERATING_MODEL §2.1 L78-82) with their canon time unit shown alongside.
 */
export const DECAY_LAMBDA_PER_HOUR: Record<SignalCategory, number> = {
  // 0.5 / hour  (canon "Crisis" — immediate response window; half-life 1.4h §5.4 L350)
  Crisis: 0.5,
  // 0.1 / day   (canon "Opportunity" — window closes within a week; half-life 7d §5.4 L351)
  Opportunity: 0.1 / HOURS_PER_DAY,
  // 0.02 / week (canon "Gap" — content void / keyword opportunity, slow fade)
  Gap: 0.02 / HOURS_PER_WEEK,
  // 0.05 / day  (canon "Competitive" — competitor action / market shift)
  Competitive: 0.05 / HOURS_PER_DAY,
  // 0.01 / day  (canon "Technical" — crawl issue / ranking drop, slowest of the day-scale rates)
  Technical: 0.01 / HOURS_PER_DAY,
};

/**
 * Route a concrete `signal_type` (as emitted by the pillar ingestors) to a canon
 * Signal Category. The λ number then comes from DECAY_LAMBDA_PER_HOUR (canon). Each
 * mapping cites the canon "Examples"/"Pillar Affinity" cell it follows.
 */
export const SIGNAL_TYPE_TO_CATEGORY: Record<string, SignalCategory> = {
  // PR opportunities — canon Opportunity example "Journalist interest" (§2.1 L79).
  pr_high_value_unpitched: 'Opportunity',
  pr_pitch_window: 'Opportunity',
  pr_stale_followup: 'Opportunity',
  // Content — a stale draft is a time-boxed publish window → Opportunity (affinity
  // "PR, Content", §2.1 L79).
  content_stale_draft: 'Opportunity',
  // Content/SEO voids & keyword opportunities — canon Gap example "Content void,
  // keyword opportunity" (§2.1 L80, affinity "Content, SEO").
  content_coverage_gap: 'Gap',
  content_low_quality: 'Gap',
  seo_content_gap: 'Gap',
  seo_opportunity_keyword: 'Gap',
  // SEO ranking regression — canon Technical example "ranking drop" (§2.1 L82,
  // affinity "SEO").
  seo_position_drop: 'Technical',
};

/**
 * Default category for an unrecognised signal_type. Canon "Opportunity" (0.1/day) is
 * the moderate day-scale rate and the safest generic assumption for an actionable
 * visibility signal. Unknown types are routed here rather than inventing a new λ.
 */
export const DEFAULT_CATEGORY: SignalCategory = 'Opportunity';

/** Classify a signal_type into its canon Signal Category. */
export function classifySignalCategory(signalType: string): SignalCategory {
  const key = (signalType || '').toLowerCase();
  // Allow a bare canon category name to be used directly (future signal_types).
  if (key in DECAY_LAMBDA_PER_HOUR) {
    // e.g. 'crisis' -> 'Crisis'
    const cap = (key.charAt(0).toUpperCase() + key.slice(1)) as SignalCategory;
    if (cap in DECAY_LAMBDA_PER_HOUR) return cap;
  }
  return SIGNAL_TYPE_TO_CATEGORY[key] ?? DEFAULT_CATEGORY;
}

/** Age of a signal in hours, clamped to >= 0 (a future scored_at cannot pre-decay). */
export function computeAgeHours(
  scoredAt: string | number | Date,
  now: Date = new Date()
): number {
  const scoredMs = new Date(scoredAt).getTime();
  const ageMs = now.getTime() - scoredMs;
  if (!Number.isFinite(ageMs) || ageMs <= 0) return 0;
  return ageMs / 3_600_000; // ms → hours
}

/**
 * Continuous decay multiplier `e^(-λ · age)` in (0, 1] for a signal_type at a given
 * age. λ is the canon per-hour rate for the signal's category.
 */
export function decayFactor(signalType: string, ageHours: number): number {
  const lambda = DECAY_LAMBDA_PER_HOUR[classifySignalCategory(signalType)];
  const factor = Math.exp(-lambda * Math.max(0, ageHours));
  // Numerical guard: exp is always (0,1] for λ,age ≥ 0.
  return Math.min(1, Math.max(0, factor));
}

/**
 * Apply canon decay to a base signal strength S₀ → effective strength S(t).
 * `S(t) = S₀ × e^(-λ · age)` (SAGE_OPERATING_MODEL §2.1 L71).
 */
export function applyDecay(
  baseStrength: number,
  signalType: string,
  scoredAt: string | number | Date,
  now: Date = new Date()
): number {
  const ageHours = computeAgeHours(scoredAt, now);
  return baseStrength * decayFactor(signalType, ageHours);
}
