'use client';

/**
 * Pitch Preview Drawer Component (Sprint S39)
 * Slide-out drawer showing generated pitch preview
 */

import type { GeneratedPitchPreview, PRPitchContactWithJournalist } from '@pravado/types';
import { useEffect, useState } from 'react';

import { generatePitchPreview, queuePitchForContact } from '@/lib/prPitchApi';

interface PitchPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: PRPitchContactWithJournalist | null;
  sequenceId: string;
  onQueued: () => void;
}

export function PitchPreviewDrawer({
  isOpen,
  onClose,
  contact,
  sequenceId,
  onQueued,
}: PitchPreviewDrawerProps) {
  const [preview, setPreview] = useState<GeneratedPitchPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contact) {
      loadPreview();
    } else {
      setPreview(null);
      setError(null);
    }
  }, [isOpen, contact]);

  const loadPreview = async () => {
    if (!contact) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generatePitchPreview({
        sequenceId,
        journalistId: contact.journalistId,
        stepPosition: contact.currentStepPosition,
      });
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueue = async () => {
    if (!contact) return;

    setIsQueueing(true);
    try {
      await queuePitchForContact(contact.id);
      onQueued();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue pitch');
    } finally {
      setIsQueueing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pitch Preview</h2>
            {contact && (
              <p className="text-sm text-gray-500">
                For {contact.journalist.name}
                {contact.journalist.outlet && ` at ${contact.journalist.outlet}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Generating personalized pitch...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadPreview}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">{preview.subject}</p>
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap font-mono text-sm">
                  {preview.body}
                </div>
              </div>

              {/* Personalization Score */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Personalization Score
                  </p>
                  <p className="text-xs text-blue-700">
                    How well the pitch is tailored to this journalist
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {preview.personalizationScore}%
                </div>
              </div>

              {/* Suggestions */}
              {preview.suggestions && preview.suggestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggestions
                  </label>
                  <div className="space-y-2">
                    {preview.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <p className="text-sm font-medium text-yellow-900 capitalize">
                          {suggestion.type}
                        </p>
                        <p className="text-sm text-yellow-800 mt-1">{suggestion.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {preview && contact?.status === 'queued' && (
            <button
              onClick={handleQueue}
              disabled={isQueueing}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isQueueing ? 'Queueing...' : 'Queue Pitch'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
