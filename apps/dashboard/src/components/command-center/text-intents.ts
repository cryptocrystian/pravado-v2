/**
 * Command Center Text Intents
 * Version: 2.0 (Fixed — corrected scale with proper hierarchy)
 *
 * CRITICAL FIX: v1.0 defined titleLarge as text-lg (18px). Body was text-sm (14px).
 * The 4px gap was invisible. The new scale starts page titles at text-2xl (24px).
 *
 * Semantic text styling helpers that enforce DS v3 typography + contrast rules.
 * Use these helpers instead of ad-hoc text classes.
 *
 * THE HIERARCHY:
 *   titlePage      24px  text-2xl     bold      /95  — one per route
 *   titleSection   20px  text-xl      semibold  /95  — major sections
 *   titlePane      18px  text-lg      semibold  /90  — panes, modals, drawers
 *   titleGroup     16px  text-base    semibold  /90  — sub-sections, card groups
 *   titleCard      15px  text-[15px]  semibold  /90  — individual card headings
 *   bodyPrimary    14px  text-sm      normal    /85  — main readable content
 *   bodySecondary  13px  text-[13px]  normal    /70  — supporting text
 *   microLabel     11px  text-[11px]  bold      ---  — badges only (uppercase required)
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md → Typography System
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

// ============================================
// TITLE INTENTS (Headings Hierarchy)
// ============================================

/** Page / surface title — h1, one per route. ALWAYS text-2xl. */
export const titlePage = 'text-2xl font-bold text-white/95 tracking-tight';

/** Section heading — major content areas within a surface */
export const titleSection = 'text-xl font-semibold text-white/95 tracking-tight';

/** Pane / panel title — tri-pane pane titles, modal/drawer headers */
export const titlePane = 'text-lg font-semibold text-white/90 tracking-tight';

/** Group / sub-section heading — grouping headers inside a pane */
export const titleGroup = 'text-base font-semibold text-white/90';

/** Card title — individual actionable card headings */
export const titleCard = 'text-[15px] font-semibold text-white/90 leading-snug';

/** Compact title — inline titles, tight spaces (never for page-level) */
export const titleCompact = 'text-sm font-semibold text-white/90';

// Legacy aliases — DEPRECATED, use new title* tokens above
/** @deprecated Use titlePage */
export const titleLarge = titlePage;
/** @deprecated Use titlePane */
export const titleSecondary = titlePane;
/** @deprecated Use titleCompact */
export const titlePrimary = titleCompact;

// ============================================
// BODY INTENTS (Readable Content)
// ============================================

/** Primary body — main content paragraphs, descriptions */
export const bodyPrimary = 'text-sm text-white/85';

/** Secondary body — supporting text, summaries */
export const bodySecondary = 'text-[13px] text-white/70';

/** Summary / preview — truncated text, preview snippets */
export const bodySummary = 'text-[13px] text-white/60';

/** Tertiary / fine print */
export const bodyTertiary = 'text-[13px] text-white/55';

// ============================================
// MUTED INTENTS (Lower Prominence)
// ============================================

/** Muted text — secondary labels, helper text */
export const mutedPrimary = 'text-sm text-white/55';

/** Muted secondary — tertiary content, hints */
export const mutedSecondary = 'text-[13px] text-white/50';

/** Muted caption — descriptions under headings */
export const mutedCaption = 'text-[13px] text-white/45';

// ============================================
// MICRO INTENTS (Minimal Footprint — Badges/Labels Only)
//
// RULE: text-[11px] is ONLY for badge labels with uppercase + tracking-wider.
// Never use for prose, readable text, or descriptions.
// ============================================

/** Micro text — badge counts, auxiliary metadata */
export const microText = 'text-[11px] text-white/55'; // typography-allow: micro — uppercase required

/** Micro label — badge/chip labels */
export const microLabel = 'text-[11px] font-bold uppercase tracking-wider text-white/70'; // typography-allow: micro

/** Micro muted — least prominent, timestamps */
export const microMuted = 'text-xs text-white/40'; // 12px, uppercase tracking if standalone

// ============================================
// BADGE INTENTS
// ============================================

/** Badge text base — pillar/status badges (uppercase required by caller) */
export const badgeBase = 'text-[11px] font-bold uppercase tracking-wider'; // typography-allow: badge

/** Badge text medium — medium emphasis badges */
export const badgeMedium = 'text-[11px] font-semibold uppercase tracking-wider'; // typography-allow: badge

// ============================================
// SEMANTIC INTENTS
// ============================================

/** Error text */
export const errorText = 'text-sm font-medium text-semantic-danger';

/** Warning text */
export const warningText = 'text-sm font-medium text-semantic-warning';

/** Success text */
export const successText = 'text-sm font-medium text-semantic-success';

/** Info text */
export const infoText = 'text-sm text-brand-cyan';

// ============================================
// INTERACTIVE INTENTS
// ============================================

/** Link text — inline links, navigation */
export const linkText = 'text-sm font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors cursor-pointer';

/** Button text primary */
export const buttonPrimary = 'text-sm font-semibold';

/** Button text secondary */
export const buttonSecondary = 'text-sm font-medium';

/** Tab text — navigation/filter tabs */
export const tabText = 'text-xs font-semibold uppercase tracking-wide'; // typography-allow: tab — 12px with uppercase is acceptable

// ============================================
// METRIC INTENTS
// ============================================

/** Metric value hero — large KPI numbers, EVI score displays */
export const metricValueHero = 'text-2xl font-bold text-white/95 tabular-nums';

/** Metric value standard — typical metric display */
export const metricValue = 'text-lg font-bold text-white/90 tabular-nums';

/** Metric value compact — inline metrics */
export const metricValueCompact = 'text-base font-bold text-white/90 tabular-nums';

/** Metric label */
export const metricLabel = 'text-xs text-white/55 uppercase tracking-wide'; // typography-allow: metric

/** Metric delta — change indicators */
export const metricDelta = 'text-[13px] font-bold'; // typography-allow: metric — color applied separately

// ============================================
// SECTION INTENTS (Organizational)
// ============================================

/** Section header — uppercase section labels */
export const sectionHeader = 'text-xs font-semibold text-white/55 uppercase tracking-wide';

/** Section header small — compact section labels */
export const sectionHeaderSm = 'text-[11px] font-semibold text-white/50 uppercase tracking-wider'; // typography-allow: section

/** Divider label */
export const dividerLabel = 'text-xs text-white/35 uppercase tracking-wider';

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function combineIntents(...intents: (string | undefined | false | null)[]): string {
  return intents.filter(Boolean).join(' ');
}

export function pillarText(pillar: 'pr' | 'content' | 'seo'): string {
  const colors = {
    pr: 'text-brand-magenta',
    content: 'text-brand-iris',
    seo: 'text-brand-cyan',
  };
  return colors[pillar];
}

export function priorityText(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const colors = {
    critical: 'text-semantic-danger',
    high: 'text-semantic-warning',
    medium: 'text-brand-cyan',
    low: 'text-white/60',
  };
  return colors[priority];
}
