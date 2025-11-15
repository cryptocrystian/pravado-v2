/**
 * Agent system types for Pravado's multi-agent runtime
 * This is a foundation layer - full runtime implementation happens in S4+
 */

import type { UUID } from './common';

/**
 * Agent capabilities and metadata
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'pr' | 'content' | 'seo' | 'general';
  capabilities: string[]; // e.g., ['research', 'writing', 'analysis']
  requiredInputs: string[]; // required fields in task input
  outputSchema: Record<string, unknown>; // JSON schema for output
  estimatedDuration?: string; // e.g., '2-5 minutes'
  metadata?: Record<string, unknown>;
}

/**
 * Task input for agent execution
 */
export interface AgentTask<TInput = Record<string, unknown>> {
  id: UUID;
  agentId: string;
  input: TInput;
  context?: {
    orgId: UUID;
    userId: UUID;
    playbookId?: UUID;
    [key: string]: unknown;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

/**
 * Agent execution result
 */
export interface AgentResult<TOutput = Record<string, unknown>> {
  taskId: UUID;
  agentId: string;
  status: 'success' | 'failure' | 'partial';
  output?: TOutput;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metrics?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    tokensUsed?: number;
    cost?: number;
  };
  artifacts?: {
    type: string; // 'document', 'report', 'data', 'analysis'
    url?: string;
    data?: unknown;
  }[];
}

/**
 * Playbook node in workflow DAG
 */
export interface PlaybookNode {
  id: string;
  agentId: string;
  label?: string;
  input: Record<string, unknown> | string; // static input or reference to previous node output
  dependsOn?: string[]; // array of node IDs that must complete first
  condition?: {
    // conditional execution based on previous results
    nodeId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value?: unknown;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Complete playbook definition
 */
export interface PlaybookTemplate {
  id: UUID;
  name: string;
  description: string;
  category: 'pr' | 'content' | 'seo' | 'general';
  nodes: PlaybookNode[];
  expectedOutputs: string[]; // what this playbook produces
  estimatedDuration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Playbook version for tracking changes
 */
export interface PlaybookVersion {
  id: UUID;
  playbookId: UUID;
  version: number;
  nodes: PlaybookNode[];
  changelog?: string;
  createdBy: UUID;
  createdAt: string;
  isActive: boolean;
}

/**
 * Playbook execution instance
 */
export interface PlaybookExecution {
  id: UUID;
  playbookId: UUID;
  orgId: UUID;
  userId: UUID;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNodeId?: string;
  results: Record<string, AgentResult>; // nodeId -> result mapping
  startedAt?: string;
  completedAt?: string;
  error?: {
    code: string;
    message: string;
    nodeId?: string;
  };
}

/**
 * API response types for agents
 */
export interface ListAgentsResponse {
  success: boolean;
  data?: {
    agents: AgentDefinition[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ListPlaybooksResponse {
  success: boolean;
  data?: {
    playbooks: PlaybookTemplate[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidatePlaybookResponse {
  success: boolean;
  data?: {
    valid: boolean;
    errors?: Array<{
      nodeId?: string;
      field?: string;
      message: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}
