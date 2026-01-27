/**
 * EVI Operating System - Type Definitions
 *
 * Core data contracts for the Earned Visibility Index computation,
 * attribution, and forecasting systems.
 *
 * @see /docs/canon/EVI_SPEC.md
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 */

import type { EVIDriverType, Pillar, Trend } from '@/components/command-center/types';

// ============================================
// EVI FORMULA CONSTANTS (CANONICAL)
// EVI = Visibility * 0.40 + Authority * 0.35 + Momentum * 0.25
// ============================================

export const EVI_WEIGHTS = {
  visibility: 0.40,
  authority: 0.35,
  momentum: 0.25,
} as const;

export const EVI_BANDS = {
  at_risk: { min: 0, max: 40, label: 'At Risk' },
  emerging: { min: 41, max: 60, label: 'Emerging' },
  competitive: { min: 61, max: 80, label: 'Competitive' },
  dominant: { min: 81, max: 100, label: 'Dominant' },
} as const;

// ============================================
// INPUT SNAPSHOTS - Raw data from providers
// ============================================

/**
 * Component metric that feeds into an EVI driver
 */
export interface EVIComponentMetric {
  id: string;
  label: string;
  value: number;
  max_value: number;
  /** Weight within the driver (0-1, should sum to 1 per driver) */
  weight: number;
  /** Source system identifier */
  source: 'pr' | 'seo' | 'content' | 'external';
}

/**
 * Snapshot of a single EVI driver's inputs
 */
export interface EVIDriverSnapshot {
  type: EVIDriverType;
  /** Computed score for this driver (0-100) */
  score: number;
  /** Confidence in this score (0-1) based on data freshness and coverage */
  confidence: number;
  /** Component metrics that compose this driver */
  components: EVIComponentMetric[];
  /** Computed deltas */
  delta_7d: number;
  delta_30d: number;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Complete EVI input snapshot from all providers
 */
export interface EVIInputSnapshot {
  /** Timestamp of snapshot generation */
  generated_at: string;
  /** Organization ID */
  org_id: string;
  /** Driver snapshots */
  visibility: EVIDriverSnapshot;
  authority: EVIDriverSnapshot;
  momentum: EVIDriverSnapshot;
  /** Historical data for sparkline */
  historical_scores: {
    date: string;
    score: number;
  }[];
}

// ============================================
// ATTRIBUTION EVENTS - What moved EVI
// ============================================

/**
 * Evidence supporting an attribution event
 */
export interface AttributionEvidence {
  type: 'citation' | 'url' | 'diff' | 'metric';
  label: string;
  value: string;
  url?: string;
}

/**
 * Single attribution event explaining EVI movement
 */
export interface EVIAttributionEvent {
  id: string;
  /** When the event occurred */
  timestamp: string;
  /** Which driver this event impacted */
  driver: EVIDriverType;
  /** Which pillar originated this event */
  pillar: Pillar;
  /** Points contributed to EVI change */
  delta_points: number;
  /** Human-readable reason */
  reason: string;
  /** Evidence supporting this attribution */
  evidence: AttributionEvidence[];
  /** Deep link to related action or work surface */
  deep_link: {
    label: string;
    href: string;
  };
  /** Related action ID (if applicable) */
  action_id?: string;
  /** Confidence in this attribution (0-1) */
  confidence: number;
}

/**
 * Top mover item for Strategy Panel display
 */
export interface TopMover {
  id: string;
  /** Which EVI driver this impacted */
  driver: EVIDriverType;
  /** Points change */
  delta_points: number;
  /** Short reason (1 sentence) */
  reason: string;
  /** Evidence type for icon display */
  evidence_type: 'citation' | 'url' | 'diff' | 'metric';
  /** Deep link to work surface or action */
  deep_link: {
    label: string;
    href: string;
  };
  /** Related action ID for filtering */
  action_id?: string;
  /** Related pillar for filtering */
  pillar: Pillar;
  /** Trend direction */
  trend: Trend;
}

// ============================================
// FORECASTING - Predicted EVI movement
// ============================================

/**
 * Scenario toggle for EVI forecasting
 */
export interface ForecastScenario {
  id: string;
  label: string;
  description: string;
  /** Drivers this scenario impacts */
  drivers: EVIDriverType[];
  /** Expected delta if scenario is activated */
  delta_evi: number;
  /** Confidence interval */
  confidence: {
    low: number;
    expected: number;
    high: number;
  };
  /** Assumptions behind this scenario */
  assumptions: string[];
  /** Is this scenario currently active in forecast */
  is_active: boolean;
}

/**
 * EVI Forecast output
 */
export interface EVIForecast {
  /** Current EVI score */
  current_score: number;
  /** Forecast horizon in days */
  horizon_days: number;
  /** Forecasted EVI without any scenarios */
  baseline: {
    low: number;
    expected: number;
    high: number;
  };
  /** Forecasted EVI with active scenarios */
  with_scenarios: {
    low: number;
    expected: number;
    high: number;
  };
  /** Available scenarios */
  scenarios: ForecastScenario[];
  /** Assumptions driving baseline forecast */
  baseline_assumptions: string[];
  /** Last updated timestamp */
  updated_at: string;
}

// ============================================
// COMPUTED EVI RESULT
// ============================================

/**
 * Computed EVI result from snapshot
 */
export interface ComputedEVI {
  /** Final EVI score (0-100) */
  score: number;
  /** Score from previous period */
  previous_score: number;
  /** Deltas */
  delta_7d: number;
  delta_30d: number;
  /** Status band */
  status: 'at_risk' | 'emerging' | 'competitive' | 'dominant';
  /** Overall trend */
  trend: Trend;
  /** Driver breakdown */
  drivers: {
    visibility: { score: number; weighted: number; delta_7d: number; trend: Trend };
    authority: { score: number; weighted: number; delta_7d: number; trend: Trend };
    momentum: { score: number; weighted: number; delta_7d: number; trend: Trend };
  };
  /** Sparkline data (last 7 points) */
  sparkline: number[];
  /** Computation timestamp */
  computed_at: string;
  /** Overall confidence based on driver confidences */
  confidence: number;
}

// ============================================
// FILTER STATE - For cross-component communication
// ============================================

/**
 * Filter state for Action Stream from Strategy Panel
 */
export interface EVIFilterState {
  /** Filter by EVI driver */
  driver?: EVIDriverType;
  /** Filter by pillar */
  pillar?: Pillar;
  /** Source of filter (for UI display) */
  source: 'driver_click' | 'top_mover_click' | 'narrative_click' | 'manual';
  /** Label for filter chip */
  label: string;
}
