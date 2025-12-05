'use client';

/**
 * SuiteOutcomePanel Component (Sprint S72)
 * Display narrative, risk map, and outcomes for a suite run
 */

import { useState } from 'react';
import type { ScenarioSuiteRun } from '@pravado/types';
import {
  generateSuiteNarrative,
  generateSuiteRiskMap,
  getRiskBadgeClass,
} from '../../lib/scenarioOrchestrationApi';

interface SuiteOutcomePanelProps {
  run: ScenarioSuiteRun;
  onNarrativeGenerated?: (narrative: string) => void;
  onRiskMapGenerated?: (riskMap: unknown) => void;
}

type NarrativeFormat = 'summary' | 'detailed' | 'executive';

export function SuiteOutcomePanel({
  run,
  onNarrativeGenerated,
  onRiskMapGenerated,
}: SuiteOutcomePanelProps) {
  const [activeTab, setActiveTab] = useState<'narrative' | 'riskmap' | 'outcomes'>('narrative');
  const [narrativeFormat, setNarrativeFormat] = useState<NarrativeFormat>('summary');
  const [narrative, setNarrative] = useState<string>(run.suiteNarrative || '');
  const [riskMap, setRiskMap] = useState<Record<string, unknown> | null>(
    run.riskMap as Record<string, unknown> | null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = run.status === 'completed' || run.status === 'failed';

  const handleGenerateNarrative = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateSuiteNarrative(run.id, {
        format: narrativeFormat,
        includeRecommendations: true,
      });
      setNarrative(result.narrative);
      onNarrativeGenerated?.(result.narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate narrative');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRiskMap = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateSuiteRiskMap(run.id, {
        includeOpportunities: true,
        includeMitigations: true,
      });
      setRiskMap(result.riskMap as unknown as Record<string, unknown>);
      onRiskMapGenerated?.(result.riskMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate risk map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton
          active={activeTab === 'narrative'}
          onClick={() => setActiveTab('narrative')}
        >
          Narrative
        </TabButton>
        <TabButton
          active={activeTab === 'riskmap'}
          onClick={() => setActiveTab('riskmap')}
        >
          Risk Map
        </TabButton>
        <TabButton
          active={activeTab === 'outcomes'}
          onClick={() => setActiveTab('outcomes')}
        >
          Outcomes
        </TabButton>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'narrative' && (
          <NarrativeTab
            narrative={narrative}
            format={narrativeFormat}
            onFormatChange={setNarrativeFormat}
            onGenerate={handleGenerateNarrative}
            loading={loading}
            canGenerate={canGenerate}
          />
        )}

        {activeTab === 'riskmap' && (
          <RiskMapTab
            riskMap={riskMap}
            onGenerate={handleGenerateRiskMap}
            loading={loading}
            canGenerate={canGenerate}
          />
        )}

        {activeTab === 'outcomes' && (
          <OutcomesTab run={run} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function NarrativeTab({
  narrative,
  format,
  onFormatChange,
  onGenerate,
  loading,
  canGenerate,
}: {
  narrative: string;
  format: NarrativeFormat;
  onFormatChange: (format: NarrativeFormat) => void;
  onGenerate: () => void;
  loading: boolean;
  canGenerate: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Format:</label>
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as NarrativeFormat)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="summary">Summary</option>
            <option value="detailed">Detailed</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading || !canGenerate}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : narrative ? 'Regenerate' : 'Generate Narrative'}
        </button>
      </div>

      {narrative ? (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">{narrative}</div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No narrative generated yet.</p>
          {canGenerate && (
            <p className="text-sm mt-1">Click &quot;Generate Narrative&quot; to create an AI-powered summary.</p>
          )}
        </div>
      )}
    </div>
  );
}

function RiskMapTab({
  riskMap,
  onGenerate,
  loading,
  canGenerate,
}: {
  riskMap: Record<string, unknown> | null;
  onGenerate: () => void;
  loading: boolean;
  canGenerate: boolean;
}) {
  if (!riskMap) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-500 mb-4">No risk map generated yet.</p>
        <button
          onClick={onGenerate}
          disabled={loading || !canGenerate}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Risk Map'}
        </button>
      </div>
    );
  }

  const risks = (riskMap.risks as Array<{ category: string; level: string; description: string; mitigation?: string }>) || [];
  const opportunities = (riskMap.opportunities as Array<{ category: string; description: string; potential?: string }>) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={loading || !canGenerate}
          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Risks */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Identified Risks ({risks.length})
        </h4>
        {risks.length === 0 ? (
          <p className="text-sm text-gray-500">No significant risks identified.</p>
        ) : (
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadgeClass(risk.level)}`}>
                    {risk.level}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{risk.category}</span>
                </div>
                <p className="text-sm text-gray-600">{risk.description}</p>
                {risk.mitigation && (
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Opportunities ({opportunities.length})
          </h4>
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <div key={i} className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    opportunity
                  </span>
                  <span className="text-sm font-medium text-gray-900">{opp.category}</span>
                </div>
                <p className="text-sm text-gray-600">{opp.description}</p>
                {opp.potential && (
                  <p className="text-xs text-green-700 mt-2">
                    <strong>Potential:</strong> {opp.potential}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomesTab({ run }: { run: ScenarioSuiteRun }) {
  const outcomes = (run.aggregatedOutcomes as unknown as Array<{
    simulationName?: string;
    outcomeType?: string;
    summary?: string;
    riskLevel?: string;
  }>) || [];

  if (outcomes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No outcomes recorded yet.</p>
        <p className="text-sm mt-1">Outcomes are aggregated as simulations complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {outcomes.map((outcome, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-900">
              {outcome.simulationName || `Simulation ${i + 1}`}
            </span>
            {outcome.outcomeType && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                {outcome.outcomeType}
              </span>
            )}
            {outcome.riskLevel && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadgeClass(outcome.riskLevel)}`}>
                {outcome.riskLevel}
              </span>
            )}
          </div>
          {outcome.summary && (
            <p className="text-sm text-gray-600">{outcome.summary}</p>
          )}
        </div>
      ))}
    </div>
  );
}
