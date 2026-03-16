'use client';

/**
 * Journalist CRM — /app/pr/journalists
 * Split-pane: 360px journalist list | flex profile detail.
 */

export const dynamic = 'force-dynamic';

import { MagnifyingGlass, ArrowClockwise } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

import { JournalistListItem } from '@/components/pr/JournalistListItem';
import { JournalistProfile } from '@/components/pr/JournalistProfile';
import { mockJournalists, mockSageJournalists } from '@/components/pr/pr-mock-data';
import type { Journalist } from '@/components/pr/pr-mock-data';
import { SageJournalistCard } from '@/components/pr/SageJournalistCard';
import { fetchJournalists, adaptProfileToJournalist } from '@/lib/prApi';

type ListTab = 'all' | 'contacts' | 'sage' | 'pitched';

export default function JournalistsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ListTab>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Journalist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchJournalists({ limit: 50 });
        if (!cancelled) {
          const mapped = data.profiles.map(adaptProfileToJournalist);
          // Fall back to mock contacts until journalist import is complete
          const resolved = mapped.length > 0 ? mapped : mockJournalists;
          setContacts(resolved);
          setSelectedId(resolved[0].id);
        }
      } catch {
        if (!cancelled) {
          // API unavailable — surface stays functional with mock data
          const resolved = mockJournalists;
          setContacts(resolved);
          setSelectedId(resolved[0]?.id ?? null);
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const selectedJournalist =
    [...contacts, ...mockSageJournalists].find((j) => j.id === selectedId) ?? contacts[0] ?? null;

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.publication.toLowerCase().includes(q) ||
        j.beats.some((b) => b.toLowerCase().includes(q)),
    );
  }, [contacts, search]);

  // "Pitched" = journalists who have been pitched (first 4 from live data)
  const pitchedIds = useMemo(
    () => new Set(contacts.slice(0, 4).map((c) => c.id)),
    [contacts],
  );

  function getVisibleJournalists(): Journalist[] {
    switch (activeTab) {
      case 'contacts':
        return filteredContacts;
      case 'sage':
        return []; // SAGE tab shows SageJournalistCards instead
      case 'pitched':
        return filteredContacts.filter((j) => pitchedIds.has(j.id));
      default:
        return filteredContacts;
    }
  }

  function handleAddSageJournalist(journalist: Journalist) {
    if (!contacts.find((j) => j.id === journalist.id)) {
      setContacts((prev) => [...prev, journalist]);
    }
  }

  function handleRetry() {
    setError(null);
    setIsLoading(true);
    fetchJournalists({ limit: 50 })
      .then((data) => {
        const mapped = data.profiles.map(adaptProfileToJournalist);
        const resolved = mapped.length > 0 ? mapped : mockJournalists;
        setContacts(resolved);
        setSelectedId(resolved[0]?.id ?? null);
      })
      .catch(() => {
        // API unavailable — fall back to mock data so the surface stays functional
        setContacts(mockJournalists);
        setSelectedId(mockJournalists[0]?.id ?? null);
        setError(null);
      })
      .finally(() => setIsLoading(false));
  }

  const tabs: { id: ListTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'contacts', label: 'My Contacts' },
    { id: 'sage', label: 'SAGE Suggested' },
    { id: 'pitched', label: 'Pitched' },
  ];

  return (
    <div className="flex h-[calc(100vh-49px)] overflow-hidden">
      {/* ── Left Panel: Journalist List (360px) ──────── */}
      <div className="w-[360px] flex-shrink-0 border-r border-white/8 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Journalists</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="bg-brand-magenta text-white rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-brand-magenta/90 shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-colors"
              >
                +Add
              </button>
              <button
                type="button"
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
              >
                Import
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/journalists/enrich', { method: 'POST' });
                    const json = await res.json();
                    if (json.success) {
                      handleRetry(); // Reload to show enriched data
                    }
                  } catch { /* ignore */ }
                }}
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
                title="Enrich all journalists with Hunter.io data"
              >
                Enrich All
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <MagnifyingGlass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search journalists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-3 border border-slate-4 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-magenta/30 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm pb-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b border-brand-magenta'
                    : 'text-white/45 hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className={`flex-1 overflow-y-auto${isLoading ? ' opacity-50' : ''}`}>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-red-400 mb-3">Could not load contacts. Please try again.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-sm text-brand-magenta hover:text-brand-magenta/80 transition-colors"
              >
                <ArrowClockwise size={14} />
                Retry
              </button>
            </div>
          ) : !isLoading && contacts.length === 0 && activeTab !== 'sage' ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-white/45">
                No contacts yet. Add your first journalist to get started.
              </p>
            </div>
          ) : activeTab === 'sage' ? (
            /* SAGE Suggested — stays on mock data */
            mockSageJournalists.map((j) => (
              <SageJournalistCard
                key={j.id}
                journalist={j}
                onAdd={() => handleAddSageJournalist(j)}
              />
            ))
          ) : (
            /* Regular list */
            getVisibleJournalists().map((j) => (
              <JournalistListItem
                key={j.id}
                journalist={j}
                isActive={j.id === selectedId}
                onClick={() => setSelectedId(j.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Profile ──────────────────────── */}
      <div className="flex-1 min-w-0 bg-cc-page">
        {selectedJournalist ? (
          <JournalistProfile
            journalist={selectedJournalist}
            onNewPitch={() => router.push('/app/pr/pitches/new')}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/45 text-sm">
              Select a journalist to view their profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
