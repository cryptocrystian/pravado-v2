'use client';

/**
 * Reality Maps Dashboard Page (Sprint S73 + S90 AI Presence Enhancement)
 * AI-Driven Multi-Outcome Reality Maps with AI presence indicators
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
type AIStatus = 'idle' | 'analyzing' | 'generating';

// AI Dot component
function AIDot({ status }: { status: AIStatus }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}

// AI Insight Banner component
function AIInsightBanner({
  message,
  type = 'info',
  onDismiss
}: {
  message: string;
  type?: 'info' | 'success' | 'warning';
  onDismiss?: () => void;
}) {
  const borderColor = type === 'success' ? 'border-l-semantic-success' :
                      type === 'warning' ? 'border-l-semantic-warning' : 'border-l-brand-cyan';
  const bgColor = type === 'success' ? 'bg-semantic-success/5' :
                  type === 'warning' ? 'bg-semantic-warning/5' : 'bg-brand-cyan/5';

  return (
    <div className={`panel-card p-4 border-l-4 ${borderColor} ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AIDot status="idle" />
          <span className="text-xs font-medium text-brand-cyan">Pravado Insight</span>
        </div>
        <p className="text-sm text-white flex-1">{message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

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

  // Derive AI status from operational states
  const aiStatus: AIStatus = generating ? 'generating' : analyzing ? 'analyzing' : 'idle';

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <AIDot status={aiStatus} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white-0">Reality Maps</h1>
            <p className="text-sm text-muted mt-1">
              AI-driven multi-outcome scenario visualization
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Reality Map
        </button>
      </div>

      {/* AI Insight Banner */}
      {maps.length > 0 && (
        <AIInsightBanner
          message={`Pravado is monitoring ${maps.length} reality ${maps.length === 1 ? 'map' : 'maps'}. ${
            maps.filter(m => m.status === 'completed').length > 0
              ? `${maps.filter(m => m.status === 'completed').length} completed with AI analysis ready for review.`
              : 'Generate your first map to see AI-powered outcome predictions.'
          }`}
          type="info"
        />
      )}

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
            className="input-field w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin w-8 h-8 text-brand-cyan" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : maps.length === 0 ? (
        <div className="text-center py-16 panel-card">
          <svg className="w-16 h-16 mx-auto text-slate-6 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-medium text-white-0 mb-1">No reality maps yet</h3>
          <p className="text-sm text-muted mb-4">
            Create your first reality map to visualize multi-outcome scenarios.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
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
              <p className="text-sm text-muted">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= total}
                  className="btn-ghost disabled:opacity-50"
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

    // Determine detail-specific AI status
    const detailAiStatus: AIStatus = generating ? 'generating' : analyzing ? 'analyzing' : 'idle';

    return (
      <div className="h-full flex flex-col">
        {/* Back button and title with AI Status */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedMap(null);
              setGraphData(null);
              setAnalysisData(null);
            }}
            className="p-2 text-slate-6 hover:bg-slate-3 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <AIDot status={detailAiStatus} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white-0">{selectedMap.name}</h1>
              {selectedMap.description && (
                <p className="text-sm text-muted">{selectedMap.description}</p>
              )}
            </div>
          </div>
          {/* AI Status Label */}
          {detailAiStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              <AIDot status={detailAiStatus} />
              <span className="text-xs font-medium text-brand-cyan">
                {detailAiStatus === 'generating' ? 'AI Generating...' : 'AI Analyzing...'}
              </span>
            </div>
          )}
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
        <div className="flex border-b border-border-subtle mt-4">
          <button
            onClick={() => setDetailTab('graph')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'graph'
                ? 'text-brand-cyan border-b-2 border-brand-cyan'
                : 'text-slate-6 hover:text-white-0'
            }`}
          >
            Graph View
          </button>
          <button
            onClick={() => setDetailTab('paths')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'paths'
                ? 'text-brand-cyan border-b-2 border-brand-cyan'
                : 'text-slate-6 hover:text-white-0'
            }`}
          >
            Paths
          </button>
          <button
            onClick={() => setDetailTab('analysis')}
            className={`px-4 py-2 text-sm font-medium ${
              detailTab === 'analysis'
                ? 'text-brand-cyan border-b-2 border-brand-cyan'
                : 'text-slate-6 hover:text-white-0'
            }`}
          >
            Analysis
          </button>
        </div>

        {/* AI Insight Banner for completed maps */}
        {selectedMap.status === 'completed' && analysisData?.analysis && (
          <div className="mt-4">
            <AIInsightBanner
              message={(() => {
                const recs = analysisData.analysis.recommendations || [];
                const risks = analysisData.analysis.aggregatedRisks || [];
                const contradictions = analysisData.analysis.contradictions || [];
                if (recs.length > 0) {
                  return `${recs.length} AI recommendation${recs.length > 1 ? 's' : ''} identified. ${risks.length > 0 ? `${risks.length} risk factor${risks.length > 1 ? 's' : ''} detected.` : ''}`;
                }
                if (contradictions.length > 0) {
                  return `${contradictions.length} contradiction${contradictions.length > 1 ? 's' : ''} detected across outcome paths.`;
                }
                return `This reality map contains ${graphData?.nodes?.length || 0} nodes and ${graphData?.paths?.length || 0} outcome paths. AI analysis is ready for review.`;
              })()}
              type={(analysisData.analysis.aggregatedRisks?.length || 0) > 0 ? 'warning' : 'info'}
            />
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-hidden mt-4">
          {selectedMap.status !== 'completed' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {selectedMap.status === 'generating' || selectedMap.status === 'analyzing' ? (
                  <>
                    <svg className="animate-spin w-12 h-12 mx-auto text-brand-cyan mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-muted">
                      {selectedMap.status === 'generating' ? 'Generating reality map...' : 'Running analysis...'}
                    </p>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 mx-auto text-slate-6 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-muted mb-4">
                      {selectedMap.status === 'draft' ? 'This map has not been generated yet.' : 'Generation failed. Try again.'}
                    </p>
                    <button
                      onClick={() => handleGenerate(selectedMap)}
                      className="btn-primary"
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
                  <div className="h-full panel-card">
                    <RealityPathPanel
                      paths={graphData.paths as unknown as RealityGraphPath[]}
                      selectedPathId={selectedPathId}
                      onPathSelect={handlePathSelect}
                      onPathHighlight={handlePathHighlight}
                    />
                  </div>
                )}
                {detailTab === 'analysis' && (
                  <div className="h-full panel-card">
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
                <div className="w-80 panel-card flex-shrink-0">
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
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? renderListView() : renderDetailView()}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-white-0">Create Reality Map</h2>
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
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-white-0">Edit Reality Map</h2>
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
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white-0 mb-2">Delete Reality Map</h2>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete &quot;{deletingMap.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingMap(null);
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-semantic-danger hover:bg-semantic-danger/90 rounded-lg"
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
