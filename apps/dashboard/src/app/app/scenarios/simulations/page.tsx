'use client';

/**
 * AI Scenario Simulations Page (Sprint S71)
 * Dashboard page for managing AI-powered scenario simulations
 * Styled according to Pravado Design System v2
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AIScenarioSimulation } from '@pravado/types';
import {
  SimulationList,
  CreateSimulationModal,
  RunViewer,
} from '../../../../components/ai-scenario-simulations';

export default function SimulationsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleView = (simulation: AIScenarioSimulation) => {
    // Navigate to simulation detail page (could be implemented in future sprint)
    router.push(`/app/scenarios/simulations/${simulation.id}`);
  };

  const handleEdit = (simulation: AIScenarioSimulation) => {
    // Navigate to simulation edit page (could be implemented in future sprint)
    router.push(`/app/scenarios/simulations/${simulation.id}/edit`);
  };

  const handleCreated = (simulation: AIScenarioSimulation) => {
    setRefreshKey((k) => k + 1);
    // Optionally navigate to the new simulation
    router.push(`/app/scenarios/simulations/${simulation.id}`);
  };

  const handleRunStarted = (runId: string, _simulationId: string) => {
    setSelectedRunId(runId);
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white-0">AI Scenario Simulations</h1>
          <p className="mt-1 text-sm text-muted">
            Create and run autonomous multi-agent simulations for crisis, investor, and strategic planning.
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulations list */}
          <div className={`${selectedRunId ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            <div className="panel-card p-6">
              <SimulationList
                key={refreshKey}
                onView={handleView}
                onEdit={handleEdit}
                onCreateNew={() => setShowCreateModal(true)}
                onRunStarted={handleRunStarted}
              />
            </div>
          </div>

          {/* Run viewer */}
          {selectedRunId && (
            <div className="lg:col-span-2">
              <div className="panel-card h-[600px] flex flex-col">
                <RunViewer
                  runId={selectedRunId}
                  onClose={() => setSelectedRunId(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Simulations"
            value="—"
            description="Active scenarios"
          />
          <StatCard
            label="Total Runs"
            value="—"
            description="Across all simulations"
          />
          <StatCard
            label="Avg. Completion Rate"
            value="—"
            description="Successful runs"
          />
          <StatCard
            label="Top Risk Level"
            value="—"
            description="Highest identified risk"
          />
        </div>

        {/* Info section */}
        <div className="mt-8 bg-brand-iris/10 border border-brand-iris/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-brand-iris mb-2">
            About AI Scenario Simulations
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted">
            <div>
              <h4 className="font-medium mb-1 text-white-0">Multi-Agent Dialogues</h4>
              <p>
                Simulate realistic conversations between executives, journalists, investors,
                regulators, and other stakeholders in various scenario contexts.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1 text-white-0">Risk Assessment</h4>
              <p>
                Each simulation run analyzes potential risks and opportunities,
                providing actionable recommendations for your communications strategy.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1 text-white-0">What-If Analysis</h4>
              <p>
                Run multiple variations of scenarios to explore different outcomes
                and prepare for various contingencies.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1 text-white-0">Powered by AI</h4>
              <p>
                Leverages advanced language models to generate realistic responses
                and provide strategic insights based on your organization&apos;s context.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <CreateSimulationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="panel-card p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="text-2xl font-bold text-white-0 mt-1">{value}</p>
      <p className="text-xs text-slate-6 mt-1">{description}</p>
    </div>
  );
}
