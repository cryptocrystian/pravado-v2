/**
 * Command Center Typography Tokens
 *
 * Single source of truth for text styling in the command center scope.
 * These tokens enforce readability standards (minimum text-[11px]) and
 * consistent contrast levels using white/xx opacity tokens.
 *
 * DS v3 Typography Scale:
 * - Primary content: text-sm (14px) - high visibility, main content
 * - Secondary content: text-xs (12px) - supporting info, labels
 * - Meta/decorative: text-[11px] - badges, counts, timestamps
 *
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

// === PRIMARY TEXT STYLES ===
// For main content that users need to read easily

/** Primary body text - main content, action titles, descriptions */
export const textPrimary = 'text-sm text-white/90';

/** Secondary body text - supporting content, summaries */
export const textSecondary = 'text-xs text-white/70';

/** Meta text - timestamps, counts, auxiliary info (minimum readable size) */
export const textMeta = 'text-[11px] text-white/55'; // typography-allow: meta

// === HEADING STYLES ===
// For section titles and hierarchy

/** Small heading - section titles, card headers */
export const headingSm = 'text-sm font-semibold text-white/90';

/** Medium heading - pane titles, modal headers */
export const headingMd = 'text-base font-semibold text-white/95';

/** Large heading - page titles, hero content */
export const headingLg = 'text-lg font-bold text-white';

// === LABEL STYLES ===
// For form labels, category tags, filter chips

/** Standard label - form fields, section labels */
export const label = 'text-xs font-medium text-white/70';

/** Uppercase label - category headers, status indicators */
export const labelUppercase = 'text-xs font-semibold text-white/50 uppercase tracking-wide';

/** Small uppercase label - tight spaces, inline badges */
export const labelSmUppercase = 'text-[11px] font-semibold text-white/50 uppercase tracking-wide'; // typography-allow: meta

// === BADGE STYLES ===
// For pillar badges, status chips, counts

/** Badge text - pillar tags, status badges */
export const badgeText = 'text-[11px] font-bold uppercase'; // typography-allow: meta

/** Badge count - numeric indicators in badges */
export const badgeCount = 'text-[11px] font-bold'; // typography-allow: meta

// === INTERACTIVE STYLES ===
// For buttons, links, clickable elements

/** Button text - primary buttons, CTAs */
export const buttonText = 'text-sm font-medium';

/** Small button text - compact buttons, secondary actions */
export const buttonTextSm = 'text-xs font-medium';

/** Link text - inline links, navigation */
export const linkText = 'text-xs font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors';

// === SPECIAL STYLES ===
// For specific UI patterns

/** Metric value - KPI numbers, scores */
export const metricValue = 'text-sm font-bold text-white';

/** Metric label - KPI labels, small descriptions */
export const metricLabel = 'text-[11px] text-white/55'; // typography-allow: meta

/** Error text - error messages, warnings */
export const errorText = 'text-xs text-semantic-danger';

/** Success text - success messages, confirmations */
export const successText = 'text-xs text-semantic-success';

/** Muted text - placeholder text, disabled states */
export const mutedText = 'text-xs text-white/40';

// === COMBINED TOKENS FOR COMMON PATTERNS ===

/** Card title - action cards, calendar items */
export const cardTitle = 'text-sm font-semibold text-white/90';

/** Card subtitle - card descriptions, summaries */
export const cardSubtitle = 'text-xs text-white/60';

/** Tab text - filter tabs, navigation tabs */
export const tabText = 'text-xs font-semibold uppercase tracking-wide';

/** Tab text active - selected tab state */
export const tabTextActive = 'text-xs font-semibold uppercase tracking-wide text-brand-cyan';

// === UTILITY FUNCTION ===

/**
 * Combines multiple typography classes safely
 * @param classes - Typography class strings to combine
 * @returns Combined class string
 */
export function combineTypography(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
