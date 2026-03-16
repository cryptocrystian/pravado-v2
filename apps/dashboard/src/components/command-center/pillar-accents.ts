/**
 * Pillar Accent System - DS v3.1
 *
 * Defines the visual language for PR, Content, and SEO pillars.
 * Accents support scanning and quick identification of pillar context.
 *
 * Color tokens from DS v3.1:
 * - PR (Magenta): #E879F9 - brand-magenta
 * - Content (Iris): #A855F7 - brand-iris
 * - SEO (Cyan): #00D9FF - brand-cyan
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import type { Pillar, Priority, Mode } from './types';

/**
 * Pillar accent configuration
 * Used for borders, backgrounds, text, and glow effects
 */
export const pillarAccents: Record<
  Pillar,
  {
    bg: string;
    bgHover: string;
    solidBg: string;
    text: string;
    border: string;
    borderLeft: string;  // For left-accent border (action cards)
    borderHover: string;
    glow: string;
    gradient: string;
    badge: string;       // Pre-composed badge class
  }
> = {
  pr: {
    bg: 'bg-brand-magenta/10',
    bgHover: 'bg-brand-magenta/20',
    solidBg: 'bg-brand-magenta',
    text: 'text-brand-magenta',
    border: 'border-brand-magenta/30',
    borderLeft: 'border-l-brand-magenta',
    borderHover: 'border-brand-magenta/60',
    glow: 'shadow-[0_0_12px_rgba(232,121,249,0.15)]',
    gradient: 'from-brand-magenta/20 to-transparent',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
  },
  content: {
    bg: 'bg-brand-iris/10',
    bgHover: 'bg-brand-iris/20',
    solidBg: 'bg-brand-iris',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    borderLeft: 'border-l-brand-iris',
    borderHover: 'border-brand-iris/60',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]',
    gradient: 'from-brand-iris/20 to-transparent',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
  },
  seo: {
    bg: 'bg-brand-cyan/10',
    bgHover: 'bg-brand-cyan/20',
    solidBg: 'bg-brand-cyan',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    borderLeft: 'border-l-brand-cyan',
    borderHover: 'border-brand-cyan/60',
    glow: 'shadow-[0_0_12px_rgba(0,217,255,0.15)]',
    gradient: 'from-brand-cyan/20 to-transparent',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  },
};

/**
 * Priority styling with semantic colors
 */
export const priorityStyles: Record<
  Priority,
  {
    dot: string;
    bg: string;
    text: string;
    label: string;
  }
> = {
  critical: {
    dot: 'bg-semantic-danger',
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    label: 'Critical',
  },
  high: {
    dot: 'bg-semantic-warning',
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    label: 'High',
  },
  medium: {
    dot: 'bg-brand-cyan',
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    label: 'Medium',
  },
  low: {
    dot: 'bg-white/30',
    bg: 'bg-white/5',
    text: 'text-white/50',
    label: 'Low',
  },
};

/**
 * Mode styling for manual/copilot/autopilot
 * Matches MODE_UX_ARCHITECTURE.md badge color contracts exactly.
 */
export const modeStyles: Record<
  Mode,
  {
    bg: string;
    text: string;
    border: string;
    icon: string;
    label: string;
  }
> = {
  autopilot: {
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    icon: 'bolt',
    label: 'Autopilot',
  },
  copilot: {
    bg: 'bg-brand-iris/10',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    icon: 'user',
    label: 'Copilot',
  },
  manual: {
    bg: 'bg-white/5',
    text: 'text-white/70',
    border: 'border-white/20',
    icon: 'clock',
    label: 'Manual',
  },
};

// surfaceTokens REMOVED — banned pattern (JS hex object bypasses Tailwind DS).
// Use Tailwind classes directly: bg-page, bg-panel, bg-slate-3, border-border-subtle, border-slate-5, etc.
// See docs/skills/PRAVADO_DESIGN_SKILL.md for the full token quick-reference.

/**
 * Card base classes for consistent styling
 */
export const cardClasses = {
  base: 'bg-panel border border-border-subtle rounded-lg',
  hover: 'hover:border-slate-5 transition-all duration-200',
  interactive: 'cursor-pointer hover:bg-slate-3',
  glow: 'hover:shadow-[0_0_20px_rgba(0,217,255,0.08)]',
};

/**
 * Get pillar-specific card hover classes
 */
export function getPillarCardClasses(pillar: Pillar): string {
  const accent = pillarAccents[pillar];
  return `${cardClasses.base} ${cardClasses.hover} hover:${accent.borderHover} group`;
}
