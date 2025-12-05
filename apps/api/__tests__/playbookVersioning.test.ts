/**
 * Playbook Versioning Tests (Sprint S20)
 */

import { describe, it, expect } from 'vitest';
import { diffGraphs, type PlaybookGraph } from '../src/services/playbookVersioningService';

describe('Playbook Versioning (S20)', () => {
  describe('diffGraphs', () => {
    it('should detect added nodes', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'DATA', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.addedNodes).toHaveLength(1);
      expect(diff.addedNodes[0].id).toBe('b');
      expect(diff.removedNodes).toHaveLength(0);
      expect(diff.modifiedNodes).toHaveLength(0);
    });

    it('should detect removed nodes', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'DATA', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.removedNodes).toHaveLength(1);
      expect(diff.removedNodes[0].id).toBe('b');
      expect(diff.addedNodes).toHaveLength(0);
    });

    it('should detect modified node labels', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'Old Label', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'New Label', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.modifiedNodes).toHaveLength(1);
      expect(diff.modifiedNodes[0].id).toBe('a');
      expect(diff.modifiedNodes[0].changes).toContain('Label: "Old Label" → "New Label"');
    });

    it('should detect modified node types', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'DATA', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.modifiedNodes).toHaveLength(1);
      expect(diff.modifiedNodes[0].changes).toContain('Type: AGENT → DATA');
    });

    it('should detect modified node configurations', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: { setting: 'old' } } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: { setting: 'new' } } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.modifiedNodes).toHaveLength(1);
      expect(diff.modifiedNodes[0].changes).toContain('Configuration changed');
    });

    it('should detect position changes', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 100, y: 50 }, data: { label: 'A', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.modifiedNodes).toHaveLength(1);
      expect(diff.modifiedNodes[0].changes).toContain('Position changed');
    });

    it('should detect added edges', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
        ],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.addedEdges).toHaveLength(1);
      expect(diff.addedEdges[0].source).toBe('a');
      expect(diff.addedEdges[0].target).toBe('b');
    });

    it('should detect removed edges', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
        ],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'AGENT', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.removedEdges).toHaveLength(1);
      expect(diff.removedEdges[0].source).toBe('a');
      expect(diff.removedEdges[0].target).toBe('b');
    });

    it('should report no changes for identical graphs', () => {
      const graph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'DATA', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
        ],
      };

      const diff = diffGraphs(graph, graph);

      expect(diff.hasChanges).toBe(false);
      expect(diff.addedNodes).toHaveLength(0);
      expect(diff.removedNodes).toHaveLength(0);
      expect(diff.modifiedNodes).toHaveLength(0);
      expect(diff.addedEdges).toHaveLength(0);
      expect(diff.removedEdges).toHaveLength(0);
    });

    it('should detect branch edge labels', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'branch', type: 'BRANCH', position: { x: 0, y: 0 }, data: { label: 'Branch', config: {} } },
          { id: 'true', type: 'AGENT', position: { x: 100, y: -50 }, data: { label: 'True', config: {} } },
        ],
        edges: [],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'branch', type: 'BRANCH', position: { x: 0, y: 0 }, data: { label: 'Branch', config: {} } },
          { id: 'true', type: 'AGENT', position: { x: 100, y: -50 }, data: { label: 'True', config: {} } },
        ],
        edges: [
          { id: 'branch-true', source: 'branch', target: 'true', label: 'true' },
        ],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.addedEdges).toHaveLength(1);
      expect(diff.addedEdges[0].label).toBe('true');
    });

    it('should handle complex multi-change scenarios', () => {
      const oldGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A', config: {} } },
          { id: 'b', type: 'DATA', position: { x: 100, y: 0 }, data: { label: 'B', config: {} } },
          { id: 'c', type: 'API', position: { x: 200, y: 0 }, data: { label: 'C', config: {} } },
        ],
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'b-c', source: 'b', target: 'c' },
        ],
      };

      const newGraph: PlaybookGraph = {
        nodes: [
          { id: 'a', type: 'AGENT', position: { x: 0, y: 0 }, data: { label: 'A Modified', config: {} } },
          { id: 'd', type: 'BRANCH', position: { x: 300, y: 0 }, data: { label: 'D', config: {} } },
        ],
        edges: [
          { id: 'a-d', source: 'a', target: 'd' },
        ],
      };

      const diff = diffGraphs(oldGraph, newGraph);

      expect(diff.hasChanges).toBe(true);
      expect(diff.addedNodes).toHaveLength(1); // d
      expect(diff.removedNodes).toHaveLength(2); // b, c
      expect(diff.modifiedNodes).toHaveLength(1); // a label changed
      expect(diff.addedEdges).toHaveLength(1); // a-d
      expect(diff.removedEdges).toHaveLength(2); // a-b, b-c
    });
  });
});
