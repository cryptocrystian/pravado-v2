'use client';

/**
 * PR Outreach Dashboard (Sprint S44, updated S97)
 * Main page for managing journalist outreach sequences and runs
 * S97: Added context preservation from URL params
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { OutreachRun, OutreachSequence, OutreachStats } from '@pravado/types';

import { OutreachRunDetailDrawer } from '@/components/pr-outreach/OutreachRunDetailDrawer';
import { OutreachRunList } from '@/components/pr-outreach/OutreachRunList';
import { OutreachSequenceEditor } from '@/components/pr-outreach/OutreachSequenceEditor';
import { OutreachSequenceList } from '@/components/pr-outreach/OutreachSequenceList';
import {
  getOutreachStats,
  listOutreachRuns,
  listOutreachSequences,
} from '@/lib/prOutreachApi';

// Context info extracted from URL params
interface OutreachContext {
  outlet?: string;
  action?: string;
  context?: string;
  topic?: string;
  journalistId?: string;
  journalistName?: string;
  articleId?: string;
  deadline?: string;
}

export default function PROutreachPage() {
  // Sequences state
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<OutreachSequence | null>(null);
  const [showSequenceEditor, setShowSequenceEditor] = useState(false);
  const [editingSequence, setEditingSequence] = useState<OutreachSequence | null>(null);
  const [sequencesLoading, setSequencesLoading] = useState(false);

  // Runs state
  const [runs, setRuns] = useState<OutreachRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<OutreachRun | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Context state (from URL params)
  const searchParams = useSearchParams();
  const [outreachContext, setOutreachContext] = useState<OutreachContext | null>(null);

  // Extract context from URL params on mount
  useEffect(() => {
    if (!searchParams) return;

    const ctx: OutreachContext = {};
    const outlet = searchParams.get('outlet');
    const action = searchParams.get('action');
    const context = searchParams.get('context');
    const topic = searchParams.get('topic');
    const journalistId = searchParams.get('journalistId');
    const journalistName = searchParams.get('name');
    const articleId = searchParams.get('articleId');
    const deadline = searchParams.get('deadline');

    if (outlet) ctx.outlet = outlet;
    if (action) ctx.action = action;
    if (context) ctx.context = context;
    if (topic) ctx.topic = topic;
    if (journalistId) ctx.journalistId = journalistId;
    if (journalistName) ctx.journalistName = journalistName;
    if (articleId) ctx.articleId = articleId;
    if (deadline) ctx.deadline = deadline;

    if (Object.keys(ctx).length > 0) {
      setOutreachContext(ctx);
      // Auto-open editor when coming with context
      if (ctx.action === 'respond' || ctx.action === 'pitch') {
        setShowSequenceEditor(true);
      }
    }
  }, [searchParams]);

  // Load sequences
  const loadSequences = useCallback(async () => {
    setSequencesLoading(true);
    try {
      const result = await listOutreachSequences({ limit: 50 });
      setSequences(result.sequences);
    } catch (error) {
      console.error('Failed to load sequences:', error);
    } finally {
      setSequencesLoading(false);
    }
  }, []);

  // Load runs
  const loadRuns = useCallback(async (sequenceId?: string) => {
    setRunsLoading(true);
    try {
      const result = await listOutreachRuns({
        sequenceId,
        limit: 50,
      });
      setRuns(result.runs);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setRunsLoading(false);
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getOutreachStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSequences();
    loadRuns();
    loadStats();
  }, [loadSequences, loadRuns, loadStats]);

  // Handle sequence selection
  const handleSequenceSelect = (sequence: OutreachSequence) => {
    setSelectedSequence(sequence);
    loadRuns(sequence.id);
  };

  // Handle sequence change
  const handleSequenceChange = () => {
    loadSequences();
    loadStats();
    setShowSequenceEditor(false);
    setEditingSequence(null);
  };

  // Handle run change
  const handleRunChange = () => {
    loadRuns(selectedSequence?.id);
    loadStats();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/app/pr"
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to PR Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Journalist Outreach</h1>
          <p className="text-gray-600 mt-1">
            Automated email sequences and campaign management
          </p>
        </div>
      </div>

      {/* Context Banner - shows when navigated from signal/recommendation */}
      {outreachContext && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Outreach Context</h3>
              <p className="text-sm text-blue-700 mt-1">
                {outreachContext.action === 'respond' && (
                  <>Responding to inquiry from <strong>{outreachContext.outlet}</strong></>
                )}
                {outreachContext.action === 'pitch' && (
                  <>Creating pitch for <strong>{outreachContext.outlet}</strong> on <strong>{outreachContext.topic?.replace(/-/g, ' ')}</strong></>
                )}
                {outreachContext.action === 'follow-up' && (
                  <>Following up on pending outreach</>
                )}
                {!outreachContext.action && outreachContext.outlet && (
                  <>Targeting <strong>{outreachContext.outlet}</strong></>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {outreachContext.outlet && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Outlet: {outreachContext.outlet}
                  </span>
                )}
                {outreachContext.topic && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Topic: {outreachContext.topic.replace(/-/g, ' ')}
                  </span>
                )}
                {outreachContext.context && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Context: {outreachContext.context}
                  </span>
                )}
                {outreachContext.deadline && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Deadline: {outreachContext.deadline}
                  </span>
                )}
                {outreachContext.journalistName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Journalist: {outreachContext.journalistName}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setOutreachContext(null)}
              className="flex-shrink-0 text-blue-400 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Total Sequences</div>
            <div className="text-2xl font-bold mt-1">{stats.totalSequences}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Active Runs</div>
            <div className="text-2xl font-bold mt-1">{stats.activeRuns}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Emails Sent</div>
            <div className="text-2xl font-bold mt-1">{stats.totalEmailsSent}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Replies</div>
            <div className="text-2xl font-bold mt-1">{stats.totalReplies}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sequences */}
        <div className="lg:col-span-1">
          <OutreachSequenceList
            sequences={sequences}
            selectedSequence={selectedSequence}
            onSequenceSelect={handleSequenceSelect}
            onSequenceChange={handleSequenceChange}
            isLoading={sequencesLoading}
            onNewSequence={() => {
              setEditingSequence(null);
              setShowSequenceEditor(true);
            }}
            onEditSequence={(sequence) => {
              setEditingSequence(sequence);
              setShowSequenceEditor(true);
            }}
          />
        </div>

        {/* Right: Runs */}
        <div className="lg:col-span-2">
          <OutreachRunList
            runs={runs}
            selectedRun={selectedRun}
            onRunSelect={setSelectedRun}
            onRunChange={handleRunChange}
            isLoading={runsLoading}
            sequenceName={selectedSequence?.name}
          />
        </div>
      </div>

      {/* Sequence Editor Modal */}
      {showSequenceEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <OutreachSequenceEditor
            sequence={editingSequence}
            onClose={() => {
              setShowSequenceEditor(false);
              setEditingSequence(null);
            }}
            onSave={handleSequenceChange}
          />
        </div>
      )}

      {/* Run Detail Drawer */}
      {selectedRun && (
        <OutreachRunDetailDrawer
          runId={selectedRun.id}
          onClose={() => setSelectedRun(null)}
          onRunChange={handleRunChange}
        />
      )}
    </div>
  );
}
