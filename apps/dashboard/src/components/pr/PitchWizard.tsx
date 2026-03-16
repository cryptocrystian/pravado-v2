'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lightning,
  CheckCircle,
  Warning,
  ArrowLeft,
  ArrowRight,
  Copy,
  FloppyDisk,
  Trash,
  CircleNotch,
} from '@phosphor-icons/react';
import type { Journalist, ContentPiece } from './pr-mock-data';
import {
  mockJournalists,
  mockContentPieces,
  mockPitchBody,
  mockPitchSubject,
  sageReasoningPoints,
  wizardLoadingMessages,
} from './pr-mock-data';

type AngleType = 'content' | 'announcement' | 'expert' | 'custom';

interface PitchWizardProps {
  preselectedJournalist?: Journalist;
}

export function PitchWizard({ preselectedJournalist }: PitchWizardProps) {
  const [step, setStep] = useState(1);
  const [angle, setAngle] = useState<AngleType>('content');
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null);
  const [selectedJournalist, setSelectedJournalist] = useState<Journalist | null>(
    preselectedJournalist ?? null,
  );
  const [journalistSearch, setJournalistSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const router = useRouter();

  // Step 3: loading simulation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsg((i) => (i + 1) % wizardLoadingMessages.length);
    }, 500);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setSubject(mockPitchSubject);
      // Replace [Your name] placeholder with a resolved sender name
      // In production this would come from the user's profile
      setBody(mockPitchBody.replace('[Your name]', 'Your Name'));
    }, 1500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading]);

  // SAGE top 3 recommended IDs set — used to deduplicate the full list
  const sageRecommendedIds = new Set(
    mockJournalists.filter((j) => j.aiCitation === 'high').slice(0, 3).map((j) => j.id),
  );

  const filteredJournalists = journalistSearch
    ? mockJournalists.filter(
        (j) =>
          j.name.toLowerCase().includes(journalistSearch.toLowerCase()) ||
          j.publication.toLowerCase().includes(journalistSearch.toLowerCase()),
      )
    // When not searching, exclude SAGE-recommended from the full list (they appear above)
    : mockJournalists.filter((j) => !sageRecommendedIds.has(j.id));

  // SAGE top 3 recommended
  const sageRecommended = mockJournalists
    .filter((j) => j.aiCitation === 'high')
    .slice(0, 3);

  // Save draft handler
  const handleSaveDraft = useCallback(() => {
    setSavedDraft(true);
    setTimeout(() => {
      router.push('/app/pr/pitches');
    }, 1200);
  }, [router]);

  function goToStep(s: number) {
    if (s === 3 && !isLoading && !subject) {
      setIsLoading(true);
      setLoadingMsg(0);
    }
    setStep(s);
  }

  const stepLabels = ['Angle', 'Journalist', 'Generate', 'Review', 'Confirm'];

  return (
    <div className="max-w-[800px] mx-auto">
      {/* ── Step Indicators ───────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const isCurrent = step === num;
          const isDone = step > num;
          return (
            <div key={num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isCurrent
                      ? 'bg-cc-cyan text-cc-page'
                      : isDone
                        ? 'bg-cc-cyan/20 text-cc-cyan'
                        : 'bg-white/5 text-white/30'
                  }`}
                >
                  {isDone ? <CheckCircle size={14} weight="fill" /> : num}
                </div>
                <span
                  className={`text-xs ${
                    isCurrent ? 'text-white font-medium' : 'text-white/30'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-8 h-px ${isDone ? 'bg-cc-cyan/30' : 'bg-white/8'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Choose Angle ──────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Choose your angle</h2>
          <div className="space-y-2 mb-6">
            {([
              { value: 'content', label: 'A specific piece of content (article, study, guide)' },
              { value: 'announcement', label: 'A product announcement or news' },
              { value: 'expert', label: 'An expert source / thought leader' },
              { value: 'custom', label: 'A custom story angle' },
            ] as { value: AngleType; label: string }[]).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  angle === opt.value
                    ? 'border-cc-cyan bg-cc-cyan/5'
                    : 'border-white/8 hover:border-white/16'
                }`}
              >
                <input
                  type="radio"
                  name="angle"
                  value={opt.value}
                  checked={angle === opt.value}
                  onChange={() => setAngle(opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    angle === opt.value ? 'border-cc-cyan' : 'border-white/30'
                  }`}
                >
                  {angle === opt.value && <div className="w-2 h-2 rounded-full bg-cc-cyan" />}
                </div>
                <span className="text-sm text-white/90">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Content picker */}
          {angle === 'content' && (
            <div className="mb-6">
              <label className="text-xs text-white/45 block mb-2">
                Which content piece are you pitching?
              </label>
              <div className="space-y-1.5">
                {mockContentPieces.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setSelectedContent(cp)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                      selectedContent?.id === cp.id
                        ? 'border-cc-cyan bg-cc-cyan/5'
                        : 'border-white/8 hover:border-white/16'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{cp.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">CiteMind: {cp.citeMindScore}</span>
                        <span className="text-xs text-cc-cyan">SAGE: {cp.sageMatchScore}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => goToStep(preselectedJournalist ? 3 : 2)}
            className="flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── Step 2: Select Journalist ─────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Select journalist</h2>

          <input
            type="text"
            placeholder="Search journalists..."
            value={journalistSearch}
            onChange={(e) => setJournalistSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30 mb-4"
          />

          {/* SAGE recommended */}
          {!journalistSearch && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightning size={14} className="text-cc-cyan" />
                <span className="text-xs font-semibold text-cc-cyan uppercase tracking-wider">
                  SAGE recommends
                </span>
              </div>
              <div className="space-y-1.5">
                {sageRecommended.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setSelectedJournalist(j)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      selectedJournalist?.id === j.id
                        ? 'border-cc-cyan bg-cc-cyan/5'
                        : 'border-white/8 hover:border-white/16'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-xs text-white/70">{j.initials}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-white">{j.name}</span>
                      <span className="text-xs text-white/45 ml-1.5">{j.publication}</span>
                    </div>
                    <span className="text-xs text-cc-cyan">Recommended</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All journalists */}
          <div className="space-y-1.5 mb-6">
            {filteredJournalists.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setSelectedJournalist(j)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                  selectedJournalist?.id === j.id
                    ? 'border-cc-cyan bg-cc-cyan/5'
                    : 'border-white/8 hover:border-white/16'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xs text-white/70">{j.initials}</span>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-white">{j.name}</span>
                  <span className="text-xs text-white/45 ml-1.5">{j.publication}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              disabled={!selectedJournalist}
              className="flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: AI Generates Pitch ────────────────── */}
      {step === 3 && (
        <div>
          {isLoading ? (
            <div className="text-center py-20">
              <CircleNotch size={32} className="text-cc-cyan animate-spin mx-auto mb-4" />
              <p className="text-sm text-white/70 animate-pulse">
                {wizardLoadingMessages[loadingMsg]}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-4">Edit your pitch</h2>

              {/* Subject */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-white/45">Subject line</label>
                  <button type="button" className="text-xs text-cc-cyan">Regenerate</button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cc-cyan/30"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-white/45">Pitch body</label>
                  <button type="button" className="text-xs text-cc-cyan">Regenerate body</button>
                </div>
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cc-cyan/30 resize-none"
                />
              </div>

              {/* SAGE Reasoning */}
              <div className="bg-cc-cyan/5 border border-cc-cyan/20 rounded-2xl p-4 mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-cc-cyan block mb-2">
                  SAGE Reasoning
                </span>
                <div className="space-y-1.5">
                  {sageReasoningPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {point.type === 'success' ? (
                        <CheckCircle size={14} className="text-semantic-success mt-0.5 flex-shrink-0" weight="fill" />
                      ) : (
                        <Warning size={14} className="text-amber-500 mt-0.5 flex-shrink-0" weight="fill" />
                      )}
                      <span className="text-sm text-white/70">{point.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
                >
                  Review <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 4: Review & Finalize ─────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Review &amp; finalize</h2>

          <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/45">
                To: {selectedJournalist?.name} ({selectedJournalist?.email})
              </span>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-cc-cyan"
              >
                Edit
              </button>
            </div>
            <h3 className="text-sm font-semibold text-white mb-3">{subject}</h3>
            <p className="text-sm text-white/70 whitespace-pre-line">{body}</p>
          </div>

          {/* Follow-up reminder */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-white/70">Set a follow-up reminder?</span>
            <input
              type="date"
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cc-cyan/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Copy to clipboard + open mailto
                void navigator.clipboard?.writeText(body);
                setStep(5);
              }}
              className="flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
            >
              <Copy size={14} />
              Copy &amp; Open Email
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savedDraft}
              className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors disabled:opacity-60"
            >
              {savedDraft ? (
                <><CheckCircle size={14} className="text-semantic-success" />Saved!</>
              ) : (
                <><FloppyDisk size={14} />Save Draft</>
              )}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash size={14} />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Confirmation ──────────────────────── */}
      {step === 5 && !confirmed && (
        <div className="flex items-center justify-center py-12">
          <div className="bg-cc-surface border border-white/8 rounded-2xl p-6 text-center max-w-[400px]">
            <h3 className="text-lg font-semibold text-white mb-2">Mark as sent?</h3>
            <p className="text-sm text-white/70 mb-5">
              Confirm you&apos;ve sent this pitch to {selectedJournalist?.name} to log it in your pitch tracker.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="bg-cc-cyan text-cc-page rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
              >
                Yes, mark as sent
              </button>
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="text-sm text-white/45 hover:text-white transition-colors"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 5 && confirmed && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle size={48} className="text-semantic-success mx-auto mb-3" weight="fill" />
            <h3 className="text-lg font-semibold text-white mb-1">Pitch logged</h3>
            <p className="text-sm text-white/70">
              Your pitch to {selectedJournalist?.name} has been moved to Sent / Tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
