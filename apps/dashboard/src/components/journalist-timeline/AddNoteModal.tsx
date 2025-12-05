/**
 * Add Note Modal Component (Sprint S49)
 * Modal for adding manual notes to journalist timeline
 */

import type { CreateManualNoteInput, TimelineSentiment } from '@pravado/types';
import { useState } from 'react';

interface AddNoteModalProps {
  journalistId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: CreateManualNoteInput) => Promise<void>;
}

const sentimentOptions: { value: TimelineSentiment; label: string; icon: string }[] = [
  { value: 'positive', label: 'Positive', icon: '😊' },
  { value: 'neutral', label: 'Neutral', icon: '😐' },
  { value: 'negative', label: 'Negative', icon: '😞' },
  { value: 'unknown', label: 'Unknown', icon: '❓' },
];

export function AddNoteModal({
  journalistId,
  isOpen,
  onClose,
  onSubmit,
}: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sentiment, setSentiment] = useState<TimelineSentiment>('neutral');
  const [relationshipImpact, setRelationshipImpact] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        journalistId,
        title: title.trim(),
        description: description.trim(),
        sentiment,
        relationshipImpact,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSentiment('neutral');
      setRelationshipImpact(0);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setSentiment('neutral');
    setRelationshipImpact(0);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Manual Note
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="note-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Phone call discussion about Q4 trends"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/500 characters
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="note-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="note-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed notes about the interaction, discussion topics, follow-up actions, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              maxLength={5000}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {description.length}/5000 characters
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sentimentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSentiment(option.value)}
                  className={`px-4 py-2 rounded-md border transition-all flex items-center justify-center gap-2 ${
                    sentiment === option.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Impact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Impact: {relationshipImpact.toFixed(2)}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={relationshipImpact}
                onChange={(e) => setRelationshipImpact(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Negative (-1)</span>
                <span>Neutral (0)</span>
                <span>Positive (+1)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How does this interaction affect your relationship? Use negative values for
              negative impacts (e.g., unsubscribe), positive for positive impacts (e.g., coverage).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding Note...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
