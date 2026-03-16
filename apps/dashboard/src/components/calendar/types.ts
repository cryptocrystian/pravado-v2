/**
 * Orchestration Calendar Types
 *
 * Reuses CalendarItem / CalendarStatus from command-center types.
 * Adds calendar-specific view types and config maps.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md
 */

export type { CalendarItem, CalendarStatus, CalendarItemDetails, CalendarItemLinked } from '../command-center/types';
export type { Pillar, Mode } from '../command-center/types';

export type CalendarViewMode = 'day' | 'week' | 'month';

// ============================================
// STATUS VISUAL CONFIG (§5.1)
// ============================================

export interface StatusConfig {
  label: string;
  /** Tailwind classes for the status indicator icon/badge */
  indicatorClass: string;
  /** Tailwind classes for the status badge */
  badgeClass: string;
  /** Whether this status requires user attention */
  urgent: boolean;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  planned: {
    label: 'Planned',
    indicatorClass: 'border-2 border-white/30',
    badgeClass: 'bg-white/5 text-white/50 border-white/10',
    urgent: false,
  },
  drafting: {
    label: 'Drafting',
    indicatorClass: 'bg-brand-iris animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.5)]',
    badgeClass: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30',
    urgent: false,
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    indicatorClass: 'bg-semantic-warning shadow-[0_0_6px_rgba(234,179,8,0.5)]',
    badgeClass: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
    urgent: true,
  },
  scheduled: {
    label: 'Scheduled',
    indicatorClass: 'bg-brand-cyan shadow-[0_0_6px_rgba(0,217,255,0.4)]',
    badgeClass: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
    urgent: false,
  },
  published: {
    label: 'Published',
    indicatorClass: 'bg-semantic-success',
    badgeClass: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
    urgent: false,
  },
  failed: {
    label: 'Failed',
    indicatorClass: 'bg-semantic-danger',
    badgeClass: 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
    urgent: true,
  },
};

// ============================================
// MODE VISUAL CONFIG (§6.2)
// ============================================

export interface ModeConfig {
  label: string;
  badgeClass: string;
}

export const MODE_CONFIG: Record<string, ModeConfig> = {
  manual: {
    label: 'Manual',
    badgeClass: 'bg-white/5 text-white/50 border-white/10',
  },
  copilot: {
    label: 'Copilot',
    badgeClass: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30',
  },
  autopilot: {
    label: 'Auto',
    badgeClass: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 shadow-[0_0_8px_rgba(0,217,255,0.15)]',
  },
};

// ============================================
// PILLAR VISUAL CONFIG
// ============================================

export interface PillarConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const PILLAR_CONFIG: Record<string, PillarConfig> = {
  pr: {
    label: 'PR',
    badgeClass: 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/30',
    dotClass: 'bg-brand-magenta',
  },
  content: {
    label: 'Content',
    badgeClass: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30',
    dotClass: 'bg-brand-iris',
  },
  seo: {
    label: 'SEO',
    badgeClass: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
    dotClass: 'bg-brand-cyan',
  },
};

// ============================================
// RISK VISUAL CONFIG (§7.1)
// ============================================

export const RISK_CONFIG: Record<string, { label: string; dotClass: string }> = {
  low: { label: 'Low', dotClass: '' },
  med: { label: 'Medium', dotClass: 'bg-semantic-warning shadow-[0_0_4px_rgba(234,179,8,0.4)]' },
  high: { label: 'High', dotClass: 'bg-semantic-danger shadow-[0_0_4px_rgba(239,68,68,0.4)]' },
};

// ============================================
// TIME GROUP CONFIG (Day view §9.1)
// ============================================

export interface TimeGroup {
  label: string;
  startHour: number;
  endHour: number;
}

export const TIME_GROUPS: TimeGroup[] = [
  { label: 'Early Morning', startHour: 0, endHour: 8 },
  { label: 'Morning', startHour: 8, endHour: 12 },
  { label: 'Midday', startHour: 12, endHour: 14 },
  { label: 'Afternoon', startHour: 14, endHour: 18 },
  { label: 'Evening', startHour: 18, endHour: 24 },
];
