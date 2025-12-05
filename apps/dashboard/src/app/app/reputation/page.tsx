/**
 * Brand Reputation Dashboard Page (Sprint S56)
 * Executive radar dashboard for real-time brand reputation intelligence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ReputationScoreCard,
  ComponentScorePanel,
  ReputationDriverList,
  CompetitorComparisonTable,
  ReputationAlertsList,
  ExecutiveSummaryPanel,
  ReputationTrendChart,
  ReputationEventsList,
} from '@/components/brand-reputation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getDashboard,
  getTrend,
  getAlerts,
  getEvents,
  recalculateReputation,
  getTimeWindowLabel,
} from '@/lib/brandReputationApi';
import type {
  GetReputationDashboardResponse,
  GetReputationTrendResponse,
  GetReputationAlertsResponse,
  GetReputationEventsResponse,
  ReputationTimeWindow,
} from '@pravado/types';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Loader2,
  LayoutDashboard,
  Activity,
  Bell,
  Zap,
  Calculator,
} from 'lucide-react';

export default function ReputationDashboardPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<ReputationTimeWindow>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [dashboard, setDashboard] = useState<GetReputationDashboardResponse | null>(null);
  const [trend, setTrend] = useState<GetReputationTrendResponse | null>(null);
  const [alerts, setAlerts] = useState<GetReputationAlertsResponse | null>(null);
  const [events, setEvents] = useState<GetReputationEventsResponse | null>(null);

  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      const dashboardData = await getDashboard({
        window: timeWindow,
        includeCompetitors: true,
        includeTrend: true,
        includeEvents: true,
        maxDrivers: 5,
      });
      setDashboard(dashboardData);

      // Load trend data
      const trendData = await getTrend({
        window: timeWindow,
        granularity: timeWindow === '24h' ? 'hourly' : 'daily',
        includeComponents: true,
      });
      setTrend(trendData);

      // Load alerts
      const alertsData = await getAlerts({
        isResolved: false,
        limit: 10,
      });
      setAlerts(alertsData);

      // Load events
      const eventsData = await getEvents({
        window: timeWindow,
        limit: 20,
      });
      setEvents(eventsData);
    } catch (err: any) {
      console.error('Failed to load reputation data:', err);
      setError(err.message || 'Failed to load reputation data');
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  // Load data on mount and when time window changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Recalculate reputation
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateReputation({
        window: timeWindow,
        forceRefresh: true,
      });
      await loadData();
    } catch (err: any) {
      console.error('Failed to recalculate reputation:', err);
    } finally {
      setRecalculating(false);
    }
  };

  // Handle alert action
  const handleAlertAction = () => {
    // Reload alerts
    getAlerts({ isResolved: false, limit: 10 }).then(setAlerts).catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading reputation data...</p>
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

  const summary = dashboard?.executiveSummary;
  const config = dashboard?.config;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Brand Reputation</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Real-time reputation intelligence and executive radar dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Window Selector */}
          <Select
            value={timeWindow}
            onValueChange={(v) => setTimeWindow(v as ReputationTimeWindow)}
          >
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          {/* Recalculate Button */}
          <Button
            onClick={handleRecalculate}
            variant="outline"
            size="sm"
            disabled={recalculating}
          >
            {recalculating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Recalculate
          </Button>

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

      {/* Quick Stats Bar */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-3xl font-bold text-blue-700">
              {summary.currentScore.toFixed(0)}
            </div>
            <div className="text-sm text-blue-600">Current Score</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-3xl font-bold text-purple-700">
              #{summary.competitiveRank}
            </div>
            <div className="text-sm text-purple-600">
              of {summary.competitorCount + 1} Competitors
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-3xl font-bold text-orange-700">
              {summary.activeCrises}
            </div>
            <div className="text-sm text-orange-600">Active Crises</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="text-3xl font-bold text-red-700">
              {summary.alertCount}
            </div>
            <div className="text-sm text-red-600">Active Alerts</div>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <Activity className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {alerts && alerts.unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {alerts.unacknowledgedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Zap className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {summary && (
            <>
              {/* Top Row - Score and Components */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ReputationScoreCard
                  score={summary.currentScore}
                  previousScore={summary.previousScore}
                  trendDirection={summary.trendDirection}
                  scoreDelta={summary.scoreDelta}
                  description="Composite brand reputation score based on media sentiment, coverage, crisis impact, competitive position, and engagement."
                />
                <div className="lg:col-span-2">
                  <ComponentScorePanel
                    componentScores={summary.componentScores}
                    strongestComponent={summary.strongestComponent}
                    weakestComponent={summary.weakestComponent}
                  />
                </div>
              </div>

              {/* Drivers */}
              <ReputationDriverList
                positiveDrivers={summary.topPositiveDrivers}
                negativeDrivers={summary.topNegativeDrivers}
                maxItems={5}
              />

              {/* Bottom Row - Executive Summary and Competitors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExecutiveSummaryPanel
                  summary={summary}
                  timeWindow={timeWindow}
                />
                <CompetitorComparisonTable
                  brandScore={summary.currentScore}
                  competitors={summary.competitorComparison}
                  brandRank={summary.competitiveRank}
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          {trend && (
            <ReputationTrendChart
              trendPoints={trend.trendPoints}
              overallTrend={trend.overallTrend}
              startScore={trend.startScore}
              endScore={trend.endScore}
              highScore={trend.highScore}
              lowScore={trend.lowScore}
              averageScore={trend.averageScore}
              volatility={trend.volatility}
              timeWindow={timeWindow}
              showComponents
            />
          )}

          {/* Component Score Details */}
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ComponentScorePanel
                componentScores={summary.componentScores}
                strongestComponent={summary.strongestComponent}
                weakestComponent={summary.weakestComponent}
              />
              <ReputationDriverList
                positiveDrivers={summary.topPositiveDrivers}
                negativeDrivers={summary.topNegativeDrivers}
                maxItems={3}
              />
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          {alerts && (
            <ReputationAlertsList
              alerts={alerts.alerts}
              totalCount={alerts.total}
              unacknowledgedCount={alerts.unacknowledgedCount}
              criticalCount={alerts.criticalCount}
              onAlertAction={handleAlertAction}
            />
          )}

          {/* Alert Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Alert Configuration</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Score Drop Threshold</div>
                  <div className="font-medium text-gray-800">
                    {config?.thresholdAlertScoreDrop ?? 10} pts
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Critical Score Threshold</div>
                  <div className="font-medium text-gray-800">
                    Below {config?.thresholdCriticalScore ?? 30}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Warning Score Threshold</div>
                  <div className="font-medium text-gray-800">
                    Below {config?.thresholdWarningScore ?? 50}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-6">
          {events && (
            <ReputationEventsList
              events={events.events}
              totalCount={events.total}
              maxItems={20}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Last Calculated Footer */}
      {dashboard?.lastCalculatedAt && (
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          Last calculated: {new Date(dashboard.lastCalculatedAt).toLocaleString()}
          {' | '}
          Data window: {getTimeWindowLabel(timeWindow)}
        </div>
      )}
    </div>
  );
}
