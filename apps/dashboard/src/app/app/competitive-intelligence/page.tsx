'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  Competitor,
  CompetitorInsight,
  CompetitorMetricsSnapshot,
  CompetitorMetricsSummary,
} from '@pravado/types';
import {
  getCompetitors,
  getInsights,
  getSnapshots,
  getCompetitorMetrics,
  deleteCompetitor,
  getTierLabel,
} from '@/lib/competitorIntelligenceApi';
import CompetitorCard from '@/components/competitive-intelligence/CompetitorCard';
import { CompetitorInsightList } from '@/components/competitive-intelligence/CompetitorInsightPanel';
import { CompetitorTrendChart } from '@/components/competitive-intelligence/CompetitorTrendChart';
import { CompetitorComparisonDrawer } from '@/components/competitive-intelligence/CompetitorComparisonDrawer';
import { CompetitorForm } from '@/components/competitive-intelligence/CompetitorForm';
import {
  Plus,
  RefreshCw,
  Search,
  BarChart2,
  Lightbulb,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function CompetitiveIntelligencePage() {
  // State
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [snapshots, setSnapshots] = useState<CompetitorMetricsSnapshot[]>([]);
  const [metricsMap, setMetricsMap] = useState<Map<string, CompetitorMetricsSummary>>(new Map());

  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [competitorsRes, insightsRes, snapshotsRes] = await Promise.all([
        getCompetitors(),
        getInsights({ isDismissed: false }, 50),
        getSnapshots({ period: 'daily' as any, snapshotStart: startDate, snapshotEnd: endDate }, 100),
      ]);

      setCompetitors(competitorsRes.competitors);
      setInsights(insightsRes.insights);
      setSnapshots(snapshotsRes.snapshots);

      // Load metrics for each competitor
      const metricsPromises = competitorsRes.competitors.map(async (comp) => {
        try {
          const metrics = await getCompetitorMetrics(comp.id, startDate, endDate);
          return [comp.id, metrics] as [string, CompetitorMetricsSummary];
        } catch {
          return null;
        }
      });

      const metricsResults = await Promise.all(metricsPromises);
      const newMetricsMap = new Map<string, CompetitorMetricsSummary>();
      metricsResults.forEach((result) => {
        if (result) {
          newMetricsMap.set(result[0], result[1]);
        }
      });
      setMetricsMap(newMetricsMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered competitors
  const filteredCompetitors = competitors.filter((comp) => {
    const matchesSearch =
      searchQuery === '' ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === 'all' || comp.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  // Handle competitor actions
  const handleCompetitorAdded = (competitor: Competitor) => {
    setCompetitors((prev) => [...prev, competitor]);
    setShowAddForm(false);
  };

  const handleCompetitorUpdated = (competitor: Competitor) => {
    setCompetitors((prev) => prev.map((c) => (c.id === competitor.id ? competitor : c)));
    setEditingCompetitor(null);
  };

  const handleDeleteCompetitor = async (competitor: Competitor) => {
    if (!confirm(`Are you sure you want to delete "${competitor.name}"?`)) {
      return;
    }

    try {
      await deleteCompetitor(competitor.id);
      setCompetitors((prev) => prev.filter((c) => c.id !== competitor.id));
    } catch (error) {
      console.error('Failed to delete competitor:', error);
    }
  };

  const handleCompareCompetitor = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setComparisonOpen(true);
  };

  const handleInsightUpdated = (insight: CompetitorInsight) => {
    setInsights((prev) => prev.map((i) => (i.id === insight.id ? insight : i)));
  };

  // Summary stats
  const totalCompetitors = competitors.length;
  const activeCompetitors = competitors.filter((c) => c.isActive).length;
  const unreadInsights = insights.filter((i) => !i.isRead && !i.isDismissed).length;
  const totalMentions = Array.from(metricsMap.values()).reduce((sum, m) => sum + (m.totalMentions || 0), 0);

  // Tier breakdown
  const tierBreakdown = {
    tier_1: competitors.filter((c) => c.tier === 'tier_1').length,
    tier_2: competitors.filter((c) => c.tier === 'tier_2').length,
    tier_3: competitors.filter((c) => c.tier === 'tier_3').length,
    tier_4: competitors.filter((c) => c.tier === 'tier_4').length,
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitive Intelligence</h1>
          <p className="text-muted-foreground">
            Track competitors, analyze coverage, and identify strategic opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Competitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompetitors}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompetitors - activeCompetitors} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentions (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMentions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all competitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadInsights}</div>
            <p className="text-xs text-muted-foreground">Actionable intelligence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Distribution</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-xs">
                T1: {tierBreakdown.tier_1}
              </Badge>
              <Badge variant="warning" className="text-xs">
                T2: {tierBreakdown.tier_2}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                T3: {tierBreakdown.tier_3}
              </Badge>
              <Badge variant="outline" className="text-xs">
                T4: {tierBreakdown.tier_4}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <Users className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
            {unreadInsights > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadInsights}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Panel - Top Competitors */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Competitors by Activity</CardTitle>
                <CardDescription>Most active competitors in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors
                    .slice(0, 5)
                    .map((competitor) => {
                      const metrics = metricsMap.get(competitor.id);
                      return (
                        <div
                          key={competitor.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{competitor.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {getTierLabel(competitor.tier)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {metrics?.totalMentions?.toLocaleString() || 0} mentions
                            </p>
                            <p className="text-xs text-muted-foreground">
                              EVI: {metrics?.avgEviScore?.toFixed(0) || 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompareCompetitor(competitor)}
                          >
                            Compare
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
                <CardDescription>Latest AI-generated insights</CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitorInsightList
                  insights={insights.slice(0, 5)}
                  onUpdate={handleInsightUpdated}
                  compact
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search competitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="tier_1">Tier 1 - Direct</SelectItem>
                <SelectItem value="tier_2">Tier 2 - Secondary</SelectItem>
                <SelectItem value="tier_3">Tier 3 - Emerging</SelectItem>
                <SelectItem value="tier_4">Tier 4 - Distant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Competitor Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                metrics={metricsMap.get(competitor.id) ? {
                  mentionCount: metricsMap.get(competitor.id)!.totalMentions,
                  avgSentiment: metricsMap.get(competitor.id)!.avgSentiment,
                  eviScore: metricsMap.get(competitor.id)!.avgEviScore,
                } : undefined}
                onSelect={handleCompareCompetitor}
                onEdit={setEditingCompetitor}
                onDelete={handleDeleteCompetitor}
              />
            ))}
          </div>

          {filteredCompetitors.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No competitors found</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Competitor
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <CompetitorInsightList insights={insights} onUpdate={handleInsightUpdated} />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CompetitorTrendChart
              snapshots={snapshots}
              metric="mentions"
              title="Overall Mention Volume"
              description="Aggregate competitor mentions over time"
            />
            <CompetitorTrendChart
              snapshots={snapshots}
              metric="sentiment"
              title="Average Sentiment"
              description="Sentiment trends across competitors"
            />
            <CompetitorTrendChart
              snapshots={snapshots}
              metric="evi"
              title="EVI Score Trends"
              description="Earned visibility index over time"
            />
            <CompetitorTrendChart
              snapshots={snapshots}
              metric="reach"
              title="Estimated Reach"
              description="Total estimated audience reach"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals and Drawers */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl p-4">
            <CompetitorForm
              onSuccess={handleCompetitorAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {editingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl p-4">
            <CompetitorForm
              competitor={editingCompetitor}
              onSuccess={handleCompetitorUpdated}
              onCancel={() => setEditingCompetitor(null)}
            />
          </div>
        </div>
      )}

      <CompetitorComparisonDrawer
        competitor={selectedCompetitor}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />
    </div>
  );
}
