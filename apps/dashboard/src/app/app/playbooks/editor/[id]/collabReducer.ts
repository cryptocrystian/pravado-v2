/**
 * Collaboration Reducer (Sprint S22)
 * Manages collaborative editing state and applies remote events
 */

import type {
  EditorEvent,
  UserPresence,
  CursorPosition,
  NodeSelection,
  GraphPatch,
  GraphNode,
  GraphEdge,
} from '@/hooks/useEditorStream';

/**
 * Collaboration state
 */
export interface CollaborationState {
  presence: UserPresence[];
  cursors: Record<string, CursorPosition>;
  selections: Record<string, NodeSelection>;
  remoteGraphVersion: number;
}

/**
 * Initial collaboration state
 */
export const initialCollabState: CollaborationState = {
  presence: [],
  cursors: {},
  selections: {},
  remoteGraphVersion: 0,
};

/**
 * Apply graph patch to nodes/edges
 */
export function applyGraphPatch(
  nodes: GraphNode[],
  edges: GraphEdge[],
  patch: GraphPatch
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  let updatedNodes = [...nodes];
  let updatedEdges = [...edges];

  // Apply node additions
  if (patch.nodesAdded) {
    updatedNodes = [...updatedNodes, ...patch.nodesAdded];
  }

  // Apply node removals
  if (patch.nodesRemoved) {
    const removeIds = new Set(patch.nodesRemoved);
    updatedNodes = updatedNodes.filter((node) => !removeIds.has(node.id));
  }

  // Apply node updates
  if (patch.nodesUpdated) {
    const updateMap = new Map(patch.nodesUpdated.map((u) => [u.id, u]));
    updatedNodes = updatedNodes.map((node) => {
      const update = updateMap.get(node.id);
      if (update) {
        return { ...node, ...update };
      }
      return node;
    });
  }

  // Apply edge additions
  if (patch.edgesAdded) {
    updatedEdges = [...updatedEdges, ...patch.edgesAdded];
  }

  // Apply edge removals
  if (patch.edgesRemoved) {
    const removeIds = new Set(patch.edgesRemoved);
    updatedEdges = updatedEdges.filter((edge) => !removeIds.has(edge.id));
  }

  // Apply edge updates
  if (patch.edgesUpdated) {
    const updateMap = new Map(patch.edgesUpdated.map((u) => [u.id, u]));
    updatedEdges = updatedEdges.map((edge) => {
      const update = updateMap.get(edge.id);
      if (update) {
        return { ...edge, ...update };
      }
      return edge;
    });
  }

  return { nodes: updatedNodes, edges: updatedEdges };
}

/**
 * Collaboration reducer action types
 */
export type CollabAction =
  | { type: 'APPLY_EVENT'; event: EditorEvent }
  | { type: 'RESET' }
  | { type: 'SET_PRESENCE'; presence: UserPresence[] }
  | { type: 'UPDATE_CURSOR'; userId: string; position: CursorPosition }
  | { type: 'UPDATE_SELECTION'; userId: string; selection: NodeSelection }
  | { type: 'REMOVE_USER'; userId: string };

/**
 * Collaboration state reducer
 */
export function collabReducer(
  state: CollaborationState,
  action: CollabAction
): CollaborationState {
  switch (action.type) {
    case 'APPLY_EVENT': {
      const event = action.event;

      switch (event.type) {
        case 'presence.join': {
          const user = event.payload.user as UserPresence;
          // Add user if not already present
          if (!state.presence.find((u) => u.userId === user.userId)) {
            return {
              ...state,
              presence: [...state.presence, user],
            };
          }
          return state;
        }

        case 'presence.leave': {
          const userId = event.payload.userId as string;
          // Remove user and their cursor/selection
          const { [userId]: _, ...cursors } = state.cursors;
          const { [userId]: __, ...selections } = state.selections;
          return {
            ...state,
            presence: state.presence.filter((u) => u.userId !== userId),
            cursors,
            selections,
          };
        }

        case 'presence.list': {
          const users = event.payload.users as UserPresence[];
          return {
            ...state,
            presence: users,
          };
        }

        case 'cursor.update': {
          const position = event.payload.position as CursorPosition;
          return {
            ...state,
            cursors: {
              ...state.cursors,
              [event.userId]: position,
            },
          };
        }

        case 'selection.update': {
          const selection = event.payload.selection as NodeSelection;
          return {
            ...state,
            selections: {
              ...state.selections,
              [event.userId]: selection,
            },
          };
        }

        case 'graph.patch': {
          // Increment remote graph version
          return {
            ...state,
            remoteGraphVersion: state.remoteGraphVersion + 1,
          };
        }

        case 'graph.replace': {
          const graphVersion = event.payload.graphVersion as number;
          return {
            ...state,
            remoteGraphVersion: graphVersion,
          };
        }

        default:
          return state;
      }
    }

    case 'RESET':
      return initialCollabState;

    case 'SET_PRESENCE':
      return {
        ...state,
        presence: action.presence,
      };

    case 'UPDATE_CURSOR':
      return {
        ...state,
        cursors: {
          ...state.cursors,
          [action.userId]: action.position,
        },
      };

    case 'UPDATE_SELECTION':
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.userId]: action.selection,
        },
      };

    case 'REMOVE_USER': {
      const { [action.userId]: _, ...cursors } = state.cursors;
      const { [action.userId]: __, ...selections } = state.selections;
      return {
        ...state,
        presence: state.presence.filter((u) => u.userId !== action.userId),
        cursors,
        selections,
      };
    }

    default:
      return state;
  }
}

/**
 * Generate a unique patch ID
 */
export function generatePatchId(): string {
  return `patch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a graph patch from node/edge changes
 */
export function createGraphPatch(
  userId: string,
  changes: {
    nodesAdded?: GraphNode[];
    nodesRemoved?: string[];
    nodesUpdated?: Partial<GraphNode & { id: string }>[];
    edgesAdded?: GraphEdge[];
    edgesRemoved?: string[];
    edgesUpdated?: Partial<GraphEdge & { id: string }>[];
  }
): GraphPatch {
  return {
    patchId: generatePatchId(),
    userId,
    ...changes,
  };
}

/**
 * Check if a node is locked by another user
 */
export function isNodeLocked(
  nodeId: string,
  currentUserId: string,
  selections: Record<string, NodeSelection>
): { locked: boolean; lockedBy?: string } {
  for (const [userId, selection] of Object.entries(selections)) {
    if (userId !== currentUserId && selection.nodeIds.includes(nodeId)) {
      return { locked: true, lockedBy: userId };
    }
  }
  return { locked: false };
}

/**
 * Get user by ID from presence list
 */
export function getUserById(
  userId: string,
  presence: UserPresence[]
): UserPresence | undefined {
  return presence.find((u) => u.userId === userId);
}
