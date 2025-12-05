/**
 * SEO Intelligence Dashboard (S4 - Real Implementation, S5 - On-Page & Backlinks)
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import type {
  SEOKeywordWithMetrics,
  SEOOpportunityDTO,
  SEOSerpSnapshot,
} from '@pravado/types';
import { useState, useEffect } from 'react';

interface KeywordsData {
  items: SEOKeywordWithMetrics[];
  total: number;
  page: number;
  pageSize: number;
}

type TabType = 'keywords' | 'onpage' | 'backlinks';

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState<TabType>('keywords');
  const [keywords, setKeywords] = useState<KeywordsData | null>(null);
  const [opportunities, setOpportunities] = useState<SEOOpportunityDTO[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<SEOKeywordWithMetrics | null>(null);
  const [serpSnapshot, setSerpSnapshot] = useState<SEOSerpSnapshot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [serpLoading, setSerpLoading] = useState(false);

  // Fetch keywords
  const fetchKeywords = async (query?: string) => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '50',
      });
      if (query) {
        params.set('q', query);
      }

      const response = await fetch(
        `http://localhost:4000/api/v1/seo/keywords?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setKeywords(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch opportunities
  const fetchOpportunities = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/seo/opportunities?limit=10', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setOpportunities(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  // Fetch SERP snapshot for a keyword
  const fetchSerpSnapshot = async (keywordId: string) => {
    setSerpLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/seo/serp?keywordId=${keywordId}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setSerpSnapshot(data.data.snapshot);
      }
    } catch (error) {
      console.error('Failed to fetch SERP snapshot:', error);
      setSerpSnapshot(null);
    } finally {
      setSerpLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchOpportunities();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchKeywords(searchQuery);
  };

  const handleKeywordSelect = (keyword: SEOKeywordWithMetrics) => {
    setSelectedKeyword(keyword);
    fetchSerpSnapshot(keyword.keyword.id);
  };

  const getPriorityColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getIntentBadge = (intent: string | null) => {
    if (!intent) return null;
    const colors: Record<string, string> = {
      informational: 'bg-blue-100 text-blue-700',
      navigational: 'bg-purple-100 text-purple-700',
      commercial: 'bg-yellow-100 text-yellow-700',
      transactional: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[intent]}`}>
        {intent}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Intelligence</h1>
        <p className="text-gray-600">
          Keyword tracking, SERP analysis, on-page optimization, and backlink intelligence
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'keywords'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Keywords & SERP
          </button>
          <button
            onClick={() => setActiveTab('onpage')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'onpage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            On-Page Optimization
          </button>
          <button
            onClick={() => setActiveTab('backlinks')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backlinks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Backlink Intelligence
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'keywords' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Keywords & SERP */}
          <div className="lg:col-span-2 space-y-6">
          {/* Keywords Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Keywords
                  {keywords && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({keywords.total})
                    </span>
                  )}
                </h2>
                <form onSubmit={handleSearch} className="flex-1 max-w-md ml-4">
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </form>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading keywords...</div>
              ) : keywords && keywords.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Keyword
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Intent
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Volume
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Difficulty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {keywords.items.map((item) => (
                        <tr
                          key={item.keyword.id}
                          onClick={() => handleKeywordSelect(item)}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedKeyword?.keyword.id === item.keyword.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.keyword.keyword}
                          </td>
                          <td className="px-4 py-3 text-sm">{getIntentBadge(item.keyword.intent)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {item.metrics?.searchVolume?.toLocaleString() || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {item.metrics?.difficulty || '-'}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-right font-semibold ${getPriorityColor(
                              item.metrics?.priorityScore || null
                            )}`}
                          >
                            {item.metrics?.priorityScore?.toFixed(1) || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No keywords found. {searchQuery && 'Try adjusting your search.'}
                </div>
              )}
            </div>
          </div>

          {/* SERP Snapshot Section */}
          {selectedKeyword && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  SERP Snapshot: {selectedKeyword.keyword.keyword}
                </h2>

                {serpLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading SERP data...</div>
                ) : serpSnapshot && serpSnapshot.results.length > 0 ? (
                  <div>
                    <div className="mb-4 p-4 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Top Competitors:</span>
                          <div className="mt-1">
                            {serpSnapshot.topCompetitors.slice(0, 3).map((comp, idx) => (
                              <div key={idx} className="text-gray-900">
                                #{comp.rank} {comp.domain}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Our Best Rank:</span>
                          <div className="mt-1 text-2xl font-semibold text-gray-900">
                            {serpSnapshot.ourBestRank ? `#${serpSnapshot.ourBestRank}` : 'Not ranking'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {serpSnapshot.results.slice(0, 10).map((result) => (
                        <div
                          key={result.id}
                          className={`p-3 rounded-md border ${
                            result.isCompetitor ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 text-sm font-semibold text-gray-600">
                              #{result.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-600 truncate">
                                {result.title || result.url}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{result.url}</div>
                              {result.snippet && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No SERP data available for this keyword yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Opportunities */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow sticky top-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Opportunities
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({opportunities.length})
                </span>
              </h2>

              {opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            {opp.keyword.keyword}
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded font-medium ${
                                opp.opportunityType === 'keyword_gap'
                                  ? 'bg-purple-100 text-purple-700'
                                  : opp.opportunityType === 'content_refresh'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {opp.opportunityType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold ${getPriorityColor(opp.priorityScore)}`}
                        >
                          {opp.priorityScore.toFixed(0)}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-2">{opp.gapSummary}</p>

                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-900">
                        <strong>Action:</strong> {opp.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No opportunities detected yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* On-Page Optimization Tab */}
      {activeTab === 'onpage' && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              On-Page Optimization Engine
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Analyze page quality, identify technical issues, and get actionable recommendations to
              improve rankings. Coming soon in Sprint S5!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Page Audits</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive on-page scoring with 0-100 quality scores
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Issue Detection</h3>
                <p className="text-sm text-gray-600">
                  Identify missing tags, thin content, slow performance
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Actionable hints to fix high-priority issues quickly
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backlink Intelligence Tab */}
      {activeTab === 'backlinks' && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Backlink Intelligence System
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Track backlinks, analyze referring domains, and monitor link profiles. Build authority
              with data-driven link building strategies. Coming soon in Sprint S5!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Backlink Tracking</h3>
                <p className="text-sm text-gray-600">
                  Monitor active and lost backlinks with dofollow/nofollow classification
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Domain Authority</h3>
                <p className="text-sm text-gray-600">
                  Analyze referring domains by authority and spam scores
                </p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Anchor Analysis</h3>
                <p className="text-sm text-gray-600">
                  Track top anchor texts and optimize link diversity
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
