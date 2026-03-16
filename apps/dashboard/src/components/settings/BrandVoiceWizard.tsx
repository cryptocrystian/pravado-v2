'use client';

import { useState } from 'react';
import { Check, X, Upload } from '@phosphor-icons/react';
import { mockBrandVoice } from '@/components/content/content-mock-data';
import type { BrandVoice } from '@/components/content/content-mock-data';

type WizardStep = 1 | 2 | 3 | 4;

interface BrandVoiceWizardProps {
  onSave: (voice: BrandVoice) => void;
  onCancel: () => void;
}

export function BrandVoiceWizard({ onSave, onCancel }: BrandVoiceWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [voiceName, setVoiceName] = useState('');
  const [sampleText, setSampleText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);

  function handleAnalyze() {
    // Simulate analysis delay
    setAnalyzed(true);
    setStep(3);
  }

  function handleConfirm() {
    setStep(4);
  }

  function handleSave() {
    onSave({
      ...mockBrandVoice,
      id: `voice-${Date.now()}`,
      name: voiceName || 'New Voice',
    });
  }

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 mt-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                s < step
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : s === step
                    ? 'bg-cc-cyan text-cc-page'
                    : 'bg-white/5 text-white/45'
              }`}
            >
              {s < step ? <Check size={14} weight="bold" /> : s}
            </div>
            {s < 4 && <div className={`w-8 h-px ${s < step ? 'bg-emerald-500/30' : 'bg-white/8'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div>
          <h4 className="text-base font-semibold text-white mb-1">Name your voice</h4>
          <p className="text-xs text-white/45 mb-4">
            You can have multiple voices for different content types
          </p>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder='e.g. "Default Voice", "Executive Voice", "Technical Blog"'
            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors mb-4"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!voiceName.trim()}
              className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-white/45 hover:text-white/70 px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Samples */}
      {step === 2 && (
        <div>
          <h4 className="text-base font-semibold text-white mb-1">Upload writing samples</h4>
          <p className="text-xs text-white/45 mb-4">
            Use 3\u20135 examples of your best content for most accurate calibration
          </p>

          <textarea
            rows={6}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Paste sample content (minimum 500 words recommended)"
            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors resize-none mb-3"
          />

          <div className="border border-dashed border-white/[0.16] rounded-xl p-6 text-center mb-4">
            <Upload size={24} className="text-white/45 mx-auto mb-2" />
            <p className="text-sm text-white/45">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-white/30 mt-1">Accepts .txt, .docx</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
            >
              Analyze Voice
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-white/45 hover:text-white/70 px-4 py-2 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Detected Traits */}
      {step === 3 && analyzed && (
        <div>
          <h4 className="text-base font-semibold text-white mb-4">Detected voice traits</h4>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xs text-white/45 w-28 flex-shrink-0 pt-0.5">Tone</span>
              <span className="text-sm text-white">{mockBrandVoice.tone}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-white/45 w-28 flex-shrink-0 pt-0.5">Sentence length</span>
              <span className="text-sm text-white">{mockBrandVoice.sentenceLength}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-white/45 w-28 flex-shrink-0 pt-0.5">Vocabulary</span>
              <span className="text-sm text-white">{mockBrandVoice.vocabularyLevel}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-white/45 w-28 flex-shrink-0 pt-0.5">Perspective</span>
              <span className="text-sm text-white">{mockBrandVoice.perspective}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-white/45 w-28 flex-shrink-0 pt-0.5">Key phrases</span>
              <div className="flex flex-wrap gap-1.5">
                {mockBrandVoice.keyPhrases.map((phrase) => (
                  <span
                    key={phrase}
                    className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
            >
              These look right
            </button>
            <button
              type="button"
              className="text-sm text-white/45 hover:text-white/70 px-4 py-2 transition-colors"
            >
              Adjust manually
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Save */}
      {step === 4 && (
        <div>
          <h4 className="text-base font-semibold text-white mb-1">Confirm &amp; save</h4>
          <p className="text-xs text-white/45 mb-4">
            Review your brand voice before saving
          </p>

          <div className="bg-cc-page border border-white/8 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-white mb-2">{voiceName}</p>
            <p className="text-xs text-white/70">
              {mockBrandVoice.tone} &middot; {mockBrandVoice.sentenceLength} &middot;{' '}
              {mockBrandVoice.perspective}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {mockBrandVoice.keyPhrases.map((phrase) => (
                <span
                  key={phrase}
                  className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
            >
              Save Brand Voice
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-sm text-white/45 hover:text-white/70 px-4 py-2 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Voice Card (for showing saved voices) ---

interface VoiceCardProps {
  voice: BrandVoice;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function VoiceCard({ voice, onEdit, onDelete }: VoiceCardProps) {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <h4 className="text-base font-semibold text-white mb-1">{voice.name}</h4>
        <p className="text-xs text-white/70 mb-2">
          {voice.tone} &middot; {voice.sentenceLength}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {voice.keyPhrases.map((phrase) => (
            <span
              key={phrase}
              className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full"
            >
              {phrase}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-white/45 hover:text-white/70 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-500/70 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
