/**
 * Visual Playbook Editor - Graph Type Definitions (Sprint S17)
 * Internal graph DSL for the visual editor
 */

import type { Node, Edge } from 'reactflow';

/**
 * Node types supported in the visual editor
 */
export type NodeType = 'AGENT' | 'DATA' | 'BRANCH' | 'API';

/**
 * Custom data for editor nodes
 */
export interface EditorNodeData {
  label: string;
  config: Record<string, unknown>;
  errors?: string[];
}

/**
 * Editor node - React Flow Node with custom data
 */
export type EditorNode = Node<EditorNodeData> & {
  type: NodeType;
};

/**
 * Editor edge - React Flow Edge with optional label
 */
export type EditorEdge = Edge & {
  label?: string;
};

/**
 * Complete editor graph
 */
export interface EditorGraph {
  nodes: EditorNode[];
  edges: EditorEdge[];
}

/**
 * Validation result for a node
 */
export interface NodeValidation {
  nodeId: string;
  valid: boolean;
  errors: string[];
}

/**
 * Graph validation result
 */
export interface GraphValidation {
  valid: boolean;
  nodes: NodeValidation[];
  globalErrors: string[];
}

/**
 * Execution plan step
 */
export interface ExecutionPlanStep {
  stepKey: string;
  type: NodeType;
  label: string;
  nextSteps: string[];
  branchInfo?: {
    condition: string;
    truePath: string;
    falsePath: string;
  };
}

/**
 * Complete execution plan
 */
export interface ExecutionPlan {
  steps: ExecutionPlanStep[];
  entryPoint: string;
  validation: GraphValidation;
}

/**
 * Node configuration types
 */

export interface AgentNodeConfig {
  agentId?: string;
  personalityId?: string | null;
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  inputMapping?: Record<string, unknown>;
  outputKey?: string;
  errorHandling?: 'fail' | 'continue' | 'retry';
}

export interface DataNodeConfig {
  operation: 'pluck' | 'map' | 'merge' | 'filter' | 'transform';
  sourceKey?: string;
  fields?: string[];
  mapping?: Record<string, unknown>;
  transform?: string; // JS expression
  outputKey?: string;
}

export interface BranchNodeConfig {
  condition: string; // JS expression
  trueStep?: string;
  falseStep?: string;
}

export interface ApiNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout?: number;
  outputKey?: string;
}

/**
 * Union type for all node configs
 */
export type NodeConfig = AgentNodeConfig | DataNodeConfig | BranchNodeConfig | ApiNodeConfig;

/**
 * Editor state
 */
export interface EditorState {
  graph: EditorGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDirty: boolean;
  validation: GraphValidation | null;
  isValidating: boolean;
  isSaving: boolean;
  error: string | null;
}
