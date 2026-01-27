'use client';

/**
 * PR Detail Page (Sprint S38)
 * Detail view for a single press release
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { PRAngleOption, PRGeneratedRelease, PRHeadlineVariant, PRSimilarRelease } from '@pravado/types';

import { PRGenerationResult } from '@/components/pr-generator';
import {
  findSimilarPressReleases,
  formatDate,
  formatNewsType,
  getPressRelease,
  optimizePressRelease,
} from '@/lib/pressReleaseApi';

export default function PRDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [release, setRelease] = useState<PRGeneratedRelease | null>(null);
  const [headlineVariants, setHeadlineVariants] = useState<PRHeadlineVariant[]>([]);
  const [angleOptions, setAngleOptions] = useState<PRAngleOption[]>([]);
  const [similarReleases, setSimilarReleases] = useState<PRSimilarRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'headlines' | 'angles' | 'similar'>('content');

  useEffect(() => {
    if (id) {
      loadRelease();
    }
  }, [id]);

  const loadRelease = async () => {
    try {
      setIsLoading(true);
      const result = await getPressRelease(id);
      setRelease(result.release);
      setHeadlineVariants(result.headlineVariants || []);
      setAngleOptions(result.angleOptions || []);

      // Load similar releases
      try {
        const similarResult = await findSimilarPressReleases(id);
        setSimilarReleases(similarResult.similar);
      } catch {
        // Ignore similarity errors
      }
    } catch (err) {
      console.error('Failed to load release:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!release) return;

    setIsOptimizing(true);
    try {
      const result = await optimizePressRelease(release.id);
      setRelease(result.release);
    } catch (err) {
      console.error('Failed to optimize:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Press Release Not Found</h2>
          <Link href="/app/pr/generator" className="mt-4 text-blue-600 hover:underline">
            Go back to generator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/app/pr/generator" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Generator
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {release.headline || 'Untitled Press Release'}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">
                  {formatNewsType(release.input?.newsType || 'other')}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(release.createdAt)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    release.status === 'complete'
                      ? 'bg-green-100 text-green-800'
                      : release.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {release.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['content', 'headlines', 'angles', 'similar'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'content' && 'Content'}
                {tab === 'headlines' && `Headlines (${headlineVariants.length})`}
                {tab === 'angles' && `Angles (${angleOptions.length})`}
                {tab === 'similar' && `Similar (${similarReleases.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' && (
          <PRGenerationResult
            release={release}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
          />
        )}

        {activeTab === 'headlines' && (
          <HeadlineVariantsPanel variants={headlineVariants} />
        )}

        {activeTab === 'angles' && (
          <AngleOptionsPanel options={angleOptions} />
        )}

        {activeTab === 'similar' && (
          <SimilarReleasesPanel releases={similarReleases} />
        )}
      </div>
    </div>
  );
}

function HeadlineVariantsPanel({ variants }: { variants: PRHeadlineVariant[] }) {
  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No headline variants available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <div
          key={variant.id || index}
          className={`p-4 rounded-lg border ${
            variant.isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{variant.headline}</p>
              {variant.isSelected && (
                <span className="text-xs text-blue-600 mt-1 inline-block">
                  Selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {variant.score.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-blue-600">
                  {variant.seoScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">SEO</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-600">
                  {variant.viralityScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Virality</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-green-600">
                  {variant.readabilityScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Readability</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AngleOptionsPanel({ options }: { options: PRAngleOption[] }) {
  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No angle options available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div
          key={option.id || index}
          className={`p-4 rounded-lg border ${
            option.isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{option.angleTitle}</p>
              {option.angleDescription && (
                <p className="text-sm text-gray-600 mt-1">{option.angleDescription}</p>
              )}
              {option.isSelected && (
                <span className="text-xs text-blue-600 mt-2 inline-block">
                  Selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {option.totalScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-blue-600">
                  {option.newsworthinessScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">News</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-600">
                  {option.uniquenessScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Unique</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-green-600">
                  {option.relevanceScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Relevance</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimilarReleasesPanel({ releases }: { releases: PRSimilarRelease[] }) {
  if (releases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No similar press releases found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {releases.map((release) => (
        <Link
          key={release.id}
          href={`/app/pr/${release.id}`}
          className="block p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {release.headline || 'Untitled Release'}
              </p>
              {release.angle && (
                <p className="text-sm text-gray-600 mt-1">{release.angle}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(release.createdAt)}
              </p>
            </div>
            <div className="text-center ml-4">
              <div className="text-lg font-bold text-blue-600">
                {(release.similarity * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Similarity</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
