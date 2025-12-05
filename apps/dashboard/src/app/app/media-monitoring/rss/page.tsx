'use client';

/**
 * RSS & Media Crawling Page (Sprint S41)
 * Manage RSS feeds and view crawl jobs
 */

import type {
  CrawlJobWithFeed,
  RSSFeedStats,
  RSSFeedWithSource,
} from '@pravado/types';
import { useCallback, useEffect, useState } from 'react';

import { CrawlStatusBadge } from '@/components/media-crawler';
import {
  createRSSFeed,
  deactivateRSSFeed,
  getRSSStats,
  listCrawlJobs,
  listRSSFeeds,
  runCrawlJobs,
  triggerRSSFetch,
} from '@/lib/mediaCrawlerApi';

export default function RSSCrawlerPage() {
  const [feeds, setFeeds] = useState<RSSFeedWithSource[]>([]);
  const [jobs, setJobs] = useState<CrawlJobWithFeed[]>([]);
  const [stats, setStats] = useState<RSSFeedStats | null>(null);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showAddFeedForm, setShowAddFeedForm] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const loadFeeds = useCallback(async () => {
    setIsLoadingFeeds(true);
    try {
      const result = await listRSSFeeds();
      setFeeds(result.feeds);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setIsLoadingFeeds(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const result = await listCrawlJobs({ limit: 100 });
      setJobs(result.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getRSSStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadFeeds();
    loadJobs();
    loadStats();
  }, [loadFeeds, loadJobs, loadStats]);

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) return;

    setIsAdding(true);
    try {
      await createRSSFeed({ url: newFeedUrl.trim(), title: newFeedTitle.trim() || undefined });
      setNewFeedUrl('');
      setNewFeedTitle('');
      setShowAddFeedForm(false);
      await loadFeeds();
      await loadStats();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this RSS feed?')) return;
    await deactivateRSSFeed(id);
    await loadFeeds();
    await loadStats();
  };

  const handleFetchFeeds = async () => {
    setIsFetching(true);
    try {
      await triggerRSSFetch();
      await loadJobs();
      await loadStats();
    } finally {
      setIsFetching(false);
    }
  };

  const handleRunJobs = async () => {
    setIsRunning(true);
    try {
      await runCrawlJobs();
      await loadJobs();
      await loadStats();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">RSS & Media Crawling</h1>
              <p className="text-sm text-gray-500">Automated article ingestion</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFetchFeeds}
                disabled={isFetching}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isFetching ? 'Fetching...' : 'Fetch All Feeds'}
              </button>
              <button
                onClick={handleRunJobs}
                disabled={isRunning}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {isRunning ? 'Running...' : 'Run Jobs'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto bg-white p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">RSS Feeds</h2>
                <button
                  onClick={() => setShowAddFeedForm(!showAddFeedForm)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  + Add Feed
                </button>
              </div>

              {showAddFeedForm && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Feed URL</label>
                      <input
                        type="url"
                        value={newFeedUrl}
                        onChange={(e) => setNewFeedUrl(e.target.value)}
                        placeholder="https://example.com/feed.xml"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title (Optional)</label>
                      <input
                        type="text"
                        value={newFeedTitle}
                        onChange={(e) => setNewFeedTitle(e.target.value)}
                        placeholder="My Feed"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddFeed}
                        disabled={isAdding || !newFeedUrl.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isAdding ? 'Adding...' : 'Add Feed'}
                      </button>
                      <button
                        onClick={() => setShowAddFeedForm(false)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {feeds.map((feed) => (
                  <div key={feed.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{feed.title || feed.url}</div>
                      <div className="text-sm text-gray-500">{feed.url}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {feed.articlesFound} articles • Last fetched:{' '}
                        {feed.lastFetchedAt ? new Date(feed.lastFetchedAt).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivate(feed.id)}
                      className="ml-4 text-sm text-red-600 hover:text-red-800"
                    >
                      Deactivate
                    </button>
                  </div>
                ))}
                {feeds.length === 0 && !isLoadingFeeds && (
                  <p className="py-8 text-center text-sm text-gray-500">No RSS feeds yet. Add one to get started.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Crawl Jobs</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">URL</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Attempts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{job.title || new URL(job.url).hostname}</td>
                        <td className="px-4 py-3 text-sm">
                          <CrawlStatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{job.runCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {jobs.length === 0 && !isLoadingJobs && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                          No crawl jobs yet. Fetch RSS feeds to create jobs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-4 font-semibold text-gray-900">Statistics</h3>
            {stats && (
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalFeeds}</div>
                  <div className="text-sm text-gray-500">Total Feeds</div>
                  <div className="mt-1 text-xs text-green-600">{stats.activeFeeds} active</div>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
                  <div className="text-sm text-gray-500">Total Jobs</div>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queued:</span>
                      <span className="font-medium">{stats.queuedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Running:</span>
                      <span className="font-medium">{stats.runningJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Success:</span>
                      <span className="font-medium">{stats.successJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Failed:</span>
                      <span className="font-medium">{stats.failedJobs}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{stats.articlesDiscovered}</div>
                  <div className="text-sm text-gray-500">Articles Discovered</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
