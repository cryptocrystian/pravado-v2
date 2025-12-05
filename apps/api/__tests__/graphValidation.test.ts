/**
 * Graph Validation Tests (Sprint S20)
 */

import { describe, it, expect } from 'vitest';
import { validateGraph, type PlaybookGraph } from '../src/services/playbookGraphService';

describe('Graph Validation (S20)', () => {
  describe('Empty Graph', () => {
    it('should reject empty graph', () => {
      const graph: PlaybookGraph = {
        nodes: [],
        edges: [],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Graph must have at least one node');
      expect(result.issues.some((i) => i.code === 'EMPTY_GRAPH')).toBe(true);
    });
  });

  describe('Entry Points', () => {
    it('should reject graph with no entry point', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'b-a', source: 'b', target: 'a' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'NO_ENTRY_POINT')).toBe(true);
    });

    it('should reject graph with multiple entry points', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
          { id: 'c', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [{ id: 'b-c', source: 'b', target: 'c' }],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'MULTIPLE_ENTRY_POINTS')).toBe(true);
    });

    it('should accept graph with exactly one entry point', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [{ id: 'a-b', source: 'a', target: 'b' }],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
    });
  });

  describe('Duplicate Keys', () => {
    it('should reject graph with duplicate node IDs', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'a', type: 'DATA', position: { x: 0, y: 0 }, data: { label: 'A2', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'DUPLICATE_KEYS')).toBe(true);
    });
  });

  describe('Orphaned Nodes', () => {
    it('should reject graph with orphaned nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
          { id: 'c', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [{ id: 'a-b', source: 'a', target: 'b' }],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'ORPHANED_NODES')).toBe(true);
    });

    it('should accept single node graph without edges', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
    });
  });

  describe('Cycle Detection', () => {
    it('should reject graph with simple cycle', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'b-a', source: 'b', target: 'a' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'CYCLIC_GRAPH')).toBe(true);
    });

    it('should reject graph with complex cycle', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
          { id: 'c', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'b-c', source: 'b', target: 'c' },
          { id: 'c-a', source: 'c', target: 'a' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'CYCLIC_GRAPH')).toBe(true);
    });

    it('should accept acyclic graph', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'B', config: {} } },
          { id: 'c', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'a-c', source: 'a', target: 'c' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
    });
  });

  describe('Branch Nodes', () => {
    it('should warn about incomplete branch nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'branch', type: 'BRANCH', position: { x: 0, y: 0 }, data: { label: 'Branch', config: {} } },
          { id: 'c', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [
          { id: 'a-branch', source: 'a', target: 'branch' },
          { id: 'branch-c-true', source: 'branch', target: 'c', label: 'true' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.issues.some((i) => i.code === 'INCOMPLETE_BRANCH' && i.severity === 'warning')).toBe(true);
    });
  });

  describe('Invalid Edges', () => {
    it('should reject edges referencing non-existent nodes', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [
          { id: 'a-nonexistent', source: 'a', target: 'nonexistent' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'INVALID_EDGES')).toBe(true);
    });
  });

  describe('Valid Graphs', () => {
    it('should accept simple linear graph', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'step1', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'Step 1', config: {} } },
          { id: 'step2', type: 'DATA', position: { x: 100, y: 0 }, data: { label: 'Step 2', config: {} } },
          { id: 'step3', type: 'API', position: { x: 200, y: 0 }, data: { label: 'Step 3', config: {} } },
        ],
        edges: [
          { id: 'step1-step2', source: 'step1', target: 'step2' },
          { id: 'step2-step3', source: 'step2', target: 'step3' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    });

    it('should accept parallel branches', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'start', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'Start', config: {} } },
          { id: 'branch1', type: 'AGENT', position: { x: 100, y: -50 }, data: { label: 'Branch 1', config: {} } },
          { id: 'branch2', type: 'AGENT', position: { x: 100, y: 50 }, data: { label: 'Branch 2', config: {} } },
          { id: 'end', type: 'AGENT', position: { x: 200, y: 0 }, data: { label: 'End', config: {} } },
        ],
        edges: [
          { id: 'start-branch1', source: 'start', target: 'branch1' },
          { id: 'start-branch2', source: 'start', target: 'branch2' },
          { id: 'branch1-end', source: 'branch1', target: 'end' },
          { id: 'branch2-end', source: 'branch2', target: 'end' },
        ],
      };

      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
    });
  });
});
