/**
 * Crisis Dashboard Page (Sprint S55)
 *
 * Three-panel layout for crisis incident management with signals,
 * actions, briefs, and real-time monitoring
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CrisisIncidentCard,
  CrisisSignalList,
  CrisisActionList,
  CrisisIncidentDetailDrawer,
  CrisisBriefPanel,
  CrisisFiltersBar,
  CrisisDashboardStats,
  CrisisSeverityBadge,
  CrisisDetectionPanel,
  CrisisEscalationRuleEditor,
} from '@/components/crisis';
import type { CrisisFilters } from '@/components/crisis';
import type {
  CrisisIncident,
  CrisisSignal,
  CrisisAction,
  CrisisBrief,
  CrisisDashboardStats as DashboardStats,
  CrisisEscalationRule,
  DetectionResultResponse,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  TriggerDetectionRequest,
} from '@pravado/types';
import * as crisisApi from '@/lib/crisisApi';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Loader2,
  Plus,
  RefreshCw,
  Radar,
  Sparkles,
  Settings,
  Shield,
} from 'lucide-react';

export default function CrisisPage() {
  // Data State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<CrisisIncident[]>([]);
  const [signals, setSignals] = useState<CrisisSignal[]>([]);
  const [actions, setActions] = useState<CrisisAction[]>([]);
  const [escalationRules, setEscalationRules] = useState<CrisisEscalationRule[]>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<CrisisIncident | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<CrisisBrief | null>(null);
  const [lastDetectionResults, setLastDetectionResults] = useState<DetectionResultResponse | null>(null);
  const [lastDetectionRunAt, setLastDetectionRunAt] = useState<Date | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CrisisFilters>({
    status: ['active', 'contained'],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Load data on mount and filter change
  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [filters]);

  // Load selected incident details
  useEffect(() => {
    if (selectedIncident?.id) {
      loadIncidentDetails(selectedIncident.id);
    }
  }, [selectedIncident?.id]);

  const loadData = async () => {
    await Promise.all([loadIncidents(), loadSignals(), loadActions(), loadEscalationRules()]);
  };

  const loadEscalationRules = async () => {
    try {
      const result = await crisisApi.getRules();
      setEscalationRules(result.rules);
    } catch (err: unknown) {
      console.error('Failed to load escalation rules:', err);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await crisisApi.getDashboardStats();
      setDashboardStats(stats);
    } catch (err: unknown) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await crisisApi.getIncidents(
        {
          status: filters.status,
          severity: filters.severity,
          trajectory: filters.trajectory,
          propagationLevel: filters.propagationLevel,
          isEscalated: filters.isEscalated,
          searchQuery: filters.searchQuery,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
        20,
        0
      );

      setIncidents(result.incidents);
      setTotalIncidents(result.total);

      // Auto-select first incident if none selected
      if (!selectedIncident && result.incidents.length > 0) {
        setSelectedIncident(result.incidents[0]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load incidents';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSignals = async () => {
    try {
      const result = await crisisApi.getSignals({ isActive: true }, 50, 0);
      setSignals(result.signals);
    } catch (err: unknown) {
      console.error('Failed to load signals:', err);
    }
  };

  const loadActions = async () => {
    try {
      const result = await crisisApi.getActions(
        { status: ['recommended', 'approved', 'in_progress'] },
        50,
        0
      );
      setActions(result.actions);
    } catch (err: unknown) {
      console.error('Failed to load actions:', err);
    }
  };

  const loadIncidentDetails = async (incidentId: string) => {
    try {
      const [incident, brief] = await Promise.all([
        crisisApi.getIncident(incidentId),
        crisisApi.getCurrentBrief(incidentId),
      ]);
      setSelectedIncident(incident);
      setSelectedBrief(brief);
    } catch (err: unknown) {
      console.error('Failed to load incident details:', err);
    }
  };

  // Detection
  const handleRunDetection = async (options?: TriggerDetectionRequest) => {
    try {
      setIsDetecting(true);
      setError(null);

      const result = await crisisApi.runDetection(options || { forceRefresh: true });

      // Store detection results
      setLastDetectionResults(result);
      setLastDetectionRunAt(new Date());

      // Reload data after detection
      await Promise.all([loadIncidents(), loadSignals(), loadStats()]);

      // Show success message if signals/incidents were generated
      if (result.signalsGenerated > 0 || result.incidentsCreated > 0) {
        console.log(
          `Detection completed: ${result.signalsGenerated} signals, ${result.incidentsCreated} incidents`
        );
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Detection failed';
      setError(message);
      return undefined;
    } finally {
      setIsDetecting(false);
    }
  };

  // Escalation Rule handlers
  const handleCreateRule = async (input: CreateEscalationRuleRequest) => {
    await crisisApi.createRule(input);
    await loadEscalationRules();
  };

  const handleUpdateRule = async (ruleId: string, updates: UpdateEscalationRuleRequest) => {
    await crisisApi.updateRule(ruleId, updates);
    await loadEscalationRules();
  };

  const handleDeleteRule = async (ruleId: string) => {
    await crisisApi.deleteRule(ruleId);
    await loadEscalationRules();
  };

  // Signal handlers
  const handleAcknowledgeSignal = useCallback(async (signal: CrisisSignal) => {
    await crisisApi.acknowledgeSignal(signal.id);
    await loadSignals();
    await loadStats();
  }, []);

  const handleCreateIncidentFromSignal = useCallback((_signal: CrisisSignal) => {
    setShowCreateModal(true);
    // Pre-fill form with signal data
  }, []);

  // Incident handlers
  const handleSelectIncident = (incident: CrisisIncident) => {
    setSelectedIncident(incident);
    setDetailDrawerOpen(true);
  };

  const handleEscalateIncident = async (incident: CrisisIncident) => {
    try {
      await crisisApi.escalateIncident(incident.id, incident.escalationLevel + 1);
      await loadIncidents();
      await loadStats();
      if (selectedIncident?.id === incident.id) {
        await loadIncidentDetails(incident.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Escalation failed';
      setError(message);
    }
  };

  const handleContainIncident = async () => {
    if (!selectedIncident) return;
    try {
      await crisisApi.updateIncident(selectedIncident.id, { status: 'contained' });
      await loadIncidents();
      await loadStats();
      await loadIncidentDetails(selectedIncident.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Containment failed';
      setError(message);
    }
  };

  const handleResolveIncident = async (notes?: string) => {
    if (!selectedIncident) return;
    try {
      await crisisApi.closeIncident(selectedIncident.id, notes);
      await loadIncidents();
      await loadStats();
      await loadIncidentDetails(selectedIncident.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Resolution failed';
      setError(message);
    }
  };

  // Brief handlers
  const handleGenerateBrief = async () => {
    if (!selectedIncident) return;
    try {
      setIsGeneratingBrief(true);
      const result = await crisisApi.generateBrief(selectedIncident.id);
      setSelectedBrief(result.brief);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Brief generation failed';
      setError(message);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Recommendation handlers
  const handleGenerateRecommendations = async () => {
    if (!selectedIncident) return;
    try {
      setIsGeneratingRecommendations(true);
      await crisisApi.generateRecommendations(selectedIncident.id);
      await loadActions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Recommendation generation failed';
      setError(message);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Action handlers
  const handleApproveAction = useCallback(async (action: CrisisAction) => {
    await crisisApi.approveAction(action.id);
    await loadActions();
  }, []);

  const handleStartAction = useCallback(async (action: CrisisAction) => {
    await crisisApi.startAction(action.id);
    await loadActions();
  }, []);

  const handleCompleteAction = useCallback(async (action: CrisisAction) => {
    await crisisApi.completeAction(action.id);
    await loadActions();
    await loadStats();
  }, []);

  // Get incident-specific data
  const incidentSignals = selectedIncident
    ? signals.filter((s) => selectedIncident.linkedSignalIds.includes(s.id))
    : [];
  const incidentActions = selectedIncident
    ? actions.filter((a) => a.incidentId === selectedIncident.id)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              Crisis Response Center
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor threats, manage incidents, and coordinate response actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleRunDetection()} disabled={isDetecting}>
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4 mr-2" />
                  Run Detection
                </>
              )}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Incident
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded mb-6">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setError(null)}
            >
              &times;
            </Button>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="mb-6">
          <CrisisDashboardStats
            stats={dashboardStats}
            isLoading={isLoadingStats}
            onRefresh={loadStats}
            onNavigateToIncidents={() => setFilters({ ...filters, status: ['active'] })}
            onNavigateToSignals={() => {
              // Focus signals panel
            }}
            onNavigateToActions={() => {
              // Focus actions panel
            }}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <CrisisFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={totalIncidents}
            filteredCount={incidents.length}
          />
        </div>

        {/* Three-Panel Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Incident List */}
          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h2 className="font-semibold">Incidents</h2>
                    <Badge variant="secondary">{incidents.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadIncidents}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-500px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No incidents found</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleRunDetection()}
                    >
                      Run detection scan
                    </Button>
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <CrisisIncidentCard
                      key={incident.id}
                      incident={incident}
                      onSelect={handleSelectIncident}
                      onEscalate={handleEscalateIncident}
                      onViewBrief={(inc) => {
                        setSelectedIncident(inc);
                        setDetailDrawerOpen(true);
                      }}
                      isSelected={selectedIncident?.id === incident.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* CENTER PANEL: Signals & Tabs */}
          <div className="col-span-5 space-y-4">
            <Tabs defaultValue="signals">
              <TabsList className="w-full">
                <TabsTrigger value="signals" className="flex-1">
                  <Bell className="h-4 w-4 mr-1" />
                  Signals ({signals.filter((s) => s.isActive).length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex-1">
                  Actions ({actions.length})
                </TabsTrigger>
                <TabsTrigger value="brief" className="flex-1">
                  Brief
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="mt-4">
                <CrisisSignalList
                  signals={signals}
                  onAcknowledge={handleAcknowledgeSignal}
                  onCreateIncident={handleCreateIncidentFromSignal}
                  onRefresh={loadSignals}
                  maxHeight="calc(100vh - 450px)"
                />
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <CrisisActionList
                  actions={selectedIncident ? incidentActions : actions}
                  onApprove={handleApproveAction}
                  onStart={handleStartAction}
                  onComplete={handleCompleteAction}
                  onRefresh={loadActions}
                  maxHeight="calc(100vh - 450px)"
                />
              </TabsContent>

              <TabsContent value="brief" className="mt-4">
                <CrisisBriefPanel
                  brief={selectedBrief}
                  onGenerate={handleGenerateBrief}
                  isGenerating={isGeneratingBrief}
                  maxHeight="calc(100vh - 450px)"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT PANEL: Signals, Detection, Rules Tabs */}
          <div className="col-span-3 space-y-4">
            <Tabs defaultValue="signals">
              <TabsList className="w-full">
                <TabsTrigger value="signals" className="flex-1">
                  <Bell className="h-4 w-4 mr-1" />
                  Signals
                </TabsTrigger>
                <TabsTrigger value="detection" className="flex-1">
                  <Radar className="h-4 w-4 mr-1" />
                  Detection
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  Rules
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="mt-4">
                <CrisisSignalList
                  signals={signals}
                  onAcknowledge={handleAcknowledgeSignal}
                  onCreateIncident={handleCreateIncidentFromSignal}
                  onRefresh={loadSignals}
                  maxHeight="calc(100vh - 400px)"
                />
              </TabsContent>

              <TabsContent value="detection" className="mt-4">
                <CrisisDetectionPanel
                  onRunDetection={handleRunDetection}
                  isRunning={isDetecting}
                  lastRunAt={lastDetectionRunAt || undefined}
                  lastResults={lastDetectionResults}
                />
              </TabsContent>

              <TabsContent value="rules" className="mt-4">
                <CrisisEscalationRuleEditor
                  rules={escalationRules}
                  onCreate={handleCreateRule}
                  onUpdate={handleUpdateRule}
                  onDelete={handleDeleteRule}
                />
              </TabsContent>
            </Tabs>

            {/* Selected Incident Summary */}
            {selectedIncident && (
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Selected Incident</h3>
                    <CrisisSeverityBadge
                      severity={selectedIncident.severity}
                      trajectory={selectedIncident.trajectory}
                      showTrajectory
                      size="sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium truncate">{selectedIncident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedIncident.incidentCode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Mentions</span>
                      <span className="font-semibold">
                        {selectedIncident.mentionCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Reach</span>
                      <span className="font-semibold">
                        {selectedIncident.estimatedReach >= 1_000_000
                          ? `${(selectedIncident.estimatedReach / 1_000_000).toFixed(1)}M`
                          : selectedIncident.estimatedReach >= 1_000
                            ? `${(selectedIncident.estimatedReach / 1_000).toFixed(1)}K`
                            : selectedIncident.estimatedReach}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDetailDrawerOpen(true)}
                    >
                      View Details
                    </Button>
                    {selectedIncident.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleEscalateIncident(selectedIncident)}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Quick Actions</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manual Incident
                </Button>
                {selectedIncident && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleGenerateRecommendations}
                      disabled={isGeneratingRecommendations}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGeneratingRecommendations ? 'Generating...' : 'AI Recommendations'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleGenerateBrief}
                      disabled={isGeneratingBrief}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isGeneratingBrief ? 'Generating...' : 'Generate Brief'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Incident Detail Drawer */}
        <CrisisIncidentDetailDrawer
          incident={selectedIncident}
          signals={incidentSignals}
          actions={incidentActions}
          brief={selectedBrief}
          isOpen={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          onEscalate={(level) =>
            selectedIncident
              ? crisisApi
                  .escalateIncident(selectedIncident.id, level)
                  .then(() => loadIncidentDetails(selectedIncident.id))
              : Promise.resolve()
          }
          onContain={handleContainIncident}
          onResolve={handleResolveIncident}
          onGenerateBrief={handleGenerateBrief}
          onGenerateRecommendations={handleGenerateRecommendations}
          onAcknowledgeSignal={handleAcknowledgeSignal}
          onApproveAction={handleApproveAction}
          onStartAction={handleStartAction}
          onCompleteAction={handleCompleteAction}
          onOpenFullPage={(id) => {
            // Navigate to full page view
            window.location.href = `/app/crisis/${id}`;
          }}
          isGeneratingBrief={isGeneratingBrief}
          isGeneratingRecommendations={isGeneratingRecommendations}
        />

        {/* Create Incident Modal - Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Incident</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                Manual incident creation form will be implemented here.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button disabled>Create</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
