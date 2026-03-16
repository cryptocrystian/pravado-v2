/**
 * Command Center Components
 *
 * v3 tri-pane layout with Entity Map concentric ring architecture.
 */

// --- v2 Command Center components ---
export { SituationBrief } from './SituationBrief';
export { ActionQueue } from './ActionQueue';
export { SageRecommendations } from './SageRecommendations';
export { EviScoreCard } from './EviScoreCard';
export { SagePulse } from './SagePulse';
export { OnboardingChecklist } from './OnboardingChecklist';

// --- Shared / layout components ---
export { CommandCenterTopbar } from './CommandCenterTopbar';

// --- Tri-pane shell + pane components ---
export { TriPaneShell } from './TriPaneShell';
export { ActionStreamPane } from './ActionStreamPane';
export { ActionCard, type DensityLevel, type ExecutionState } from './ActionCard';
export { ActionModal } from './ActionModal';
export { IntelligenceCanvasPane } from './IntelligenceCanvasPane';
export { StrategyPanelPane } from './StrategyPanelPane';
export { CalendarPeek } from './CalendarPeek';
export { EVIExplainerModal } from './EVIExplainerModal';
export { EVIForecastPanel } from './EVIForecastPanel';
export { EntityMap } from './EntityMap';

// Pillar accent system
export { pillarAccents, priorityStyles, modeStyles, cardClasses, getPillarCardClasses } from './pillar-accents';

// Re-export types
export type {
  ActionItem,
  ActionStreamResponse,
  IntelligenceCanvasResponse,
  StrategyPanelResponse,
  OrchestrationCalendarResponse,
  Pillar,
  Priority,
  Mode,
  EVIFilterState,
  EVIDriverType,
  TopMover,
  EntityNode,
  EntityEdge,
  EdgeState,
  EdgeRel,
  ActionImpactMap,
  EntityMapPayload,
  SessionCitationEvent,
} from './types';
