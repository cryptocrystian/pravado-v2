/**
 * Generated Content Brief Viewer (Sprint S13)
 * Displays AI-generated content brief with full details
 */

'use client';

import type { GeneratedBrief } from '@pravado/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface BriefViewerPageProps {
  params: {
    id: string;
  };
}

export default function BriefViewerPage({ params }: BriefViewerPageProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<GeneratedBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/content/generated-briefs/${params.id}`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        setBrief(data.data.item);
      } else {
        setError(data.error?.message || 'Failed to load brief');
      }
    } catch (err) {
      setError('An error occurred while loading the brief');
      console.error('Brief fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brief...</p>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Brief</h2>
          <p className="text-gray-600 mb-4">{error || 'Brief not found'}</p>
          <button
            onClick={() => router.push('/app/content')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Content
          </button>
        </div>
      </div>
    );
  }

  const briefData = brief.brief as Record<string, any>;
  const seoContext = brief.seoContext as Record<string, any>;
  const personalityData = brief.personalityUsed as Record<string, any>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push('/app/content')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Content
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{briefData.title || 'Content Brief'}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Generated {formatDate(brief.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              {briefData.targetKeyword && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Target Keyword</label>
                  <p className="text-sm text-gray-900 mt-1">{briefData.targetKeyword}</p>
                </div>
              )}

              {briefData.targetIntent && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Search Intent</label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{briefData.targetIntent}</p>
                </div>
              )}

              {briefData.targetAudience && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Target Audience</label>
                  <p className="text-sm text-gray-900 mt-1">{briefData.targetAudience}</p>
                </div>
              )}

              {briefData.tone && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tone</label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{briefData.tone}</p>
                </div>
              )}

              {(briefData.minWordCount || briefData.maxWordCount) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Word Count Range</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {briefData.minWordCount?.toLocaleString() || '?'} - {briefData.maxWordCount?.toLocaleString() || '?'} words
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Outline Card */}
          {briefData.outline && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Content Outline</h2>

              {briefData.outline.introduction && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Introduction</h3>
                  {briefData.outline.introduction.hook && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Hook: </span>
                      <span className="text-sm text-gray-700">{briefData.outline.introduction.hook}</span>
                    </div>
                  )}
                  {briefData.outline.introduction.context && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Context: </span>
                      <span className="text-sm text-gray-700">{briefData.outline.introduction.context}</span>
                    </div>
                  )}
                  {briefData.outline.introduction.thesis && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Thesis: </span>
                      <span className="text-sm text-gray-700">{briefData.outline.introduction.thesis}</span>
                    </div>
                  )}
                </div>
              )}

              {briefData.outline && typeof briefData.outline === 'object' && (briefData.outline as Record<string, unknown>).mainSections && Array.isArray((briefData.outline as Record<string, unknown>).mainSections) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Main Sections</h3>
                  <div className="space-y-4">
                    {((briefData.outline as Record<string, unknown>).mainSections as Array<Record<string, unknown>>).map((section, index: number) => (
                      <div key={index} className="pl-4 border-l-2 border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-2">{String(section.title || '')}</h4>
                        {Array.isArray(section.keyPoints) && section.keyPoints.length > 0 && (
                          <ul className="space-y-1">
                            {(section.keyPoints as string[]).map((point, pointIndex: number) => (
                              <li key={pointIndex} className="text-sm text-gray-700 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {briefData.outline.conclusion && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Conclusion</h3>
                  {briefData.outline.conclusion.summary && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Summary: </span>
                      <span className="text-sm text-gray-700">{briefData.outline.conclusion.summary}</span>
                    </div>
                  )}
                  {briefData.outline.conclusion.cta && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Call to Action: </span>
                      <span className="text-sm text-gray-700">{briefData.outline.conclusion.cta}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEO Guidelines Card */}
          {briefData.seoGuidelines && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Guidelines</h2>

              {briefData.seoGuidelines.primaryKeyword && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase">Primary Keyword</label>
                  <p className="text-sm text-gray-900 mt-1">{briefData.seoGuidelines.primaryKeyword}</p>
                </div>
              )}

              {briefData.seoGuidelines && typeof briefData.seoGuidelines === 'object' && Array.isArray((briefData.seoGuidelines as Record<string, unknown>).secondaryKeywords) && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase">Secondary Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {((briefData.seoGuidelines as Record<string, unknown>).secondaryKeywords as string[]).map((kw, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {briefData.seoGuidelines.metaDescription && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase">Meta Description</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                    {briefData.seoGuidelines.metaDescription}
                  </p>
                </div>
              )}

              {briefData.seoGuidelines.targetSearchVolume && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Target Search Volume</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {briefData.seoGuidelines.targetSearchVolume.toLocaleString()} searches/month
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Context Cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Personality Used */}
            {personalityData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Personality Used</h2>
                {personalityData.tone && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 uppercase">Tone</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{personalityData.tone}</p>
                  </div>
                )}
                {personalityData.style && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Style</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{personalityData.style}</p>
                  </div>
                )}
              </div>
            )}

            {/* SEO Context Summary */}
            {seoContext && Array.isArray(seoContext.relatedKeywords) && seoContext.relatedKeywords.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Context</h2>
                <label className="text-xs font-medium text-gray-500 uppercase">Related Keywords</label>
                <div className="mt-2 space-y-1">
                  {(seoContext.relatedKeywords as Array<Record<string, any>>).slice(0, 5).map((kw, index: number) => (
                    <div key={index} className="text-sm text-gray-700 flex items-center justify-between">
                      <span>{kw.keyword}</span>
                      {kw.searchVolume && (
                        <span className="text-xs text-gray-500">{kw.searchVolume} vol</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600">
              {briefData.createdBy && `Generated by ${briefData.createdBy} • `}
              Brief ID: {brief.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
