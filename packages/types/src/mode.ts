/**
 * PR-1 Keystone — Automation mode types (shared across api + dashboard).
 *
 * Canon: mode is a PER-PILLAR policy (PRODUCT_CONSTITUTION §, AUTOMATION_MODES_UX,
 * MODE_UX_ARCHITECTURE §2A/§3). It is NOT a single platform-wide toggle. Each of
 * the three product pillars (PR / Content / SEO) carries its own current mode,
 * governed by a floor/ceiling (MODE_UX_ARCHITECTURE §2A). Floor/ceiling/lockedByAdmin
 * are wired through the read path here; server-side ENFORCEMENT lands in PR-4.
 *
 * This module is the single source of truth for the `AutomationMode` union —
 * historically it was re-declared 5–6 times across the dashboard.
 */

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

/** The three product pillars that carry a per-pillar mode. */
export type ModePillar = 'pr' | 'content' | 'seo';

/**
 * Where a pillar's effective mode came from:
 * - `user`         — an explicit user_mode_preferences row
 * - `plan_default` — derived from the org's plan tier (D026)
 * - `fallback`     — safe default (`copilot`) when no plan/preference resolves
 */
export type ModeSource = 'user' | 'plan_default' | 'fallback';

/** Effective mode + governance envelope for a single pillar. */
export interface PillarModeState {
  mode: AutomationMode;
  source: ModeSource;
  /** Minimum allowed mode (admin policy). Default `manual`. Enforced in PR-4. */
  floor: AutomationMode;
  /** Maximum allowed mode (admin/plan policy). Enforced in PR-4. */
  ceiling: AutomationMode;
  /** True when floor === ceiling (pillar locked to a single mode). */
  lockedByAdmin: boolean;
}

/** Full per-org mode state: one PillarModeState per product pillar. */
export interface OrgModeState {
  pillars: Record<ModePillar, PillarModeState>;
}

/** PATCH /orgs/:orgId/mode request body. */
export interface SetPillarModeRequest {
  pillar: ModePillar;
  mode: AutomationMode;
}

/** Canonical ordering (least → most autonomous). Used for floor/ceiling clamps. */
export const MODE_ORDER: readonly AutomationMode[] = [
  'manual',
  'copilot',
  'autopilot',
];

export const MODE_PILLARS: readonly ModePillar[] = ['pr', 'content', 'seo'];

/** Numeric rank for clamp math. */
export function modeRank(mode: AutomationMode): number {
  return MODE_ORDER.indexOf(mode);
}

/** Clamp a mode into the inclusive [floor, ceiling] window (nearest valid). */
export function clampMode(
  mode: AutomationMode,
  floor: AutomationMode,
  ceiling: AutomationMode
): AutomationMode {
  const r = modeRank(mode);
  if (r < modeRank(floor)) return floor;
  if (r > modeRank(ceiling)) return ceiling;
  return mode;
}
