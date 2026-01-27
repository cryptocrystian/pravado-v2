/**
 * EVI Operating System - Module Exports
 *
 * Central export point for all EVI computation, types, and providers.
 *
 * @see /docs/canon/EVI_SPEC.md
 */

// Types
export type {
  EVIComponentMetric,
  EVIDriverSnapshot,
  EVIInputSnapshot,
  EVIAttributionEvent,
  TopMover,
  ForecastScenario,
  EVIForecast,
  ComputedEVI,
  EVIFilterState,
  AttributionEvidence,
} from './types';

export { EVI_WEIGHTS, EVI_BANDS } from './types';

// Computation
export { computeEVI, validateEVIFormula, computeEVIForecast } from './compute';

// Providers
export type { PRInputData, SEOInputData, ContentInputData } from './providers';
export {
  prToVisibilityComponents,
  prToAuthorityComponents,
  seoToVisibilityComponents,
  seoToAuthorityComponents,
  contentToMomentumComponents,
  generateMockEVISnapshot,
  generateMockTopMovers,
  generateMockAttributionEvents,
} from './providers';
