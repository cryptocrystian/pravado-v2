/**
 * PR Generator Client Component (Sprint S100)
 * Client-side UI for press release generation
 *
 * INVARIANT: This component does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import type { PRGeneratedRelease, PRGenerationInput } from '@pravado/types';
import { PRGenerationResult, PRGeneratorForm, PRSidebarList } from '@/components/pr-generator';

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
  initialReleases: PRGeneratedRelease[];
}

export default function GeneratorClient({ initialReleases }: GeneratorClientProps) {
  const [releases, setReleases] = useState<PRGeneratedRelease[]>(initialReleases);
  const [selectedRelease, setSelectedRelease] = useState<PRGeneratedRelease | null>(null);
  const [isLoading, setIsLoading] = useState(initialReleases.length === 0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // S100: Load releases on mount via route handler
  useEffect(() => {
    if (initialReleases.length === 0) {
      loadReleases();
    }
  }, []);
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
      <div className="w-80 border-r border-border-subtle bg-slate-1 flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-white">Press Releases</h2>
          <p className="text-sm text-white/50 mt-1">Recent generations</p>
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
      <div className="flex-1 overflow-y-auto bg-page">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Press Release Generator</h1>
            <p className="text-white/50 mt-1">
              Generate professional press releases with AI-powered angle finding and SEO optimization
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
              <p className="text-semantic-danger">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-semantic-danger/70 hover:text-semantic-danger"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mb-6 p-4 bg-brand-iris/10 border border-brand-iris/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-brand-iris">
                  {STEP_LABELS[generationStep]}
                </span>
                <span className="text-sm text-brand-iris/70">{progress}%</span>
              </div>
              <div className="w-full bg-slate-3 rounded-full h-2">
                <div
                  className="bg-brand-iris h-2 rounded-full transition-all duration-300"
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
              <h2 className="text-xl font-semibold text-white mb-4">Generated Press Release</h2>
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
