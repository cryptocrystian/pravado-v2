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
// AI PERCEPTION (Phase 9A)
// ============================================
export {
  type AIPerceptualState,
  type ConfidenceLevel,
  AI_STATE_PRIORITY,
  AI_PERCEPTUAL_SIGNALS,
  CONFIDENCE_SIGNALS,
  deriveAIPerceptualState,
  getHighestPriorityState,
  getConfidenceLevel,
} from './ai-perception';

// ============================================
// SHELL & LAYOUT
// ============================================
export { ContentWorkSurfaceShell, type ContentWorkSurfaceShellProps } from './ContentWorkSurfaceShell';

// ============================================
// VIEWS
// ============================================
export { ContentWorkQueueView } from './views/ContentWorkQueueView';
export { ManualModeView } from './views/ManualModeView';
export { CopilotModeView } from './views/CopilotModeView';
export { AutopilotModeView } from './views/AutopilotModeView';
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
export { CiteMindPublishGate, type CiteMindPublishGateProps } from './components/CiteMindPublishGate';
export { LifecycleStepper, type LifecycleStatus, type LifecycleStepperProps } from './components/LifecycleStepper';
export { CrossPillarHooksPanel, type CrossPillarHooksPanelProps } from './components/CrossPillarHooksPanel';
export {
  VersionHistoryPanel,
  type VersionHistoryPanelProps,
  type VersionEvent,
  type VersionEventType,
} from './components/VersionHistoryPanel';

// AI State Indicators (Phase 9A)
export {
  AmbientAIIndicator,
  LocalAIIndicator,
  AIStateRing,
  AIProgressIndicator,
  AIStateDot,
} from './components/AIStateIndicator';

// ============================================
// EDITOR (Phase 1 - Block Editor)
// ============================================
export {
  TiptapEditor,
  type TiptapEditorProps,
  type TiptapEditorHandle,
  type HeadingNode,
  type SaveState,
  DocumentOutline,
  type DocumentOutlineProps,
  ArticleEditor,
  type ArticleEditorProps,
  PravadoEditor,
  type PravadoEditorProps,
  DocumentRail,
  type DocumentRailProps,
  ContextRailEditor,
  type ContextRailEditorProps,
} from './editor';

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

// ============================================
// ORCHESTRATION (Phase 6A)
// ============================================
export {
  OrchestrationEditorShell,
  type TriggerAction,
  type EntityChecklistItem,
  type TargetAIProfile,
  type OrchestrationEditorShellProps,
  ModeSelector,
  ModeIndicator,
  ModeBehaviorBanner,
  LivingCanvasEditor,
  AutopilotDraftPreview,
  ExplainabilityDrawer,
} from './orchestration';
