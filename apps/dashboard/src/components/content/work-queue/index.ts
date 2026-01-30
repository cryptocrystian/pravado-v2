/**
 * Content Work Queue Triage Components
 *
 * Selection-driven triage layout for the Content Work Queue.
 * Replaces stacked-card layout with 3-pane triage:
 * - Left: QueueList (dense rows)
 * - Center: WorkbenchCanvas (selected item details)
 * - Right: ContextRail (CiteMind, entities, derivatives, cross-pillar)
 *
 * @see /docs/canon/AUTOMATION_MODE_CONTRACTS_CANON.md
 */

export { QueueList, type QueueListProps } from './QueueList';
export { QueueRow, type QueueItem, type QueueRowProps } from './QueueRow';
export { WorkbenchCanvas, type WorkbenchCanvasProps } from './WorkbenchCanvas';
export { ContextRail, type ContextRailProps } from './ContextRail';
