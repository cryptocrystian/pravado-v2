/**
 * Media Performance Dashboard Page (Sprint S52)
 * Unified performance intelligence dashboard across S38-S50 systems
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerformanceScoreCard } from '@/components/media-performance/PerformanceScoreCard';
import { SentimentTrendChart } from '@/components/media-performance/SentimentTrendChart';
import { CoverageVelocityChart } from '@/components/media-performance/CoverageVelocityChart';
import { TierDistributionPie } from '@/components/media-performance/TierDistributionPie';
import { JournalistImpactTable } from '@/components/media-performance/JournalistImpactTable';
import { CampaignHeatmap } from '@/components/media-performance/CampaignHeatmap';
import { InsightNarrativePanel } from '@/components/media-performance/InsightNarrativePanel';
import {
  getOverview,
  getTrend,
  getInsights,
} from '@/lib/mediaPerformanceApi';
import type {
  GetOverviewResponse,
  GetTrendResponse,
  MediaPerformanceInsight,
  MetricType,
  TierDistribution,
} from '@pravado/types';
import {
  Activity,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function MediaPerformancePage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [overview, setOverview] = useState<GetOverviewResponse | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<GetTrendResponse | null>(null);
  const [velocityTrend, setVelocityTrend] = useState<GetTrendResponse | null>(null);
  const [insights, setInsights] = useState<MediaPerformanceInsight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
    }

    return { start, end };
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      // Load overview
      const overviewData = await getOverview(start, end);
      setOverview(overviewData);

      // Load sentiment trend
      const sentimentData = await getTrend(
        'sentiment_score' as MetricType,
        { startDate: start, endDate: end },
        50
      );
      setSentimentTrend(sentimentData);

      // Load velocity trend
      const velocityData = await getTrend(
        'mention_volume' as MetricType,
        { startDate: start, endDate: end },
        50
      );
      setVelocityTrend(velocityData);

      // Load insights
      const insightsData = await getInsights(
        { startDate: start, endDate: end, isDismissed: false },
        10
      );
      setInsights(insightsData.insights);
    } catch (err: any) {
      console.error('Failed to load performance data:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when date range changes
  useEffect(() => {
    loadData();
  }, [dateRange]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handle insight dismissed
  const handleInsightDismissed = (insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Data</h3>
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={handleRefresh} className="mt-3" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierDistribution: TierDistribution = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
    unknown: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Performance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Unified analytics across all PR campaigns and media coverage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceScoreCard
          title="Visibility Score"
          score={overview?.summary.avgVisibilityScore}
          trend={overview?.trends.visibilityTrend !== undefined
            ? overview.trends.visibilityTrend > 0 ? 'up' : overview.trends.visibilityTrend < 0 ? 'down' : 'stable'
            : 'stable'}
          changePct={overview?.trends.visibilityTrend}
          description="Overall media reach and exposure"
          icon={<TrendingUp className="h-4 w-4" />}
        />

        <PerformanceScoreCard
          title="EVI Score"
          score={overview?.summary.avgEviScore}
          trend={overview?.trends.eviTrend !== undefined
            ? overview.trends.eviTrend > 0 ? 'up' : overview.trends.eviTrend < 0 ? 'down' : 'stable'
            : 'stable'}
          changePct={overview?.trends.eviTrend}
          description="Earned Visibility Index composite"
          icon={<Activity className="h-4 w-4" />}
        />

        <PerformanceScoreCard
          title="Avg Sentiment"
          score={overview?.summary.avgSentiment !== undefined
            ? (overview.summary.avgSentiment + 1) * 50
            : undefined}
          trend={overview?.trends.sentimentTrend !== undefined
            ? overview.trends.sentimentTrend > 0 ? 'up' : overview.trends.sentimentTrend < 0 ? 'down' : 'stable'
            : 'stable'}
          changePct={overview?.trends.sentimentTrend}
          description="Media sentiment quality"
          icon={<BarChart3 className="h-4 w-4" />}
        />

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-600">Coverage Stats</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {overview?.summary.totalMentions || 0}
                </span>
                <span className="text-sm text-gray-500">mentions</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <div className="font-medium text-gray-900">
                    {overview?.summary.totalJournalists || 0}
                  </div>
                  <div>journalists</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {overview?.summary.totalOutlets || 0}
                  </div>
                  <div>outlets</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sentiment Trend */}
          <SentimentTrendChart
            data={sentimentTrend?.dataPoints.map(dp => ({
              timestamp: new Date(dp.timestamp),
              value: dp.value,
            })) || []}
            currentSentiment={overview?.summary.avgSentiment}
            trendDirection={overview?.trends.sentimentTrend !== undefined
              ? overview.trends.sentimentTrend > 0 ? 'up' : overview.trends.sentimentTrend < 0 ? 'down' : 'stable'
              : 'stable'}
            changePct={overview?.trends.sentimentTrend}
          />

          {/* Coverage Velocity */}
          <CoverageVelocityChart
            data={velocityTrend?.dataPoints.map(dp => ({
              timestamp: new Date(dp.timestamp),
              mentionCount: dp.value,
            })) || []}
            currentVelocity={velocityTrend?.summary.currentValue}
            momentumScore={undefined}
          />

          {/* Campaign Heatmap */}
          <CampaignHeatmap
            data={velocityTrend?.dataPoints.map(dp => ({
              date: new Date(dp.timestamp),
              value: dp.value,
            })) || []}
          />

          {/* Journalist Impact Table */}
          <JournalistImpactTable
            journalists={overview?.topPerformers.journalists.map(p => ({
              journalistId: p.id,
              journalistName: p.name,
              mentionCount: p.value,
              avgSentiment: 0.5,
              impactScore: 75,
            })) || []}
          />
        </div>

        {/* Right Column - Insights & Tier Distribution */}
        <div className="space-y-6">
          {/* Insights */}
          <InsightNarrativePanel
            insights={insights}
            onInsightDismissed={handleInsightDismissed}
          />

          {/* Tier Distribution */}
          <TierDistributionPie
            distribution={tierDistribution}
            totalMentions={overview?.summary.totalMentions}
          />
        </div>
      </div>
    </div>
  );
}
