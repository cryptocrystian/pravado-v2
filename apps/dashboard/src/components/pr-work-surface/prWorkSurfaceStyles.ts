/**
 * PR Work Surface Styling Contract - DS v3.0
 *
 * This file defines the Design System 3.0 styling patterns for PR Work Surface,
 * aligned with Command Center's premium AI-first aesthetic.
 *
 * CANON REFERENCE:
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/COMMAND-CENTER-UI.md
 *
 * DESIGN PRINCIPLES:
 * - Form over fashion, but premium and intentional
 * - Semantic colors; neon accents are functional, not decorative
 * - Strong hierarchy: proposals + causality dominate
 * - Micro-interactions are meaningful and restrained
 * - Density tuned for power users; progressive disclosure for complexity
 */

import type { Mode } from './types';

// ============================================
// SURFACE TOKENS (DS v3.1)
// ============================================

export const surfaceTokens = {
  // Background hierarchy (darkest → lightest)
  pageBg: '#0A0A0F', // Main page background
  cardBg: '#0D0D12', // Card/container background
  cardElevated: '#13131A', // Elevated cards, modals
  cardHover: '#111116', // Card hover state
  panelBg: '#16161E', // Panel backgrounds

  // Border hierarchy
  borderSubtle: '#1A1A24', // Default borders
  borderDefault: '#1F1F28', // Emphasized borders
  borderHover: '#2A2A36', // Hover state borders
  borderActive: '#3A3A48', // Active state borders

  // Interactive overlays
  hoverOverlay: 'rgba(255, 255, 255, 0.02)',
  activeOverlay: 'rgba(255, 255, 255, 0.04)',
};

// ============================================
// PILLAR ACCENT SYSTEM (PR = Magenta primary)
// ============================================

export const prAccent = {
  // Primary PR accent (magenta)
  bg: 'bg-brand-magenta/10',
  bgHover: 'bg-brand-magenta/15',
  bgActive: 'bg-brand-magenta/20',
  solidBg: 'bg-brand-magenta',
  text: 'text-brand-magenta',
  border: 'border-brand-magenta/30',
  borderHover: 'border-brand-magenta/50',
  glow: 'shadow-[0_0_16px_rgba(232,121,249,0.15)]',
  glowStrong: 'shadow-[0_0_24px_rgba(232,121,249,0.25)]',
  gradient: 'from-brand-magenta/20 to-transparent',
  ring: 'ring-brand-magenta/40',
};

// Secondary accents for cross-pillar indicators
export const pillarAccents = {
  pr: prAccent,
  content: {
    bg: 'bg-brand-iris/10',
    bgHover: 'bg-brand-iris/15',
    solidBg: 'bg-brand-iris',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    borderHover: 'border-brand-iris/50',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.15)]',
  },
  seo: {
    bg: 'bg-brand-cyan/10',
    bgHover: 'bg-brand-cyan/15',
    solidBg: 'bg-brand-cyan',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    borderHover: 'border-brand-cyan/50',
    glow: 'shadow-[0_0_16px_rgba(0,217,255,0.15)]',
  },
};

// ============================================
// EVI DRIVER COLORS
// ============================================

export const eviDriverStyles = {
  visibility: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
    dot: 'bg-brand-cyan',
  },
  authority: {
    text: 'text-brand-iris',
    bg: 'bg-brand-iris/10',
    border: 'border-brand-iris/30',
    dot: 'bg-brand-iris',
  },
  momentum: {
    text: 'text-brand-magenta',
    bg: 'bg-brand-magenta/10',
    border: 'border-brand-magenta/30',
    dot: 'bg-brand-magenta',
  },
};

// ============================================
// PRIORITY STYLING (Semantic Colors)
// ============================================

export const priorityStyles = {
  critical: {
    dot: 'bg-semantic-danger',
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/30',
    label: 'Critical',
  },
  high: {
    dot: 'bg-semantic-warning',
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/30',
    label: 'High',
  },
  medium: {
    dot: 'bg-brand-cyan',
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    label: 'Medium',
  },
  low: {
    dot: 'bg-white/30',
    bg: 'bg-white/5',
    text: 'text-white/50',
    border: 'border-white/10',
    label: 'Low',
  },
};

// ============================================
// MODE STYLING (Manual/Copilot/Autopilot)
// ============================================

export const modeStyles: Record<Mode, {
  bg: string;
  text: string;
  border: string;
  label: string;
  description: string;
  icon: 'lock' | 'user' | 'bolt';
}> = {
  manual: {
    bg: 'bg-white/5',
    text: 'text-white/70',
    border: 'border-white/20',
    label: 'Manual',
    description: 'Requires your direct action',
    icon: 'lock',
  },
  copilot: {
    bg: 'bg-brand-iris/10',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    label: 'Copilot',
    description: 'AI assists, you approve',
    icon: 'user',
  },
  autopilot: {
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    label: 'Autopilot',
    description: 'System handles within guardrails',
    icon: 'bolt',
  },
};

// ============================================
// TYPOGRAPHY INTENTS (DS v3.0 FINAL)
// ============================================
// HARD RULES:
// ❌ No meaningful text below 13px
// ❌ No text-xs for semantic content
// ✅ Metadata minimum: 13–14px (text-[13px] or text-sm)
// ✅ Body text default: 15–16px (text-[15px] or text-base)
// ✅ Uppercase labels: 11px acceptable (tracking-wider makes legible)

export const typography = {
  // High emphasis (titles, headers) - weight-driven, not color-only
  titleLarge: 'text-lg font-semibold text-white leading-snug',
  titleMedium: 'text-base font-semibold text-white leading-snug',
  titleSmall: 'text-sm font-semibold text-white/90 leading-snug',

  // Body text (15-16px for sustained reading)
  bodyPrimary: 'text-[15px] text-white/85 leading-relaxed',
  bodySecondary: 'text-sm text-white/70 leading-relaxed',

  // Metadata text (13-14px minimum for readability)
  metaPrimary: 'text-[13px] text-white/60 leading-normal',
  metaSecondary: 'text-[13px] text-white/50 leading-normal',

  // DEPRECATED - kept for migration, use metaPrimary/metaSecondary instead
  mutedPrimary: 'text-[13px] text-white/55 leading-normal',
  mutedSecondary: 'text-[13px] text-white/45 leading-normal',

  // Timestamps and tertiary info (13px minimum)
  micro: 'text-[13px] text-white/50 leading-normal',
  microStrong: 'text-[13px] font-medium text-white/60 leading-normal',

  // Uppercase labels ONLY - tracking-wider makes 11px visually equivalent to 13px
  labelLarge: 'text-xs font-semibold uppercase tracking-wider text-white/70',
  labelSmall: 'text-[11px] font-bold uppercase tracking-wider text-white/50',

  // System hints (reduced opacity, NOT reduced size)
  hint: 'text-[13px] text-white/40 leading-normal',
};

// ============================================
// CARD STYLES
// ============================================

export const cardStyles = {
  // Base card (most common)
  base: `
    bg-[#0D0D12]
    border border-[#1A1A24]
    rounded-xl
    transition-all duration-200
  `,

  // Interactive card (clickable)
  interactive: `
    bg-[#0D0D12]
    border border-[#1A1A24]
    rounded-xl
    transition-all duration-200
    hover:bg-[#111116]
    hover:border-[#2A2A36]
    cursor-pointer
  `,

  // Selected card
  selected: `
    bg-[#111116]
    border border-[#2A2A36]
    rounded-xl
    ring-1 ring-brand-magenta/30
  `,

  // Elevated card (modals, drawers)
  elevated: `
    bg-[#13131A]
    border border-[#1F1F28]
    rounded-xl
    shadow-elev-2
  `,

  // Panel (large container)
  panel: `
    bg-[#0D0D12]/80
    border border-[#1A1A24]
    rounded-xl
    backdrop-blur-sm
  `,
};

// ============================================
// BUTTON STYLES
// ============================================

export const buttonStyles = {
  // Primary CTA (dominant)
  primary: `
    px-4 py-2.5
    text-sm font-semibold
    bg-brand-magenta text-white
    rounded-lg
    hover:bg-brand-magenta/90
    shadow-[0_0_16px_rgba(232,121,249,0.25)]
    hover:shadow-[0_0_20px_rgba(232,121,249,0.35)]
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `,

  // Secondary CTA (ghost)
  secondary: `
    px-4 py-2.5
    text-sm font-medium
    text-white/60
    border border-white/10
    rounded-lg
    hover:text-white/90
    hover:border-white/20
    hover:bg-white/5
    transition-all duration-200
  `,

  // Tertiary (text only)
  tertiary: `
    px-3 py-2
    text-xs font-medium
    text-white/55
    hover:text-white/80
    hover:bg-white/5
    rounded-lg
    transition-all duration-200
  `,

  // Success/Ready state
  success: `
    px-4 py-2.5
    text-sm font-semibold
    bg-semantic-success text-white
    rounded-lg
    hover:bg-semantic-success/90
    shadow-[0_0_16px_rgba(34,197,94,0.25)]
    transition-all duration-200
  `,
};

// ============================================
// BADGE STYLES
// ============================================

export const badgeStyles = {
  // Pillar badge (PR/Content/SEO)
  pillar: (pillar: 'pr' | 'content' | 'seo') => {
    const colors = {
      pr: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
      content: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
      seo: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
    };
    return `px-2 py-1 text-[11px] font-bold uppercase rounded border ${colors[pillar]}`;
  },

  // Priority badge
  priority: (level: 'critical' | 'high' | 'medium' | 'low') => {
    const styles = priorityStyles[level];
    return `px-2 py-1 text-[11px] font-bold uppercase rounded border ${styles.bg} ${styles.text} ${styles.border}`;
  },

  // Mode badge
  mode: (mode: Mode) => {
    const styles = modeStyles[mode];
    return `px-2 py-1 text-[11px] font-medium uppercase rounded border ${styles.bg} ${styles.text} ${styles.border}`;
  },

  // Count badge
  count: 'px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/10 text-white/70',

  // Status badge
  success: 'px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30',
  warning: 'px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30',
  danger: 'px-2 py-1 text-[11px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30',
};

// ============================================
// INPUT STYLES
// ============================================

export const inputStyles = {
  base: `
    w-full px-3 py-2.5
    text-sm text-white
    bg-[#0D0D12]
    border border-[#1A1A24]
    rounded-lg
    placeholder:text-white/40
    focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/30
    transition-all duration-200
  `,

  search: `
    w-full px-3 py-2 pl-9
    text-sm text-white
    bg-[#0D0D12]
    border border-[#1A1A24]
    rounded-lg
    placeholder:text-white/40
    focus:outline-none focus:border-brand-magenta/50
    transition-all duration-200
  `,
};

// ============================================
// SECTION HEADER COMPONENT STYLES
// ============================================

export const sectionStyles = {
  // Section header with icon
  header: `
    flex items-center gap-2 mb-4
  `,
  headerIcon: 'w-5 h-5 text-brand-magenta',
  headerTitle: 'text-sm font-semibold text-white leading-snug',
  headerCount: 'px-1.5 py-0.5 text-[11px] font-bold rounded bg-brand-magenta/15 text-brand-magenta',

  // Divider
  divider: 'h-px bg-[#1A1A24] my-4',

  // Uppercase label above sections (tracking-wider makes 11px legible)
  label: 'text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2',
};

// ============================================
// MOTION / ANIMATION
// ============================================

export const motion = {
  // Timing functions
  easeStandard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeEmphatic: 'cubic-bezier(0.16, 1, 0.3, 1)',

  // Duration classes
  durationFast: 'duration-150',
  durationDefault: 'duration-200',
  durationSlow: 'duration-300',

  // Common transitions
  transition: 'transition-all duration-200',
  transitionColors: 'transition-colors duration-200',
  transitionOpacity: 'transition-opacity duration-200',
};

// ============================================
// GLOW EFFECTS
// ============================================

export const glowEffects = {
  pr: 'shadow-[0_0_16px_rgba(232,121,249,0.15)]',
  prStrong: 'shadow-[0_0_24px_rgba(232,121,249,0.25)]',
  content: 'shadow-[0_0_16px_rgba(168,85,247,0.15)]',
  seo: 'shadow-[0_0_16px_rgba(0,217,255,0.15)]',
  success: 'shadow-[0_0_16px_rgba(34,197,94,0.20)]',
  warning: 'shadow-[0_0_16px_rgba(255,201,90,0.20)]',
  danger: 'shadow-[0_0_16px_rgba(255,107,107,0.20)]',
};

// ============================================
// FORBIDDEN LEGACY TOKENS
// Tokens that MUST NOT appear in PR Work Surface
// Used by CI guardrails
// ============================================

export const FORBIDDEN_LEGACY_TOKENS = [
  // Old slate grays
  'slate-11',
  'slate-9',
  'text-slate-400',
  'text-slate-500',
  'text-gray-',
  'text-neutral-',
  'text-zinc-',
  'bg-gray-',
  'bg-neutral-',
  'bg-zinc-',

  // Old color patterns
  'emerald-400', // Use semantic-success
  'red-400', // Use semantic-danger
  'amber-400', // Use semantic-warning

  // Old borders
  'border-slate-',
  'border-gray-',
];

// ============================================
// DS 3.0 TYPOGRAPHY ENFORCEMENT RULES
// CI guardrail configuration
// ============================================

export const DS3_TYPOGRAPHY_RULES = {
  // Minimum font sizes for semantic content
  // text-xs (12px) is ONLY allowed with uppercase + tracking-wider
  // text-[9px], text-[10px] ONLY for uppercase labels
  forbiddenForSemanticContent: [
    // Sub-13px sizes for regular text (not uppercase labels)
    // Note: CI script should check context - these are OK if uppercase + tracking-wider
  ],

  // Allowed small sizes (ONLY for uppercase labels)
  allowedSmallSizes: {
    'text-[10px]': 'only with font-bold uppercase tracking-wider',
    'text-[11px]': 'only with font-bold uppercase tracking-wider',
    'text-xs': 'only with uppercase tracking-wider',
  },

  // Required minimum for semantic content
  minimumSemanticSize: 'text-[13px]', // 13px minimum for readable metadata

  // Line height requirements for dense lists
  denseListLineHeight: '1.45', // leading-normal or leading-relaxed
};

// ============================================
// REQUIRED DS3 PATTERNS
// Patterns that MUST be present for DS3 compliance
// Used by CI guardrails
// ============================================

export const REQUIRED_DS3_PATTERNS = [
  // Surface tokens
  'bg-[#0D0D12]',
  'bg-[#13131A]',
  'border-[#1A1A24]',

  // Typography (white opacity scale)
  'text-white/90',
  'text-white/85',
  'text-white/70',
  'text-white/65',
  'text-white/55',

  // Brand colors
  'brand-magenta',
  'brand-iris',
  'brand-cyan',

  // Semantic colors
  'semantic-success',
  'semantic-warning',
  'semantic-danger',
];
