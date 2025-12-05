'use client';

/**
 * Media Monitoring Page (Sprint S40)
 * Main workspace for media monitoring and earned coverage tracking
 */

import type {
  ArticleWithSource,
  CreateSourceInput,
  MediaMonitoringSource,
  MediaMonitoringStats,
  MentionSentiment,
  MentionWithArticle,
} from '@pravado/types';
import { useCallback, useEffect, useState } from 'react';

import {
  ArticleDrawer,
  ArticleTable,
  MentionList,
  SourceList,
} from '@/components/media-monitoring';
import {
  createSource,
  deactivateSource,
  getStats,
  ingestArticle,
  listArticles,
  listMentions,
  listSources,
} from '@/lib/mediaMonitoringApi';

type ViewMode = 'articles' | 'mentions';

export default function MediaMonitoringPage() {
  // Sources state
  const [sources, setSources] = useState<MediaMonitoringSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<MediaMonitoringSource | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Articles state
  const [articles, setArticles] = useState<ArticleWithSource[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);

  // Mentions state
  const [mentions, setMentions] = useState<MentionWithArticle[]>([]);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<MentionSentiment | null>(null);

  // Stats state
  const [stats, setStats] = useState<MediaMonitoringStats | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('articles');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Ingest form state
  const [showIngestForm, setShowIngestForm] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Load sources
  const loadSources = useCallback(async () => {
    setIsLoadingSources(true);
    try {
      const result = await listSources();
      setSources(result.sources);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  // Load articles
  const loadArticles = useCallback(async () => {
    setIsLoadingArticles(true);
    try {
      const result = await listArticles({
        sourceId: selectedSource?.id,
        limit: 50,
      });
      setArticles(result.articles);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoadingArticles(false);
    }
  }, [selectedSource?.id]);

  // Load mentions
  const loadMentions = useCallback(async () => {
    setIsLoadingMentions(true);
    try {
      const result = await listMentions({
        sentiment: sentimentFilter || undefined,
        limit: 100,
      });
      setMentions(result.mentions);
    } catch (error) {
      console.error('Failed to load mentions:', error);
    } finally {
      setIsLoadingMentions(false);
    }
  }, [sentimentFilter]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSources();
    loadStats();
  }, [loadSources, loadStats]);

  // Load data when view mode or filters change
  useEffect(() => {
    if (viewMode === 'articles') {
      loadArticles();
    } else {
      loadMentions();
    }
  }, [viewMode, loadArticles, loadMentions]);

  // Handlers
  const handleAddSource = async (input: CreateSourceInput) => {
    await createSource(input);
    await loadSources();
  };

  const handleDeactivateSource = async (id: string) => {
    await deactivateSource(id);
    if (selectedSource?.id === id) {
      setSelectedSource(null);
    }
    await loadSources();
  };

  const handleSelectArticle = (article: ArticleWithSource) => {
    setSelectedArticleId(article.id);
    setIsDrawerOpen(true);
  };

  const handleSelectMention = (mention: MentionWithArticle) => {
    setSelectedArticleId(mention.articleId);
    setIsDrawerOpen(true);
  };

  const handleIngestArticle = async () => {
    if (!ingestUrl.trim()) return;

    setIsIngesting(true);
    try {
      await ingestArticle(ingestUrl, {
        sourceId: selectedSource?.id,
      });
      setIngestUrl('');
      setShowIngestForm(false);
      await loadArticles();
      await loadStats();
    } catch (error) {
      console.error('Failed to ingest article:', error);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100">
      {/* Left Sidebar - Sources */}
      <div className="w-64 flex-shrink-0">
        <SourceList
          sources={sources}
          selectedSourceId={selectedSource?.id || null}
          onSelectSource={setSelectedSource}
          onAddSource={handleAddSource}
          onDeactivateSource={handleDeactivateSource}
          isLoading={isLoadingSources}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Media Monitoring</h1>
            <p className="text-sm text-gray-500">
              {selectedSource ? selectedSource.name : 'All Sources'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setViewMode('articles')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'articles'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Articles
              </button>
              <button
                onClick={() => setViewMode('mentions')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'mentions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mentions
              </button>
            </div>

            {/* Ingest Button */}
            <button
              onClick={() => setShowIngestForm(!showIngestForm)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Ingest Article
            </button>
          </div>
        </div>

        {/* Ingest Form */}
        {showIngestForm && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Article URL
                </label>
                <input
                  type="url"
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                  placeholder="https://techcrunch.com/2024/01/15/article-title"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleIngestArticle}
                disabled={isIngesting || !ingestUrl.trim()}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isIngesting ? 'Ingesting...' : 'Ingest'}
              </button>
              <button
                onClick={() => setShowIngestForm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Panel */}
          <div className="flex-1 overflow-auto bg-white">
            {viewMode === 'articles' ? (
              <ArticleTable
                articles={articles}
                onSelectArticle={handleSelectArticle}
                isLoading={isLoadingArticles}
              />
            ) : (
              <MentionList
                mentions={mentions}
                onSelectMention={handleSelectMention}
                sentimentFilter={sentimentFilter}
                onSentimentFilterChange={setSentimentFilter}
                isLoading={isLoadingMentions}
              />
            )}
          </div>

          {/* Right Sidebar - Stats */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-4 font-semibold text-gray-900">Statistics</h3>
            {stats ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalArticles}
                  </div>
                  <div className="text-sm text-gray-500">Total Articles</div>
                  <div className="mt-1 text-xs text-green-600">
                    +{stats.articlesThisWeek} this week
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalMentions}
                  </div>
                  <div className="text-sm text-gray-500">Total Mentions</div>
                  <div className="mt-1 text-xs text-green-600">
                    +{stats.mentionsThisWeek} this week
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Sentiment Breakdown
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">Positive</span>
                      <span className="font-medium">{stats.positiveMentions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Neutral</span>
                      <span className="font-medium">{stats.neutralMentions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Negative</span>
                      <span className="font-medium">{stats.negativeMentions}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.avgRelevance * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Avg. Relevance</div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.activeSources}
                  </div>
                  <div className="text-sm text-gray-500">Active Sources</div>
                  <div className="mt-1 text-xs text-gray-400">
                    of {stats.totalSources} total
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Drawer */}
      <ArticleDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedArticleId(null);
        }}
        articleId={selectedArticleId}
      />
    </div>
  );
}
