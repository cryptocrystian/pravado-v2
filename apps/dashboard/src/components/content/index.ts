/**
 * Content Pillar Components
 *
 * Barrel export for Content Work Surface components.
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 */

// ============================================
// TYPES
// ============================================
export * from './types';

// ============================================
// TOKENS (DS v3.1)
// ============================================
export * from './tokens';

// ============================================
// SHELL & LAYOUT
// ============================================
export { ContentWorkSurfaceShell, type ContentWorkSurfaceShellProps } from './ContentWorkSurfaceShell';

// ============================================
// VIEWS
// ============================================
export { ContentOverviewView } from './views/ContentOverviewView';
export { ContentLibraryView, AssetDetailPreview } from './views/ContentLibraryView';
export { ContentCalendarView, ContentAgendaView } from './views/ContentCalendarView';
export { ContentInsightsView } from './views/ContentInsightsView';

// ============================================
// COMPONENTS
// ============================================
export { ContentAssetCard } from './components/ContentAssetCard';
export { ContentEmptyState } from './components/ContentEmptyState';
export { ContentLoadingSkeleton } from './components/ContentLoadingSkeleton';
export { ContentFiltersPanel, QuickFilterBar } from './components/ContentFiltersPanel';
export { AuthorityDashboard, AuthorityStrip } from './components/AuthorityDashboard';
export { CiteMindStatusIndicator, CiteMindGatePanel } from './components/CiteMindStatusIndicator';
export { DerivativesPanel, type DerivativesPanelProps } from './components/DerivativesPanel';
export { CiteMindGatingPanel, type CiteMindGatingPanelProps } from './components/CiteMindGatingPanel';
export { LifecycleStepper, type LifecycleStatus, type LifecycleStepperProps } from './components/LifecycleStepper';
export { CrossPillarHooksPanel, type CrossPillarHooksPanelProps } from './components/CrossPillarHooksPanel';
export {
  VersionHistoryPanel,
  type VersionHistoryPanelProps,
  type VersionEvent,
  type VersionEventType,
} from './components/VersionHistoryPanel';

// ============================================
// HOOKS
// ============================================
export {
  useContentItems,
  useContentBriefs,
  useContentGaps,
  useContentClusters,
  useContentSignals,
} from './hooks/useContentData';
