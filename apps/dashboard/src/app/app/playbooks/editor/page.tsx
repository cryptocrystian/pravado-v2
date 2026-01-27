/**
 * Visual Playbook Editor Page (Sprint S17)
 * Main editor view with canvas, toolbar, and panels
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import type { PlaybookDefinitionDTO } from '@pravado/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';

import { Canvas } from './components/Canvas';
import { CreateBranchModal } from './components/CreateBranchModal';
import { Inspector } from './components/Inspector';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { usePlaybookEditor } from './hooks/usePlaybookEditor';
import { usePlaybookGraph } from './hooks/usePlaybookGraph';
import type { NodeType, EditorNode, GraphValidation, EditorGraph } from './types/graph';

export default function PlaybookEditorPage() {
  const searchParams = useSearchParams();
  const playbookId = searchParams?.get('id');

  const { convertToGraph, convertToSteps, validateGraph } = usePlaybookGraph();
  const [playbook, setPlaybook] = useState<PlaybookDefinitionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExecutionPlan, setShowExecutionPlan] = useState(false);
  // S23: Branch state
  const [currentBranchId, setCurrentBranchId] = useState<string | undefined>();
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);

  // Load playbook from API
  useEffect(() => {
    if (!playbookId) {
      setLoading(false);
      return;
    }

    const loadPlaybook = async () => {
      try {
        // Gate 1A: Use route handler, not direct backend call
        const response = await fetch(`/api/playbooks/${playbookId}`);
        const data = await response.json();

        if (data.success && data.data?.item) {
          setPlaybook(data.data.item);
          // S23: Set current branch ID from playbook
          if (data.data.item.playbook.currentBranchId) {
            setCurrentBranchId(data.data.item.playbook.currentBranchId);
          }
        }
      } catch (error) {
        console.error('Failed to load playbook:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaybook();
  }, [playbookId]);

  // S23: Handle branch change
  const handleBranchChange = useCallback((newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    // Reload playbook data for the new branch
    if (playbookId) {
      window.location.reload(); // Simple approach: reload page to get new branch data
    }
  }, [playbookId]);

  // S23: Handle branch created
  const handleBranchCreated = useCallback((newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    // Optionally switch to the new branch
    handleBranchChange(newBranchId);
  }, [handleBranchChange]);

  // Convert playbook to graph for editor
  const initialGraph = playbook ? convertToGraph(playbook) : undefined;

  // Handle save
  const handleSave = useCallback(
    async (graph: EditorGraph) => {
      if (!playbook || !playbookId) return;

      const steps = convertToSteps(graph);

      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch(`/api/playbooks/${playbookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playbook.playbook.name,
          steps,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save playbook');
      }

      const data = await response.json();
      if (data.success && data.data?.item) {
        setPlaybook(data.data.item);
      }
    },
    [playbook, playbookId, convertToSteps]
  );

  // Handle validate
  const handleValidate = useCallback(
    async (graph: EditorGraph): Promise<GraphValidation> => {
      // Local validation
      const localValidation = validateGraph(graph);

      // TODO: Call route handler for validation
      // const response = await fetch(`/api/playbooks/${playbookId}/validate`, {...});

      return {
        valid: localValidation.valid,
        nodes: graph.nodes.map((node) => ({
          nodeId: node.id,
          valid: true,
          errors: [],
        })),
        globalErrors: localValidation.errors,
      };
    },
    [validateGraph]
  );

  const editor = usePlaybookEditor({
    initialGraph,
    onSave: handleSave,
    onValidate: handleValidate,
  });

  // Handle add node from sidebar
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const newNode: EditorNode = {
        id: `${type.toLowerCase()}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: `New ${type}`,
          config: {},
        },
      };

      editor.addNode(newNode);
    },
    [editor]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      editor.setSelectedNodeId(node.id);
      editor.setSelectedEdgeId(null);
    },
    [editor]
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: any) => {
      editor.setSelectedEdgeId(edge.id);
      editor.setSelectedNodeId(null);
    },
    [editor]
  );

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    editor.setSelectedNodeId(null);
    editor.setSelectedEdgeId(null);
  }, [editor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading playbook...</div>
      </div>
    );
  }

  if (!playbook && playbookId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Playbook not found</div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        {/* Toolbar */}
        <Toolbar
          isDirty={editor.state.isDirty}
          isSaving={editor.state.isSaving}
          isValidating={editor.state.isValidating}
          onSave={() => editor.save()}
          onValidate={() => editor.validate()}
          onPreviewExecution={() => setShowExecutionPlan(true)}
          onReset={() => editor.reset()}
          playbookId={playbookId || undefined}
          currentBranchId={currentBranchId}
          onBranchChange={handleBranchChange}
          onCreateBranch={() => setShowCreateBranchModal(true)}
        />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <Sidebar onAddNode={handleAddNode} />

          {/* Canvas */}
          <div className="flex-1">
            <Canvas
              nodes={editor.nodes}
              edges={editor.edges}
              onNodesChange={editor.onNodesChange}
              onEdgesChange={editor.onEdgesChange}
              onConnect={editor.onConnect}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
            />
          </div>

          {/* Right inspector */}
          <Inspector
            selectedNode={editor.getSelectedNode()}
            onUpdateNode={editor.updateNode}
          />
        </div>

        {/* Error toast */}
        {editor.state.error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded shadow-lg">
            {editor.state.error}
          </div>
        )}

        {/* Validation results */}
        {editor.state.validation && !editor.state.validation.valid && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-3 rounded shadow-lg max-w-md">
            <div className="font-semibold mb-1">Validation Errors:</div>
            <ul className="text-sm">
              {editor.state.validation.globalErrors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Execution plan modal */}
        {showExecutionPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Execution Plan Preview</h2>
              <div className="space-y-2">
                {editor.nodes.map((node, index) => (
                  <div key={node.id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Step {index + 1}</span>
                      <span className="font-medium">{node.data.label}</span>
                      <span className="text-xs text-gray-500 uppercase">{node.type}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowExecutionPlan(false)}
                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* S23: Create Branch Modal */}
        {showCreateBranchModal && playbookId && (
          <CreateBranchModal
            playbookId={playbookId}
            onClose={() => setShowCreateBranchModal(false)}
            onBranchCreated={handleBranchCreated}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
