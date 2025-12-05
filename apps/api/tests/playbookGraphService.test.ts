/**
 * PlaybookGraphService tests (Sprint S17)
 */

import { describe, it, expect } from 'vitest';
import {
  playbookToGraph,
  graphToPlaybook,
  validateGraph,
  normalizeGraph,
  type PlaybookGraph,
} from '../src/services/playbookGraphService';
import type { PlaybookDefinitionDTO, PlaybookStep } from '@pravado/types';

describe('playbookGraphService', () => {
  describe('playbookToGraph', () => {
    it('should convert simple linear playbook to graph', () => {
      const playbook: PlaybookDefinitionDTO = {
        playbook: {
          id: 'pb-1',
          orgId: 'org-1',
          name: 'Test Playbook',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'step1',
            name: 'First Step',
            type: 'AGENT',
            config: { agentId: 'test-agent' },
            position: 0,
            nextStepKey: 'step2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-2',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'step2',
            name: 'Second Step',
            type: 'DATA',
            config: { operation: 'pluck' },
            position: 1,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = playbookToGraph(playbook);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);

      expect(graph.nodes[0]).toMatchObject({
        id: 'step1',
        type: 'AGENT',
        data: {
          label: 'First Step',
          config: { agentId: 'test-agent' },
        },
      });

      expect(graph.edges[0]).toMatchObject({
        source: 'step1',
        target: 'step2',
      });
    });

    it('should handle BRANCH nodes with true/false paths', () => {
      const playbook: PlaybookDefinitionDTO = {
        playbook: {
          id: 'pb-1',
          orgId: 'org-1',
          name: 'Branch Playbook',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'branch1',
            name: 'Quality Check',
            type: 'BRANCH',
            config: {
              condition: 'input.score > 75',
              trueStep: 'high-quality',
              falseStep: 'low-quality',
            },
            position: 0,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-2',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'high-quality',
            name: 'High Quality Path',
            type: 'AGENT',
            config: { agentId: 'premium' },
            position: 1,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-3',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'low-quality',
            name: 'Low Quality Path',
            type: 'AGENT',
            config: { agentId: 'basic' },
            position: 2,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = playbookToGraph(playbook);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);

      const trueEdge = graph.edges.find((e) => e.label === 'true');
      const falseEdge = graph.edges.find((e) => e.label === 'false');

      expect(trueEdge).toMatchObject({
        source: 'branch1',
        target: 'high-quality',
        label: 'true',
      });

      expect(falseEdge).toMatchObject({
        source: 'branch1',
        target: 'low-quality',
        label: 'false',
      });
    });

    it('should assign grid positions to nodes', () => {
      const playbook: PlaybookDefinitionDTO = {
        playbook: {
          id: 'pb-1',
          orgId: 'org-1',
          name: 'Test',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'step1',
            name: 'Step 1',
            type: 'AGENT',
            config: {},
            position: 0,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = playbookToGraph(playbook);

      expect(graph.nodes[0].position).toMatchObject({
        x: 100,
        y: 100,
      });
    });
  });

  describe('graphToPlaybook', () => {
    it('should convert simple graph to playbook steps', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: {
              label: 'First Step',
              config: { agentId: 'test-agent' },
            },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: {
              label: 'Second Step',
              config: { operation: 'pluck' },
            },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
        ],
      };

      const steps = graphToPlaybook(graph);

      expect(steps).toHaveLength(2);

      expect(steps[0]).toMatchObject({
        key: 'step1',
        name: 'First Step',
        type: 'AGENT',
        config: { agentId: 'test-agent' },
        position: 0,
        nextStepKey: 'step2',
      });

      expect(steps[1]).toMatchObject({
        key: 'step2',
        name: 'Second Step',
        type: 'DATA',
        config: { operation: 'pluck' },
        position: 1,
        nextStepKey: null,
      });
    });

    it('should convert BRANCH node with true/false edges', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'branch1',
            type: 'BRANCH',
            position: { x: 100, y: 100 },
            data: {
              label: 'Quality Check',
              config: { condition: 'input.score > 75' },
            },
          },
          {
            id: 'high',
            type: 'AGENT',
            position: { x: 400, y: 50 },
            data: {
              label: 'High Quality',
              config: { agentId: 'premium' },
            },
          },
          {
            id: 'low',
            type: 'AGENT',
            position: { x: 400, y: 150 },
            data: {
              label: 'Low Quality',
              config: { agentId: 'basic' },
            },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'branch1',
            target: 'high',
            label: 'true',
          },
          {
            id: 'e2',
            source: 'branch1',
            target: 'low',
            label: 'false',
          },
        ],
      };

      const steps = graphToPlaybook(graph);

      const branchStep = steps.find((s) => s.type === 'BRANCH');

      expect(branchStep).toMatchObject({
        key: 'branch1',
        type: 'BRANCH',
        config: {
          condition: 'input.score > 75',
          trueStep: 'high',
          falseStep: 'low',
        },
        nextStepKey: null,
      });
    });

    it('should handle nodes with no outgoing edges', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'final',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: {
              label: 'Final Step',
              config: { agentId: 'test' },
            },
          },
        ],
        edges: [],
      };

      const steps = graphToPlaybook(graph);

      expect(steps[0]).toMatchObject({
        key: 'final',
        nextStepKey: null,
      });
    });
  });

  describe('validateGraph', () => {
    it('should accept valid graph with single entry point', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty graph', () => {
      const graph: PlaybookGraph = {
        nodes: [],
        edges: [],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Graph must have at least one node');
    });

    it('should reject graph with no entry point', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
          {
            id: 'e2',
            source: 'step2',
            target: 'step1',
          },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Graph must have exactly one entry point (node with no incoming edges)'
      );
    });

    it('should warn about multiple entry points', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
        ],
        edges: [],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Graph has 2 entry points, but should have exactly one'
      );
    });

    it('should detect orphaned nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
          {
            id: 'orphan',
            type: 'API',
            position: { x: 700, y: 100 },
            data: { label: 'Orphaned', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Found 1 orphaned nodes (not connected to graph)');
    });

    it('should allow single node without edges', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'only',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Only Step', config: {} },
          },
        ],
        edges: [],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('normalizeGraph', () => {
    it('should remove orphaned nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
          {
            id: 'orphan',
            type: 'API',
            position: { x: 700, y: 100 },
            data: { label: 'Orphaned', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
        ],
      };

      const normalized = normalizeGraph(graph);

      expect(normalized.nodes).toHaveLength(2);
      expect(normalized.nodes.find((n) => n.id === 'orphan')).toBeUndefined();
    });

    it('should remove edges to non-existent nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'nonexistent',
          },
        ],
      };

      const normalized = normalizeGraph(graph);

      expect(normalized.edges).toHaveLength(0);
    });

    it('should preserve valid graph unchanged', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Step 1', config: {} },
          },
          {
            id: 'step2',
            type: 'DATA',
            position: { x: 400, y: 100 },
            data: { label: 'Step 2', config: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'step1',
            target: 'step2',
          },
        ],
      };

      const normalized = normalizeGraph(graph);

      expect(normalized.nodes).toHaveLength(2);
      expect(normalized.edges).toHaveLength(1);
    });

    it('should keep single node with no edges', () => {
      const graph: PlaybookGraph = {
        nodes: [
          {
            id: 'only',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: { label: 'Only Step', config: {} },
          },
        ],
        edges: [],
      };

      const normalized = normalizeGraph(graph);

      expect(normalized.nodes).toHaveLength(1);
      expect(normalized.edges).toHaveLength(0);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain data consistency through round-trip', () => {
      const originalPlaybook: PlaybookDefinitionDTO = {
        playbook: {
          id: 'pb-1',
          orgId: 'org-1',
          name: 'Test Playbook',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'step1',
            name: 'First Step',
            type: 'AGENT',
            config: { agentId: 'test-agent', prompt: 'Do something' },
            position: 0,
            nextStepKey: 'step2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-2',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'step2',
            name: 'Second Step',
            type: 'DATA',
            config: { operation: 'pluck', sourceKey: 'result' },
            position: 1,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      // Playbook → Graph → Steps
      const graph = playbookToGraph(originalPlaybook);
      const convertedSteps = graphToPlaybook(graph);

      // Compare essential fields
      expect(convertedSteps).toHaveLength(2);

      expect(convertedSteps[0]).toMatchObject({
        key: 'step1',
        name: 'First Step',
        type: 'AGENT',
        config: { agentId: 'test-agent', prompt: 'Do something' },
        nextStepKey: 'step2',
      });

      expect(convertedSteps[1]).toMatchObject({
        key: 'step2',
        name: 'Second Step',
        type: 'DATA',
        config: { operation: 'pluck', sourceKey: 'result' },
        nextStepKey: null,
      });
    });

    it('should maintain BRANCH config through round-trip', () => {
      const originalPlaybook: PlaybookDefinitionDTO = {
        playbook: {
          id: 'pb-1',
          orgId: 'org-1',
          name: 'Branch Playbook',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'branch1',
            name: 'Quality Check',
            type: 'BRANCH',
            config: {
              condition: 'input.score > 75',
              trueStep: 'high',
              falseStep: 'low',
            },
            position: 0,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-2',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'high',
            name: 'High',
            type: 'AGENT',
            config: { agentId: 'premium' },
            position: 1,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'step-3',
            orgId: 'org-1',
            playbookId: 'pb-1',
            key: 'low',
            name: 'Low',
            type: 'AGENT',
            config: { agentId: 'basic' },
            position: 2,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = playbookToGraph(originalPlaybook);
      const convertedSteps = graphToPlaybook(graph);

      const branchStep = convertedSteps.find((s) => s.type === 'BRANCH');

      expect(branchStep?.config).toMatchObject({
        condition: 'input.score > 75',
        trueStep: 'high',
        falseStep: 'low',
      });
    });
  });
});
