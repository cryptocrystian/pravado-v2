'use client';

/**
 * Insight Conflicts Dashboard Page (Sprint S74)
 * Autonomous Insight Conflict Resolution Engine
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  InsightConflict,
  InsightConflictItem,
  InsightConflictResolution,
  ConflictGraphData,
  ConflictStats,
  ListConflictsQuery,
  ResolveConflictInput,
} from '@pravado/types';
import {
  listConflicts,
  getConflict,
  analyzeConflict,
  resolveConflict,
  dismissConflict,
  reviewResolution,
  getConflictGraph,
  getConflictStats,
  runDetection,
  listAuditLog,
  batchAnalyze,
  batchDismiss,
} from '../../../lib/insightConflictApi';
import {
  ConflictList,
  ConflictDetail,
  ConflictFilterBar,
  ConflictStatsCard,
  ConflictAnalysisPanel,
  ConflictResolutionPanel,
  ConflictGraph,
  ConflictAuditLog,
} from '../../../components/insight-conflicts';

type ViewMode = 'list' | 'detail';
type DetailTab = 'overview' | 'analysis' | 'resolution' | 'graph' | 'audit';

export default function InsightConflictsPage() {
  // List state
  const [conflicts, setConflicts] = useState<InsightConflict[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState<ListConflictsQuery>({
    limit: 20,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConflict, setSelectedConflict] = useState<InsightConflict | null>(null);
  const [conflictItems, setConflictItems] = useState<InsightConflictItem[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<InsightConflictResolution[]>([]);
  const [conflictGraph, setConflictGraph] = useState<ConflictGraphData | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  // Selection for batch operations
  const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set());

  // Operation states
  const [analyzing, setAnalyzing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [batchOperating, setBatchOperating] = useState(false);

  // Modals
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  // Load conflicts
  const loadConflicts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listConflicts(filters);
      setConflicts(response.conflicts);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conflicts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getConflictStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load conflict details
  const loadConflictDetails = useCallback(async (conflict: InsightConflict) => {
    setSelectedConflict(conflict);
    setViewMode('detail');
    setConflictItems([]);
    setConflictResolutions([]);
    setConflictGraph(null);
    setAuditEvents([]);
    setDetailTab('overview');

    try {
      const response = await getConflict(conflict.id);
      setSelectedConflict(response.conflict);
      setConflictItems(response.items);
      setConflictResolutions(response.resolutions);
    } catch (err) {
      console.error('Failed to load conflict details:', err);
    }
  }, []);

  // Load graph
  const loadGraph = useCallback(async () => {
    if (!selectedConflict) return;
    try {
      const response = await getConflictGraph(selectedConflict.id);
      setConflictGraph(response.graph);
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  }, [selectedConflict]);

  // Load audit log
  const loadAuditLog = useCallback(async () => {
    if (!selectedConflict) return;
    try {
      const response = await listAuditLog(selectedConflict.id);
      setAuditEvents(response.events);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
  }, [selectedConflict]);

  // Handle tab changes
  useEffect(() => {
    if (detailTab === 'graph' && !conflictGraph) {
      loadGraph();
    }
    if (detailTab === 'audit' && auditEvents.length === 0) {
      loadAuditLog();
    }
  }, [detailTab, conflictGraph, auditEvents.length, loadGraph, loadAuditLog]);

  // Handle analyze
  const handleAnalyze = async (conflict: InsightConflict) => {
    setAnalyzing(true);
    try {
      const response = await analyzeConflict(conflict.id, {
        includeRelatedConflicts: true,
        includeVectorAnalysis: true,
        includeRootCauseAnalysis: true,
      });
      setSelectedConflict(response.conflict);
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle resolve
  const handleResolve = async (input: ResolveConflictInput) => {
    if (!selectedConflict) return;
    setResolving(true);
    try {
      const response = await resolveConflict(selectedConflict.id, input);
      setSelectedConflict(response.conflict);
      setConflictResolutions([response.resolution, ...conflictResolutions]);
      setShowResolveModal(false);
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Resolution failed:', err);
    } finally {
      setResolving(false);
    }
  };

  // Handle dismiss
  const handleDismiss = async (conflict: InsightConflict) => {
    try {
      const response = await dismissConflict(conflict.id, dismissReason);
      if (selectedConflict?.id === conflict.id) {
        setSelectedConflict(response.conflict);
      }
      setShowDismissModal(false);
      setDismissReason('');
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
  };

  // Handle review
  const handleReview = async (resolutionId: string, isAccepted: boolean, notes?: string) => {
    if (!selectedConflict) return;
    try {
      const response = await reviewResolution(selectedConflict.id, resolutionId, {
        isAccepted,
        reviewNotes: notes,
      });
      // Update resolutions list
      setConflictResolutions(resolutions =>
        resolutions.map(r => r.id === resolutionId ? response.resolution : r)
      );
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  // Handle run detection
  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await runDetection();
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Detection failed:', err);
    } finally {
      setDetecting(false);
    }
  };

  // Handle batch operations
  const handleBatchAnalyze = async () => {
    setBatchOperating(true);
    try {
      await batchAnalyze({ conflictIds: Array.from(selectedConflicts) });
      setSelectedConflicts(new Set());
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Batch analyze failed:', err);
    } finally {
      setBatchOperating(false);
    }
  };

  const handleBatchDismiss = async () => {
    setBatchOperating(true);
    try {
      await batchDismiss({
        conflictIds: Array.from(selectedConflicts),
        reason: dismissReason,
      });
      setSelectedConflicts(new Set());
      setDismissReason('');
      await loadConflicts();
      await loadStats();
    } catch (err) {
      console.error('Batch dismiss failed:', err);
    } finally {
      setBatchOperating(false);
    }
  };

  // Pagination
  const page = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const pageSize = filters.limit || 20;
  const hasMore = page * pageSize < total;

  const goToPage = (newPage: number) => {
    setFilters(f => ({
      ...f,
      offset: (newPage - 1) * pageSize,
    }));
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insight Conflicts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous conflict detection, analysis, and resolution across intelligence systems
          </p>
        </div>
      </div>

      {/* Stats */}
      <ConflictStatsCard stats={stats} loading={statsLoading} />

      {/* Filter Bar */}
      <ConflictFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={loadConflicts}
        onRunDetection={handleRunDetection}
        loading={loading}
        detectionLoading={detecting}
      />

      {/* Batch actions */}
      {selectedConflicts.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
          <span className="text-sm font-medium text-indigo-700">
            {selectedConflicts.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBatchAnalyze}
            disabled={batchOperating}
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Analyze All
          </button>
          <button
            onClick={() => setShowDismissModal(true)}
            disabled={batchOperating}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Dismiss All
          </button>
          <button
            onClick={() => setSelectedConflicts(new Set())}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Conflict List */}
      <ConflictList
        conflicts={conflicts}
        loading={loading}
        onView={loadConflictDetails}
        onAnalyze={handleAnalyze}
        onResolve={(conflict) => {
          setSelectedConflict(conflict);
          setShowResolveModal(true);
        }}
        onDismiss={(conflict) => {
          setSelectedConflict(conflict);
          setShowDismissModal(true);
        }}
        selectedConflicts={selectedConflicts}
        onSelectionChange={setSelectedConflicts}
        emptyMessage={
          filters.search || filters.conflictType || filters.severity || filters.status
            ? 'No conflicts match your filters'
            : 'No conflicts detected yet'
        }
      />

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedConflict) return null;

    return (
      <div className="h-full flex flex-col">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedConflict(null);
              setConflictItems([]);
              setConflictResolutions([]);
              setConflictGraph(null);
              setAuditEvents([]);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{selectedConflict.title}</h1>
          </div>
        </div>

        {/* Detail tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {(['overview', 'analysis', 'resolution', 'graph', 'audit'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-2 text-sm font-medium ${
                detailTab === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {detailTab === 'overview' && (
            <ConflictDetail
              conflict={selectedConflict}
              items={conflictItems}
              onAnalyze={() => handleAnalyze(selectedConflict)}
              onResolve={() => setShowResolveModal(true)}
              onDismiss={() => setShowDismissModal(true)}
            />
          )}

          {detailTab === 'analysis' && (
            <ConflictAnalysisPanel
              conflict={selectedConflict}
              onAnalyze={() => handleAnalyze(selectedConflict)}
              analyzing={analyzing}
            />
          )}

          {detailTab === 'resolution' && (
            <ConflictResolutionPanel
              conflict={selectedConflict}
              resolutions={conflictResolutions}
              onResolve={handleResolve}
              onReview={handleReview}
              resolving={resolving}
            />
          )}

          {detailTab === 'graph' && (
            <ConflictGraph
              data={conflictGraph}
              loading={!conflictGraph && selectedConflict.conflictGraph === undefined}
              width={900}
              height={600}
            />
          )}

          {detailTab === 'audit' && (
            <ConflictAuditLog
              events={auditEvents}
              loading={auditEvents.length === 0}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? renderListView() : renderDetailView()}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Resolve Conflict</h2>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <ConflictResolutionPanel
                conflict={selectedConflict}
                onResolve={handleResolve}
                resolving={resolving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Dismiss {selectedConflicts.size > 0 ? `${selectedConflicts.size} Conflicts` : 'Conflict'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedConflicts.size > 0
                ? 'Are you sure you want to dismiss these conflicts? This marks them as not requiring resolution.'
                : 'Are you sure you want to dismiss this conflict? This marks it as not requiring resolution.'
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Provide a reason for dismissing..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setDismissReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedConflicts.size > 0) {
                    handleBatchDismiss();
                  } else if (selectedConflict) {
                    handleDismiss(selectedConflict);
                  }
                }}
                disabled={batchOperating}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
