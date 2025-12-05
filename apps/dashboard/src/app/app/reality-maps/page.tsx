'use client';

/**
 * Reality Maps Dashboard Page (Sprint S73)
 * AI-Driven Multi-Outcome Reality Maps
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  RealityMap,
  RealityMapGraphData,
  RealityMapNode,
  RealityMapGraphNode,
  RealityGraphPath,
  GetRealityMapAnalysisResponse,
  ListRealityMapsQuery,
  CreateRealityMapInput,
  UpdateRealityMapInput,
} from '@pravado/types';
import {
  listRealityMaps,
  createRealityMap,
  deleteRealityMap,
  generateRealityMap,
  getRealityMap,
  getGraph,
  getAnalysis,
  STATUS_LABELS,
} from '../../../lib/realityMapApi';
import {
  RealityMapCard,
  RealityMapGraph,
  RealityNodeDetailDrawer,
  RealityPathPanel,
  RealityAnalysisPanel,
  RealityCreateForm,
  RealityMapToolbar,
} from '../../../components/reality-maps';

type ViewMode = 'list' | 'detail';
type DetailTab = 'graph' | 'paths' | 'analysis';

export default function RealityMapsPage() {
  const router = useRouter();

  // List state
  const [maps, setMaps] = useState<RealityMap[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMap, setSelectedMap] = useState<RealityMap | null>(null);
  const [graphData, setGraphData] = useState<RealityMapGraphData | null>(null);
  const [analysisData, setAnalysisData] = useState<GetRealityMapAnalysisResponse | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('graph');

  // Node drawer state
  const [selectedNode, setSelectedNode] = useState<RealityMapGraphNode | null>(null);
  const [_selectedNodeFull, _setSelectedNodeFull] = useState<RealityMapNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMap, setEditingMap] = useState<RealityMap | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMap, setDeletingMap] = useState<RealityMap | null>(null);

  // Operation states
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Path highlighting
  const [highlightedPathIds, setHighlightedPathIds] = useState<string[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Load maps
  const loadMaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Partial<ListRealityMapsQuery> = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (search) query.search = search;
      if (statusFilter) query.status = statusFilter as ListRealityMapsQuery['status'];

      const response = await listRealityMaps(query);
      setMaps(response.maps);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reality maps');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadMaps();
  }, [loadMaps]);

  // Load map details
  const loadMapDetails = useCallback(async (map: RealityMap) => {
    setSelectedMap(map);
    setViewMode('detail');
    setGraphData(null);
    setAnalysisData(null);

    if (map.status === 'completed') {
      try {
        const [graphResponse, analysisResponse] = await Promise.all([
          getGraph(map.id),
          getAnalysis(map.id),
        ]);
        setGraphData(graphResponse.graph);
        setAnalysisData(analysisResponse);
      } catch (err) {
        console.error('Failed to load map details:', err);
      }
    }
  }, []);

  // Handle create
  const handleCreate = async (input: CreateRealityMapInput | UpdateRealityMapInput) => {
    try {
      const response = await createRealityMap(input as CreateRealityMapInput);
      setShowCreateModal(false);
      await loadMaps();
      // Optionally navigate to the new map
      loadMapDetails(response.map);
    } catch (err) {
      throw err;
    }
  };

  // Handle generate
  const handleGenerate = async (map: RealityMap) => {
    setGenerating(true);
    try {
      await generateRealityMap(map.id);
      // Refresh the map
      const response = await getRealityMap(map.id);
      if (selectedMap?.id === map.id && response.map) {
        setSelectedMap(response.map);
        // Reload graph data after generation
        if (response.map.status === 'completed') {
          const [graphResponse, analysisResponse] = await Promise.all([
            getGraph(map.id),
            getAnalysis(map.id),
          ]);
          setGraphData(graphResponse.graph);
          setAnalysisData(analysisResponse);
        }
      }
      await loadMaps();
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingMap) return;
    try {
      await deleteRealityMap(deletingMap.id);
      setShowDeleteConfirm(false);
      setDeletingMap(null);
      if (selectedMap?.id === deletingMap.id) {
        setViewMode('list');
        setSelectedMap(null);
      }
      await loadMaps();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Handle refresh analysis
  const handleRefreshAnalysis = async () => {
    if (!selectedMap) return;
    setAnalyzing(true);
    try {
      const response = await getAnalysis(selectedMap.id);
      setAnalysisData(response);
    } catch (err) {
      console.error('Analysis refresh failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle node click
  const handleNodeClick = (node: RealityMapGraphNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
    // TODO: Load full node data if needed
  };

  // Handle path select
  const handlePathSelect = (pathId: string) => {
    setSelectedPathId(pathId);
    setHighlightedPathIds([pathId]);
  };

  // Handle path highlight
  const handlePathHighlight = (pathIds: string[]) => {
    setHighlightedPathIds(pathIds);
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reality Maps</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-driven multi-outcome scenario visualization
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Reality Map
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search reality maps..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : maps.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No reality maps yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first reality map to visualize multi-outcome scenarios.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Create Reality Map
          </button>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maps.map(map => (
              <RealityMapCard
                key={map.id}
                map={map}
                onView={(m) => loadMapDetails(m)}
                onEdit={(m) => {
                  setEditingMap(m);
                  setShowEditModal(true);
                }}
                onGenerate={(m) => handleGenerate(m)}
                onDelete={(m) => {
                  setDeletingMap(m);
                  setShowDeleteConfirm(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= total}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedMap) return null;

    return (
      <div className="h-full flex flex-col">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedMap(null);
              setGraphData(null);
              setAnalysisData(null);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedMap.name}</h1>
            {selectedMap.description && (
              <p className="text-sm text-gray-500">{selectedMap.description}</p>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <RealityMapToolbar
          mapId={selectedMap.id}
          status={selectedMap.status}
          onGenerate={() => handleGenerate(selectedMap)}
          onRefreshAnalysis={handleRefreshAnalysis}
          onEdit={() => {
            setEditingMap(selectedMap);
            setShowEditModal(true);
          }}
          onExport={(format) => {
            console.log('Export as', format);
            // TODO: Implement export
          }}
          onViewAuditLog={() => {
            router.push(`/app/reality-maps/${selectedMap.id}/audit`);
          }}
          onDelete={() => {
            setDeletingMap(selectedMap);
            setShowDeleteConfirm(true);
          }}
          generating={generating}
          analyzing={analyzing}
        />

        {/* Detail tabs */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setDetailTab('graph')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'graph'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Graph View
          </button>
          <button
            onClick={() => setDetailTab('paths')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'paths'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Paths
          </button>
          <button
            onClick={() => setDetailTab('analysis')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'analysis'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Analysis
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden mt-4">
          {selectedMap.status !== 'completed' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {selectedMap.status === 'generating' || selectedMap.status === 'analyzing' ? (
                  <>
                    <svg className="animate-spin w-12 h-12 mx-auto text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-600">
                      {selectedMap.status === 'generating' ? 'Generating reality map...' : 'Running analysis...'}
                    </p>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-gray-600 mb-4">
                      {selectedMap.status === 'draft' ? 'This map has not been generated yet.' : 'Generation failed. Try again.'}
                    </p>
                    <button
                      onClick={() => handleGenerate(selectedMap)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Generate Now
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex gap-4">
              {/* Main content area */}
              <div className="flex-1">
                {detailTab === 'graph' && graphData && (
                  <RealityMapGraph
                    graphData={graphData}
                    onNodeClick={handleNodeClick}
                    selectedNodeId={selectedNode?.id}
                    highlightedPathIds={highlightedPathIds}
                  />
                )}
                {detailTab === 'paths' && graphData && (
                  <div className="h-full bg-white rounded-lg border border-gray-200">
                    <RealityPathPanel
                      paths={graphData.paths as unknown as RealityGraphPath[]}
                      selectedPathId={selectedPathId}
                      onPathSelect={handlePathSelect}
                      onPathHighlight={handlePathHighlight}
                    />
                  </div>
                )}
                {detailTab === 'analysis' && (
                  <div className="h-full bg-white rounded-lg border border-gray-200">
                    <RealityAnalysisPanel
                      analysis={analysisData?.analysis ?? null}
                      loading={analyzing}
                      onRefresh={handleRefreshAnalysis}
                    />
                  </div>
                )}
              </div>

              {/* Side panel for paths when viewing graph */}
              {detailTab === 'graph' && graphData && (
                <div className="w-80 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                  <RealityPathPanel
                    paths={graphData.paths as unknown as RealityGraphPath[]}
                    selectedPathId={selectedPathId}
                    onPathSelect={handlePathSelect}
                    onPathHighlight={handlePathHighlight}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Node Detail Drawer */}
        <RealityNodeDetailDrawer
          node={selectedNode}
          fullNode={_selectedNodeFull}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedNode(null);
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? renderListView() : renderDetailView()}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Reality Map</h2>
            </div>
            <div className="p-4">
              <RealityCreateForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Reality Map</h2>
            </div>
            <div className="p-4">
              <RealityCreateForm
                map={editingMap}
                onSubmit={async (_input) => {
                  // TODO: Call update API
                  setShowEditModal(false);
                  setEditingMap(null);
                  await loadMaps();
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingMap(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Reality Map</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &quot;{deletingMap.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingMap(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
