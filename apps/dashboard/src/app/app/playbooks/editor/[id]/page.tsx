/**
 * Playbook Visual Editor Page (Sprint S17 + S22 + S23)
 * Collaborative graph-based playbook editor with version control
 */

'use client';

import type { PlaybookBranchWithCommit, PlaybookGraph, MergeConflict } from '@pravado/types';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { useEditorStream, type GraphNode, type GraphEdge } from '@/hooks/useEditorStream';
import * as playbookApi from '@/lib/playbookApi';

import { CommitModal } from '../components/CommitModal';
import { CreateBranchModal } from '../components/CreateBranchModal';
import { MergeModal } from '../components/MergeModal';
import { Toolbar } from '../components/Toolbar';
import { VersionGraph } from '../components/VersionGraph';

export default function PlaybookEditorPage() {
  const params = useParams();
  const playbookId = params?.id as string;

  // Graph state
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // S23: Branch state
  const [branches, setBranches] = useState<PlaybookBranchWithCommit[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | undefined>();
  const [currentBranch, setCurrentBranch] = useState<PlaybookBranchWithCommit | undefined>();

  // S23: Modal state
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showVersionGraph, setShowVersionGraph] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeConflicts, setMergeConflicts] = useState<MergeConflict[] | undefined>();

  // Editor stream (for future collaboration features)
  const { connected } = useEditorStream(playbookId, { enabled: true });

  // Load graph from branch's latest commit
  const loadGraphFromBranch = useCallback(async (branchId: string) => {
    try {
      const branch = branches.find((b) => b.id === branchId) ||
        (await playbookApi.listBranches(playbookId)).find((b) => b.id === branchId);

      if (branch?.latestCommit?.graph) {
        const graph = branch.latestCommit.graph as PlaybookGraph;
        setNodes(graph.nodes as GraphNode[] || []);
        setEdges(graph.edges as GraphEdge[] || []);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to load graph from branch:', error);
    }
  }, [branches, playbookId]);

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchList = await playbookApi.listBranches(playbookId);
        setBranches(branchList);

        // Find main branch or first branch as default
        const mainBranch = branchList.find((b) => b.name === 'main') || branchList[0];
        if (mainBranch) {
          setCurrentBranchId(mainBranch.id);
          setCurrentBranch(mainBranch);
          await loadGraphFromBranch(mainBranch.id);
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      }
    };

    loadBranches();
  }, [playbookId, loadGraphFromBranch]);

  // S23: Handle branch change
  const handleBranchChange = async (branchId: string) => {
    try {
      await playbookApi.switchBranch(playbookId, branchId);
      setCurrentBranchId(branchId);
      const branch = branches.find((b) => b.id === branchId);
      setCurrentBranch(branch);
      await loadGraphFromBranch(branchId);

      // Note: Graph replacement is handled by loadGraphFromBranch
    } catch (error) {
      console.error('Failed to switch branch:', error);
      alert('Failed to switch branch');
    }
  };

  // S23: Handle create branch callback
  const handleBranchCreated = async (branchId: string) => {
    // Refresh branches list
    const branchList = await playbookApi.listBranches(playbookId);
    setBranches(branchList);
    const newBranch = branchList.find((b) => b.id === branchId);

    // Optionally switch to new branch
    if (newBranch && confirm(`Switch to new branch "${newBranch.name}"?`)) {
      await handleBranchChange(branchId);
    }
  };

  // S23: Handle commit
  const handleCommit = async (message: string) => {
    if (!currentBranchId) return;

    try {
      setIsCommitting(true);

      const graph = { nodes, edges } as PlaybookGraph;
      const playbookJson = {}; // TODO: Convert graph to playbook JSON

      await playbookApi.createCommit(
        playbookId,
        currentBranchId,
        message,
        graph,
        playbookJson
      );

      setIsDirty(false);
      setShowCommitModal(false);

      // Refresh branches to get updated commit count
      const branchList = await playbookApi.listBranches(playbookId);
      setBranches(branchList);
      const updatedBranch = branchList.find((b) => b.id === currentBranchId);
      setCurrentBranch(updatedBranch);
    } catch (error) {
      console.error('Failed to commit:', error);
      alert('Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  };

  // S23: Handle merge
  const handleMerge = async (
    sourceBranchId: string,
    targetBranchId: string,
    message?: string,
    resolutions?: Array<{ nodeId?: string; edgeId?: string; resolution: 'ours' | 'theirs' }>
  ) => {
    try {
      setIsMerging(true);

      const result = await playbookApi.mergeBranches(
        playbookId,
        sourceBranchId,
        targetBranchId,
        message,
        resolutions
      );

      if (!result.success && result.conflicts && result.conflicts.length > 0) {
        // Show conflicts in modal
        setMergeConflicts(result.conflicts);
        setIsMerging(false);
        return;
      }

      // Merge successful
      setShowMergeModal(false);
      setMergeConflicts(undefined);

      // Refresh branches and reload graph
      const branchList = await playbookApi.listBranches(playbookId);
      setBranches(branchList);
      await loadGraphFromBranch(targetBranchId);

      alert('Merge successful!');
    } catch (error) {
      console.error('Failed to merge:', error);
      alert('Failed to merge branches');
    } finally {
      setIsMerging(false);
    }
  };

  // Handle graph changes
  const handleNodeAdd = useCallback(() => {
    const newNode: GraphNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: `Node ${nodes.length + 1}` },
    };

    setNodes([...nodes, newNode]);
    setIsDirty(true);

    // Note: Collaboration patches would be sent via proper GraphPatch format
  }, [nodes]);

  // Save graph (not a commit, just in-memory save)
  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save logic if needed
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
    }, 500);
  };

  // Validate graph
  const handleValidate = async () => {
    // TODO: Implement validation
  };

  // Preview execution
  const handlePreviewExecution = () => {
    // TODO: Implement preview
  };

  // Reset graph
  const handleReset = () => {
    if (confirm('Reset all unsaved changes?')) {
      if (currentBranchId) {
        loadGraphFromBranch(currentBranchId);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar
        isDirty={isDirty}
        hasUnsavedChanges={false}
        isSaving={isSaving}
        isValidating={false}
        onSave={handleSave}
        onValidate={handleValidate}
        onPreviewExecution={handlePreviewExecution}
        onReset={handleReset}
        playbookId={playbookId}
        currentBranchId={currentBranchId}
        onBranchChange={handleBranchChange}
        onCreateBranch={() => setShowCreateBranch(true)}
        onCommit={() => setShowCommitModal(true)}
        onShowMerge={() => setShowMergeModal(true)}
        onShowVersionGraph={() => setShowVersionGraph(true)}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Playbook Editor
          </h2>
          <p className="text-gray-600 mb-6">
            Branch: <span className="font-semibold">{currentBranch?.name || 'Loading...'}</span>
          </p>
          <p className="text-gray-500 mb-4">
            {nodes.length} nodes, {edges.length} edges
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleNodeAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Node (Example)
            </button>
            <button
              onClick={() => setShowVersionGraph(true)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              View Commit Graph
            </button>
          </div>
          {connected && (
            <p className="text-sm text-green-600 mt-4">
              ✓ Connected to collaboration server
            </p>
          )}
        </div>
      </div>

      {/* S23: Modals */}
      {showCreateBranch && (
        <CreateBranchModal
          playbookId={playbookId}
          onClose={() => setShowCreateBranch(false)}
          onBranchCreated={handleBranchCreated}
        />
      )}

      <CommitModal
        isOpen={showCommitModal}
        isCommitting={isCommitting}
        branchName={currentBranch?.name}
        onClose={() => setShowCommitModal(false)}
        onCommit={handleCommit}
      />

      <MergeModal
        isOpen={showMergeModal}
        isMerging={isMerging}
        playbookId={playbookId}
        currentBranchId={currentBranchId}
        currentBranchName={currentBranch?.name}
        branches={branches}
        conflicts={mergeConflicts}
        onClose={() => {
          setShowMergeModal(false);
          setMergeConflicts(undefined);
        }}
        onMerge={handleMerge}
      />

      {/* Version Graph Modal */}
      {showVersionGraph && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Commit Graph</h2>
              <button
                onClick={() => setShowVersionGraph(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <VersionGraph
                playbookId={playbookId}
                onCommitSelect={() => {
                  // TODO: Implement commit selection (e.g., show diff viewer)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {/* TODO S24: Implement S23-compatible version history drawer with commit list */}
      {/* The VersionGraph component currently shows commit DAG visualization */}
    </div>
  );
}
