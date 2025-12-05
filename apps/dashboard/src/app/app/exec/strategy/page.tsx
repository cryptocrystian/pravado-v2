/**
 * Strategic Intelligence Dashboard Page (Sprint S65)
 * CEO-level Strategic Intelligence Narrative Engine
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StrategicReportStatsCard,
  StrategicReportListItem,
  CreateStrategicReportDialog,
} from '@/components/strategic-intelligence';
import {
  listReports,
  getStats,
  deleteReport,
  type StrategicReportListItem as ReportListItem,
  type StrategicReportStats,
  type StrategicReportStatus,
  type StrategicReportFormat,
} from '@/lib/strategicIntelligenceApi';
import {
  FileText,
  Target,
  TrendingUp,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function StrategicIntelligencePage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [stats, setStats] = useState<StrategicReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StrategicReportStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<StrategicReportFormat | 'all'>('all');

  const limit = 20;

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: Record<string, unknown> = {
        limit,
        offset,
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      if (search) query.search = search;
      if (statusFilter !== 'all') query.status = statusFilter;
      if (formatFilter !== 'all') query.format = formatFilter;

      const result = await listReports(query);
      setReports(result.reports);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, search, statusFilter, formatFilter]);

  const fetchStats = async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports]);

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(reportId);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchReports();
  };

  const handleRefresh = () => {
    fetchReports();
    fetchStats();
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategic Intelligence</h1>
          <p className="text-muted-foreground">
            CEO-level strategic intelligence reports synthesizing all systems
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateStrategicReportDialog onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StrategicReportStatsCard
            title="Total Reports"
            value={stats.totalReports}
            icon={FileText}
            description={`${stats.byStatus.published || 0} published`}
          />
          <StrategicReportStatsCard
            title="Avg Strategic Score"
            value={stats.avgStrategicScore !== null ? Math.round(stats.avgStrategicScore) : 'N/A'}
            icon={Target}
            description="Across all reports"
          />
          <StrategicReportStatsCard
            title="Avg Risk Score"
            value={stats.avgRiskScore !== null ? Math.round(stats.avgRiskScore) : 'N/A'}
            icon={AlertTriangle}
            description="Risk posture"
          />
          <StrategicReportStatsCard
            title="Avg Opportunity Score"
            value={stats.avgOpportunityScore !== null ? Math.round(stats.avgOpportunityScore) : 'N/A'}
            icon={TrendingUp}
            description="Growth potential"
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StrategicReportStatus | 'all');
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formatFilter}
              onValueChange={(v) => {
                setFormatFilter(v as StrategicReportFormat | 'all');
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="quarterly_strategic_review">Quarterly Review</SelectItem>
                <SelectItem value="annual_strategic_assessment">Annual Assessment</SelectItem>
                <SelectItem value="board_strategy_brief">Board Brief</SelectItem>
                <SelectItem value="ceo_intelligence_brief">CEO Brief</SelectItem>
                <SelectItem value="investor_strategy_update">Investor Update</SelectItem>
                <SelectItem value="crisis_strategic_response">Crisis Response</SelectItem>
                <SelectItem value="competitive_strategy_report">Competitive Report</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== 'all' || formatFilter !== 'all'
                    ? 'No reports match your filters. Try adjusting your search criteria.'
                    : 'Get started by creating your first strategic intelligence report.'}
                </p>
                <CreateStrategicReportDialog onSuccess={handleRefresh}>
                  <Button>Create Report</Button>
                </CreateStrategicReportDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <StrategicReportListItem
                  key={report.id}
                  report={report}
                  onDelete={handleDelete}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} reports
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + limit >= total}
                      onClick={() => setOffset(offset + limit)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          {stats?.recentReports && stats.recentReports.length > 0 ? (
            <div className="space-y-4">
              {stats.recentReports.map((report) => (
                <StrategicReportListItem
                  key={report.id}
                  report={report}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No recent reports available.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
