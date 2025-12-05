/**
 * Playbook Graph Service (Sprint S17)
 * Server-side mapping between Playbook schema and Graph representation
 */

import type { PlaybookDefinitionDTO, PlaybookStep } from '@pravado/types';

/**
 * Graph node for visual editor
 */
export interface GraphNode {
  id: string;
  type: 'AGENT' | 'DATA' | 'BRANCH' | 'API';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, unknown>;
  };
}

/**
 * Graph edge for visual editor
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Complete graph representation
 */
export interface PlaybookGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Convert PlaybookDefinitionDTO to graph
 */
export function playbookToGraph(playbook: PlaybookDefinitionDTO): PlaybookGraph {
  const { steps } = playbook;

  // Create nodes from steps
  const nodes: GraphNode[] = steps.map((step, index) => ({
    id: step.key,
    type: step.type,
    position: {
      x: 100 + (index % 3) * 300,
      y: 100 + Math.floor(index / 3) * 200,
    },
    data: {
      label: step.name,
      config: step.config,
    },
  }));

  // Create edges from step relationships
  const edges: GraphEdge[] = [];

  for (const step of steps) {
    // Regular nextStepKey edges
    if (step.nextStepKey) {
      edges.push({
        id: `${step.key}-${step.nextStepKey}`,
        source: step.key,
        target: step.nextStepKey,
      });
    }

    // BRANCH nodes have special edges
    if (step.type === 'BRANCH' && step.config) {
      const { trueStep, falseStep } = step.config as {
        trueStep?: string;
        falseStep?: string;
      };

      if (trueStep) {
        edges.push({
          id: `${step.key}-true-${trueStep}`,
          source: step.key,
          target: trueStep,
          label: 'true',
        });
      }

      if (falseStep) {
        edges.push({
          id: `${step.key}-false-${falseStep}`,
          source: step.key,
          target: falseStep,
          label: 'false',
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Convert graph to playbook steps
 */
export function graphToPlaybook(graph: PlaybookGraph): Partial<PlaybookStep>[] {
  const { nodes, edges } = graph;

  // Build edge lookup map
  const nodeEdges = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const existing = nodeEdges.get(edge.source) || [];
    existing.push(edge);
    nodeEdges.set(edge.source, existing);
  }

  // Convert nodes to steps
  const steps: Partial<PlaybookStep>[] = nodes.map((node, index) => {
    const outgoingEdges = nodeEdges.get(node.id) || [];
    let nextStepKey: string | null = null;

    if (node.type === 'BRANCH') {
      // For BRANCH, nextStepKey is null (branches in config)
      const trueEdge = outgoingEdges.find((e) => e.label === 'true');
      const falseEdge = outgoingEdges.find((e) => e.label === 'false');

      return {
        key: node.id,
        name: node.data.label,
        type: node.type,
        config: {
          ...node.data.config,
          trueStep: trueEdge?.target || null,
          falseStep: falseEdge?.target || null,
        },
        position: index,
        nextStepKey: null,
      };
    }

    // For other nodes, use first outgoing edge
    if (outgoingEdges.length > 0) {
      nextStepKey = outgoingEdges[0].target;
    }

    return {
      key: node.id,
      name: node.data.label,
      type: node.type,
      config: node.data.config,
      position: index,
      nextStepKey,
    };
  });

  return steps;
}

/**
 * Detect cycles in the graph using DFS
 */
function hasCycle(graph: PlaybookGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of graph.edges) {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  }

  // DFS to detect cycle
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Found a cycle
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check all components
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate graph structure (Sprint S20 Enhanced)
 */
export function validateGraph(graph: PlaybookGraph): {
  valid: boolean;
  errors: string[];
  issues: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
} {
  const errors: string[] = [];
  const issues: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }> = [];

  // Empty graph check
  if (graph.nodes.length === 0) {
    errors.push('Graph must have at least one node');
    issues.push({
      code: 'EMPTY_GRAPH',
      message: 'Graph must have at least one node',
      severity: 'error',
    });
  }

  // Check for duplicate step keys (node IDs)
  const nodeIds = new Set<string>();
  const duplicates: string[] = [];
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      duplicates.push(node.id);
    }
    nodeIds.add(node.id);
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate step keys found: ${duplicates.join(', ')}`);
    issues.push({
      code: 'DUPLICATE_KEYS',
      message: `Duplicate step keys found: ${duplicates.join(', ')}`,
      severity: 'error',
    });
  }

  // Check for entry point
  const targetNodes = new Set(graph.edges.map((e) => e.target));
  const entryNodes = graph.nodes.filter((n) => !targetNodes.has(n.id));

  if (entryNodes.length === 0 && graph.nodes.length > 0) {
    errors.push('Graph must have exactly one entry point (node with no incoming edges)');
    issues.push({
      code: 'NO_ENTRY_POINT',
      message: 'Graph must have an entry point',
      severity: 'error',
    });
  }

  if (entryNodes.length > 1) {
    errors.push(`Graph has ${entryNodes.length} entry points, but should have exactly one`);
    issues.push({
      code: 'MULTIPLE_ENTRY_POINTS',
      message: `Found ${entryNodes.length} entry points: ${entryNodes.map(n => n.data.label).join(', ')}`,
      severity: 'error',
    });
  }

  // Check for orphaned nodes
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const orphanedNodes = graph.nodes.filter(
    (n) => !connectedNodes.has(n.id) && graph.nodes.length > 1
  );

  if (orphanedNodes.length > 0) {
    errors.push(`Found ${orphanedNodes.length} orphaned nodes (not connected to graph)`);
    issues.push({
      code: 'ORPHANED_NODES',
      message: `Orphaned nodes: ${orphanedNodes.map(n => n.data.label).join(', ')}`,
      severity: 'error',
    });
  }

  // Check for cycles (Sprint S20)
  if (graph.nodes.length > 0 && hasCycle(graph)) {
    errors.push('Graph contains cycles (circular dependencies)');
    issues.push({
      code: 'CYCLIC_GRAPH',
      message: 'Graph contains cycles (circular dependencies)',
      severity: 'error',
    });
  }

  // Validate all edges connect to valid nodes
  const invalidEdges = graph.edges.filter(
    (e) => !nodeIds.has(e.source) || !nodeIds.has(e.target)
  );

  if (invalidEdges.length > 0) {
    errors.push(`Found ${invalidEdges.length} edges connecting to non-existent nodes`);
    issues.push({
      code: 'INVALID_EDGES',
      message: `${invalidEdges.length} edges reference non-existent nodes`,
      severity: 'error',
    });
  }

  // Validate BRANCH nodes have both true and false paths
  const branchNodes = graph.nodes.filter((n) => n.type === 'BRANCH');
  for (const branchNode of branchNodes) {
    const outgoingEdges = graph.edges.filter((e) => e.source === branchNode.id);
    const hasTrue = outgoingEdges.some((e) => e.label === 'true');
    const hasFalse = outgoingEdges.some((e) => e.label === 'false');

    if (!hasTrue || !hasFalse) {
      issues.push({
        code: 'INCOMPLETE_BRANCH',
        message: `Branch node "${branchNode.data.label}" missing ${!hasTrue ? 'true' : 'false'} path`,
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    issues,
  };
}

/**
 * Normalize graph (clean up IDs, remove orphans)
 */
export function normalizeGraph(graph: PlaybookGraph): PlaybookGraph {
  // Remove orphaned nodes if there are other connected nodes
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  let nodes = graph.nodes;

  if (graph.nodes.length > 1) {
    nodes = graph.nodes.filter((n) => connectedNodes.has(n.id) || graph.edges.length === 0);
  }

  // Remove edges that reference non-existent nodes
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return { nodes, edges };
}
