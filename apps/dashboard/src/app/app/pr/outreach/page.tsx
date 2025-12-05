'use client';

/**
 * PR Outreach Dashboard (Sprint S44)
 * Main page for managing journalist outreach sequences and runs
 */

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
      <div>
        <h1 className="text-3xl font-bold">Journalist Outreach</h1>
        <p className="text-gray-600 mt-1">
          Automated email sequences and campaign management
        </p>
      </div>

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
