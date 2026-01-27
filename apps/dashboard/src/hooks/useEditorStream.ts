/**
 * useEditorStream Hook (Sprint S22)
 * React hook for subscribing to real-time editor collaboration events via SSE
 */

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Editor event types (matches backend)
 */
export type EditorEventType =
  | 'presence.join'
  | 'presence.leave'
  | 'presence.list'
  | 'cursor.update'
  | 'selection.update'
  | 'graph.patch'
  | 'graph.replace'
  | 'user.activity';

/**
 * User presence information
 */
export interface UserPresence {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  joinedAt: string;
  lastActivityAt: string;
}

/**
 * Cursor position
 */
export interface CursorPosition {
  x: number;
  y: number;
  viewportX?: number;
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
 * Graph node
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
 * Graph patch
 */
export interface GraphPatch {
  patchId: string;
  userId: string;
  nodesAdded?: GraphNode[];
  nodesRemoved?: string[];
  nodesUpdated?: Partial<GraphNode & { id: string }>[];
  edgesAdded?: GraphEdge[];
  edgesRemoved?: string[];
  edgesUpdated?: Partial<GraphEdge & { id: string }>[];
}

/**
 * Editor event structure
 */
export interface EditorEvent {
  type: EditorEventType;
  playbookId: string;
  userId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Hook state
 */
interface UseEditorStreamState {
  connected: boolean;
  presence: UserPresence[];
  cursors: Record<string, CursorPosition>;
  selections: Record<string, NodeSelection>;
  events: EditorEvent[];
  lastEvent: EditorEvent | null;
  error: string | null;
}

/**
 * Hook options
 */
interface UseEditorStreamOptions {
  enabled?: boolean;
  maxEvents?: number;
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Hook for subscribing to editor collaboration stream via SSE
 * @param playbookId - The playbook ID to subscribe to
 * @param options - Stream options
 * @returns Stream state and controls
 */
export function useEditorStream(
  playbookId: string | null,
  options: UseEditorStreamOptions = {}
) {
  const {
    enabled = true,
    maxEvents = 100,
    retryDelay = 3000,
    maxRetries = 5,
  } = options;

  const [state, setState] = useState<UseEditorStreamState>({
    connected: false,
    presence: [],
    cursors: {},
    selections: {},
    events: [],
    lastEvent: null,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Add event to state
   */
  const addEvent = useCallback(
    (event: EditorEvent) => {
      setState((prev) => {
        const newState = {
          ...prev,
          events: [...prev.events.slice(-(maxEvents - 1)), event],
          lastEvent: event,
        };

        // Update presence
        if (event.type === 'presence.join') {
          const user = event.payload.user as UserPresence;
          if (!newState.presence.find((u) => u.userId === user.userId)) {
            newState.presence = [...newState.presence, user];
          }
        } else if (event.type === 'presence.leave') {
          const userId = event.payload.userId as string;
          newState.presence = newState.presence.filter((u) => u.userId !== userId);
          // Clean up cursor and selection
          const { [userId]: _, ...cursors } = newState.cursors;
          const { [userId]: __, ...selections } = newState.selections;
          newState.cursors = cursors;
          newState.selections = selections;
        } else if (event.type === 'presence.list') {
          newState.presence = event.payload.users as UserPresence[];
        }

        // Update cursors
        if (event.type === 'cursor.update') {
          newState.cursors = {
            ...newState.cursors,
            [event.userId]: event.payload.position as CursorPosition,
          };
        }

        // Update selections
        if (event.type === 'selection.update') {
          newState.selections = {
            ...newState.selections,
            [event.userId]: event.payload.selection as NodeSelection,
          };
        }

        return newState;
      });
    },
    [maxEvents]
  );

  /**
   * Connect to SSE stream
   * Gate 1A: Fetch stream URL from route handler (includes auth token)
   */
  const connect = useCallback(async () => {
    if (!playbookId || !enabled) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Gate 1A: Get authenticated stream URL from route handler
      const response = await fetch(`/api/playbooks/${playbookId}/editor/stream`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!result.success || !result.data?.streamUrl) {
        throw new Error('Failed to get stream URL');
      }

      const eventSource = new EventSource(result.data.streamUrl);

      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.addEventListener('connected', () => {
        setState((prev) => ({
          ...prev,
          connected: true,
          error: null,
        }));
        retryCountRef.current = 0;
      });

      // Listen to all editor event types
      const eventTypes: EditorEventType[] = [
        'presence.join',
        'presence.leave',
        'presence.list',
        'cursor.update',
        'selection.update',
        'graph.patch',
        'graph.replace',
        'user.activity',
      ];

      eventTypes.forEach((eventType) => {
        eventSource.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const event: EditorEvent = JSON.parse(e.data);
            addEvent(event);
          } catch (err) {
            // Failed to parse event - skip it
          }
        });
      });

      // Error handling
      eventSource.onerror = () => {
        eventSource.close();

        setState((prev) => ({
          ...prev,
          connected: false,
          error: 'Stream connection lost',
        }));

        // Retry with exponential backoff
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);

          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setState((prev) => ({
            ...prev,
            error: 'Max retries reached. Stream disconnected.',
          }));
        }
      };
    } catch (err) {
      setState((prev) => ({
        ...prev,
        connected: false,
        error: 'Failed to establish connection',
      }));
    }
  }, [playbookId, enabled, addEvent, retryDelay, maxRetries]);

  /**
   * Disconnect from stream
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      connected: false,
    }));

    retryCountRef.current = 0;
  }, []);

  /**
   * Manually retry connection
   */
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  /**
   * Send cursor update
   * Gate 1A: Use route handler, not direct backend call
   */
  const sendCursor = useCallback(
    async (position: CursorPosition) => {
      if (!playbookId) return;

      try {
        await fetch(`/api/playbooks/${playbookId}/editor/cursor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ position }),
        });
      } catch (error) {
        // Failed to send cursor - ignore silently
      }
    },
    [playbookId]
  );

  /**
   * Send selection update
   * Gate 1A: Use route handler, not direct backend call
   */
  const sendSelection = useCallback(
    async (selection: NodeSelection, lock: boolean = false) => {
      if (!playbookId) return;

      try {
        await fetch(`/api/playbooks/${playbookId}/editor/selection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ selection, lock }),
        });
      } catch (error) {
        // Failed to send selection - ignore silently
      }
    },
    [playbookId]
  );

  /**
   * Send graph patch
   * Gate 1A: Use route handler, not direct backend call
   */
  const sendPatch = useCallback(
    async (patch: GraphPatch, graphVersion?: number) => {
      if (!playbookId) return;

      try {
        await fetch(`/api/playbooks/${playbookId}/editor/graph/patch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ patch, graphVersion }),
        });
      } catch (error) {
        // Failed to send patch - ignore silently
      }
    },
    [playbookId]
  );

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      events: [],
      lastEvent: null,
    }));
  }, []);

  // Connect on mount and when playbookId changes
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    disconnect,
    retry,
    sendCursor,
    sendSelection,
    sendPatch,
    clearEvents,
  };
}
