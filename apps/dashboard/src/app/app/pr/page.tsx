/**
 * PR Intelligence - Media Explorer (S6 - Real Implementation)
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import type {
  JournalistWithContext,
  PRList,
} from '@pravado/types';
import { useState, useEffect } from 'react';

export default function PRPage() {
  // State
  const [journalists, setJournalists] = useState<JournalistWithContext[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedJournalists, setSelectedJournalists] = useState<Set<string>>(new Set());

  // Lists state
  const [lists, setLists] = useState<PRList[]>([]);
  const [selectedList, setSelectedList] = useState<PRList | null>(null);
  const [listMembers, setListMembers] = useState<JournalistWithContext[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Fetch journalists
  const fetchJournalists = async (query?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (query) params.set('q', query);
      if (selectedCountry) params.set('country', selectedCountry);
      if (selectedTier) params.set('tier', selectedTier);

      const response = await fetch(
        `http://localhost:4000/api/v1/pr/journalists?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setJournalists(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch journalists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lists
  const fetchLists = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/pr/lists', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setLists(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  // Fetch list members
  const fetchListMembers = async (listId: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/pr/lists/${listId}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setListMembers(data.data.item.members);
      }
    } catch (error) {
      console.error('Failed to fetch list members:', error);
    }
  };

  // Create list
  const createList = async () => {
    if (!newListName.trim()) return;

    try {
      const response = await fetch('http://localhost:4000/api/v1/pr/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newListName,
          description: newListDescription || undefined,
        }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchLists();
        setShowCreateListModal(false);
        setNewListName('');
        setNewListDescription('');
      }
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  // Add selected journalists to list
  const addToList = async () => {
    if (!selectedList || selectedJournalists.size === 0) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/pr/lists/${selectedList.id}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            journalistIds: Array.from(selectedJournalists),
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setSelectedJournalists(new Set());
        await fetchListMembers(selectedList.id);
      }
    } catch (error) {
      console.error('Failed to add to list:', error);
    }
  };

  // Remove member from list
  const removeFromList = async (journalistId: string) => {
    if (!selectedList) return;

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/pr/lists/${selectedList.id}/members`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            journalistIds: [journalistId],
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        await fetchListMembers(selectedList.id);
      }
    } catch (error) {
      console.error('Failed to remove from list:', error);
    }
  };

  // Toggle journalist selection
  const toggleJournalistSelection = (journalistId: string) => {
    const newSelected = new Set(selectedJournalists);
    if (newSelected.has(journalistId)) {
      newSelected.delete(journalistId);
    } else {
      newSelected.add(journalistId);
    }
    setSelectedJournalists(newSelected);
  };

  // Initial fetch
  useEffect(() => {
    fetchJournalists();
    fetchLists();
  }, []);

  // Update on filter change
  useEffect(() => {
    fetchJournalists(searchQuery);
  }, [selectedCountry, selectedTier]);

  // Fetch list members when list is selected
  useEffect(() => {
    if (selectedList) {
      fetchListMembers(selectedList.id);
    }
  }, [selectedList]);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-page min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white-0 mb-2">Media Explorer</h1>
        <p className="text-muted">
          Curated media intelligence for targeted outreach — not spray & pray
        </p>
      </div>

      {/* Main Layout: Explorer (left) + Lists (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Explorer (Left 2/3) */}
        <div className="lg:col-span-2">
          <div className="panel-card">
            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchJournalists(searchQuery);
                  }}
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Search journalists by name, email, or bio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Search
                  </button>
                </form>

                {/* Filters */}
                <div className="flex space-x-4">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Countries</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>

                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Tiers</option>
                    <option value="top_tier">Top Tier</option>
                    <option value="trade">Trade</option>
                    <option value="niche">Niche</option>
                  </select>
                </div>
              </div>

              {/* Add to List Button */}
              {selectedJournalists.size > 0 && selectedList && (
                <div className="mb-4 p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-md flex items-center justify-between">
                  <span className="text-sm text-brand-cyan">
                    {selectedJournalists.size} journalist(s) selected
                  </span>
                  <button
                    onClick={addToList}
                    className="btn-primary text-sm"
                  >
                    Add to &quot;{selectedList.name}&quot;
                  </button>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className="text-center py-12 text-muted">Loading journalists...</div>
              ) : journalists.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted mb-4">
                    Found {total} journalist{total !== 1 ? 's' : ''}
                  </div>
                  {journalists.map((item) => (
                    <div
                      key={item.journalist.id}
                      className={`p-4 border rounded-md hover:bg-slate-3 ${
                        selectedJournalists.has(item.journalist.id)
                          ? 'border-brand-cyan bg-brand-cyan/10'
                          : 'border-border-subtle'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedJournalists.has(item.journalist.id)}
                          onChange={() => toggleJournalistSelection(item.journalist.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-white-0">
                                {item.journalist.fullName}
                                {item.journalist.isFreelancer && (
                                  <span className="ml-2 px-2 py-0.5 bg-brand-iris/10 text-brand-iris text-xs rounded">
                                    Freelancer
                                  </span>
                                )}
                              </h3>
                              {item.outlet && (
                                <p className="text-sm text-muted mt-0.5">
                                  {item.outlet.name}
                                  {item.outlet.tier && (
                                    <span className="ml-2 text-xs text-slate-6">
                                      ({item.outlet.tier})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            {item.journalist.location && (
                              <span className="text-xs text-slate-6">
                                {item.journalist.location}
                              </span>
                            )}
                          </div>

                          {item.beats.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.beats.map((beat) => (
                                <span
                                  key={beat.id}
                                  className="px-2 py-0.5 bg-slate-3 text-muted text-xs rounded"
                                >
                                  {beat.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.journalist.email && (
                            <p className="text-sm text-slate-6 mt-2">
                              {item.journalist.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted">
                  No journalists found. Try adjusting your search or filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lists Panel (Right 1/3) */}
        <div className="lg:col-span-1">
          <div className="panel-card sticky top-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white-0">Lists</h2>
                <button
                  onClick={() => setShowCreateListModal(true)}
                  className="btn-primary text-sm"
                >
                  Create List
                </button>
              </div>

              {/* Lists */}
              {lists.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedList?.id === list.id
                          ? 'bg-brand-cyan/10 border-2 border-brand-cyan'
                          : 'bg-slate-3 border-2 border-transparent hover:border-slate-5'
                      }`}
                    >
                      <div className="font-medium text-white-0 text-sm">{list.name}</div>
                      {list.description && (
                        <div className="text-xs text-muted mt-0.5">{list.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted text-sm">
                  No lists yet. Create one to get started.
                </div>
              )}

              {/* List Members */}
              {selectedList && (
                <div className="border-t border-border-subtle pt-4">
                  <h3 className="font-semibold text-white-0 mb-3">
                    {selectedList.name} ({listMembers.length})
                  </h3>
                  {listMembers.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {listMembers.map((member) => (
                        <div
                          key={member.journalist.id}
                          className="p-2 bg-slate-3 rounded-md text-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white-0 truncate">
                                {member.journalist.fullName}
                              </div>
                              {member.outlet && (
                                <div className="text-xs text-muted truncate">
                                  {member.outlet.name}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromList(member.journalist.id)}
                              className="ml-2 text-semantic-danger hover:text-semantic-danger/80 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted text-sm">
                      No members yet. Select journalists and add them to this list.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50">
          <div className="panel-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white-0 mb-4">Create New List</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white-0 mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Tech Journalists"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white-0 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list..."
                  rows={3}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateListModal(false);
                  setNewListName('');
                  setNewListDescription('');
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createList}
                disabled={!newListName.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
