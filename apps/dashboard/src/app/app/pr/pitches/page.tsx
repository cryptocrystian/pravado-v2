'use client';

/**
 * PR Pitches Page (Sprint S100.1)
 * Main workspace for managing PR pitch sequences and outreach
 *
 * S100.1: ALL API calls go through internal /api/pr/* routes only
 */

import type {
  CreatePRPitchSequenceInput,
  PRPitchContactWithJournalist,
  PRPitchSequenceWithSteps,
} from '@pravado/types';
import { useCallback, useEffect, useState } from 'react';

import {
  ContactTable,
  PitchPreviewDrawer,
  SequenceEditor,
  SequenceList,
} from '@/components/pr-pitch';
import {
  attachContactsToSequence,
  createPitchSequence,
  getPitchSequence,
  listPitchSequences,
  listSequenceContacts,
  queuePitchForContact,
  updatePitchSequence,
} from '@/lib/prPitchApi';

type ViewMode = 'editor' | 'contacts';

export default function PRPitchesPage() {
  // State
  const [sequences, setSequences] = useState<PRPitchSequenceWithSteps[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<PRPitchSequenceWithSteps | null>(null);
  const [contacts, setContacts] = useState<PRPitchContactWithJournalist[]>([]);
  const [pressReleases, setPressReleases] = useState<{ id: string; headline: string }[]>([]);

  const [isLoadingSequences, setIsLoadingSequences] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [isCreating, setIsCreating] = useState(false);

  // Preview drawer state
  const [previewContact, setPreviewContact] = useState<PRPitchContactWithJournalist | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Journalist search for adding contacts
  const [journalistSearch, setJournalistSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedJournalists, setSelectedJournalists] = useState<string[]>([]);

  // Load sequences on mount
  useEffect(() => {
    loadSequences();
    loadPressReleases();
  }, []);

  const loadSequences = async () => {
    setIsLoadingSequences(true);
    try {
      const result = await listPitchSequences({ limit: 50 });
      // Load full sequence details for each
      const fullSequences = await Promise.all(
        result.sequences.map((s) => getPitchSequence(s.id))
      );
      setSequences(fullSequences);
    } catch (err) {
      console.error('Failed to load sequences:', err);
    } finally {
      setIsLoadingSequences(false);
    }
  };

  const loadPressReleases = async () => {
    // S100.1: Fetch press releases via internal route handler
    try {
      const response = await fetch('/api/pr/releases?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.releases) {
          setPressReleases(
            data.releases.map((r: { id: string; headline: string }) => ({
              id: r.id,
              headline: r.headline || 'Untitled',
            }))
          );
        }
      }
    } catch {
      // Ignore errors, press releases are optional
    }
  };

  const loadContacts = useCallback(async (sequenceId: string) => {
    setIsLoadingContacts(true);
    try {
      const result = await listSequenceContacts(sequenceId, { limit: 100 });
      setContacts(result.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const handleSelectSequence = async (id: string) => {
    const sequence = sequences.find((s) => s.id === id);
    if (sequence) {
      setSelectedSequence(sequence);
      setIsCreating(false);
      await loadContacts(id);
    }
  };

  const handleCreateNew = () => {
    setSelectedSequence(null);
    setIsCreating(true);
    setContacts([]);
    setViewMode('editor');
  };

  const handleSave = async (input: CreatePRPitchSequenceInput) => {
    setIsSaving(true);
    try {
      const newSequence = await createPitchSequence(input);
      setSequences([newSequence, ...sequences]);
      setSelectedSequence(newSequence);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create sequence:', err);
      alert('Failed to create sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string, input: Partial<CreatePRPitchSequenceInput>) => {
    setIsSaving(true);
    try {
      const updated = await updatePitchSequence(id, input);
      setSequences(sequences.map((s) => (s.id === id ? updated : s)));
      setSelectedSequence(updated);
    } catch (err) {
      console.error('Failed to update sequence:', err);
      alert('Failed to update sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = (contact: PRPitchContactWithJournalist) => {
    setPreviewContact(contact);
    setIsPreviewOpen(true);
  };

  const handleQueue = async (contactId: string) => {
    try {
      await queuePitchForContact(contactId);
      if (selectedSequence) {
        await loadContacts(selectedSequence.id);
      }
    } catch (err) {
      console.error('Failed to queue pitch:', err);
      alert('Failed to queue pitch');
    }
  };

  const handleAddContacts = async () => {
    if (!selectedSequence || selectedJournalists.length === 0) return;

    try {
      await attachContactsToSequence(selectedSequence.id, selectedJournalists);
      await loadContacts(selectedSequence.id);
      setSelectedJournalists([]);
      setJournalistSearch('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to add contacts:', err);
      alert('Failed to add contacts');
    }
  };

  const searchJournalists = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // S100.1: Search journalists via internal route handler
    try {
      const response = await fetch(
        `/api/pr/journalists?q=${encodeURIComponent(query)}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.profiles) {
          setSearchResults(
            data.profiles.map((j: { id: string; fullName: string; primaryEmail: string }) => ({
              id: j.id,
              name: j.fullName,
              email: j.primaryEmail || '',
            }))
          );
        }
      }
    } catch {
      // Ignore search errors
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Sequence List */}
      <SequenceList
        sequences={sequences}
        selectedId={selectedSequence?.id || null}
        onSelect={handleSelectSequence}
        onCreateNew={handleCreateNew}
        isLoading={isLoadingSequences}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isCreating
                  ? 'New Pitch Sequence'
                  : selectedSequence?.name || 'PR Pitch Sequences'}
              </h1>
              {selectedSequence && (
                <p className="text-sm text-gray-500">
                  {selectedSequence.steps.length} step{selectedSequence.steps.length !== 1 ? 's' : ''} |
                  {selectedSequence.stats?.totalContacts || 0} contacts
                </p>
              )}
            </div>

            {selectedSequence && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('editor')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    viewMode === 'editor'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('contacts')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    viewMode === 'contacts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Contacts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selectedSequence && !isCreating ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg">Select a sequence or create a new one</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create New Sequence
                </button>
              </div>
            </div>
          ) : viewMode === 'editor' || isCreating ? (
            <SequenceEditor
              sequence={isCreating ? null : selectedSequence}
              pressReleases={pressReleases}
              onSave={handleSave}
              onUpdate={handleUpdate}
              isSaving={isSaving}
            />
          ) : (
            <div className="p-6">
              {/* Add Contacts Section */}
              <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Add Journalists</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={journalistSearch}
                      onChange={(e) => {
                        setJournalistSearch(e.target.value);
                        searchJournalists(e.target.value);
                      }}
                      placeholder="Search by name or email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                        {searchResults.map((j) => (
                          <button
                            key={j.id}
                            onClick={() => {
                              if (!selectedJournalists.includes(j.id)) {
                                setSelectedJournalists([...selectedJournalists, j.id]);
                              }
                              setJournalistSearch('');
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          >
                            <p className="text-sm font-medium text-gray-900">{j.name}</p>
                            <p className="text-xs text-gray-500">{j.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddContacts}
                    disabled={selectedJournalists.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add ({selectedJournalists.length})
                  </button>
                </div>
                {selectedJournalists.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedJournalists.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {id.substring(0, 8)}...
                        <button
                          onClick={() =>
                            setSelectedJournalists(selectedJournalists.filter((jId) => jId !== id))
                          }
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contacts Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <ContactTable
                  contacts={contacts}
                  isLoading={isLoadingContacts}
                  onPreview={handlePreview}
                  onQueue={handleQueue}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Sidebar (Right) */}
      {selectedSequence && selectedSequence.stats && (
        <div className="w-64 border-l border-gray-200 bg-white p-4 hidden lg:block">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Sequence Stats</h3>

          <div className="space-y-4">
            <StatItem label="Total Contacts" value={selectedSequence.stats.totalContacts} />
            <StatItem
              label="Queued"
              value={selectedSequence.stats.queuedCount}
              color="text-gray-600"
            />
            <StatItem
              label="Sent"
              value={selectedSequence.stats.sentCount}
              color="text-green-600"
            />
            <StatItem
              label="Opened"
              value={selectedSequence.stats.openedCount}
              color="text-purple-600"
            />
            <StatItem
              label="Replied"
              value={selectedSequence.stats.repliedCount}
              color="text-emerald-600"
            />
            <StatItem
              label="Bounced"
              value={selectedSequence.stats.bouncedCount}
              color="text-orange-600"
            />
            <StatItem
              label="Failed"
              value={selectedSequence.stats.failedCount}
              color="text-red-600"
            />
          </div>

          {/* Open Rate */}
          {selectedSequence.stats.sentCount > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700">Open Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (selectedSequence.stats.openedCount / selectedSequence.stats.sentCount) * 100
                )}
                %
              </p>
            </div>
          )}

          {/* Reply Rate */}
          {selectedSequence.stats.sentCount > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Reply Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Math.round(
                  (selectedSequence.stats.repliedCount / selectedSequence.stats.sentCount) * 100
                )}
                %
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Drawer */}
      <PitchPreviewDrawer
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        contact={previewContact}
        sequenceId={selectedSequence?.id || ''}
        onQueued={() => {
          if (selectedSequence) {
            loadContacts(selectedSequence.id);
          }
        }}
      />
    </div>
  );
}

function StatItem({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}
