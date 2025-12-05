/**
 * usePlaybookEditor Hook (Sprint S17)
 * Manages editor state (selected nodes, edges, dirty state)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { addEdge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange, type Connection } from 'reactflow';

import type { EditorGraph, EditorNode, EditorEdge, EditorState, GraphValidation } from '../types/graph';

export interface UsePlaybookEditorProps {
  initialGraph?: EditorGraph;
  onSave?: (graph: EditorGraph) => Promise<void>;
  onValidate?: (graph: EditorGraph) => Promise<GraphValidation>;
}

export function usePlaybookEditor(props: UsePlaybookEditorProps = {}) {
  const { initialGraph, onSave, onValidate } = props;

  // React Flow nodes and edges
  const [nodes, setNodes] = useState<EditorNode[]>(initialGraph?.nodes || []);
  const [edges, setEdges] = useState<EditorEdge[]>(initialGraph?.edges || []);

  // Editor state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validation, setValidation] = useState<GraphValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initial state for dirty checking
  const [initialState, setInitialState] = useState<EditorGraph | null>(initialGraph || null);

  // Initialize from props
  useEffect(() => {
    if (initialGraph) {
      setNodes(initialGraph.nodes);
      setEdges(initialGraph.edges);
      setInitialState(initialGraph);
      setIsDirty(false);
    }
  }, [initialGraph]);

  // Mark as dirty when nodes or edges change
  useEffect(() => {
    if (!initialState) return;

    const currentGraph = { nodes, edges };
    const hasChanged =
      JSON.stringify(currentGraph.nodes) !== JSON.stringify(initialState.nodes) ||
      JSON.stringify(currentGraph.edges) !== JSON.stringify(initialState.edges);

    setIsDirty(hasChanged);
  }, [nodes, edges, initialState]);

  /**
   * Handle node changes (drag, delete, etc.)
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as EditorNode[]);
    },
    []
  );

  /**
   * Handle edge changes (delete, etc.)
   */
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as EditorEdge[]);
    },
    []
  );

  /**
   * Handle new connection
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds) as EditorEdge[]);
    },
    []
  );

  /**
   * Add a new node to the canvas
   */
  const addNode = useCallback(
    (node: EditorNode) => {
      setNodes((nds) => [...nds, node]);
    },
    [setNodes]
  );

  /**
   * Update a node's data
   */
  const updateNode = useCallback(
    (nodeId: string, data: Partial<EditorNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * Delete selected node or edge
   */
  const deleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId, setNodes, setEdges]);

  /**
   * Validate the current graph
   */
  const validate = useCallback(async () => {
    if (!onValidate) return null;

    setIsValidating(true);
    setError(null);

    try {
      const result = await onValidate({ nodes, edges });
      setValidation(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setError(message);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges, onValidate]);

  /**
   * Save the current graph
   */
  const save = useCallback(async () => {
    if (!onSave) return false;

    setIsSaving(true);
    setError(null);

    try {
      await onSave({ nodes, edges });
      setInitialState({ nodes, edges });
      setIsDirty(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, onSave]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (initialState) {
      setNodes(initialState.nodes);
      setEdges(initialState.edges);
      setIsDirty(false);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setValidation(null);
      setError(null);
    }
  }, [initialState]);

  /**
   * Get current graph
   */
  const getGraph = useCallback((): EditorGraph => {
    return { nodes, edges };
  }, [nodes, edges]);

  /**
   * Get selected node
   */
  const getSelectedNode = useCallback((): EditorNode | null => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const state: EditorState = {
    graph: { nodes, edges },
    selectedNodeId,
    selectedEdgeId,
    isDirty,
    validation,
    isValidating,
    isSaving,
    error,
  };

  return {
    // State
    state,
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,

    // Actions
    setSelectedNodeId,
    setSelectedEdgeId,
    addNode,
    updateNode,
    deleteSelected,
    validate,
    save,
    reset,
    getGraph,
    getSelectedNode,

    // React Flow handlers
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
  };
}
