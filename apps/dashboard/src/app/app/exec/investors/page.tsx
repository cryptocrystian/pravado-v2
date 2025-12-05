/**
 * Investor Relations Dashboard Page (Sprint S64)
 * Main page for managing investor packs and earnings narratives
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InvestorPackStatsCard,
  InvestorPackListItem,
  CreateInvestorPackDialog,
} from '@/components/investor-relations';
import {
  type InvestorPack,
  type InvestorPackStats,
  listPacks,
  getStats,
  getFormatLabel,
} from '@/lib/investorRelationsApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  TrendingUp,
  Calendar,
  Users,
  AlertCircle,
  BarChart3,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import type { InvestorPackFormat, InvestorPackStatus } from '@pravado/types';

type FilterStatus = InvestorPackStatus | 'all';
type FilterFormat = InvestorPackFormat | 'all';

export default function InvestorRelationsPage() {
  const [packs, setPacks] = useState<InvestorPack[]>([]);
  const [stats, setStats] = useState<InvestorPackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState<FilterStatus>('all');
  const [formatFilter, setFormatFilter] = useState<FilterFormat>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [packsResult, statsResult] = await Promise.all([
        listPacks({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          format: formatFilter !== 'all' ? formatFilter : undefined,
          includeArchived: false,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        getStats(),
      ]);

      setPacks(packsResult.packs);
      setHasMore(packsResult.packs.length === pageSize);
      setStats(statsResult);
    } catch (err) {
      console.error('Failed to fetch investor relations data:', err);
      setError('Failed to load investor packs. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, formatFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleCreateSuccess = () => {
    fetchData(true);
  };

  // Filter packs by search query
  const filteredPacks = packs.filter((pack) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pack.title.toLowerCase().includes(query) ||
      pack.description?.toLowerCase().includes(query) ||
      pack.fiscalQuarter?.toLowerCase().includes(query)
    );
  });

  // Group packs by tab
  const getPacksByTab = () => {
    switch (activeTab) {
      case 'draft':
        return filteredPacks.filter((p) => p.status === 'draft' || p.status === 'generating');
      case 'review':
        return filteredPacks.filter((p) => p.status === 'review' || p.status === 'approved');
      case 'published':
        return filteredPacks.filter((p) => p.status === 'published');
      case 'archived':
        return filteredPacks.filter((p) => p.status === 'archived');
      default:
        return filteredPacks;
    }
  };

  const displayPacks = getPacksByTab();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading investor relations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-indigo-600" />
            Investor Relations
          </h1>
          <p className="text-gray-500 mt-1">
            Create and manage investor packs, quarterly earnings narratives, and board communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <CreateInvestorPackDialog onSuccess={handleCreateSuccess} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData()}
              className="ml-auto"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InvestorPackStatsCard
            title="Total Packs"
            value={stats.totalPacks}
            icon={FileText}
            trend={stats.packsByFormat.quarterly_earnings > 0 ? '+' : undefined}
            trendValue={
              stats.packsByFormat.quarterly_earnings > 0
                ? `${stats.packsByFormat.quarterly_earnings} quarterly`
                : undefined
            }
          />
          <InvestorPackStatsCard
            title="Published"
            value={stats.byStatus.published || 0}
            icon={BarChart3}
            iconColor="text-green-600"
            bgColor="bg-green-50"
          />
          <InvestorPackStatsCard
            title="In Review"
            value={(stats.byStatus.review || 0) + (stats.byStatus.approved || 0)}
            icon={Users}
            iconColor="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <InvestorPackStatsCard
            title="Q&A Generated"
            value={stats.totalQnAs}
            icon={Sparkles}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
            subtitle={stats.approvedQnAs > 0 ? `${stats.approvedQnAs} approved` : undefined}
          />
        </div>
      )}

      {/* Filters and Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Investor Packs</CardTitle>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search packs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              {/* Format Filter */}
              <Select
                value={formatFilter}
                onValueChange={(value) => setFormatFilter(value as FilterFormat)}
              >
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="quarterly_earnings">Quarterly Earnings</SelectItem>
                  <SelectItem value="annual_review">Annual Review</SelectItem>
                  <SelectItem value="investor_day">Investor Day</SelectItem>
                  <SelectItem value="board_update">Board Update</SelectItem>
                  <SelectItem value="fundraising_round">Fundraising Round</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                All
                <Badge variant="secondary" className="ml-1">
                  {filteredPacks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="draft" className="flex items-center gap-2">
                Draft
                <Badge variant="secondary" className="ml-1">
                  {filteredPacks.filter((p) => p.status === 'draft' || p.status === 'generating').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                Review
                <Badge variant="secondary" className="ml-1">
                  {filteredPacks.filter((p) => p.status === 'review' || p.status === 'approved').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="published" className="flex items-center gap-2">
                Published
                <Badge variant="secondary" className="ml-1">
                  {filteredPacks.filter((p) => p.status === 'published').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                Archived
                <Badge variant="secondary" className="ml-1">
                  {filteredPacks.filter((p) => p.status === 'archived').length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {displayPacks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No packs found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Create your first investor pack to get started'}
                  </p>
                  {!searchQuery && (
                    <CreateInvestorPackDialog onSuccess={handleCreateSuccess}>
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Create Investor Pack
                      </Button>
                    </CreateInvestorPackDialog>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayPacks.map((pack) => (
                    <InvestorPackListItem key={pack.id} pack={pack} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats by Format */}
      {stats && stats.totalPacks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Packs by Format
            </CardTitle>
            <CardDescription>
              Distribution of investor packs across different formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.packsByFormat).map(([format, count]) => (
                <div
                  key={format}
                  className={cn(
                    'p-4 rounded-lg text-center',
                    count > 0 ? 'bg-indigo-50' : 'bg-gray-50'
                  )}
                >
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      count > 0 ? 'text-indigo-600' : 'text-gray-400'
                    )}
                  >
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getFormatLabel(format as InvestorPackFormat)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Teaser */}
      {stats && stats.recentPacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Recently created or updated investor packs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentPacks.slice(0, 5).map((pack) => (
                <InvestorPackListItem key={pack.id} pack={pack} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
