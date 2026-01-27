/**
 * SEO Intelligence Dashboard (S90 AI Presence Enhancement)
 * Styled according to Pravado Design System v2
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

// AI Dot component for presence indication
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}

// AI Insight Banner component
function AIInsightBanner({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'success' | 'warning';
}) {
  const borderColor = type === 'success' ? 'border-l-semantic-success' :
                      type === 'warning' ? 'border-l-semantic-warning' : 'border-l-brand-cyan';
  const bgColor = type === 'success' ? 'bg-semantic-success/5' :
                  type === 'warning' ? 'bg-semantic-warning/5' : 'bg-brand-cyan/5';

  return (
    <div className={`panel-card p-4 border-l-4 ${borderColor} ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AIDot status="idle" />
          <span className="text-xs font-medium text-brand-cyan">Pravado Insight</span>
        </div>
        <p className="text-sm text-white flex-1">{message}</p>
      </div>
    </div>
  );
}

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

      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch(`/api/seo/keywords?${params.toString()}`, {
        credentials: 'include',
      });
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
      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch('/api/seo/opportunities?limit=10', {
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
      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch(`/api/seo/serp?keywordId=${keywordId}`, {
        credentials: 'include',
      });
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
    if (!score) return 'text-slate-6';
    if (score >= 75) return 'text-semantic-success';
    if (score >= 50) return 'text-semantic-warning';
    return 'text-brand-amber';
  };

  const getIntentBadge = (intent: string | null) => {
    if (!intent) return null;
    const colors: Record<string, string> = {
      informational: 'bg-brand-cyan/10 text-brand-cyan',
      navigational: 'bg-brand-magenta/10 text-brand-magenta',
      commercial: 'bg-brand-amber/10 text-brand-amber',
      transactional: 'bg-semantic-success/10 text-semantic-success',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[intent]}`}>
        {intent}
      </span>
    );
  };

  // Derive AI status
  const aiStatus = loading ? 'analyzing' : serpLoading ? 'analyzing' : 'idle';

  // Count high-priority opportunities
  const highPriorityOpportunities = opportunities.filter(o => o.priorityScore >= 70).length;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-page min-h-screen">
      {/* Page Header with AI Status */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-2">
            <AIDot status={aiStatus} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white-0 mb-2">SEO Intelligence</h1>
            <p className="text-muted">
              Keyword tracking, SERP analysis, on-page optimization, and backlink intelligence
            </p>
          </div>
          {/* AI Status Pill when active */}
          {aiStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              <AIDot status={aiStatus} />
              <span className="text-xs font-medium text-brand-cyan">
                Analyzing data...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight Banner for Opportunities */}
      {!loading && opportunities.length > 0 && (
        <div className="mb-6">
          <AIInsightBanner
            message={`${opportunities.length} SEO opportunit${opportunities.length !== 1 ? 'ies' : 'y'} detected. ${
              highPriorityOpportunities > 0
                ? `${highPriorityOpportunities} high-priority action${highPriorityOpportunities !== 1 ? 's' : ''} recommended.`
                : 'Review opportunities to improve rankings.'
            }`}
            type={highPriorityOpportunities > 0 ? 'success' : 'info'}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-border-subtle">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-sm ${
              activeTab === 'keywords'
                ? 'border-brand-cyan text-brand-cyan'
                : 'border-transparent text-slate-6 hover:text-white-0 hover:border-slate-5'
            }`}
          >
            Keywords & SERP
          </button>
          <button
            onClick={() => setActiveTab('onpage')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-sm ${
              activeTab === 'onpage'
                ? 'border-brand-cyan text-brand-cyan'
                : 'border-transparent text-slate-6 hover:text-white-0 hover:border-slate-5'
            }`}
          >
            On-Page Optimization
          </button>
          <button
            onClick={() => setActiveTab('backlinks')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-sm ${
              activeTab === 'backlinks'
                ? 'border-brand-cyan text-brand-cyan'
                : 'border-transparent text-slate-6 hover:text-white-0 hover:border-slate-5'
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
            <div className="panel-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white-0">
                    Keywords
                    {keywords && (
                      <span className="ml-2 text-sm font-normal text-slate-6">
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
                      className="input-field"
                    />
                  </form>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-slate-6">Loading keywords...</div>
                ) : keywords && keywords.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-subtle">
                      <thead className="bg-slate-3/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-6 uppercase">
                            Keyword
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-6 uppercase">
                            Intent
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-6 uppercase">
                            Volume
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-6 uppercase">
                            Difficulty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-6 uppercase">
                            Priority
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {keywords.items.map((item) => (
                          <tr
                            key={item.keyword.id}
                            onClick={() => handleKeywordSelect(item)}
                            className={`cursor-pointer transition-colors duration-sm hover:bg-slate-4/50 ${
                              selectedKeyword?.keyword.id === item.keyword.id ? 'bg-brand-iris/10' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-white-0">
                              {item.keyword.keyword}
                            </td>
                            <td className="px-4 py-3 text-sm">{getIntentBadge(item.keyword.intent)}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-6">
                              {item.metrics?.searchVolume?.toLocaleString() || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-6">
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
                  <div className="text-center py-8 text-slate-6">
                    No keywords found. {searchQuery && 'Try adjusting your search.'}
                  </div>
                )}
              </div>
            </div>

            {/* SERP Snapshot Section */}
            {selectedKeyword && (
              <div className="panel-card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white-0 mb-4">
                    SERP Snapshot: {selectedKeyword.keyword.keyword}
                  </h2>

                  {serpLoading ? (
                    <div className="text-center py-8 text-slate-6">Loading SERP data...</div>
                  ) : serpSnapshot && serpSnapshot.results.length > 0 ? (
                    <div>
                      <div className="mb-4 p-4 bg-slate-3/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-6">Top Competitors:</span>
                            <div className="mt-1">
                              {serpSnapshot.topCompetitors.slice(0, 3).map((comp, idx) => (
                                <div key={idx} className="text-white-0">
                                  #{comp.rank} {comp.domain}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-6">Our Best Rank:</span>
                            <div className="mt-1 text-2xl font-semibold text-white-0">
                              {serpSnapshot.ourBestRank ? `#${serpSnapshot.ourBestRank}` : 'Not ranking'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {serpSnapshot.results.slice(0, 10).map((result) => (
                          <div
                            key={result.id}
                            className={`p-3 rounded-lg border transition-colors duration-sm ${
                              result.isCompetitor
                                ? 'border-border-subtle bg-slate-3/30'
                                : 'border-brand-cyan/30 bg-brand-cyan/5'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 text-sm font-semibold text-slate-6">
                                #{result.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-brand-cyan truncate">
                                  {result.title || result.url}
                                </div>
                                <div className="text-xs text-slate-6 truncate">{result.url}</div>
                                {result.snippet && (
                                  <p className="mt-1 text-xs text-muted line-clamp-2">
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
                    <div className="text-center py-8 text-slate-6">
                      No SERP data available for this keyword yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Opportunities */}
          <div className="lg:col-span-1">
            <div className="panel-card sticky top-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white-0 mb-4">
                  Opportunities
                  <span className="ml-2 text-sm font-normal text-slate-6">
                    ({opportunities.length})
                  </span>
                </h2>

                {opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opp) => (
                      <div key={opp.id} className="border border-border-subtle rounded-lg p-4 bg-slate-3/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white-0 mb-1">
                              {opp.keyword.keyword}
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                              <span
                                className={`px-2 py-0.5 rounded font-medium ${
                                  opp.opportunityType === 'keyword_gap'
                                    ? 'bg-brand-magenta/10 text-brand-magenta'
                                    : opp.opportunityType === 'content_refresh'
                                    ? 'bg-brand-amber/10 text-brand-amber'
                                    : 'bg-slate-5 text-slate-6'
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

                        <p className="text-xs text-slate-6 mb-2">{opp.gapSummary}</p>

                        <div className="mt-3 p-2 bg-brand-iris/10 rounded text-xs text-brand-iris">
                          <strong>Action:</strong> {opp.recommendedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-6">No opportunities detected yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* On-Page Optimization Tab */}
      {activeTab === 'onpage' && (
        <div className="panel-card p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-magenta/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white-0 mb-2">
              On-Page Optimization Engine
            </h2>
            <p className="text-muted mb-6 max-w-2xl mx-auto">
              Analyze page quality, identify technical issues, and get actionable recommendations to
              improve rankings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Page Audits</h3>
                <p className="text-sm text-slate-6">
                  Comprehensive on-page scoring with 0-100 quality scores
                </p>
              </div>
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Issue Detection</h3>
                <p className="text-sm text-slate-6">
                  Identify missing tags, thin content, slow performance
                </p>
              </div>
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Recommendations</h3>
                <p className="text-sm text-slate-6">
                  Actionable hints to fix high-priority issues quickly
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backlink Intelligence Tab */}
      {activeTab === 'backlinks' && (
        <div className="panel-card p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-cyan/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white-0 mb-2">
              Backlink Intelligence System
            </h2>
            <p className="text-muted mb-6 max-w-2xl mx-auto">
              Track backlinks, analyze referring domains, and monitor link profiles. Build authority
              with data-driven link building strategies.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Backlink Tracking</h3>
                <p className="text-sm text-slate-6">
                  Monitor active and lost backlinks with dofollow/nofollow classification
                </p>
              </div>
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Domain Authority</h3>
                <p className="text-sm text-slate-6">
                  Analyze referring domains by authority and spam scores
                </p>
              </div>
              <div className="p-6 bg-slate-3/50 rounded-xl border border-border-subtle">
                <h3 className="font-semibold text-white-0 mb-2">Anchor Analysis</h3>
                <p className="text-sm text-slate-6">
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
