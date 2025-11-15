/**
 * Agent utility functions
 * Helper methods for agent runtime operations (stub for S4+ implementation)
 */

import type {
  PlaybookTemplate,
  PlaybookNode,
  AgentTask,
  AgentDefinition,
} from '@pravado/types';
import { createLogger } from './logger';

const logger = createLogger('utils:agents');

/**
 * Load a playbook by ID (stub - will connect to DB in S4)
 * @param playbookId - UUID of the playbook
 * @returns PlaybookTemplate or null if not found
 */
export async function loadPlaybook(
  playbookId: string
): Promise<PlaybookTemplate | null> {
  logger.info('Loading playbook (stub)', { playbookId });

  // Stub implementation - returns null
  // In S4, this will query the database for the playbook
  return null;
}

/**
 * Validate playbook shape and dependencies
 * @param playbook - Playbook to validate
 * @returns Validation result with errors if any
 */
export function validatePlaybookShape(playbook: PlaybookTemplate): {
  valid: boolean;
  errors: Array<{
    nodeId?: string;
    field?: string;
    message: string;
  }>;
} {
  const errors: Array<{
    nodeId?: string;
    field?: string;
    message: string;
  }> = [];

  // Validate basic structure
  if (!playbook.name || playbook.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Playbook name is required',
    });
  }

  if (!playbook.nodes || playbook.nodes.length === 0) {
    errors.push({
      field: 'nodes',
      message: 'Playbook must have at least one node',
    });
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  playbook.nodes.forEach((node) => {
    // Check for duplicate node IDs
    if (nodeIds.has(node.id)) {
      errors.push({
        nodeId: node.id,
        field: 'id',
        message: `Duplicate node ID: ${node.id}`,
      });
    }
    nodeIds.add(node.id);

    // Check for missing agent ID
    if (!node.agentId) {
      errors.push({
        nodeId: node.id,
        field: 'agentId',
        message: 'Node must have an agentId',
      });
    }

    // Validate dependencies exist
    if (node.dependsOn) {
      node.dependsOn.forEach((depId) => {
        if (!playbook.nodes.find((n) => n.id === depId)) {
          errors.push({
            nodeId: node.id,
            field: 'dependsOn',
            message: `Dependency node not found: ${depId}`,
          });
        }
      });
    }
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = playbook.nodes.find((n) => n.id === nodeId);
    if (node && node.dependsOn) {
      for (const depId of node.dependsOn) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of playbook.nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push({
          field: 'nodes',
          message: 'Playbook contains circular dependencies',
        });
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize agent task input
 * Ensures task has all required fields and proper structure
 */
export function normalizeAgentTask<TInput = Record<string, unknown>>(
  task: Partial<AgentTask<TInput>>,
  agentDef: AgentDefinition
): AgentTask<TInput> {
  const normalized: AgentTask<TInput> = {
    id: task.id || crypto.randomUUID(),
    agentId: task.agentId || agentDef.id,
    input: task.input || ({} as TInput),
    context: task.context,
    priority: task.priority || 'medium',
    createdAt: task.createdAt || new Date().toISOString(),
  };

  // Validate required inputs
  for (const requiredField of agentDef.requiredInputs) {
    if (!(requiredField in (normalized.input as Record<string, unknown>))) {
      throw new Error(
        `Missing required input field for agent ${agentDef.id}: ${requiredField}`
      );
    }
  }

  return normalized;
}

/**
 * Calculate playbook execution order based on dependencies
 * Returns nodes in topologically sorted order
 */
export function calculateExecutionOrder(nodes: PlaybookNode[]): PlaybookNode[] {
  const sorted: PlaybookNode[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(nodeId: string) {
    if (temp.has(nodeId)) {
      throw new Error('Circular dependency detected');
    }
    if (visited.has(nodeId)) {
      return;
    }

    temp.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.dependsOn) {
      for (const depId of node.dependsOn) {
        visit(depId);
      }
    }

    temp.delete(nodeId);
    visited.add(nodeId);
    sorted.push(node);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  }

  return sorted;
}

/**
 * Estimate playbook duration based on node count and agent estimates
 * Returns estimated duration in minutes
 */
export function estimatePlaybookDuration(
  playbook: PlaybookTemplate,
  agentDefinitions: AgentDefinition[]
): number {
  let totalMinutes = 0;

  for (const node of playbook.nodes) {
    const agentDef = agentDefinitions.find((a) => a.id === node.agentId);
    if (agentDef && agentDef.estimatedDuration) {
      // Parse duration string like '2-5 minutes'
      const match = agentDef.estimatedDuration.match(/(\d+)-?(\d+)?\s*(minute|hour)/);
      if (match) {
        const min = parseInt(match[1], 10);
        const max = match[2] ? parseInt(match[2], 10) : min;
        const avg = (min + max) / 2;
        const multiplier = match[3] === 'hour' ? 60 : 1;
        totalMinutes += avg * multiplier;
      }
    } else {
      // Default estimate if no duration specified
      totalMinutes += 3; // 3 minutes default per node
    }
  }

  return Math.ceil(totalMinutes);
}
