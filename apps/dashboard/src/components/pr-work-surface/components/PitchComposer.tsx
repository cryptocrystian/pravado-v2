'use client';

/**
 * Pitch Composer - DS 3.0
 *
 * Component for composing and sending pitches.
 * NO auto-send - all pitches require manual send action.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { useState } from 'react';
import type { MediaContact, Pitch } from '../types';

interface Props {
  contact?: MediaContact;
  onSend?: (pitch: Partial<Pitch>) => void;
  onSaveDraft?: (pitch: Partial<Pitch>) => void;
  onClose?: () => void;
}

export function PitchComposer({ contact, onSend, onSaveDraft, onClose }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [personalizationScore, setPersonalizationScore] = useState(0);

  // Simple personalization score calculation (placeholder)
  const calculateScore = () => {
    let score = 0;
    if (subject.length > 20) score += 20;
    if (body.length > 100) score += 20;
    if (contact?.name && body.includes(contact.name)) score += 20;
    if (contact?.outlet && body.includes(contact.outlet)) score += 20;
    if (contact?.beats?.some((beat) => body.toLowerCase().includes(beat.toLowerCase()))) score += 20;
    setPersonalizationScore(Math.min(score, 100));
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    calculateScore();
  };

  const handleSend = () => {
    if (onSend) {
      onSend({
        contactId: contact?.id,
        subject,
        body,
        personalizationScore,
        status: 'sent',
      });
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft({
        contactId: contact?.id,
        subject,
        body,
        personalizationScore,
        status: 'draft',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Compose Pitch</h3>
          {contact && (
            <p className="text-sm text-white/55 mt-0.5">
              To: {contact.name} {contact.outlet && `(${contact.outlet})`}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Manual Execution Notice */}
      <div className="p-3 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-xs text-brand-cyan">
            No auto-send. Click "Send Pitch" to deliver manually.
          </span>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-white/55 mb-2">
          Subject Line
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject line..."
          className="w-full px-4 py-2 rounded-lg bg-[#0D0D12] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-iris/50"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-white/55 mb-2">
          Message Body
        </label>
        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Write your pitch..."
          rows={10}
          className="w-full px-4 py-3 rounded-lg bg-[#0D0D12] border border-[#1A1A24] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-iris/50 resize-none"
        />
      </div>

      {/* Personalization Score */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#13131A] border border-[#1A1A24]">
        <div>
          <div className="text-sm font-medium text-white">Personalization Score</div>
          <div className="text-xs text-white/55 mt-0.5">
            Higher scores indicate better tailoring to the contact
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                personalizationScore >= 80
                  ? 'bg-semantic-success'
                  : personalizationScore >= 60
                  ? 'bg-semantic-warning'
                  : 'bg-semantic-danger'
              }`}
              style={{ width: `${personalizationScore}%` }}
            />
          </div>
          <span
            className={`text-lg font-bold ${
              personalizationScore >= 80
                ? 'text-semantic-success'
                : personalizationScore >= 60
                ? 'text-semantic-warning'
                : 'text-semantic-danger'
            }`}
          >
            {personalizationScore}%
          </span>
        </div>
      </div>

      {/* Low Score Warning */}
      {personalizationScore < 60 && personalizationScore > 0 && (
        <div className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-semantic-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs text-semantic-warning">
              <strong>Low personalization detected.</strong> Consider adding the contact&apos;s name,
              outlet, or relevant beat topics to improve engagement.
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#1A1A24]">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="px-4 py-2 text-sm font-medium text-white/55 bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!subject || !body}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Pitch
        </button>
      </div>
    </div>
  );
}
