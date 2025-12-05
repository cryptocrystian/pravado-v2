/**
 * Brand Reputation Alerts & Executive Reports Dashboard (Sprint S57)
 *
 * Main dashboard page for managing reputation alerts and viewing executive reports.
 */

'use client';

import { useState, useCallback } from 'react';
import type { BrandReputationAlertRule, BrandReputationAlertEvent, BrandReputationReport } from '@pravado/types';
import {
  AlertRulesList,
  AlertEventsTable,
  ReportsList,
  InsightsSummaryCard,
  AlertRuleForm,
} from '@/components/reputation';
import { generateReport } from '@/lib/brandReputationAlertsApi';

type TabType = 'events' | 'rules' | 'reports';

export default function ReputationAlertsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<BrandReputationAlertRule | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BrandReputationAlertEvent | null>(null);
  const [selectedReport, setSelectedReport] = useState<BrandReputationReport | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowCreateRule(true);
  };

  const handleEditRule = (rule: BrandReputationAlertRule) => {
    setEditingRule(rule);
    setShowCreateRule(true);
  };

  const handleRuleSaved = () => {
    setShowCreateRule(false);
    setEditingRule(null);
    refresh();
  };

  const handleCancelEdit = () => {
    setShowCreateRule(false);
    setEditingRule(null);
  };

  const handleViewEvent = (event: BrandReputationAlertEvent) => {
    setSelectedEvent(event);
  };

  const handleViewReport = (report: BrandReputationReport) => {
    setSelectedReport(report);
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      await generateReport({
        reportPeriodStart: thirtyDaysAgo.toISOString(),
        reportPeriodEnd: now.toISOString(),
        format: 'executive_summary',
        includeCompetitors: true,
        includeCrisisData: true,
        includeMediaMetrics: true,
      });

      refresh();
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'events', label: 'Alert Events', icon: '🔔' },
    { id: 'rules', label: 'Alert Rules', icon: '⚙️' },
    { id: 'reports', label: 'Executive Reports', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reputation Alerts & Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor reputation changes and generate executive briefings
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refresh}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Insights Summary */}
        <div className="mb-6">
          <InsightsSummaryCard refreshTrigger={refreshTrigger} />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'events' && (
            <AlertEventsTable
              onViewEvent={handleViewEvent}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'rules' && !showCreateRule && (
            <AlertRulesList
              onEditRule={handleEditRule}
              onCreateRule={handleCreateRule}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'rules' && showCreateRule && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                {editingRule ? 'Edit Alert Rule' : 'Create New Alert Rule'}
              </h2>
              <AlertRuleForm
                rule={editingRule || undefined}
                onSave={handleRuleSaved}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportsList
              onViewReport={handleViewReport}
              onGenerateReport={handleGenerateReport}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedEvent(null)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Alert Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm text-gray-900">{selectedEvent.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Trigger Reason</p>
                    <p className="text-sm text-gray-900">{selectedEvent.triggerReason || 'No reason provided'}</p>
                  </div>
                  {selectedEvent.overallScoreBefore !== undefined && selectedEvent.overallScoreAfter !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Score Change</p>
                      <p className="text-sm text-gray-900">
                        {selectedEvent.overallScoreBefore.toFixed(1)} → {selectedEvent.overallScoreAfter.toFixed(1)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Triggered At</p>
                    <p className="text-sm text-gray-900">{new Date(selectedEvent.triggeredAt).toLocaleString()}</p>
                  </div>
                  {selectedEvent.acknowledgedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Acknowledged At</p>
                      <p className="text-sm text-gray-900">{new Date(selectedEvent.acknowledgedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEvent.resolvedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resolved At</p>
                      <p className="text-sm text-gray-900">{new Date(selectedEvent.resolvedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEvent.resolutionNotes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resolution Notes</p>
                      <p className="text-sm text-gray-900">{selectedEvent.resolutionNotes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedReport(null)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedReport.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedReport.reportPeriodStart).toLocaleDateString()} - {new Date(selectedReport.reportPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedReport.overallScoreSnapshot && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedReport.overallScoreSnapshot.overallScore.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">Overall</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {selectedReport.overallScoreSnapshot.sentimentScore?.toFixed(0) || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Sentiment</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {selectedReport.overallScoreSnapshot.coverageScore?.toFixed(0) || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Coverage</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {selectedReport.overallScoreSnapshot.crisisImpactScore?.toFixed(0) || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Crisis</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {selectedReport.overallScoreSnapshot.engagementScore?.toFixed(0) || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Engagement</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.description && (
                  <p className="text-sm text-gray-600 mb-4">{selectedReport.description}</p>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    onClick={() => window.open(`/app/reputation/reports/${selectedReport.id}`, '_blank')}
                  >
                    View Full Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generating Report Overlay */}
        {generatingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating report...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
