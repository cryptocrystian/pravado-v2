/**
 * PR Media Monitoring Page (Sprint S97)
 * Live feed of media coverage with filtering and drilldown to coverage detail
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as mediaMonitoringApi from '@/lib/mediaMonitoringApi';

interface Article {
  id: string;
  url: string;
  title: string;
  author: string | null;
  publishedAt: Date | string | null;
  summary: string | null;
  relevanceScore: number;
  keywords: string[];
  domainAuthority: number;
  metadata: Record<string, unknown>;
}

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';

export default function PRMediaMonitoringPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mediaMonitoringApi.listArticles({
        limit: 50,
      });
      setArticles(result.articles || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load coverage';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const getSentimentFromMetadata = (metadata: Record<string, unknown>): string => {
    return (metadata?.sentiment as string) || 'neutral';
  };

  const filteredArticles = articles.filter((article) => {
    // Sentiment filter
    if (sentimentFilter !== 'all') {
      const sentiment = getSentimentFromMetadata(article.metadata);
      if (sentiment !== sentimentFilter) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = article.title.toLowerCase().includes(query);
      const matchesAuthor = article.author?.toLowerCase().includes(query);
      const matchesKeywords = article.keywords.some(k => k.toLowerCase().includes(query));
      if (!matchesTitle && !matchesAuthor && !matchesKeywords) return false;
    }

    return true;
  });

  const getSentimentBadgeClass = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'negative':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateInput: Date | string | null): string => {
    if (!dateInput) return 'Unknown';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  };

  // Count articles by sentiment
  const sentimentCounts = articles.reduce(
    (acc, article) => {
      const sentiment = getSentimentFromMetadata(article.metadata);
      acc[sentiment as keyof typeof acc] = (acc[sentiment as keyof typeof acc] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-3 rounded" />
          <div className="h-4 w-48 bg-slate-3 rounded" />
          <div className="h-64 bg-slate-3 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-1 p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-400">Error</h2>
          <p className="text-red-300 mt-2">{error}</p>
          <button
            onClick={loadArticles}
            className="mt-4 px-4 py-2 bg-slate-3 text-white rounded-lg hover:bg-slate-4 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-cyan/20 to-brand-iris/10 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href="/app/pr"
            className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to PR Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-white mt-4">Media Monitoring</h1>
          <p className="text-slate-300 mt-2">
            Track and analyze media coverage in real-time
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters & Stats */}
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coverage..."
                className="w-full px-3 py-2 bg-slate-3 border border-border-subtle rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-iris"
              />
            </div>

            {/* Sentiment Filter */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Filter by Sentiment</h3>
              <div className="space-y-2">
                {(['all', 'positive', 'neutral', 'negative'] as const).map((sentiment) => (
                  <button
                    key={sentiment}
                    onClick={() => setSentimentFilter(sentiment)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      sentimentFilter === sentiment
                        ? 'bg-brand-iris/20 text-white border border-brand-iris/30'
                        : 'bg-slate-3 text-slate-300 border border-transparent hover:bg-slate-4'
                    }`}
                  >
                    <span className="capitalize">{sentiment}</span>
                    <span className="text-sm">
                      {sentiment === 'all'
                        ? articles.length
                        : sentimentCounts[sentiment as keyof typeof sentimentCounts]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-2 rounded-xl border border-border-subtle p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Coverage Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Articles</span>
                  <span className="text-white font-medium">{articles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Positive</span>
                  <span className="text-white font-medium">{sentimentCounts.positive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Neutral</span>
                  <span className="text-white font-medium">{sentimentCounts.neutral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Negative</span>
                  <span className="text-white font-medium">{sentimentCounts.negative}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Article Feed */}
          <div className="lg:col-span-3">
            <div className="bg-slate-2 rounded-xl border border-border-subtle">
              <div className="px-6 py-4 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Coverage Feed</h2>
                  <span className="text-sm text-slate-400">
                    {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="p-12 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-slate-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">No coverage found</h3>
                  <p className="text-slate-400">
                    {searchQuery || sentimentFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Coverage will appear here as it is tracked'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {filteredArticles.map((article) => {
                    const sentiment = getSentimentFromMetadata(article.metadata);
                    const reachEstimate = (article.metadata?.reach_estimate as number) || 0;

                    return (
                      <Link
                        key={article.id}
                        href={`/app/pr/coverage/${article.id}`}
                        className="block px-6 py-4 hover:bg-slate-3/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-brand-cyan">
                                {getDomainFromUrl(article.url)}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded border ${getSentimentBadgeClass(sentiment)}`}
                              >
                                {sentiment}
                              </span>
                              {article.domainAuthority > 0 && (
                                <span className="px-2 py-0.5 text-xs rounded bg-slate-4 text-slate-300">
                                  DA: {article.domainAuthority}
                                </span>
                              )}
                            </div>
                            <h3 className="text-white font-medium group-hover:text-brand-iris transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            {article.summary && (
                              <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                                {article.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              {article.author && <span>By {article.author}</span>}
                              <span>{formatDate(article.publishedAt)}</span>
                              {reachEstimate > 0 && (
                                <span>Reach: {reachEstimate.toLocaleString()}</span>
                              )}
                            </div>
                            {article.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {article.keywords.slice(0, 4).map((keyword) => (
                                  <span
                                    key={keyword}
                                    className="px-2 py-0.5 text-xs bg-slate-4 text-slate-300 rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                                {article.keywords.length > 4 && (
                                  <span className="text-xs text-slate-500">
                                    +{article.keywords.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                  {Math.round(article.relevanceScore * 100)}%
                                </div>
                                <div className="text-xs text-slate-400">relevance</div>
                              </div>
                              <svg
                                className="w-5 h-5 text-slate-500 group-hover:text-brand-iris transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
