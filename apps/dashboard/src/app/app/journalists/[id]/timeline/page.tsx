'use client';

/**
 * Journalist Relationship Timeline Page (Sprint S49)
 * Displays comprehensive timeline of all journalist interactions
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type {
  JournalistTimelineEvent,
  TimelineQuery,
  TimelineStats,
  RelationshipHealthScore,
  JournalistNarrative,
  CreateManualNoteInput,
} from '@pravado/types';
import { TimelineEvent } from '@/components/journalist-timeline/TimelineEvent';
import { TimelineFilters } from '@/components/journalist-timeline/TimelineFilters';
import { EventDrawer } from '@/components/journalist-timeline/EventDrawer';
import { HealthScoreBadge } from '@/components/journalist-timeline/HealthScoreBadge';
import { NarrativePanel } from '@/components/journalist-timeline/NarrativePanel';
import { AddNoteModal } from '@/components/journalist-timeline/AddNoteModal';
import * as timelineApi from '@/lib/journalistTimelineApi';

export default function JournalistTimelinePage() {
  const params = useParams();
  const journalistId = params?.id as string;

  // State
  const [events, setEvents] = useState<JournalistTimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<JournalistTimelineEvent | null>(null);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [healthScore, setHealthScore] = useState<RelationshipHealthScore | null>(null);
  const [narrative, setNarrative] = useState<JournalistNarrative | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNarrativeLoading, setIsNarrativeLoading] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Load timeline data
  const loadTimeline = async (filters?: TimelineQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      const query: TimelineQuery = {
        journalistId,
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters,
      };

      const response = await timelineApi.listEvents(query);
      setEvents(response.events);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  // Load health score
  const loadHealthScore = async () => {
    try {
      const score = await timelineApi.calculateHealthScore(journalistId);
      setHealthScore(score);
    } catch (err: any) {
      console.error('Failed to load health score:', err);
    }
  };

  // Generate narrative
  const generateNarrative = async (timeframe?: 'last_30_days' | 'last_90_days' | 'all_time') => {
    setIsNarrativeLoading(true);
    try {
      const narrativeData = await timelineApi.generateNarrative({
        journalistId,
        timeframe: timeframe || 'all_time',
        includeRecommendations: true,
      });
      setNarrative(narrativeData);
    } catch (err: any) {
      console.error('Failed to generate narrative:', err);
      setError('Failed to generate narrative');
    } finally {
      setIsNarrativeLoading(false);
    }
  };

  // Handle event selection
  const handleEventSelect = (event: JournalistTimelineEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  // Handle event deletion
  const handleEventDelete = async (eventId: string) => {
    try {
      await timelineApi.deleteEvent(eventId);
      loadTimeline();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  // Handle filter change
  const handleFilterChange = (filters: TimelineQuery) => {
    setPagination({ ...pagination, offset: 0 });
    loadTimeline(filters);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setPagination({ ...pagination, offset: 0 });
    loadTimeline();
  };

  // Handle add note
  const handleAddNote = async (note: CreateManualNoteInput) => {
    await timelineApi.createManualNote(note);
    loadTimeline();
  };

  // Initial load
  useEffect(() => {
    if (journalistId) {
      loadTimeline();
      loadHealthScore();
    }
  }, [journalistId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Journalist Relationship Timeline
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive view of all interactions and signals
            </p>
          </div>

          <div className="flex items-center gap-3">
            {healthScore && (
              <HealthScoreBadge healthScore={healthScore} size="lg" />
            )}
            <button
              onClick={() => setIsAddNoteModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <span>+</span>
              Add Note
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Total Events</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last 30 Days</div>
              <div className="text-2xl font-bold text-gray-900">{stats.recent30Days}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Relevance</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.avgRelevanceScore * 100)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Positive Events</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.sentimentDistribution.positive}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Clusters</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalClusters}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <TimelineFilters
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />

          {/* Quick Actions */}
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <button
              onClick={() => generateNarrative('last_30_days')}
              disabled={isNarrativeLoading}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              📊 Generate 30-day narrative
            </button>
            <button
              onClick={() => generateNarrative('last_90_days')}
              disabled={isNarrativeLoading}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              📊 Generate 90-day narrative
            </button>
            <button
              onClick={() => generateNarrative('all_time')}
              disabled={isNarrativeLoading}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              📊 Generate full narrative
            </button>
            <button
              onClick={() => timelineApi.autoClusterEvents(journalistId).then(() => loadTimeline())}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              🔗 Auto-cluster events
            </button>
          </div>
        </div>

        {/* Main Timeline */}
        <div className="lg:col-span-3 space-y-6">
          {/* Narrative Panel */}
          {narrative && (
            <NarrativePanel
              narrative={narrative}
              isLoading={isNarrativeLoading}
              onRegenerate={() => generateNarrative(narrative.timeframe as any)}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Events List */}
          {!isLoading && events.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No timeline events yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start tracking interactions by adding manual notes or wait for automated events from S38-S48 systems.
              </p>
              <button
                onClick={() => setIsAddNoteModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Add First Note
              </button>
            </div>
          )}

          {!isLoading && events.length > 0 && (
            <div className="space-y-4">
              {events.map((event) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  onSelect={handleEventSelect}
                  isSelected={selectedEvent?.id === event.id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) });
                    loadTimeline();
                  }}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setPagination({ ...pagination, offset: pagination.offset + pagination.limit });
                    loadTimeline();
                  }}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Drawer */}
      <EventDrawer
        event={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEvent(null);
        }}
        onDelete={handleEventDelete}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        journalistId={journalistId}
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        onSubmit={handleAddNote}
      />
    </div>
  );
}
