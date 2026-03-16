/**
 * Analytics V1 — Barrel Export
 *
 * @see /docs/canon/ANALYTICS_CONTRACT.md
 */

export { AnalyticsDashboard } from './AnalyticsDashboard';
export { AnalyticsChromeBar } from './AnalyticsChromeBar';
export { AnalyticsShell } from './AnalyticsShell';
export { AnalyticsTabBar } from './AnalyticsTabBar';

export type {
  EVIDataPoint,
  SoMCluster,
  CoverageEvent,
  TopMover,
  EVIBand,
  DriverConfig,
  TimeRange,
  AnalyticsPillar,
  CoverageTier,
} from './types';

export {
  EVI_BANDS,
  getEVIBand,
  DRIVER_CONFIGS,
  TIER_CONFIG,
  ANALYTICS_PILLAR_CONFIG,
  TIME_RANGE_OPTIONS,
} from './types';
