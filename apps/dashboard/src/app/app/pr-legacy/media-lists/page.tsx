/**
 * AI Media List Builder Page (Sprint S47)
 * Main page for generating and managing intelligent media lists
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  MediaListGenerationInput,
  MediaListGenerationResult,
  MediaListSummary,
  MediaListWithEntries,
} from '@pravado/types';
import * as mediaListsApi from '@/lib/mediaListsApi';
import { MediaListGeneratorForm } from '@/components/mediaLists/MediaListGeneratorForm';
import { MediaListResultPreview } from '@/components/mediaLists/MediaListResultPreview';
import { MediaListCard } from '@/components/mediaLists/MediaListCard';
import { MediaListEntryTable } from '@/components/mediaLists/MediaListEntryTable';

type ViewMode = 'list' | 'generate' | 'preview' | 'detail';

export default function MediaListsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [lists, setLists] = useState<MediaListSummary[]>([]);
  const [selectedList, setSelectedList] = useState<MediaListWithEntries | null>(null);
  const [generatedResult, setGeneratedResult] = useState<MediaListGenerationResult | null>(null);
  const [currentInput, setCurrentInput] = useState<MediaListGenerationInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load media lists on mount
  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mediaListsApi.listMediaLists();
      setLists(response.lists);
    } catch (err: any) {
      setError(err.message || 'Failed to load media lists');
      console.error('Failed to load lists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (input: MediaListGenerationInput) => {
    try {
      setIsGenerating(true);
      setError(null);
      const result = await mediaListsApi.generateMediaList(input);
      setGeneratedResult(result);
      setCurrentInput(input);
      setViewMode('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to generate media list');
      console.error('Failed to generate:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveList = async () => {
    if (!generatedResult || !currentInput) return;

    const listName = prompt('Enter a name for this media list:');
    if (!listName) return;

    try {
      setIsLoading(true);
      setError(null);

      const entries = generatedResult.matches.map((match, index) => ({
        journalistId: match.journalistId,
        fitScore: match.fitScore,
        tier: match.tier,
        reason: match.reason,
        fitBreakdown: match.fitBreakdown,
        position: index,
      }));

      await mediaListsApi.createMediaList({
        name: listName,
        description: `Generated for topic: ${currentInput.topic}`,
        inputTopic: currentInput.topic,
        inputKeywords: currentInput.keywords,
        inputMarket: currentInput.market,
        inputGeography: currentInput.geography,
        inputProduct: currentInput.product,
        entries,
      });

      // Refresh lists and return to list view
      await loadLists();
      setGeneratedResult(null);
      setCurrentInput(null);
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to save media list');
      console.error('Failed to save:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewList = async (listId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await mediaListsApi.getMediaList(listId);
      setSelectedList(list);
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to load media list');
      console.error('Failed to load list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await mediaListsApi.deleteMediaList(listId);
      await loadLists();
    } catch (err: any) {
      setError(err.message || 'Failed to delete media list');
      console.error('Failed to delete:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Media List Builder</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate intelligent, hyper-targeted media lists using AI-powered fit scoring
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'list' || viewMode === 'detail'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Media Lists ({lists.length})
            </button>
            <button
              onClick={() => {
                setViewMode('generate');
                setGeneratedResult(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'generate' || viewMode === 'preview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate New List
            </button>
          </nav>
        </div>

        {/* Content */}
        {viewMode === 'list' && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading media lists...</p>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No media lists yet</p>
                <button
                  onClick={() => setViewMode('generate')}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                >
                  Generate Your First List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lists.map((list) => (
                  <MediaListCard
                    key={list.id}
                    list={list}
                    onView={handleViewList}
                    onDelete={handleDeleteList}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <MediaListGeneratorForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {viewMode === 'preview' && generatedResult && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setViewMode('generate')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Form
              </button>
            </div>
            <MediaListResultPreview
              result={generatedResult}
              onSave={handleSaveList}
              onCancel={() => {
                setGeneratedResult(null);
                setViewMode('generate');
              }}
            />
          </div>
        )}

        {viewMode === 'detail' && selectedList && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedList(null);
                  setViewMode('list');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Lists
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm('Delete this media list?')) {
                      handleDeleteList(selectedList.id);
                      setSelectedList(null);
                      setViewMode('list');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-md"
                >
                  Delete List
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedList.name}</h2>
              {selectedList.description && (
                <p className="text-gray-600 mb-4">{selectedList.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Topic: <strong>{selectedList.inputTopic}</strong></span>
                {selectedList.inputMarket && (
                  <span>Market: <strong>{selectedList.inputMarket}</strong></span>
                )}
                {selectedList.inputGeography && (
                  <span>Geography: <strong>{selectedList.inputGeography}</strong></span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedList.totalEntries}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedList.tierACount}</div>
                  <div className="text-xs text-gray-500">A-Tier</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedList.tierBCount}</div>
                  <div className="text-xs text-gray-500">B-Tier</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{selectedList.tierCCount}</div>
                  <div className="text-xs text-gray-500">C-Tier</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{selectedList.tierDCount}</div>
                  <div className="text-xs text-gray-500">D-Tier</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <MediaListEntryTable
                entries={selectedList.entries}
                onSelectJournalist={(journalistId) => {
                  router.push(`/app/pr/journalists/${journalistId}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
