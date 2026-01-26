/**
 * Content Pillar Surface Tokens
 *
 * Maps DS v3.1 tokens to reusable class patterns.
 * Eliminates hardcoded hex values across Content components.
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 */

// ============================================
// SURFACE TOKENS
// ============================================

export const surface = {
  /** Page background - slate-0 */
  page: 'bg-slate-0',
  /** Panel/card background - slate-2 */
  panel: 'bg-slate-2',
  /** Elevated panel - slate-1 */
  elevated: 'bg-slate-1',
  /** Hover state */
  hover: 'hover:bg-slate-3',
  /** Selected state */
  selected: 'bg-brand-iris/10',
} as const;

// ============================================
// BORDER TOKENS
// ============================================

export const border = {
  /** Default border - slate-4 */
  default: 'border-slate-4',
  /** Subtle border */
  subtle: 'border-border-subtle',
  /** Hover border */
  hover: 'hover:border-slate-5',
  /** Selected/active border */
  active: 'border-brand-iris/40',
  /** Iris accent border */
  iris: 'border-brand-iris/20',
} as const;

// ============================================
// TEXT TOKENS
// ============================================

export const text = {
  /** Primary text */
  primary: 'text-white',
  /** Secondary text */
  secondary: 'text-white/70',
  /** Muted text */
  muted: 'text-white/50',
  /** Hint text */
  hint: 'text-white/40',
  /** Disabled text */
  disabled: 'text-white/30',
  /** Brand accent */
  accent: 'text-brand-iris',
} as const;

// ============================================
// INTERACTIVE TOKENS
// ============================================

export const interactive = {
  /** Default button */
  button: 'bg-slate-4 hover:bg-slate-5 text-white/70',
  /** Primary button */
  primary: 'bg-brand-iris hover:bg-brand-iris/90 text-white',
  /** Ghost button */
  ghost: 'hover:bg-slate-3 text-white/50 hover:text-white',
  /** Input field */
  input: 'bg-slate-2 border-slate-4 focus:border-brand-iris/40 focus:ring-1 focus:ring-brand-iris/20',
} as const;

// ============================================
// CARD PATTERNS
// ============================================

export const card = {
  /** Base card */
  base: `bg-slate-2 border border-slate-4 rounded-lg`,
  /** Interactive card */
  interactive: `bg-slate-2 border border-slate-4 rounded-lg hover:border-slate-5 hover:bg-slate-3 transition-all duration-200`,
  /** Selected card */
  selected: `bg-slate-2 border border-brand-iris/40 rounded-lg ring-1 ring-brand-iris/20`,
  /** Accent card (Iris) */
  accent: `bg-brand-iris/5 border border-brand-iris/20 rounded-lg`,
} as const;

// ============================================
// STATUS TOKENS (CiteMind)
// ============================================

export const citeMindStatus = {
  pending: {
    bg: 'bg-slate-4',
    text: 'text-white/50',
    border: 'border-slate-5',
    dot: 'bg-slate-5',
  },
  analyzing: {
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/20',
    dot: 'bg-brand-cyan animate-pulse',
  },
  passed: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    dot: 'bg-semantic-success',
  },
  warning: {
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/20',
    dot: 'bg-semantic-warning',
  },
  blocked: {
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/20',
    dot: 'bg-semantic-danger',
  },
} as const;

// ============================================
// DERIVATIVE STATUS TOKENS
// ============================================

export const derivativeStatus = {
  fresh: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    label: 'Fresh',
  },
  stale: {
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/20',
    label: 'Stale',
  },
  generating: {
    bg: 'bg-brand-iris/10',
    text: 'text-brand-iris',
    border: 'border-brand-iris/20',
    label: 'Generating...',
  },
} as const;

// ============================================
// AUTOMATION MODE TOKENS
// ============================================

export const modeTokens = {
  manual: {
    bg: 'bg-slate-4',
    text: 'text-white/70',
    border: 'border-slate-5',
    label: 'Manual',
    description: 'Human creates and approves',
  },
  copilot: {
    bg: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/20',
    label: 'Copilot',
    description: 'AI assists, human decides',
  },
  autopilot: {
    bg: 'bg-brand-iris/10',
    text: 'text-brand-iris',
    border: 'border-brand-iris/20',
    label: 'Autopilot',
    description: 'AI executes within constraints',
  },
} as const;

// ============================================
// UTILITY CLASSES
// ============================================

export const skeleton = {
  base: 'bg-slate-4 rounded animate-pulse',
  card: 'bg-slate-2 border border-slate-4 rounded-lg animate-pulse',
} as const;

// ============================================
// COMPOSITE PATTERNS
// ============================================

/** Standard section header */
export const sectionHeader = 'flex items-center justify-between mb-3';

/** Label text */
export const label = 'text-[10px] font-bold uppercase tracking-wider text-white/50';

/** Progress bar track */
export const progressTrack = 'h-1.5 bg-slate-4 rounded-full overflow-hidden';

/** Divider */
export const divider = 'border-t border-slate-4';
