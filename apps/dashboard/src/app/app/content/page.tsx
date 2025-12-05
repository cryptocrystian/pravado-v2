/**
 * Content Intelligence Dashboard (Sprint S12)
 * Full implementation with content library, briefs, clusters, and gaps
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import type {
  ContentItem,
  ContentBrief,
  ContentBriefWithContextDTO,
  ContentClusterDTO,
  ContentGapDTO,
  AgentPersonality,
  ContentQualityAnalysisResult,
} from '@pravado/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type TabType = 'overview' | 'briefs';
type ContentStatus = 'draft' | 'published' | 'archived';
type ContentType = 'blog_post' | 'social_post' | 'long_form' | 'video_script' | 'newsletter';

const contentTypeLabels: Record<ContentType, string> = {
  blog_post: 'Blog Post',
  social_post: 'Social Post',
  long_form: 'Long Form',
  video_script: 'Video Script',
  newsletter: 'Newsletter',
};

export default function ContentPage() {
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<ContentBriefWithContextDTO | null>(null);

  // Content library state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | ''>('');

  // Briefs, clusters, and gaps
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [clusters, setClusters] = useState<ContentClusterDTO[]>([]);
  const [gaps, setGaps] = useState<ContentGapDTO[]>([]);

  // Brief generation modal state (S13)
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [personalities, setPersonalities] = useState<AgentPersonality[]>([]);
  const [generationForm, setGenerationForm] = useState({
    targetKeyword: '',
    targetIntent: 'informational' as 'informational' | 'navigational' | 'commercial' | 'transactional',
    personalityId: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Quality analysis state (S14)
  const [qualityAnalysis, setQualityAnalysis] = useState<ContentQualityAnalysisResult | null>(null);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);

  // Fetch content items
  const fetchContentItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('q', searchQuery);
      if (typeFilter) params.set('contentType', typeFilter);

      const response = await fetch(
        `http://localhost:4000/api/v1/content/items?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setContentItems(data.data.items || []);
        setTotalItems(data.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch content items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch content briefs
  const fetchBriefs = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/content/briefs?limit=20', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setBriefs(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch briefs:', error);
    }
  };

  // Fetch clusters
  const fetchClusters = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/content/clusters', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setClusters(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
    }
  };

  // Fetch content gaps
  const fetchGaps = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/content/gaps?limit=10', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setGaps(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch gaps:', error);
    }
  };

  // Fetch single brief with context
  const fetchBriefWithContext = async (briefId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/content/briefs/${briefId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setSelectedBrief(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch brief:', error);
    }
  };

  // Fetch personalities (S13)
  const fetchPersonalities = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/personalities?limit=50', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setPersonalities(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch personalities:', error);
    }
  };

  // Handle opening brief generation modal (S13)
  const handleOpenBriefModal = () => {
    setShowBriefModal(true);
    setGenerationError(null);
    setGenerationForm({
      targetKeyword: '',
      targetIntent: 'informational',
      personalityId: '',
    });
    fetchPersonalities();
  };

  // Handle brief generation (S13)
  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const requestBody: {
        targetKeyword?: string;
        targetIntent?: string;
        personalityId?: string;
        contentItemId?: string;
      } = {
        targetKeyword: generationForm.targetKeyword || undefined,
        targetIntent: generationForm.targetIntent || undefined,
        personalityId: generationForm.personalityId || undefined,
      };

      // Include contentItemId if a content item is selected
      if (selectedItem) {
        requestBody.contentItemId = selectedItem.id;
      }

      const response = await fetch('http://localhost:4000/api/v1/content/briefs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        // Close modal
        setShowBriefModal(false);

        // Navigate to brief viewer
        router.push(`/app/content/brief/${data.data.result.generatedBriefId}`);
      } else {
        setGenerationError(data.error?.message || 'Failed to generate brief');
      }
    } catch (error) {
      setGenerationError('An error occurred while generating the brief');
      console.error('Brief generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Analyze content quality (S14)
  const handleAnalyzeQuality = async () => {
    if (!selectedItem) return;

    setIsAnalyzingQuality(true);
    try {
      const response = await fetch('http://localhost:4000/api/v1/content/quality/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ contentItemId: selectedItem.id }),
      });

      const data = await response.json();

      if (data.success) {
        setQualityAnalysis(data.data.result);
      }
    } catch (error) {
      console.error('Quality analysis error:', error);
    } finally {
      setIsAnalyzingQuality(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchContentItems();
    fetchBriefs();
    fetchClusters();
    fetchGaps();
  }, [currentPage, statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchContentItems();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    setSelectedBrief(null);
  };

  const handleBriefClick = (brief: ContentBrief) => {
    setSelectedItem(null);
    fetchBriefWithContext(brief.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Content Intelligence</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your content library, briefs, and discover content opportunities
        </p>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Content Library */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Content Library</h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3"
            />

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ContentType | '')}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="blog_post">Blog Post</option>
                <option value="social_post">Social Post</option>
                <option value="long_form">Long Form</option>
                <option value="video_script">Video Script</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          {/* Content items list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : contentItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No content items found.</p>
                <p className="text-xs mt-2">Try adjusting your filters or create new content.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                          item.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{contentTypeLabels[item.contentType]}</span>
                      <span>•</span>
                      <span>{item.wordCount ? `${item.wordCount} words` : 'No content'}</span>
                      {item.updatedAt && (
                        <>
                          <span>•</span>
                          <span>{formatDate(item.updatedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalItems > 20 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalItems / 20)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= Math.ceil(totalItems / 20)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* CENTER PANEL - Content Detail / Briefs */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Content Detail
            </button>
            <button
              onClick={() => setActiveTab('briefs')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'briefs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Briefs ({briefs.length})
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'overview' ? (
              selectedItem ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedItem.title}</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedItem.status}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                      <p className="text-sm text-gray-900">
                        {contentTypeLabels[selectedItem.contentType]}
                      </p>
                    </div>

                    {selectedItem.slug && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Slug</label>
                        <p className="text-sm text-gray-900">{selectedItem.slug}</p>
                      </div>
                    )}

                    {selectedItem.url && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">URL</label>
                        <a
                          href={selectedItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedItem.url}
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Word Count
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedItem.wordCount ? selectedItem.wordCount.toLocaleString() : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Reading Time
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedItem.readingTimeMinutes
                            ? `${selectedItem.readingTimeMinutes} min`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {selectedItem.publishedAt && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Published
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedItem.publishedAt)}
                        </p>
                      </div>
                    )}

                    {selectedItem.body && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Content Preview
                        </label>
                        <p className="text-sm text-gray-700 line-clamp-6 mt-1">
                          {selectedItem.body}
                        </p>
                      </div>
                    )}

                    {/* Analyze Quality Button (S14) */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleAnalyzeQuality}
                        disabled={isAnalyzingQuality}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                      >
                        {isAnalyzingQuality ? 'Analyzing...' : 'Analyze Quality'}
                      </button>
                    </div>

                    {/* Quality Score Display (S14) */}
                    {qualityAnalysis && (
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Quality Score
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  qualityAnalysis.score.score >= 70
                                    ? 'bg-green-600'
                                    : qualityAnalysis.score.score >= 40
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                                }`}
                                style={{ width: `${qualityAnalysis.score.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{qualityAnalysis.score.score}</span>
                          </div>
                        </div>

                        {qualityAnalysis.score.readability !== null && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Readability
                            </label>
                            <p className="text-sm text-gray-900">{qualityAnalysis.score.readability}/100</p>
                          </div>
                        )}

                        {qualityAnalysis.score.keywordAlignment !== null && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Keyword Alignment
                            </label>
                            <p className="text-sm text-gray-900">{qualityAnalysis.score.keywordAlignment}/100</p>
                          </div>
                        )}

                        {qualityAnalysis.suggestedImprovements.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Suggestions
                            </label>
                            <ul className="mt-1 space-y-1">
                              {qualityAnalysis.suggestedImprovements.slice(0, 3).map((suggestion, i) => (
                                <li key={i} className="text-xs text-gray-700">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generate Brief Button (S13) */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleOpenBriefModal}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Generate Brief
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Create an AI-assisted content brief for this item
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg">📄</p>
                    <p className="text-sm mt-2">Select a content item to view details</p>
                  </div>
                </div>
              )
            ) : (
              // Briefs tab
              <div>
                {selectedBrief ? (
                  <div>
                    <button
                      onClick={() => setSelectedBrief(null)}
                      className="text-sm text-blue-600 hover:underline mb-4"
                    >
                      ← Back to briefs list
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {selectedBrief.brief.title}
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Status
                        </label>
                        <p className="text-sm text-gray-900 capitalize">
                          {selectedBrief.brief.status}
                        </p>
                      </div>

                      {selectedBrief.brief.targetKeyword && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Target Keyword
                          </label>
                          <p className="text-sm text-gray-900">{selectedBrief.brief.targetKeyword}</p>
                        </div>
                      )}

                      {selectedBrief.brief.targetAudience && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Target Audience
                          </label>
                          <p className="text-sm text-gray-900">
                            {selectedBrief.brief.targetAudience}
                          </p>
                        </div>
                      )}

                      {selectedBrief.brief.tone && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Tone</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedBrief.brief.tone}</p>
                        </div>
                      )}

                      {selectedBrief.suggestedKeywords.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Suggested Keywords
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedBrief.suggestedKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBrief.relatedTopics.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Related Topics
                          </label>
                          <div className="space-y-1 mt-1">
                            {selectedBrief.relatedTopics.map((topic) => (
                              <div key={topic.id} className="text-sm text-gray-700">
                                • {topic.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {briefs.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No briefs found.</p>
                        <p className="text-xs mt-2">Create your first content brief to get started.</p>
                      </div>
                    ) : (
                      briefs.map((brief) => (
                        <div
                          key={brief.id}
                          onClick={() => handleBriefClick(brief)}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 text-sm mb-1">{brief.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize">{brief.status}</span>
                            {brief.targetKeyword && (
                              <>
                                <span>•</span>
                                <span>{brief.targetKeyword}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Clusters & Gaps */}
        <div className="w-1/3 bg-gray-50 overflow-y-auto p-4 space-y-4">
          {/* Content Clusters Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Topic Clusters</h3>
            {clusters.length === 0 ? (
              <p className="text-sm text-gray-500">No clusters found.</p>
            ) : (
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <div key={cluster.cluster.id} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {cluster.cluster.name}
                    </h4>
                    {cluster.cluster.description && (
                      <p className="text-xs text-gray-600 mb-2">{cluster.cluster.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {cluster.topics.length} topics • {cluster.representativeContent.length} items
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Gaps Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Opportunities</h3>
            {gaps.length === 0 ? (
              <p className="text-sm text-gray-500">No content gaps identified.</p>
            ) : (
              <div className="space-y-2">
                {gaps.slice(0, 10).map((gap, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">{gap.keyword}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                          gap.seoOpportunityScore >= 70
                            ? 'bg-green-100 text-green-700'
                            : gap.seoOpportunityScore >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {gap.seoOpportunityScore}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {gap.intent && <span className="capitalize">{gap.intent} • </span>}
                      {gap.existingContentCount} existing content
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brief Generation Modal (S13) */}
      {showBriefModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Generate Content Brief</h2>
                <button
                  onClick={() => setShowBriefModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedItem && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Content Item:</span> {selectedItem.title}
                  </p>
                </div>
              )}

              {generationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{generationError}</p>
                </div>
              )}

              <form onSubmit={handleGenerateBrief} className="space-y-4">
                <div>
                  <label htmlFor="targetKeyword" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Keyword
                  </label>
                  <input
                    type="text"
                    id="targetKeyword"
                    value={generationForm.targetKeyword}
                    onChange={(e) => setGenerationForm({ ...generationForm, targetKeyword: e.target.value })}
                    placeholder="e.g., content marketing strategy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Primary keyword to target in the brief
                  </p>
                </div>

                <div>
                  <label htmlFor="targetIntent" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Intent
                  </label>
                  <select
                    id="targetIntent"
                    value={generationForm.targetIntent}
                    onChange={(e) => setGenerationForm({ ...generationForm, targetIntent: e.target.value as 'informational' | 'navigational' | 'commercial' | 'transactional' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="informational">Informational</option>
                    <option value="navigational">Navigational</option>
                    <option value="commercial">Commercial</option>
                    <option value="transactional">Transactional</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Type of search intent for the content
                  </p>
                </div>

                <div>
                  <label htmlFor="personalityId" className="block text-sm font-medium text-gray-700 mb-1">
                    Personality (Optional)
                  </label>
                  <select
                    id="personalityId"
                    value={generationForm.personalityId}
                    onChange={(e) => setGenerationForm({ ...generationForm, personalityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Default Personality</option>
                    {personalities.map((personality) => (
                      <option key={personality.id} value={personality.id}>
                        {personality.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a personality profile for tone and style
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBriefModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Brief'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
