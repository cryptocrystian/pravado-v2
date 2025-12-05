/**
 * useExecutionStream Hook (Sprint S21)
 * React hook for subscribing to real-time playbook execution updates via SSE
 */

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Execution event types (matches backend)
 */
export type ExecutionEventType =
  | 'run.updated'
  | 'run.completed'
  | 'run.failed'
  | 'step.updated'
  | 'step.log.appended'
  | 'step.completed'
  | 'step.failed';

/**
 * Execution event structure (matches backend)
 */
export interface ExecutionEvent {
  type: ExecutionEventType;
  runId: string;
  stepKey?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Hook state
 */
interface UseExecutionStreamState {
  connected: boolean;
  events: ExecutionEvent[];
  lastEvent: ExecutionEvent | null;
  error: string | null;
}

/**
 * Hook options
 */
interface UseExecutionStreamOptions {
  /**
   * Whether to enable the stream (default: true)
   */
  enabled?: boolean;
  /**
   * Maximum number of events to keep in memory (default: 100)
   */
  maxEvents?: number;
  /**
   * Retry delay in milliseconds (default: 3000)
   */
  retryDelay?: number;
  /**
   * Maximum retry attempts before giving up (default: 5)
   */
  maxRetries?: number;
}

/**
 * Hook for subscribing to execution stream via SSE
 * @param runId - The playbook run ID to subscribe to
 * @param options - Stream options
 * @returns Stream state and controls
 */
export function useExecutionStream(
  runId: string | null,
  options: UseExecutionStreamOptions = {}
) {
  const {
    enabled = true,
    maxEvents = 100,
    retryDelay = 3000,
    maxRetries = 5,
  } = options;

  const [state, setState] = useState<UseExecutionStreamState>({
    connected: false,
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
    (event: ExecutionEvent) => {
      setState((prev) => ({
        ...prev,
        events: [...prev.events.slice(-(maxEvents - 1)), event],
        lastEvent: event,
      }));
    },
    [maxEvents]
  );

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (!runId || !enabled) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const streamUrl = `${apiUrl}/api/v1/playbook-runs/${runId}/stream`;

    try {
      const eventSource = new EventSource(streamUrl, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.addEventListener('connected', () => {
        setState((prev) => ({
          ...prev,
          connected: true,
          error: null,
        }));
        retryCountRef.current = 0;
        console.log('[SSE] Connected to execution stream');
      });

      // Listen to all execution event types
      const eventTypes: ExecutionEventType[] = [
        'run.updated',
        'run.completed',
        'run.failed',
        'step.updated',
        'step.log.appended',
        'step.completed',
        'step.failed',
      ];

      eventTypes.forEach((eventType) => {
        eventSource.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const event: ExecutionEvent = JSON.parse(e.data);
            addEvent(event);
          } catch (err) {
            console.error('[SSE] Failed to parse event:', err);
          }
        });
      });

      // Error handling
      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
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

          console.log(
            `[SSE] Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`
          );

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
      console.error('[SSE] Failed to create EventSource:', err);
      setState((prev) => ({
        ...prev,
        connected: false,
        error: 'Failed to establish connection',
      }));
    }
  }, [runId, enabled, addEvent, retryDelay, maxRetries]);

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
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      events: [],
      lastEvent: null,
    }));
  }, []);

  // Connect on mount and when runId changes
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
    clearEvents,
  };
}
