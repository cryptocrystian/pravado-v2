'use client';

/**
 * Scenario Orchestrations Page (Sprint S72)
 * Multi-scenario suite management dashboard
 * Styled according to Pravado Design System v2
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ScenarioSuite,
  ScenarioSuiteRun,
  ScenarioSuiteItem,
  ScenarioSuiteRunItem,
  CreateScenarioSuiteInput,
  UpdateScenarioSuiteInput,
  ScenarioSuiteStatus,
} from '@pravado/types';
import {
  listSuites,
  getSuite,
  createSuite,
  updateSuite,
  archiveSuite,
  startSuiteRun,
  getSuiteRun,
  listSuiteRunItems,
  getSuiteStats,
} from '../../../../lib/scenarioOrchestrationApi';
import {
  SuiteCard,
  SuiteConfigForm,
  SuiteItemList,
  SuiteRunTimeline,
  SuiteMetricsPanel,
  SuiteOutcomePanel,
  SuiteRunControlBar,
} from '../../../../components/scenario-orchestrations';

type ViewMode = 'list' | 'create' | 'detail' | 'run';

interface SuiteStats {
  totalSuites: number;
  activeSuites: number;
  totalRuns: number;
  runningRuns: number;
}

export default function ScenarioOrchestrationsPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [suites, setSuites] = useState<ScenarioSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<ScenarioSuite | null>(null);
  const [suiteItems, setSuiteItems] = useState<ScenarioSuiteItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<ScenarioSuiteRun | null>(null);
  const [runItems, setRunItems] = useState<ScenarioSuiteRunItem[]>([]);
  const [stats, setStats] = useState<SuiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // Load suites
  const loadSuites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suitesResult, statsResult] = await Promise.all([
        listSuites({
          search: search || undefined,
          status: (statusFilter || undefined) as ScenarioSuiteStatus | undefined,
          limit: 50,
        }),
        getSuiteStats(),
      ]);
      setSuites(suitesResult.suites);
      setStats(statsResult as unknown as SuiteStats);

      // Get item counts
      const counts: Record<string, number> = {};
      suitesResult.suites.forEach(s => {
        counts[s.id] = 0; // Will be populated from suite detail
      });
      setItemCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suites');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadSuites();
  }, [loadSuites]);

  // Load suite detail
  const loadSuiteDetail = async (suiteId: string) => {
    try {
      const result = await getSuite(suiteId);
      setSelectedSuite(result.suite);
      setSuiteItems(result.items);
      setItemCounts(prev => ({ ...prev, [suiteId]: result.items.length }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suite');
    }
  };

  // Load run detail
  const loadRunDetail = async (runId: string) => {
    try {
      const [runResult, itemsResult] = await Promise.all([
        getSuiteRun(runId),
        listSuiteRunItems(runId),
      ]);
      setSelectedRun(runResult.run);
      setRunItems(itemsResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    }
  };

  // Handlers
  const handleViewSuite = async (suite: ScenarioSuite) => {
    await loadSuiteDetail(suite.id);
    setViewMode('detail');
  };

  const handleEditSuite = async (suite: ScenarioSuite) => {
    await loadSuiteDetail(suite.id);
    setViewMode('create'); // Reuse create form for editing
  };

  const handleRunSuite = async (suite: ScenarioSuite) => {
    try {
      const result = await startSuiteRun(suite.id);
      if (result.run) {
        setSelectedRun(result.run);
        setSelectedSuite(suite);
        setViewMode('run');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    }
  };

  const handleArchiveSuite = async (suite: ScenarioSuite) => {
    if (!confirm(`Archive suite "${suite.name}"? This cannot be undone.`)) return;
    try {
      await archiveSuite(suite.id);
      await loadSuites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive suite');
    }
  };

  const handleCreateSuite = async (input: CreateScenarioSuiteInput | UpdateScenarioSuiteInput) => {
    try {
      if (selectedSuite) {
        await updateSuite(selectedSuite.id, input as UpdateScenarioSuiteInput);
      } else {
        await createSuite(input as CreateScenarioSuiteInput);
      }
      setSelectedSuite(null);
      setViewMode('list');
      await loadSuites();
    } catch (err) {
      throw err; // Let form handle the error
    }
  };

  const handleRunUpdated = (run: ScenarioSuiteRun) => {
    setSelectedRun(run);
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'aborted') {
      loadRunDetail(run.id);
    }
  };

  const handleBack = () => {
    setSelectedSuite(null);
    setSelectedRun(null);
    setSuiteItems([]);
    setRunItems([]);
    setViewMode('list');
  };

  // Render
  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {viewMode === 'list' ? (
              <>
                <h1 className="text-2xl font-bold text-white-0">Scenario Orchestrations</h1>
                <p className="text-sm text-muted mt-1">
                  Create and manage multi-scenario simulation suites
                </p>
              </>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-6 hover:text-white-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Suites
              </button>
            )}
          </div>

          {viewMode === 'list' && (
            <button
              onClick={() => {
                setSelectedSuite(null);
                setViewMode('create');
              }}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Suite
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="alert-error mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-sm text-semantic-danger hover:opacity-80 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats bar */}
        {viewMode === 'list' && stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Suites" value={stats.totalSuites} />
            <StatCard label="Active Suites" value={stats.activeSuites} />
            <StatCard label="Total Runs" value={stats.totalRuns} />
            <StatCard label="Running Now" value={stats.runningRuns} highlight />
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suites..."
                className="input-field flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-48"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="configured">Configured</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Suites grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-brand-cyan border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-muted">Loading suites...</p>
              </div>
            ) : suites.length === 0 ? (
              <div className="text-center py-12 panel-card">
                <svg className="w-16 h-16 mx-auto text-slate-6 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-white-0 mb-2">No suites found</h3>
                <p className="text-muted mb-4">
                  Create your first scenario orchestration suite to get started.
                </p>
                <button
                  onClick={() => setViewMode('create')}
                  className="btn-primary"
                >
                  Create Suite
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suites.map(suite => (
                  <SuiteCard
                    key={suite.id}
                    suite={suite}
                    itemCount={itemCounts[suite.id] || 0}
                    onView={handleViewSuite}
                    onEdit={handleEditSuite}
                    onRun={handleRunSuite}
                    onArchive={handleArchiveSuite}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit View */}
        {viewMode === 'create' && (
          <div className="max-w-2xl mx-auto panel-card p-6">
            <h2 className="text-lg font-semibold text-white-0 mb-6">
              {selectedSuite ? 'Edit Suite' : 'Create New Suite'}
            </h2>
            <SuiteConfigForm
              suite={selectedSuite || undefined}
              onSubmit={handleCreateSuite}
              onCancel={handleBack}
            />
          </div>
        )}

        {/* Detail View */}
        {viewMode === 'detail' && selectedSuite && (
          <div className="space-y-6">
            <div className="panel-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white-0">{selectedSuite.name}</h2>
                  {selectedSuite.description && (
                    <p className="text-muted mt-1">{selectedSuite.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSuite(selectedSuite)}
                    className="btn-ghost"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRunSuite(selectedSuite)}
                    className="btn-primary"
                  >
                    Run Suite
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-medium text-white-0 mb-3">
                Simulations ({suiteItems.length})
              </h3>
              <SuiteItemList
                items={suiteItems}
                readonly
              />
            </div>
          </div>
        )}

        {/* Run View */}
        {viewMode === 'run' && selectedRun && selectedSuite && (
          <div className="space-y-6">
            <div className="panel-card p-6">
              <h2 className="text-xl font-semibold text-white-0 mb-2">
                {selectedSuite.name}
              </h2>
              <p className="text-sm text-muted">
                Run ID: {selectedRun.id.slice(0, 8)}...
              </p>
            </div>

            <SuiteRunControlBar
              run={selectedRun}
              onRunUpdated={handleRunUpdated}
              onError={setError}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-white-0 mb-3">Timeline</h3>
                <SuiteRunTimeline
                  items={runItems}
                  currentItemIndex={selectedRun.currentItemIndex || undefined}
                />
              </div>
              <div>
                <SuiteMetricsPanel run={selectedRun} items={runItems} />
              </div>
            </div>

            {(selectedRun.status === 'completed' || selectedRun.status === 'failed') && (
              <SuiteOutcomePanel run={selectedRun} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`panel-card p-4 ${highlight && value > 0 ? 'ring-2 ring-brand-cyan' : ''}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-semibold ${highlight && value > 0 ? 'text-brand-cyan' : 'text-white-0'}`}>
        {value}
      </p>
    </div>
  );
}
