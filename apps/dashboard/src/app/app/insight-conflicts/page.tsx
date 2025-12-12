'use client';

/**
 * Insight Conflicts Dashboard Page (Sprint S74 + S90 AI Presence Enhancement)
 * Autonomous Insight Conflict Resolution Engine with AI presence indicators
 */

import { useState, useEffect, useCallback } from 'react';

type AIStatus = 'idle' | 'analyzing' | 'generating';

// AI Dot component for presence indication
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

  // Derive AI status from operational states
  const aiStatus: AIStatus = analyzing || detecting ? 'analyzing' : resolving ? 'generating' : 'idle';

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
            <h1 className="text-2xl font-bold text-white-0">Insight Conflicts</h1>
            <p className="text-sm text-muted mt-1">
              Autonomous conflict detection, analysis, and resolution across intelligence systems
            </p>
          </div>
        </div>
        {/* AI Status Pill when active */}
        {aiStatus !== 'idle' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <AIDot status={aiStatus} />
            <span className="text-xs font-medium text-brand-cyan">
              {detecting ? 'Detecting Conflicts...' : analyzing ? 'AI Analyzing...' : 'AI Resolving...'}
            </span>
          </div>
        )}
      </div>

      {/* AI Insight Banner */}
      {stats && (stats.totalConflicts || 0) > 0 && (
        <AIInsightBanner
          message={(() => {
            const critical = stats.criticalCount || 0;
            const high = stats.highCount || 0;
            const pending = stats.detectedCount || 0;
            if (critical > 0 || high > 0) {
              return `${critical + high} high-priority conflict${critical + high > 1 ? 's' : ''} require${critical + high === 1 ? 's' : ''} attention. Pravado recommends addressing critical conflicts first to maintain data integrity.`;
            }
            if (pending > 0) {
              return `${pending} conflict${pending > 1 ? 's' : ''} detected and awaiting analysis. Run AI analysis to generate resolution recommendations.`;
            }
            return `Monitoring ${stats.totalConflicts} conflict${stats.totalConflicts > 1 ? 's' : ''} across your intelligence systems.`;
          })()}
          type={((stats.criticalCount || 0) + (stats.highCount || 0)) > 0 ? 'warning' : 'info'}
        />
      )}

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
        <div className="flex items-center gap-4 p-4 bg-brand-iris/10 rounded-lg border border-brand-iris/20">
          <span className="text-sm font-medium text-brand-iris">
            {selectedConflicts.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBatchAnalyze}
            disabled={batchOperating}
            className="px-3 py-1.5 text-sm font-medium text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-colors disabled:opacity-50"
          >
            Analyze All
          </button>
          <button
            onClick={() => setShowDismissModal(true)}
            disabled={batchOperating}
            className="px-3 py-1.5 text-sm font-medium text-slate-6 hover:bg-slate-3 rounded-lg transition-colors disabled:opacity-50"
          >
            Dismiss All
          </button>
          <button
            onClick={() => setSelectedConflicts(new Set())}
            className="px-3 py-1.5 text-sm font-medium text-slate-6 hover:text-white-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert-error">
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
          <p className="text-sm text-muted">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="btn-ghost disabled:opacity-50"
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

    // Determine detail-specific AI status
    const detailAiStatus: AIStatus = analyzing ? 'analyzing' : resolving ? 'generating' : 'idle';

    return (
      <div className="h-full flex flex-col">
        {/* Back button and title with AI Status */}
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
              <h1 className="text-xl font-bold text-white-0">{selectedConflict.title}</h1>
              {selectedConflict.severity && (
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                  selectedConflict.severity === 'critical' ? 'bg-semantic-danger/20 text-semantic-danger' :
                  selectedConflict.severity === 'high' ? 'bg-semantic-warning/20 text-semantic-warning' :
                  'bg-slate-5/20 text-slate-6'
                }`}>
                  {selectedConflict.severity.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          {/* AI Status Pill */}
          {detailAiStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              <AIDot status={detailAiStatus} />
              <span className="text-xs font-medium text-brand-cyan">
                {analyzing ? 'AI Analyzing...' : 'AI Resolving...'}
              </span>
            </div>
          )}
        </div>

        {/* AI Insight Banner for conflicts with analysis results */}
        {selectedConflict.analysisResult && selectedConflict.status !== 'resolved' && (
          <div className="mb-4">
            <AIInsightBanner
              message={`AI analysis complete. ${conflictResolutions.length > 0 ? `${conflictResolutions.length} resolution${conflictResolutions.length > 1 ? 's' : ''} proposed.` : 'Ready to generate resolution recommendations.'}`}
              type="success"
            />
          </div>
        )}

        {/* Detail tabs */}
        <div className="flex border-b border-border-subtle mb-4">
          {(['overview', 'analysis', 'resolution', 'graph', 'audit'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-2 text-sm font-medium ${
                detailTab === tab
                  ? 'text-brand-cyan border-b-2 border-brand-cyan'
                  : 'text-slate-6 hover:text-white-0'
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
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? renderListView() : renderDetailView()}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedConflict && (
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white-0">Resolve Conflict</h2>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-1 text-slate-6 hover:text-white-0"
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
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white-0 mb-2">
              Dismiss {selectedConflicts.size > 0 ? `${selectedConflicts.size} Conflicts` : 'Conflict'}
            </h2>
            <p className="text-sm text-muted mb-4">
              {selectedConflicts.size > 0
                ? 'Are you sure you want to dismiss these conflicts? This marks them as not requiring resolution.'
                : 'Are you sure you want to dismiss this conflict? This marks it as not requiring resolution.'
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white-0 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Provide a reason for dismissing..."
                rows={3}
                className="input-field w-full text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setDismissReason('');
                }}
                className="btn-ghost"
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
                className="btn-secondary disabled:opacity-50"
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
