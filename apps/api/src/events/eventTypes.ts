/**
 * Event Types for Execution Streaming (Sprint S21)
 * Defines event types and payloads for the internal event bus
 */

/**
 * Execution event types
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
 * Execution event payload
 */
export interface ExecutionEvent {
  type: ExecutionEventType;
  runId: string;
  stepKey?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Run updated event payload
 */
export interface RunUpdatedPayload {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentStepKey?: string | null;
  progress?: number;
}

/**
 * Run completed event payload
 */
export interface RunCompletedPayload {
  status: 'COMPLETED';
  completedAt: string;
  totalSteps: number;
  successfulSteps: number;
}

/**
 * Run failed event payload
 */
export interface RunFailedPayload {
  status: 'FAILED';
  error: string;
  failedAt: string;
  failedStepKey?: string;
}

/**
 * Step updated event payload
 */
export interface StepUpdatedPayload {
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  attempt?: number;
  startedAt?: string;
}

/**
 * Step log appended event payload
 */
export interface StepLogAppendedPayload {
  logEntry: {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Step completed event payload
 */
export interface StepCompletedPayload {
  status: 'SUCCESS';
  completedAt: string;
  result?: Record<string, unknown>;
  duration?: number;
}

/**
 * Step failed event payload
 */
export interface StepFailedPayload {
  status: 'FAILED';
  error: string;
  failedAt: string;
  attempt: number;
  willRetry: boolean;
}
