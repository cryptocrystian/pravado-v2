/**
 * Risk Radar Dashboard Page (Sprint S60)
 * Executive Risk Radar & Predictive Crisis Forecasting Engine
 */

'use client';

import {
  Radar,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import {
  RiskRadarCard,
  RiskIndicatorPanel,
  ForecastPanel,
  RiskDriverList,
  RiskNotesPanel,
  ExecutiveRiskDashboard,
  SnapshotDetailDrawer,
  ForecastGenerationForm,
} from '@/components/risk-radar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  riskRadarApi,
  type RiskRadarSnapshot,
  type RiskRadarIndicator,
  type RiskRadarForecast,
  type RiskRadarDriver,
  type RiskRadarNote,
  type RiskRadarNoteType,
  type RiskRadarForecastHorizon,
  type RiskLevel,
} from '@/lib/riskRadarApi';
import { cn } from '@/lib/utils';

export default function RiskRadarPage() {
  // State
  const [snapshots, setSnapshots] = useState<RiskRadarSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<RiskRadarSnapshot | null>(null);
  const [indicators, setIndicators] = useState<RiskRadarIndicator[]>([]);
  const [forecasts, setForecasts] = useState<RiskRadarForecast[]>([]);
  const [drivers, setDrivers] = useState<RiskRadarDriver[]>([]);
  const [notes, setNotes] = useState<RiskRadarNote[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [forecastFormOpen, setForecastFormOpen] = useState(false);

  // Fetch snapshots
  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const params: { riskLevel?: RiskLevel } = {};
      if (riskFilter !== 'all') {
        params.riskLevel = riskFilter;
      }
      const result = await riskRadarApi.listSnapshots(params);
      const snapshotsData = result.data?.snapshots || [];
      setSnapshots(snapshotsData);

      // Auto-select active snapshot if none selected
      if (!selectedSnapshot && snapshotsData.length > 0) {
        const active = snapshotsData.find((s: RiskRadarSnapshot) => s.isActive);
        if (active) {
          setSelectedSnapshot(active);
        } else {
          setSelectedSnapshot(snapshotsData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    } finally {
      setLoading(false);
    }
  }, [riskFilter, selectedSnapshot]);

  // Fetch snapshot details
  const fetchSnapshotDetails = useCallback(async (snapshotId: string) => {
    try {
      setLoadingDetails(true);
      const [indicatorsResult, forecastsResult, driversResult, notesResult] = await Promise.all([
        riskRadarApi.listIndicators(snapshotId),
        riskRadarApi.listForecasts(snapshotId),
        riskRadarApi.listDrivers(snapshotId),
        riskRadarApi.listNotes(snapshotId),
      ]);

      setIndicators(indicatorsResult.data?.indicators || []);
      setForecasts(forecastsResult.data?.forecasts || []);
      setDrivers(driversResult.data?.drivers || []);
      setNotes(notesResult.data?.notes || []);
    } catch (error) {
      console.error('Failed to fetch snapshot details:', error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Load details when snapshot changes
  useEffect(() => {
    if (selectedSnapshot) {
      fetchSnapshotDetails(selectedSnapshot.id);
    }
  }, [selectedSnapshot, fetchSnapshotDetails]);

  // Handle snapshot selection
  const handleSelectSnapshot = (snapshot: RiskRadarSnapshot) => {
    setSelectedSnapshot(snapshot);
  };

  // Handle create new snapshot
  const handleCreateSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      const result = await riskRadarApi.createSnapshot({
        title: `Risk Snapshot - ${new Date().toLocaleDateString()}`,
      });
      if (result.data) {
        setSnapshots((prev) => [result.data!, ...prev]);
        setSelectedSnapshot(result.data);
      }
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  // Handle rebuild indicators
  const handleRebuildIndicators = async () => {
    if (!selectedSnapshot) return;
    try {
      setRebuilding(true);
      await riskRadarApi.rebuildIndicators(selectedSnapshot.id);
      await fetchSnapshotDetails(selectedSnapshot.id);
      // Refresh snapshot to get updated scores
      const result = await riskRadarApi.getSnapshot(selectedSnapshot.id);
      if (result.data) {
        setSelectedSnapshot(result.data);
        setSnapshots((prev) =>
          prev.map((s) => (s.id === result.data!.id ? result.data! : s))
        );
      }
    } catch (error) {
      console.error('Failed to rebuild indicators:', error);
    } finally {
      setRebuilding(false);
    }
  };

  // Handle generate forecast
  const handleGenerateForecast = async (
    horizon: RiskRadarForecastHorizon,
    useLlm: boolean
  ) => {
    if (!selectedSnapshot) return;
    try {
      setRegenerating(true);
      const result = await riskRadarApi.generateForecast(selectedSnapshot.id, {
        horizon,
        useLlm,
      });
      if (result.data?.forecast) {
        setForecasts((prev) => [result.data!.forecast, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate forecast:', error);
    } finally {
      setRegenerating(false);
    }
  };

  // Handle regenerate forecast
  const handleRegenerateForecast = async (forecastId: string) => {
    if (!selectedSnapshot) return;
    try {
      setRegenerating(true);
      const existing = forecasts.find((f) => f.id === forecastId);
      if (existing) {
        const result = await riskRadarApi.generateForecast(selectedSnapshot.id, {
          horizon: existing.horizon,
          useLlm: true,
        });
        if (result.data?.forecast) {
          setForecasts((prev) => prev.map((f) => (f.id === forecastId ? result.data!.forecast : f)));
        }
      }
    } catch (error) {
      console.error('Failed to regenerate forecast:', error);
    } finally {
      setRegenerating(false);
    }
  };

  // Handle add note
  const handleAddNote = async (content: string, noteType: RiskRadarNoteType) => {
    if (!selectedSnapshot) return;
    try {
      const result = await riskRadarApi.addNote(selectedSnapshot.id, {
        content,
        noteType,
      });
      if (result.data) {
        setNotes((prev) => [result.data!, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  // Filter snapshots
  const filteredSnapshots = snapshots.filter((snapshot) => {
    const matchesSearch =
      !searchQuery ||
      snapshot.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snapshot.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const currentForecast = forecasts.find((f) => f.isCurrent);
  const previousSnapshot = snapshots.find(
    (s) => s.id !== selectedSnapshot?.id && !s.isActive
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Radar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Risk Radar</h1>
              <p className="text-sm text-gray-500">
                Executive risk monitoring & predictive crisis forecasting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSnapshots()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleCreateSnapshot} disabled={creatingSnapshot}>
              {creatingSnapshot ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Snapshot
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Snapshot List */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Snapshots
                  <Badge variant="secondary" className="ml-auto">
                    {snapshots.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search snapshots..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter */}
                <Select
                  value={riskFilter}
                  onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Snapshot List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredSnapshots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No snapshots found
                    </div>
                  ) : (
                    filteredSnapshots.map((snapshot) => (
                      <RiskRadarCard
                        key={snapshot.id}
                        snapshot={snapshot}
                        isActive={selectedSnapshot?.id === snapshot.id}
                        onSelect={() => handleSelectSnapshot(snapshot)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Indicators + Forecast */}
          <div className="col-span-5 space-y-4">
            {selectedSnapshot ? (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Risk Index</span>
                    </div>
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        selectedSnapshot.riskLevel === 'critical'
                          ? 'text-red-600'
                          : selectedSnapshot.riskLevel === 'high'
                            ? 'text-orange-600'
                            : selectedSnapshot.riskLevel === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                      )}
                    >
                      {selectedSnapshot.overallRiskIndex}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Indicators</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {indicators.length}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs">Forecasts</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {forecasts.length}
                    </div>
                  </Card>
                </div>

                {/* Indicators Panel */}
                <RiskIndicatorPanel indicators={indicators} loading={loadingDetails} />

                {/* Forecast Panel */}
                <div className="relative">
                  <ForecastPanel
                    forecast={currentForecast}
                    loading={loadingDetails}
                    onRegenerate={
                      currentForecast
                        ? () => handleRegenerateForecast(currentForecast.id)
                        : () => setForecastFormOpen(true)
                    }
                    regenerating={regenerating}
                  />
                  {!currentForecast && !loadingDetails && (
                    <div className="absolute top-14 right-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setForecastFormOpen(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Radar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">
                  Select a snapshot to view indicators and forecasts
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Executive Dashboard + Drivers + Notes */}
          <div className="col-span-4 space-y-4">
            {selectedSnapshot ? (
              <>
                {/* Executive Dashboard */}
                <ExecutiveRiskDashboard
                  snapshot={selectedSnapshot}
                  forecast={currentForecast}
                  previousSnapshot={previousSnapshot}
                  loading={loadingDetails}
                />

                {/* Risk Drivers */}
                <RiskDriverList drivers={drivers} loading={loadingDetails} />

                {/* Notes Panel */}
                <RiskNotesPanel
                  notes={notes}
                  loading={loadingDetails}
                  onAddNote={handleAddNote}
                />

                {/* View Full Details Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDrawerOpen(true)}
                >
                  View Full Details
                </Button>
              </>
            ) : (
              <Card className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">
                  Select a snapshot to view executive dashboard
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Detail Drawer */}
      <SnapshotDetailDrawer
        snapshot={selectedSnapshot}
        indicators={indicators}
        forecasts={forecasts}
        drivers={drivers}
        notes={notes}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={loadingDetails}
        onRebuildIndicators={handleRebuildIndicators}
        onGenerateForecast={() => setForecastFormOpen(true)}
        onRegenerateForecast={handleRegenerateForecast}
        onAddNote={handleAddNote}
        rebuilding={rebuilding}
        regenerating={regenerating}
      />

      {/* Forecast Generation Form */}
      {selectedSnapshot && (
        <ForecastGenerationForm
          snapshotId={selectedSnapshot.id}
          open={forecastFormOpen}
          onClose={() => setForecastFormOpen(false)}
          onSubmit={handleGenerateForecast}
        />
      )}
    </div>
  );
}
