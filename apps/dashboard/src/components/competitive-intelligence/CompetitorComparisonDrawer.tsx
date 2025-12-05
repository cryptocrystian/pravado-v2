'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  Competitor,
  ComparativeAnalyticsResponse,
  OverlapAnalysisResponse,
  OverlapType,
} from '@pravado/types';
import {
  getComparativeAnalytics,
  analyzeOverlap,
  formatAdvantageScore,
  getAdvantageScoreColor,
  formatOverlapPercentage,
  getOverlapScoreColor,
  formatNumber,
} from '@/lib/competitorIntelligenceApi';
import { CompetitorScoreBadge } from './CompetitorScoreBadge';
import { Loader2, TrendingUp, TrendingDown, Users, Building, AlertTriangle, Trophy } from 'lucide-react';

interface CompetitorComparisonDrawerProps {
  competitor: Competitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompetitorComparisonDrawer({
  competitor,
  open,
  onOpenChange,
}: CompetitorComparisonDrawerProps) {
  const [analytics, setAnalytics] = useState<ComparativeAnalyticsResponse | null>(null);
  const [overlap, setOverlap] = useState<OverlapAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && competitor) {
      loadComparisonData();
    }
  }, [open, competitor]);

  const loadComparisonData = async () => {
    if (!competitor) return;

    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [analyticsData, overlapData] = await Promise.all([
        getComparativeAnalytics(competitor.id, startDate, endDate),
        analyzeOverlap(competitor.id, 'journalist_overlap' as OverlapType, 30),
      ]);

      setAnalytics(analyticsData);
      setOverlap(overlapData);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!competitor) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {competitor.name}
            <CompetitorScoreBadge tier={competitor.tier} size="sm" />
          </SheetTitle>
          <SheetDescription>
            Comparative analysis vs your brand over the last 30 days
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="overlap">Overlap</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {analytics && (
                <>
                  {/* Advantage Score */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Overall Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Advantage Score</p>
                          <p
                            className={cn(
                              'text-3xl font-bold',
                              getAdvantageScoreColor(analytics.advantageScore)
                            )}
                          >
                            {formatAdvantageScore(analytics.advantageScore)}
                          </p>
                        </div>
                        <div className="text-right">
                          {analytics.advantageScore > 0 ? (
                            <Trophy className="h-8 w-8 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          Your Advantages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analytics.advantageAreas.length > 0 ? (
                          <ul className="space-y-1">
                            {analytics.advantageAreas.map((area, i) => (
                              <li key={i} className="text-sm">
                                {area}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No clear advantages</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          Threat Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analytics.threatAreas.length > 0 ? (
                          <ul className="space-y-1">
                            {analytics.threatAreas.map((area, i) => (
                              <li key={i} className="text-sm">
                                {area}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No significant threats</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              {analytics && (
                <>
                  <div className="grid gap-2">
                    <MetricComparisonRow
                      label="Mention Volume"
                      brandValue={analytics.brandMetrics.mentionVolume}
                      competitorValue={analytics.competitorMetrics.mentionVolume}
                      differential={analytics.differentials.mentionVolume}
                      format={formatNumber}
                    />
                    <MetricComparisonRow
                      label="Avg Sentiment"
                      brandValue={analytics.brandMetrics.avgSentiment}
                      competitorValue={analytics.competitorMetrics.avgSentiment}
                      differential={analytics.differentials.sentiment}
                      format={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <MetricComparisonRow
                      label="EVI Score"
                      brandValue={analytics.brandMetrics.eviScore}
                      competitorValue={analytics.competitorMetrics.eviScore}
                      differential={analytics.differentials.evi}
                      format={(v) => v.toFixed(0)}
                    />
                    <MetricComparisonRow
                      label="Visibility"
                      brandValue={analytics.brandMetrics.visibilityScore}
                      competitorValue={analytics.competitorMetrics.visibilityScore}
                      differential={analytics.differentials.visibility}
                      format={(v) => v.toFixed(0)}
                    />
                    <MetricComparisonRow
                      label="Journalists"
                      brandValue={analytics.brandMetrics.journalistCount}
                      competitorValue={analytics.competitorMetrics.journalistCount}
                      differential={analytics.differentials.journalists}
                      format={formatNumber}
                      icon={<Users className="h-4 w-4" />}
                    />
                    <MetricComparisonRow
                      label="Outlets"
                      brandValue={analytics.brandMetrics.outletCount}
                      competitorValue={analytics.competitorMetrics.outletCount}
                      differential={analytics.differentials.outlets}
                      format={formatNumber}
                      icon={<Building className="h-4 w-4" />}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="overlap" className="space-y-4">
              {overlap && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Journalist Overlap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Overlap Score</p>
                          <p
                            className={cn(
                              'text-2xl font-bold',
                              getOverlapScoreColor(overlap.overlapScore)
                            )}
                          >
                            {formatOverlapPercentage(overlap.overlapScore)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Exclusivity</p>
                          <p className="text-2xl font-bold">
                            {formatOverlapPercentage(overlap.exclusivityScore)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{overlap.brandExclusiveCount}</p>
                        <p className="text-xs text-muted-foreground">Your Exclusive</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{overlap.sharedCount}</p>
                        <p className="text-xs text-muted-foreground">Shared</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{overlap.competitorExclusiveCount}</p>
                        <p className="text-xs text-muted-foreground">Competitor Only</p>
                      </CardContent>
                    </Card>
                  </div>

                  {overlap.recommendation && (
                    <Card className="bg-muted">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">Recommendation</p>
                        <p className="mt-1 text-sm text-muted-foreground">{overlap.recommendation}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface MetricComparisonRowProps {
  label: string;
  brandValue: number;
  competitorValue: number;
  differential: number;
  format: (value: number) => string;
  icon?: React.ReactNode;
}

function MetricComparisonRow({
  label,
  brandValue,
  competitorValue,
  differential,
  format,
  icon,
}: MetricComparisonRowProps) {
  const isPositive = differential > 0;

  return (
    <div className="grid grid-cols-4 items-center gap-2 rounded bg-muted p-2">
      <div className="flex items-center gap-1 text-sm">
        {icon}
        {label}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{format(brandValue)}</p>
        <p className="text-xs text-muted-foreground">You</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{format(competitorValue)}</p>
        <p className="text-xs text-muted-foreground">Them</p>
      </div>
      <div className="text-right">
        <Badge variant={isPositive ? 'success' : 'destructive'} className="text-xs">
          {isPositive ? '+' : ''}
          {format(differential)}
        </Badge>
      </div>
    </div>
  );
}
