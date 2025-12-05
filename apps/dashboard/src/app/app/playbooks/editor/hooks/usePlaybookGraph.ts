/**
 * usePlaybookGraph Hook (Sprint S17)
 * Handles conversion between PlaybookDefinitionDTO and EditorGraph
 */

'use client';

import type { PlaybookDefinitionDTO, PlaybookStep } from '@pravado/types';
import { useCallback } from 'react';

import type { EditorGraph, EditorNode, EditorEdge, NodeType } from '../types/graph';

/**
 * Convert PlaybookDefinitionDTO to EditorGraph
 */
export function playbookToGraph(playbook: PlaybookDefinitionDTO): EditorGraph {
  const { steps } = playbook;

  // Create nodes from steps
  const nodes: EditorNode[] = steps.map((step, index) => ({
    id: step.key,
    type: step.type as NodeType,
    position: {
      x: 100 + (index % 3) * 300, // Arrange in grid
      y: 100 + Math.floor(index / 3) * 200,
    },
    data: {
      label: step.name,
      config: step.config,
    },
  }));

  // Create edges from nextStepKey relationships
  const edges: EditorEdge[] = [];
  for (const step of steps) {
    if (step.nextStepKey) {
      edges.push({
        id: `${step.key}-${step.nextStepKey}`,
        source: step.key,
        target: step.nextStepKey,
      });
    }

    // Handle BRANCH nodes with special edges
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
 * Convert EditorGraph to PlaybookStep[]
 */
export function graphToSteps(graph: EditorGraph): PlaybookStep[] {
  const { nodes, edges } = graph;

  // Create a map of node edges for quick lookup
  const nodeEdges = new Map<string, EditorEdge[]>();
  for (const edge of edges) {
    const existing = nodeEdges.get(edge.source) || [];
    existing.push(edge);
    nodeEdges.set(edge.source, existing);
  }

  // Convert nodes to steps
  const steps: Partial<PlaybookStep>[] = nodes.map((node, index) => {
    const outgoingEdges = nodeEdges.get(node.id) || [];

    // Determine nextStepKey
    let nextStepKey: string | null = null;

    if (node.type === 'BRANCH') {
      // For BRANCH nodes, nextStepKey is null - branches defined in config
      nextStepKey = null;

      // Update config with branch paths
      const trueEdge = outgoingEdges.find((e) => e.label === 'true');
      const falseEdge = outgoingEdges.find((e) => e.label === 'false');

      node.data.config = {
        ...node.data.config,
        trueStep: trueEdge?.target || null,
        falseStep: falseEdge?.target || null,
      };
    } else {
      // For other nodes, use the first outgoing edge
      if (outgoingEdges.length > 0) {
        nextStepKey = outgoingEdges[0].target;
      }
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

  // Cast to PlaybookStep[] (missing fields will be filled by backend)
  return steps as PlaybookStep[];
}

/**
 * Hook for playbook graph operations
 */
export function usePlaybookGraph() {
  const convertToGraph = useCallback((playbook: PlaybookDefinitionDTO): EditorGraph => {
    return playbookToGraph(playbook);
  }, []);

  const convertToSteps = useCallback((graph: EditorGraph): Partial<PlaybookStep>[] => {
    return graphToSteps(graph);
  }, []);

  const validateGraph = useCallback((graph: EditorGraph): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Basic validation
    if (graph.nodes.length === 0) {
      errors.push('Graph must have at least one node');
    }

    // Check for entry point
    const targetNodes = new Set(graph.edges.map((e) => e.target));
    const entryNodes = graph.nodes.filter((n) => !targetNodes.has(n.id));

    if (entryNodes.length === 0 && graph.nodes.length > 0) {
      errors.push('Graph must have an entry point (node with no incoming edges)');
    }

    if (entryNodes.length > 1) {
      errors.push('Graph should have only one entry point');
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
      errors.push(
        `Found ${orphanedNodes.length} orphaned node(s): ${orphanedNodes.map((n) => n.data.label).join(', ')}`
      );
    }

    // Validate individual nodes
    for (const node of graph.nodes) {
      const nodeErrors = validateNode(node);
      errors.push(...nodeErrors.map((err) => `${node.data.label}: ${err}`));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  return {
    convertToGraph,
    convertToSteps,
    validateGraph,
  };
}

/**
 * Validate a single node
 */
function validateNode(node: EditorNode): string[] {
  const errors: string[] = [];

  // Validate based on node type
  switch (node.type) {
    case 'AGENT':
      if (!node.data.config.agentId) {
        errors.push('Agent ID is required');
      }
      break;

    case 'DATA':
      if (!node.data.config.operation) {
        errors.push('Data operation is required');
      }
      break;

    case 'BRANCH':
      if (!node.data.config.condition) {
        errors.push('Branch condition is required');
      }
      break;

    case 'API':
      if (!node.data.config.url) {
        errors.push('API URL is required');
      }
      if (!node.data.config.method) {
        errors.push('HTTP method is required');
      }
      break;
  }

  return errors;
}
