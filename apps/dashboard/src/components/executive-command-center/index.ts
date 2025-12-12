/**
 * Executive Command Center Components (Sprint S61 + S94)
 * Barrel exports for all executive dashboard components
 */

// Original S61 Components
export { ExecDashboardCard } from './ExecDashboardCard';
export { ExecKpiGrid } from './ExecKpiGrid';
export { ExecInsightsFeed } from './ExecInsightsFeed';
export { ExecNarrativePanel } from './ExecNarrativePanel';
export { ExecFilterBar } from './ExecFilterBar';
export { ExecDashboardHeader } from './ExecDashboardHeader';
export {
  ExecDashboardLayout,
  ExecTwoPanelLayout,
  ExecStackLayout,
} from './ExecDashboardLayout';

// S94 Executive Intelligence Components
export {
  ExecSituationBrief,
  type SituationBriefData,
  type SituationChange,
  type EmergingSignal,
  type AttentionItem,
} from './ExecSituationBrief';

export {
  ExecDecisionPanel,
  type DecisionPanelData,
  type Decision,
  type DecisionStatus,
  type DecisionUrgency,
  type DecisionCategory,
  type DecisionDependency,
  type DecisionRecommendation,
} from './ExecDecisionPanel';

export {
  ExecSignalTimeline,
  type TimelineData,
  type TimelineSignal,
  type SignalType,
  type SignalSeverity,
} from './ExecSignalTimeline';

// S94-B Narrative Density Component
export {
  ExecNarrativeDensityCard,
  withNarrativeDensity,
  generateDefaultDensity,
  type NarrativeDensityData,
  type NarrativeInput,
  type NarrativeChange,
  type NarrativeAction,
} from './ExecNarrativeDensityCard';
