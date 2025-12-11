/**
 * Scenario Playbooks Dashboard Page (Sprint S67)
 * Main page for scenario simulation & autonomous playbook orchestration
 * Styled according to Pravado Design System v2
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import type { Scenario, ScenarioPlaybook, ScenarioRun, SimulationResult } from '@pravado/types';
import {
  ScenarioPlaybookStats,
  ScenarioList,
  PlaybookList,
  RunList,
  SimulationResultsPanel,
  CreateScenarioDialog,
  CreatePlaybookDialog,
} from '../../../components/scenario-playbooks';

type ActiveTab = 'scenarios' | 'playbooks' | 'runs';

export default function ScenariosPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scenarios');
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog states
  const [showCreateScenario, setShowCreateScenario] = useState(false);
  const [showCreatePlaybook, setShowCreatePlaybook] = useState(false);

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Selected items for navigation (variables reserved for future detail view implementation)
  const [_selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [_selectedPlaybook, setSelectedPlaybook] = useState<ScenarioPlaybook | null>(null);
  const [_selectedRun, setSelectedRun] = useState<ScenarioRun | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleScenarioCreated = (_scenario: Scenario) => {
    handleRefresh();
    setActiveTab('scenarios');
  };

  const handlePlaybookCreated = (_playbook: ScenarioPlaybook) => {
    handleRefresh();
    setActiveTab('playbooks');
  };

  const handleSimulationResult = (result: unknown) => {
    setSimulationResult(result as SimulationResult);
  };

  const handleRunStarted = (_run: unknown) => {
    setActiveTab('runs');
    handleRefresh();
  };

  const handleViewScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    // In a full implementation, this would navigate to a detail view
    console.log('View scenario:', scenario.id);
  };

  const handleEditScenario = (scenario: Scenario) => {
    // In a full implementation, this would open an edit dialog
    console.log('Edit scenario:', scenario.id);
  };

  const handleViewPlaybook = (playbook: ScenarioPlaybook) => {
    setSelectedPlaybook(playbook);
    console.log('View playbook:', playbook.id);
  };

  const handleEditPlaybook = (playbook: ScenarioPlaybook) => {
    console.log('Edit playbook:', playbook.id);
  };

  const handleViewRun = (run: ScenarioRun) => {
    setSelectedRun(run);
    console.log('View run:', run.id);
  };

  const tabClasses = (tab: ActiveTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-brand-cyan text-brand-cyan'
        : 'border-transparent text-slate-6 hover:text-white-0 hover:border-slate-5'
    }`;

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-slate-1 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white-0">
                  Scenario Playbooks
                </h1>
                <p className="mt-1 text-sm text-muted">
                  Simulate, orchestrate, and execute autonomous PR response workflows
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreatePlaybook(true)}
                  className="btn-secondary"
                >
                  + New Playbook
                </button>
                <button
                  onClick={() => setShowCreateScenario(true)}
                  className="btn-primary"
                >
                  + New Scenario
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 -mb-px">
            <button
              onClick={() => setActiveTab('scenarios')}
              className={tabClasses('scenarios')}
            >
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('playbooks')}
              className={tabClasses('playbooks')}
            >
              Playbooks
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={tabClasses('runs')}
            >
              Runs
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="mb-6">
          <ScenarioPlaybookStats refreshTrigger={refreshKey} />
        </div>

        {/* Simulation Result Modal */}
        {simulationResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-0/80"
              onClick={() => setSimulationResult(null)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-3xl">
                <SimulationResultsPanel
                  result={simulationResult}
                  onClose={() => setSimulationResult(null)}
                  onStartRun={() => {
                    setSimulationResult(null);
                    setActiveTab('runs');
                    handleRefresh();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="panel-card p-6">
          {activeTab === 'scenarios' && (
            <ScenarioList
              key={`scenarios-${refreshKey}`}
              onView={handleViewScenario}
              onEdit={handleEditScenario}
              onCreateNew={() => setShowCreateScenario(true)}
              onSimulationResult={handleSimulationResult}
              onRunStarted={handleRunStarted}
            />
          )}

          {activeTab === 'playbooks' && (
            <PlaybookList
              key={`playbooks-${refreshKey}`}
              onView={handleViewPlaybook}
              onEdit={handleEditPlaybook}
              onCreateNew={() => setShowCreatePlaybook(true)}
            />
          )}

          {activeTab === 'runs' && (
            <RunList
              key={`runs-${refreshKey}`}
              onView={handleViewRun}
              showFilters={true}
            />
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-iris/10 rounded-lg">
                <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-white-0">Simulate First</h3>
            </div>
            <p className="text-sm text-muted">
              Run simulations before executing scenarios to predict outcomes and adjust strategies.
            </p>
          </div>

          <div className="panel-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-cyan/10 rounded-lg">
                <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-white-0">Approval Gates</h3>
            </div>
            <p className="text-sm text-muted">
              Configure steps to require human approval before execution for sensitive actions.
            </p>
          </div>

          <div className="panel-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-semantic-success/10 rounded-lg">
                <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-white-0">Autonomous Execution</h3>
            </div>
            <p className="text-sm text-muted">
              Let the AI handle routine steps automatically while you focus on strategic decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Create Dialogs */}
      <CreateScenarioDialog
        isOpen={showCreateScenario}
        onClose={() => setShowCreateScenario(false)}
        onCreated={handleScenarioCreated}
      />

      <CreatePlaybookDialog
        isOpen={showCreatePlaybook}
        onClose={() => setShowCreatePlaybook(false)}
        onCreated={handlePlaybookCreated}
      />
    </div>
  );
}
