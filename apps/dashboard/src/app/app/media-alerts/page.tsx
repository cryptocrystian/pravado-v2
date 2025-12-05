'use client';

/**
 * Media Alerts Page (Sprint S43)
 * Smart signals and alerting dashboard for media monitoring
 */

import type {
  MediaAlertRule,
  MediaAlertEvent,
  MediaAlertSignalsOverview,
} from '@pravado/types';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertEventList,
  AlertRuleList,
  SignalsOverview,
  AlertEventDetailDrawer,
} from '@/components/media-alerts';
import {
  listAlertRules,
  listAlertEvents,
  getSignalsOverview,
} from '@/lib/mediaAlertsApi';

export default function MediaAlertsPage() {
  // Rules state
  const [rules, setRules] = useState<MediaAlertRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [selectedRule, setSelectedRule] = useState<MediaAlertRule | null>(null);

  // Events state
  const [events, setEvents] = useState<MediaAlertEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MediaAlertEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Signals state
  const [signals, setSignals] = useState<MediaAlertSignalsOverview | null>(null);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);

  // Load rules
  const loadRules = useCallback(async () => {
    setIsLoadingRules(true);
    try {
      const result = await listAlertRules({ limit: 100 });
      setRules(result.rules);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    } finally {
      setIsLoadingRules(false);
    }
  }, []);

  // Load events
  const loadEvents = useCallback(async (ruleId?: string) => {
    setIsLoadingEvents(true);
    try {
      const result = await listAlertEvents({
        ruleId,
        limit: 50,
        sortBy: 'triggered_at',
        sortOrder: 'desc',
      });
      setEvents(result.events);
    } catch (error) {
      console.error('Failed to load alert events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Load signals overview
  const loadSignals = useCallback(async () => {
    setIsLoadingSignals(true);
    try {
      const overview = await getSignalsOverview();
      setSignals(overview);
    } catch (error) {
      console.error('Failed to load signals overview:', error);
    } finally {
      setIsLoadingSignals(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRules();
    loadEvents();
    loadSignals();
  }, [loadRules, loadEvents, loadSignals]);

  // Auto-refresh signals every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSignals();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadSignals]);

  // Handle rule selection
  const handleRuleSelect = (rule: MediaAlertRule) => {
    setSelectedRule(rule);
    loadEvents(rule.id);
  };

  // Handle event click
  const handleEventClick = (event: MediaAlertEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Panel - Alert Rules */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Alert Rules</h2>
          <p className="text-sm text-gray-500 mt-1">Manage monitoring conditions</p>
        </div>
        <AlertRuleList
          rules={rules}
          selectedRule={selectedRule}
          onRuleSelect={handleRuleSelect}
          onRuleChange={loadRules}
          isLoading={isLoadingRules}
        />
      </div>

      {/* Center Panel - Alert Events */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">Media Alerts</h1>
          <p className="text-gray-600 mt-1">
            {selectedRule
              ? `Showing events for "${selectedRule.name}"`
              : 'All alert events from your monitoring rules'}
          </p>
        </div>
        <div className="p-6">
          <AlertEventList
            events={events}
            onEventClick={handleEventClick}
            isLoading={isLoadingEvents}
            onEventsChange={loadEvents}
          />
        </div>
      </div>

      {/* Right Panel - Signals Overview */}
      <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Smart Signals</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time monitoring overview</p>
        </div>
        <SignalsOverview
          signals={signals}
          isLoading={isLoadingSignals}
          onRefresh={loadSignals}
        />
      </div>

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <AlertEventDetailDrawer
          event={selectedEvent}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedEvent(null);
          }}
          onEventChange={loadEvents}
        />
      )}
    </div>
  );
}
