/**
 * PR Generator Client Component (Sprint S99.2)
 * Client-side UI for press release generation
 */

'use client';

import { useCallback, useState } from 'react';
import type { PRGeneratedRelease, PRGenerationInput } from '@pravado/types';
import { PRGenerationResult, PRGeneratorForm, PRSidebarList } from '@/components/pr-generator';
import type { PressRelease } from '@/server/prDataServer';

type GenerationStep = 'idle' | 'context' | 'angles' | 'headlines' | 'draft' | 'seo' | 'complete';

const STEP_LABELS: Record<GenerationStep, string> = {
  idle: 'Ready',
  context: 'Gathering context...',
  angles: 'Finding narrative angles...',
  headlines: 'Generating headlines...',
  draft: 'Writing draft...',
  seo: 'Optimizing for SEO...',
  complete: 'Complete!',
};

interface GeneratorClientProps {
  initialReleases: PressRelease[];
}

export default function GeneratorClient({ initialReleases }: GeneratorClientProps) {
  const [releases, setReleases] = useState<PRGeneratedRelease[]>(
    initialReleases as unknown as PRGeneratedRelease[]
  );
  const [selectedRelease, setSelectedRelease] = useState<PRGeneratedRelease | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadReleases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pr/releases?limit=20');
      if (!response.ok) {
        throw new Error('Failed to load releases');
      }
      const data = await response.json();
      setReleases(data.releases || []);
    } catch (err) {
      console.error('Failed to load releases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRelease = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/pr/releases/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load release');
      }
      const data = await response.json();
      setSelectedRelease(data.release);
    } catch (err) {
      console.error('Failed to load release:', err);
    }
  }, []);

  const handleGenerate = async (input: PRGenerationInput) => {
    setIsGenerating(true);
    setGenerationStep('context');
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/pr/releases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      const releaseId = data.id;

      // Simulate progress (since we don't have SSE in this simplified version)
      setGenerationStep('angles');
      setProgress(20);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('headlines');
      setProgress(40);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('draft');
      setProgress(60);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('seo');
      setProgress(80);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('complete');
      setProgress(100);

      // Load the completed release
      const releaseResponse = await fetch(`/api/pr/releases/${releaseId}`);
      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        setSelectedRelease(releaseData.release);
      }

      // Refresh the list
      await loadReleases();

      setTimeout(() => setGenerationStep('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate press release');
      setGenerationStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedRelease) return;

    setIsOptimizing(true);
    try {
      const response = await fetch(`/api/pr/releases/${selectedRelease.id}/optimize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const data = await response.json();
      setSelectedRelease(data.release);
      await loadReleases();
    } catch (err) {
      console.error('Failed to optimize:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Press Releases</h2>
          <p className="text-sm text-gray-500 mt-1">Recent generations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PRSidebarList
            releases={releases}
            selectedId={selectedRelease?.id}
            onSelect={handleSelectRelease}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Press Release Generator</h1>
            <p className="text-gray-600 mt-1">
              Generate professional press releases with AI-powered angle finding and SEO optimization
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  {STEP_LABELS[generationStep]}
                </span>
                <span className="text-sm text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generator Form */}
          <div className="mb-8">
            <PRGeneratorForm onSubmit={handleGenerate} isLoading={isGenerating} />
          </div>

          {/* Result */}
          {selectedRelease && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Press Release</h2>
              <PRGenerationResult
                release={selectedRelease}
                onOptimize={handleOptimize}
                isOptimizing={isOptimizing}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
