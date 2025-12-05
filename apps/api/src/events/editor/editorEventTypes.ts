/**
 * Editor Event Types (Sprint S22)
 * Type definitions for real-time collaborative editing events
 */

/**
 * Editor event type enumeration
 */
export type EditorEventType =
  | 'presence.join'
  | 'presence.leave'
  | 'cursor.update'
  | 'selection.update'
  | 'graph.patch'
  | 'graph.replace'
  | 'user.activity';

/**
 * Base editor event structure
 */
export interface EditorEvent {
  type: EditorEventType;
  playbookId: string;
  userId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * User presence information
 */
export interface UserPresence {
  userId: string;
  userName: string;
  userEmail: string;
  color: string; // Hex color for cursor/selection
  joinedAt: string;
  lastActivityAt: string;
}

/**
 * Cursor position
 */
export interface CursorPosition {
  x: number;
  y: number;
  viewportX?: number; // Optional viewport coordinates
  viewportY?: number;
}

/**
 * Node selection
 */
export interface NodeSelection {
  nodeIds: string[];
  edgeIds: string[];
}

/**
 * Graph node (simplified from full PlaybookStep)
 */
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

/**
 * Graph edge
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
}

/**
 * Graph patch for incremental updates
 */
export interface GraphPatch {
  patchId: string; // Unique ID for deduplication
  userId: string; // Who made this change
  nodesAdded?: GraphNode[];
  nodesRemoved?: string[];
  nodesUpdated?: Partial<GraphNode & { id: string }>[];
  edgesAdded?: GraphEdge[];
  edgesRemoved?: string[];
  edgesUpdated?: Partial<GraphEdge & { id: string }>[];
}

/**
 * Presence join event payload
 */
export interface PresenceJoinPayload {
  user: UserPresence;
}

/**
 * Presence leave event payload
 */
export interface PresenceLeavePayload {
  userId: string;
  reason?: 'disconnect' | 'leave' | 'timeout';
}

/**
 * Cursor update event payload
 */
export interface CursorUpdatePayload {
  position: CursorPosition;
}

/**
 * Selection update event payload
 */
export interface SelectionUpdatePayload {
  selection: NodeSelection;
  lock?: boolean; // Whether this selection locks nodes for editing
}

/**
 * Graph patch event payload
 */
export interface GraphPatchPayload {
  patch: GraphPatch;
  graphVersion?: number; // Optional version for conflict detection
}

/**
 * Graph replace event payload
 */
export interface GraphReplacePayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  graphVersion: number;
}

/**
 * User activity event payload
 */
export interface UserActivityPayload {
  action: 'typing' | 'idle' | 'active';
  nodeId?: string; // Which node user is interacting with
}

/**
 * Helper type for typed event payloads
 */
export type EditorEventPayload<T extends EditorEventType> = T extends 'presence.join'
  ? PresenceJoinPayload
  : T extends 'presence.leave'
  ? PresenceLeavePayload
  : T extends 'cursor.update'
  ? CursorUpdatePayload
  : T extends 'selection.update'
  ? SelectionUpdatePayload
  : T extends 'graph.patch'
  ? GraphPatchPayload
  : T extends 'graph.replace'
  ? GraphReplacePayload
  : T extends 'user.activity'
  ? UserActivityPayload
  : Record<string, unknown>;
