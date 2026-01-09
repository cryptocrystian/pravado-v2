/**
 * Command Center Components
 *
 * Exports all Command Center UI components for the tri-pane layout.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

export { TriPaneShell } from './TriPaneShell';
export { ActionStreamPane } from './ActionStreamPane';
export { ActionCard, type DensityLevel } from './ActionCard';
export { IntelligenceCanvasPane } from './IntelligenceCanvasPane';
export { StrategyPanelPane } from './StrategyPanelPane';
export { CalendarPeek } from './CalendarPeek';
export { ActionPeekDrawer } from './ActionPeekDrawer';
export { CommandCenterTopbar } from './CommandCenterTopbar';

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
} from './types';
