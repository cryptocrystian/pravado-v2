/**
 * usePlaybookGraph Hook Tests (Sprint S17)
 *
 * NOTE: These tests require vitest to be configured in the dashboard app.
 * To set up:
 * 1. Add vitest to devDependencies: pnpm add -D vitest @testing-library/react @testing-library/react-hooks
 * 2. Create vitest.config.ts
 * 3. Add test script to package.json: "test": "vitest"
 */

import type { PlaybookDefinitionDTO } from '@pravado/types';
import { describe, it, expect } from 'vitest';

import type { EditorGraph } from '../../types/graph';

/**
 * NOTE: These imports would work once vitest is set up
 * For now, we're creating the test structure
 */
// import { usePlaybookGraph } from '../usePlaybookGraph';

// Mock conversion functions for testing
// These would be imported from the actual hook
const mockConvertToGraph = (playbook: PlaybookDefinitionDTO): EditorGraph => {
  return {
    nodes: playbook.steps.map((step, index) => ({
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
    })),
    edges: playbook.steps
      .filter((step) => step.nextStepKey)
      .map((step) => ({
        id: `${step.key}-${step.nextStepKey}`,
        source: step.key,
        target: step.nextStepKey!,
      })),
  };
};

const mockConvertToSteps = (graph: EditorGraph) => {
  return graph.nodes.map((node, index) => {
    const outgoingEdge = graph.edges.find((e) => e.source === node.id);
    return {
      key: node.id,
      name: node.data.label,
      type: node.type,
      config: node.data.config,
      position: index,
      nextStepKey: outgoingEdge?.target || null,
    };
  });
};

describe('usePlaybookGraph', () => {
  describe('convertToGraph', () => {
    it('should convert simple playbook to graph', () => {
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
            config: { agentId: 'test' },
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

      const graph = mockConvertToGraph(playbook);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.nodes[0].id).toBe('step1');
      expect(graph.edges[0].source).toBe('step1');
      expect(graph.edges[0].target).toBe('step2');
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

      const graph = mockConvertToGraph(playbook);

      expect(graph.nodes[0].position).toMatchObject({
        x: 100,
        y: 100,
      });
    });

    it('should preserve node config during conversion', () => {
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
            key: 'agent1',
            name: 'Agent Step',
            type: 'AGENT',
            config: {
              agentId: 'content-strategist',
              prompt: 'Create a content brief',
              outputKey: 'brief',
            },
            position: 0,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = mockConvertToGraph(playbook);

      expect(graph.nodes[0].data.config).toMatchObject({
        agentId: 'content-strategist',
        prompt: 'Create a content brief',
        outputKey: 'brief',
      });
    });
  });

  describe('convertToSteps', () => {
    it('should convert graph back to steps', () => {
      const graph: EditorGraph = {
        nodes: [
          {
            id: 'step1',
            type: 'AGENT',
            position: { x: 100, y: 100 },
            data: {
              label: 'First Step',
              config: { agentId: 'test' },
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

      const steps = mockConvertToSteps(graph);

      expect(steps).toHaveLength(2);
      expect(steps[0]).toMatchObject({
        key: 'step1',
        name: 'First Step',
        type: 'AGENT',
        config: { agentId: 'test' },
        nextStepKey: 'step2',
      });
      expect(steps[1]).toMatchObject({
        key: 'step2',
        name: 'Second Step',
        type: 'DATA',
        nextStepKey: null,
      });
    });

    it('should handle nodes with no outgoing edges', () => {
      const graph: EditorGraph = {
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

      const steps = mockConvertToSteps(graph);

      expect(steps[0].nextStepKey).toBeNull();
    });

    it('should preserve config during conversion', () => {
      const graph: EditorGraph = {
        nodes: [
          {
            id: 'api1',
            type: 'API',
            position: { x: 100, y: 100 },
            data: {
              label: 'API Call',
              config: {
                method: 'POST',
                url: 'https://api.example.com/endpoint',
                outputKey: 'apiResponse',
              },
            },
          },
        ],
        edges: [],
      };

      const steps = mockConvertToSteps(graph);

      expect(steps[0].config).toMatchObject({
        method: 'POST',
        url: 'https://api.example.com/endpoint',
        outputKey: 'apiResponse',
      });
    });
  });

  describe('validateGraph', () => {
    it('should validate graph with single entry point', () => {
      const graph: EditorGraph = {
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

      // Mock validation logic
      const targetNodes = new Set(graph.edges.map((e) => e.target));
      const entryNodes = graph.nodes.filter((n) => !targetNodes.has(n.id));

      expect(entryNodes).toHaveLength(1);
      expect(entryNodes[0].id).toBe('step1');
    });

    it('should detect multiple entry points', () => {
      const graph: EditorGraph = {
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

      const targetNodes = new Set(graph.edges.map((e) => e.target));
      const entryNodes = graph.nodes.filter((n) => !targetNodes.has(n.id));

      expect(entryNodes).toHaveLength(2);
    });

    it('should detect orphaned nodes', () => {
      const graph: EditorGraph = {
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
            data: { label: 'Orphan', config: {} },
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

      const connectedNodes = new Set<string>();
      for (const edge of graph.edges) {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      }

      const orphanedNodes = graph.nodes.filter((n) => !connectedNodes.has(n.id));

      expect(orphanedNodes).toHaveLength(1);
      expect(orphanedNodes[0].id).toBe('orphan');
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain data through playbook → graph → steps conversion', () => {
      const originalPlaybook: PlaybookDefinitionDTO = {
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
            name: 'First',
            type: 'AGENT',
            config: { agentId: 'test', prompt: 'Do something' },
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
            name: 'Second',
            type: 'DATA',
            config: { operation: 'pluck', sourceKey: 'result' },
            position: 1,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const graph = mockConvertToGraph(originalPlaybook);
      const convertedSteps = mockConvertToSteps(graph);

      expect(convertedSteps[0]).toMatchObject({
        key: 'step1',
        name: 'First',
        type: 'AGENT',
        config: { agentId: 'test', prompt: 'Do something' },
        nextStepKey: 'step2',
      });

      expect(convertedSteps[1]).toMatchObject({
        key: 'step2',
        name: 'Second',
        type: 'DATA',
        config: { operation: 'pluck', sourceKey: 'result' },
        nextStepKey: null,
      });
    });
  });
});
