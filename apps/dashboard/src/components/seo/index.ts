/**
 * SEO/AEO Work Surface — Barrel Export
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 */

export { SEOWorkSurfaceShell } from './SEOWorkSurfaceShell';
export { SEOShell } from './SEOShell';
export { SEOChromeBar } from './SEOChromeBar';
export { SEOModeProvider, useSEOMode } from './SEOModeContext';
export type { AutomationMode } from './SEOModeContext';
export type { SEOWorkSurfaceShellProps } from './SEOWorkSurfaceShell';

export { SEOManualView } from './SEOManualView';
export { SEOCopilotView } from './SEOCopilotView';
export { SEOAutopilotView } from './SEOAutopilotView';

export type {
  SEOView,
  AEOScoreBreakdown,
  SEOAsset,
  TechnicalFinding,
  ActionQueueItem,
  CompetitorData,
  LayerHealth,
  SAGEProposal,
  AutopilotException,
  AutopilotExecution,
} from './types';

export {
  computeAEOScore,
  getAEOBandColor,
  getAEOBandBgColor,
  getAEOBandLabel,
  FINDING_CATEGORY_CONFIG,
  SEVERITY_CONFIG,
} from './types';
