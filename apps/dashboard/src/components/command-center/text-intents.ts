/**
 * Command Center Text Intents
 *
 * Semantic text styling helpers that enforce DS v3 typography + contrast rules.
 * Use these helpers instead of ad-hoc text classes to prevent dark-on-dark issues.
 *
 * INTENT-BASED NAMING:
 * - title: Primary headings, card titles
 * - body: Main content text
 * - muted: Secondary/supporting text
 * - micro: Badges, timestamps, auxiliary info
 *
 * CONTRAST RULES (enforced by CI):
 * - Primary text: min white/70 (for title, body)
 * - Secondary text: min white/50 (for muted)
 * - Micro text: min white/35 (for timestamps only)
 * - NO text-slate-*, text-gray-*, text-neutral-* allowed
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see apps/dashboard/scripts/check-command-center-contrast.mjs
 */

// ============================================
// TITLE INTENTS (High Prominence)
// ============================================

/** Primary title - card headings, section titles */
export const titlePrimary = 'text-sm font-semibold text-white/90';

/** Secondary title - drawer titles, modal headers */
export const titleSecondary = 'text-base font-semibold text-white/95';

/** Large title - page headings, hero content */
export const titleLarge = 'text-lg font-bold text-white';

/** Compact title - inline titles, tight spaces */
export const titleCompact = 'text-xs font-semibold text-white/90';

// ============================================
// BODY INTENTS (Standard Readability)
// ============================================

/** Primary body - main content paragraphs */
export const bodyPrimary = 'text-sm text-white/85';

/** Secondary body - supporting paragraphs, descriptions */
export const bodySecondary = 'text-xs text-white/70';

/** Summary body - truncated summaries, previews */
export const bodySummary = 'text-xs text-white/60';

// ============================================
// MUTED INTENTS (Lower Prominence)
// ============================================

/** Muted text - secondary labels, helper text */
export const mutedPrimary = 'text-xs text-white/55';

/** Muted secondary - tertiary content, hints */
export const mutedSecondary = 'text-xs text-white/50';

/** Muted caption - descriptions under headings */
export const mutedCaption = 'text-xs text-white/45';

// ============================================
// MICRO INTENTS (Minimal Footprint)
// ============================================

/** Micro text - timestamps, badge counts, auxiliary */
export const microText = 'text-[11px] text-white/55'; // typography-allow: micro

/** Micro label - inline labels, compact badges */
export const microLabel = 'text-[11px] font-medium text-white/50'; // typography-allow: micro

/** Micro muted - least prominent, hover hints */
export const microMuted = 'text-[11px] text-white/40'; // typography-allow: micro

// ============================================
// BADGE INTENTS (Colored Labels)
// ============================================

/** Badge text base - for pillar/status badges */
export const badgeBase = 'text-[11px] font-bold uppercase'; // typography-allow: badge

/** Badge text semibold - for medium emphasis badges */
export const badgeMedium = 'text-[11px] font-semibold uppercase'; // typography-allow: badge

// ============================================
// SEMANTIC INTENTS (Status-Based)
// ============================================

/** Error text - error messages, failures */
export const errorText = 'text-xs font-medium text-semantic-danger';

/** Warning text - warnings, cautions */
export const warningText = 'text-xs font-medium text-semantic-warning';

/** Success text - success messages, confirmations */
export const successText = 'text-xs font-medium text-semantic-success';

/** Info text - informational, hints */
export const infoText = 'text-xs text-brand-cyan';

// ============================================
// INTERACTIVE INTENTS (Clickable Elements)
// ============================================

/** Link text - inline links, navigation */
export const linkText = 'text-xs font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors cursor-pointer';

/** Button text primary - main action buttons */
export const buttonPrimary = 'text-sm font-semibold';

/** Button text secondary - secondary action buttons */
export const buttonSecondary = 'text-xs font-medium';

/** Tab text - filter tabs, navigation tabs */
export const tabText = 'text-[11px] font-semibold uppercase tracking-wide'; // typography-allow: tab

// ============================================
// METRIC INTENTS (Numbers & Values)
// ============================================

/** Metric value - large numbers, scores */
export const metricValue = 'text-sm font-bold text-white/90';

/** Metric value large - hero metrics */
export const metricValueLarge = 'text-lg font-bold text-white';

/** Metric label - labels for metrics */
export const metricLabel = 'text-[11px] text-white/55'; // typography-allow: metric

/** Metric delta - change indicators */
export const metricDelta = 'text-[11px] font-bold'; // typography-allow: metric

// ============================================
// SECTION INTENTS (Organizational)
// ============================================

/** Section header - uppercase section labels */
export const sectionHeader = 'text-xs font-semibold text-white/55 uppercase tracking-wide';

/** Section header small - compact section labels */
export const sectionHeaderSm = 'text-[11px] font-semibold text-white/50 uppercase tracking-wide'; // typography-allow: section

/** Divider label - text in dividers */
export const dividerLabel = 'text-xs text-white/35 uppercase tracking-wider';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Combines multiple text intent classes safely
 * @param intents - Text intent class strings to combine
 * @returns Combined class string
 */
export function combineIntents(...intents: (string | undefined | false | null)[]): string {
  return intents.filter(Boolean).join(' ');
}

/**
 * Gets pillar-colored text class
 * @param pillar - Pillar type ('pr' | 'content' | 'seo')
 * @returns Text color class for the pillar
 */
export function pillarText(pillar: 'pr' | 'content' | 'seo'): string {
  const colors = {
    pr: 'text-brand-magenta',
    content: 'text-brand-iris',
    seo: 'text-brand-cyan',
  };
  return colors[pillar];
}

/**
 * Gets priority-colored text class
 * @param priority - Priority level
 * @returns Text color class for the priority
 */
export function priorityText(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const colors = {
    critical: 'text-semantic-danger',
    high: 'text-semantic-warning',
    medium: 'text-brand-cyan',
    low: 'text-white/60',
  };
  return colors[priority];
}
