/**
 * Command Center Components
 *
 * Exports all Command Center UI components for the tri-pane layout.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

export { TriPaneShell } from './TriPaneShell';
export { ActionStreamPane } from './ActionStreamPane';
export { ActionCard, type DensityLevel, type ExecutionState } from './ActionCard';
export { ActionModal } from './ActionModal';
export { IntelligenceCanvasPane } from './IntelligenceCanvasPane';
export { StrategyPanelPane } from './StrategyPanelPane';
export { CalendarPeek } from './CalendarPeek';
// Note: ActionPeekDrawer is deprecated - use ActionModal instead
// export { ActionPeekDrawer } from './ActionPeekDrawer';
export { CommandCenterTopbar } from './CommandCenterTopbar';
export { EVIExplainerModal } from './EVIExplainerModal';
export { EVIForecastPanel } from './EVIForecastPanel';
export { EntityMap } from './EntityMap';

// Pillar accent system
export { pillarAccents, priorityStyles, modeStyles, surfaceTokens, cardClasses, getPillarCardClasses } from './pillar-accents';

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
  // Entity Map types
  EntityNode,
  EntityEdge,
  EntityZone,
  EdgeRel,
  ActionImpactMap,
  EntityMapResponse,
} from './types';
