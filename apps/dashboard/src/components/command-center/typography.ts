/**
 * Command Center Typography Tokens
 * Version: 2.0 (Fixed — corrected scale with proper hierarchy)
 *
 * CRITICAL FIX: v1.0 of this file defined headingLg as text-lg (18px) and
 * bodyPrimary as text-sm (14px). The 4px gap was invisible in production.
 * This file establishes a proper enterprise-grade hierarchy.
 *
 * TYPOGRAPHY SCALE:
 * Surface Title     24px  text-2xl     font-bold    /95  — h1, one per route
 * Section Heading   20px  text-xl      font-semibold /95  — major sections
 * Pane / Panel      18px  text-lg      font-semibold /90  — tri-pane titles
 * Sub-section       16px  text-base    font-semibold /90  — grouping headers
 * Card Title        15px  text-[15px]  font-semibold /90  — card headings
 * Body Primary      14px  text-sm      font-normal   /85  — main readable content
 * Body Secondary    13px  text-[13px]  font-normal   /70  — supporting text
 * Metadata          12px  text-xs      font-medium   /55  — labels (MUST use uppercase)
 * Badge / Micro     11px  text-[11px]  font-bold     var  — badges only (MUST use uppercase)
 *
 * RULE: text-xs (12px) is ONLY permitted with uppercase + tracking-wide.
 * RULE: text-[11px] is ONLY for badge labels with uppercase + tracking-wider.
 * RULE: text-[10px] is NEVER permitted.
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md → Typography System
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

// === HEADING STYLES ===

/** Surface/Page Title — h1, one per route. Always text-2xl. */
export const headingPage = 'text-2xl font-bold text-white/95 tracking-tight';

/** Section Heading — major content sections within a surface */
export const headingSection = 'text-xl font-semibold text-white/95 tracking-tight';

/** Pane Title — tri-pane shell, modal headers, drawer titles */
export const headingPane = 'text-lg font-semibold text-white/90 tracking-tight';

/** Sub-section — grouping headers inside a pane */
export const headingSubsection = 'text-base font-semibold text-white/90';

/** Card Title — individual card headings */
export const headingCard = 'text-[15px] font-semibold text-white/90 leading-snug';

// Legacy aliases — kept for backward compatibility but DEPRECATED
// Use the new heading* tokens above instead
/** @deprecated Use headingPage */
export const headingLg = headingPage;
/** @deprecated Use headingPane */
export const headingMd = headingPane;
/** @deprecated Use headingSubsection */
export const headingSm = headingSubsection;

// === BODY TEXT STYLES ===

/** Primary body — main content, action descriptions, readable prose */
export const textPrimary = 'text-sm text-white/85';

/** Secondary body — supporting content, summaries, descriptions */
export const textSecondary = 'text-[13px] text-white/70';

/** Tertiary body — fine print, helper text */
export const textTertiary = 'text-[13px] text-white/55';

// === METADATA / LABEL STYLES ===

/** Meta text — timestamps, counts (MUST be uppercase in context) */
export const textMeta = 'text-xs text-white/55'; // typography-allow: meta — use with uppercase tracking-wide

/** Standard label — section labels (use uppercase + tracking-wide) */
export const label = 'text-xs font-medium text-white/70';

/** Uppercase label — section headers, status labels */
export const labelUppercase = 'text-xs font-semibold text-white/55 uppercase tracking-wide';

/** Small uppercase label — tight spaces, filter chips */
export const labelSmUppercase = 'text-[11px] font-semibold text-white/50 uppercase tracking-wider'; // typography-allow: meta

// === BADGE STYLES ===

/** Badge text — pillar tags, status badges. MUST use uppercase. */
export const badgeText = 'text-[11px] font-bold uppercase tracking-wider'; // typography-allow: meta

/** Badge count — numeric indicators */
export const badgeCount = 'text-[11px] font-bold tabular-nums'; // typography-allow: meta

// === INTERACTIVE STYLES ===

/** Button text — primary buttons, CTAs */
export const buttonText = 'text-sm font-semibold';

/** Small button text — compact buttons, secondary actions */
export const buttonTextSm = 'text-sm font-medium';

/** Link text — inline links, navigation */
export const linkText = 'text-sm font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors';

// === METRIC STYLES ===

/** Metric value hero — KPI numbers, EVI scores (large displays) */
export const metricValueHero = 'text-2xl font-bold text-white/95 tabular-nums';

/** Metric value standard — smaller metric displays */
export const metricValue = 'text-lg font-bold text-white/90 tabular-nums';

/** Metric value compact — inline metrics */
export const metricValueCompact = 'text-base font-bold text-white/90 tabular-nums';

/** Metric label — labels under/beside metric values */
export const metricLabel = 'text-xs text-white/55 uppercase tracking-wide'; // typography-allow: meta

/** Metric delta — change indicators */
export const metricDelta = 'text-[13px] font-bold'; // typography-allow: metric — color applied separately

// === SEMANTIC STYLES ===

/** Error text */
export const errorText = 'text-sm text-semantic-danger';

/** Success text */
export const successText = 'text-sm text-semantic-success';

/** Warning text */
export const warningText = 'text-sm text-semantic-warning';

/** Muted text — placeholder, disabled */
export const mutedText = 'text-sm text-white/40';

// === CARD-LEVEL PATTERNS ===

/** Card title — individual card headings */
export const cardTitle = 'text-[15px] font-semibold text-white/90 leading-snug';

/** Card subtitle — descriptions under card titles */
export const cardSubtitle = 'text-[13px] text-white/60';

/** Card body — readable content inside cards */
export const cardBody = 'text-sm text-white/70 leading-relaxed';

/** Tab text — navigation tabs, filter tabs (12px with uppercase) */
export const tabText = 'text-xs font-semibold uppercase tracking-wide text-white/55';

/** Tab text active */
export const tabTextActive = 'text-xs font-semibold uppercase tracking-wide text-brand-cyan';

// === UTILITY FUNCTION ===

/**
 * Combines multiple typography classes safely
 */
export function combineTypography(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
