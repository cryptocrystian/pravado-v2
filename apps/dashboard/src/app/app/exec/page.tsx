/**
 * Executive Command Center Page (Sprint S61)
 * Main page for cross-system executive dashboard
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

import {
  ExecDashboardLayout,
  ExecDashboardHeader,
  ExecFilterBar,
  ExecKpiGrid,
  ExecInsightsFeed,
  ExecNarrativePanel,
  ExecDashboardCard,
} from '@/components/executive-command-center';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  execDashboardApi,
  type ExecDashboard,
  type ExecDashboardInsight,
  type ExecDashboardKpi,
  type ExecDashboardNarrative,
  type ExecDashboardWithCounts,
  type ExecDashboardTimeWindow,
  type ExecDashboardPrimaryFocus,
  getTimeWindowLabel,
  getPrimaryFocusLabel,
} from '@/lib/executiveCommandCenterApi';
import {
  AlertCircle,
  LayoutDashboard,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ExecutiveCommandCenterPage() {
  // Dashboard list state
  const [dashboards, setDashboards] = useState<ExecDashboardWithCounts[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(true);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);

  // Selected dashboard details
  const [dashboard, setDashboard] = useState<ExecDashboard | null>(null);
  const [kpis, setKpis] = useState<ExecDashboardKpi[]>([]);
  const [insights, setInsights] = useState<ExecDashboardInsight[]>([]);
  const [narrative, setNarrative] = useState<ExecDashboardNarrative | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action states
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create dashboard dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    timeWindow: '7d' as ExecDashboardTimeWindow,
    primaryFocus: 'mixed' as ExecDashboardPrimaryFocus,
  });
  const [creating, setCreating] = useState(false);

  // Load dashboards
  const loadDashboards = useCallback(async () => {
    setDashboardsLoading(true);
    setError(null);

    try {
      const response = await execDashboardApi.listDashboards({ includeArchived: false });
      if (response.success && response.data) {
        setDashboards(response.data.dashboards);

        // Auto-select default dashboard or first dashboard
        if (!selectedDashboardId && response.data.dashboards.length > 0) {
          const defaultDashboard = response.data.dashboards.find((d) => d.isDefault);
          setSelectedDashboardId(defaultDashboard?.id || response.data.dashboards[0].id);
        }
      } else {
        setError(response.error?.message || 'Failed to load dashboards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
    } finally {
      setDashboardsLoading(false);
    }
  }, [selectedDashboardId]);

  // Load dashboard details
  const loadDashboardDetails = useCallback(async (dashboardId: string) => {
    setDetailsLoading(true);
    setError(null);

    try {
      const response = await execDashboardApi.getDashboard(dashboardId);
      if (response.success && response.data) {
        setDashboard(response.data.dashboard);
        setKpis(response.data.kpis);
        setInsights(response.data.topInsights);
        setNarrative(response.data.currentNarrative);
      } else {
        setError(response.error?.message || 'Failed to load dashboard details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard details');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Refresh dashboard
  const handleRefresh = useCallback(async () => {
    if (!selectedDashboardId) return;

    setRefreshing(true);
    setError(null);

    try {
      const response = await execDashboardApi.refreshDashboard(selectedDashboardId, {
        regenerateNarrative: true,
        forceRefresh: true,
      });

      if (response.success) {
        // Reload dashboard details
        await loadDashboardDetails(selectedDashboardId);
        // Reload dashboard list to get updated counts
        await loadDashboards();
      } else {
        setError(response.error?.message || 'Failed to refresh dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [selectedDashboardId, loadDashboardDetails, loadDashboards]);

  // Create dashboard
  const handleCreateDashboard = async () => {
    if (!createFormData.title.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const response = await execDashboardApi.createDashboard({
        title: createFormData.title.trim(),
        description: createFormData.description.trim() || undefined,
        timeWindow: createFormData.timeWindow,
        primaryFocus: createFormData.primaryFocus,
      });

      if (response.success && response.data) {
        setCreateDialogOpen(false);
        setCreateFormData({
          title: '',
          description: '',
          timeWindow: '7d',
          primaryFocus: 'mixed',
        });
        // Reload and select the new dashboard
        await loadDashboards();
        setSelectedDashboardId(response.data.dashboard.id);
      } else {
        setError(response.error?.message || 'Failed to create dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard');
    } finally {
      setCreating(false);
    }
  };

  // Handle time window change
  const handleTimeWindowChange = async (timeWindow: ExecDashboardTimeWindow) => {
    if (!selectedDashboardId || !dashboard) return;

    try {
      await execDashboardApi.updateDashboard(selectedDashboardId, { timeWindow });
      setDashboard({ ...dashboard, timeWindow });
      // Trigger refresh to recalculate with new time window
      await handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time window');
    }
  };

  // Handle primary focus change
  const handlePrimaryFocusChange = async (primaryFocus: ExecDashboardPrimaryFocus) => {
    if (!selectedDashboardId || !dashboard) return;

    try {
      await execDashboardApi.updateDashboard(selectedDashboardId, { primaryFocus });
      setDashboard({ ...dashboard, primaryFocus });
      // Trigger refresh to recalculate with new focus
      await handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update focus');
    }
  };

  // Handle dashboard selection
  const handleSelectDashboard = (selected: ExecDashboardWithCounts) => {
    setSelectedDashboardId(selected.id);
  };

  // Handle set default
  const handleSetDefault = async () => {
    if (!selectedDashboardId) return;

    try {
      await execDashboardApi.updateDashboard(selectedDashboardId, { isDefault: true });
      await loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set as default');
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!selectedDashboardId) return;

    try {
      await execDashboardApi.updateDashboard(selectedDashboardId, { isArchived: true });
      setSelectedDashboardId(null);
      await loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive dashboard');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedDashboardId) return;

    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      await execDashboardApi.deleteDashboard(selectedDashboardId, true);
      setSelectedDashboardId(null);
      await loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dashboard');
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  // Load details when dashboard selected
  useEffect(() => {
    if (selectedDashboardId) {
      loadDashboardDetails(selectedDashboardId);
    }
  }, [selectedDashboardId, loadDashboardDetails]);

  // Count risks and opportunities
  const risksCount = insights.filter((i) => i.isRisk).length;
  const opportunitiesCount = insights.filter((i) => i.isOpportunity).length;

  return (
    <>
      <ExecDashboardLayout
        loading={dashboardsLoading}
        header={
          <div className="space-y-4">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-iris/20">
                  <LayoutDashboard className="h-6 w-6 text-brand-iris" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white-0">
                    Executive Command Center
                  </h1>
                  <p className="text-sm text-muted">
                    Cross-system insights and unified executive dashboard
                  </p>
                </div>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert-error flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Dashboard Header and Filter Bar */}
            {dashboard && (
              <>
                <ExecDashboardHeader
                  dashboard={dashboard}
                  kpisCount={kpis.length}
                  insightsCount={insights.length}
                  risksCount={risksCount}
                  opportunitiesCount={opportunitiesCount}
                  hasNarrative={!!narrative}
                  onSetDefault={handleSetDefault}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
                <ExecFilterBar
                  timeWindow={dashboard.timeWindow}
                  primaryFocus={dashboard.primaryFocus}
                  onTimeWindowChange={handleTimeWindowChange}
                  onPrimaryFocusChange={handlePrimaryFocusChange}
                  onRefresh={handleRefresh}
                  onCreateDashboard={() => setCreateDialogOpen(true)}
                  refreshing={refreshing}
                  disabled={detailsLoading}
                  showCreateButton={false}
                  showManageButton={false}
                />
              </>
            )}
          </div>
        }
        leftPanel={
          dashboard && (
            <ExecInsightsFeed
              insights={insights}
              loading={detailsLoading}
              className="sticky top-24"
            />
          )
        }
        centerPanel={
          dashboard && (
            <div className="space-y-6">
              <ExecKpiGrid kpis={kpis} loading={detailsLoading} />
              <ExecNarrativePanel
                narrative={narrative}
                loading={detailsLoading}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            </div>
          )
        }
        rightPanel={
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Your Dashboards
                  <Badge variant="secondary" className="ml-2">
                    {dashboards.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboards.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    <LayoutDashboard className="h-8 w-8 mx-auto mb-2 text-slate-6" />
                    <p>No dashboards yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      Create your first dashboard
                    </Button>
                  </div>
                ) : (
                  dashboards.map((d) => (
                    <ExecDashboardCard
                      key={d.id}
                      dashboard={d}
                      isSelected={d.id === selectedDashboardId}
                      onSelect={handleSelectDashboard}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            {dashboard && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Time Window</span>
                    <span className="font-medium text-white-0">
                      {getTimeWindowLabel(dashboard.timeWindow)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Primary Focus</span>
                    <span className="font-medium text-white-0">
                      {getPrimaryFocusLabel(dashboard.primaryFocus)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total KPIs</span>
                    <span className="font-medium text-white-0">{kpis.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Active Risks</span>
                    <span className="font-medium text-semantic-danger">{risksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Opportunities</span>
                    <span className="font-medium text-semantic-success">{opportunitiesCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        }
      />

      {/* Create Dashboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Executive Dashboard</DialogTitle>
            <DialogDescription>
              Create a new executive dashboard to track cross-system KPIs and insights.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Dashboard Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Executive Overview"
                value={createFormData.title}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this dashboard's purpose..."
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Window</Label>
                <Select
                  value={createFormData.timeWindow}
                  onValueChange={(v) =>
                    setCreateFormData({
                      ...createFormData,
                      timeWindow: v as ExecDashboardTimeWindow,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Focus</Label>
                <Select
                  value={createFormData.primaryFocus}
                  onValueChange={(v) =>
                    setCreateFormData({
                      ...createFormData,
                      primaryFocus: v as ExecDashboardPrimaryFocus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed Overview</SelectItem>
                    <SelectItem value="risk">Risk Management</SelectItem>
                    <SelectItem value="reputation">Brand Reputation</SelectItem>
                    <SelectItem value="growth">Growth & Opportunities</SelectItem>
                    <SelectItem value="governance">Governance & Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={creating || !createFormData.title.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dashboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
