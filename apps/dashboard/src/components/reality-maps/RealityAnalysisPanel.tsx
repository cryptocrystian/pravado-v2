'use client';

/**
 * RealityAnalysisPanel Component (Sprint S73)
 * Panel for displaying analysis results: outcome universe, contradictions, correlations
 */

import { useState } from 'react';
import type { RealityMapAnalysisResponse, OutcomeUniverse, RealityMapRiskFactor, OpportunityFactor, DetectedContradiction, DetectedCorrelation } from '@pravado/types';
import {
  formatProbability,
  formatScore,
  getRiskLevelBadgeClass,
  getOpportunityLevelBadgeClass,
  getRiskLevel,
  getOpportunityLevel,
} from '../../lib/realityMapApi';

interface RealityAnalysisPanelProps {
  analysis: RealityMapAnalysisResponse | null;
  loading?: boolean;
  onRefresh?: () => void;
}

type TabType = 'universe' | 'risks' | 'opportunities' | 'insights';

export function RealityAnalysisPanel({
  analysis,
  loading = false,
  onRefresh,
}: RealityAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('universe');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-600">Running analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No analysis available</p>
          <p className="text-xs mt-1">Generate the reality map first</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
            >
              Refresh Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  const { outcomeUniverse, contradictions, correlations, aggregatedRisks, aggregatedOpportunities } = analysis;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-2">
        <button
          onClick={() => setActiveTab('universe')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'universe'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Universe
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'risks'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Risks ({aggregatedRisks.length})
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'opportunities'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Opportunities ({aggregatedOpportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'insights'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Insights
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'universe' && (
          <OutcomeUniverseTab universe={outcomeUniverse} />
        )}
        {activeTab === 'risks' && (
          <RisksTab risks={aggregatedRisks} />
        )}
        {activeTab === 'opportunities' && (
          <OpportunitiesTab opportunities={aggregatedOpportunities} />
        )}
        {activeTab === 'insights' && (
          <InsightsTab contradictions={contradictions} correlations={correlations} />
        )}
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <div className="border-t p-2">
          <button
            onClick={onRefresh}
            className="w-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OutcomeUniverseTab({ universe }: { universe: OutcomeUniverse }) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-indigo-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-indigo-600">{universe.totalOutcomes}</div>
          <div className="text-xs text-gray-500">Outcomes</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-600">{universe.positiveOutcomes}</div>
          <div className="text-xs text-gray-500">Positive</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-red-600">{universe.negativeOutcomes}</div>
          <div className="text-xs text-gray-500">Negative</div>
        </div>
      </div>

      {/* Outcome Distribution */}
      {universe.outcomeDistribution && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Outcome Distribution</h5>
          <div className="space-y-1">
            {Object.entries(universe.outcomeDistribution).map(([outcome, probability]) => (
              <div key={outcome} className="flex items-center gap-2">
                <div className="w-24 text-xs text-gray-600 capitalize">{outcome.replace(/_/g, ' ')}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 rounded-full h-2"
                    style={{ width: `${(probability as number) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-xs text-gray-500 text-right">
                  {formatProbability(probability as number)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk/Opportunity Summary */}
      <div className="grid grid-cols-2 gap-3">
        {universe.riskSummary && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-gray-700">Risk Summary</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatScore(universe.riskSummary.averageScore ?? universe.riskSummary.score)}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
            <div className="mt-2 text-xs">
              <span className={getRiskLevelBadgeClass(getRiskLevel(universe.riskSummary.maxScore ?? universe.riskSummary.score))}>
                Max: {formatScore(universe.riskSummary.maxScore ?? universe.riskSummary.score)}
              </span>
            </div>
          </div>
        )}
        {universe.opportunitySummary && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-gray-700">Opportunity Summary</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatScore(universe.opportunitySummary.averageScore ?? universe.opportunitySummary.score)}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
            <div className="mt-2 text-xs">
              <span className={getOpportunityLevelBadgeClass(getOpportunityLevel(universe.opportunitySummary.maxScore ?? universe.opportunitySummary.score))}>
                Max: {formatScore(universe.opportunitySummary.maxScore ?? universe.opportunitySummary.score)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Drivers */}
      {universe.topDrivers && universe.topDrivers.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Top Drivers</h5>
          <div className="space-y-1">
            {universe.topDrivers.slice(0, 5).map((driver, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  driver.direction === 'positive' ? 'bg-green-500' :
                  driver.direction === 'negative' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <span className="flex-1 text-xs text-gray-700">{driver.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  driver.impact === 'high' ? 'bg-red-100 text-red-700' :
                  driver.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {driver.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RisksTab({ risks }: { risks: RealityMapRiskFactor[] }) {
  if (risks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No aggregated risks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {risks.map((risk, idx) => (
        <div key={idx} className="border border-red-200 rounded-lg p-3 bg-red-50">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{risk.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getRiskLevelBadgeClass(risk.severity || 'medium')}`}>
              {risk.severity}
            </span>
          </div>
          {risk.description && (
            <p className="text-xs text-gray-600 mb-2">{risk.description}</p>
          )}
          {risk.mitigation && (
            <div className="bg-white rounded p-2">
              <p className="text-xs text-green-700">
                <strong>Mitigation:</strong> {risk.mitigation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OpportunitiesTab({ opportunities }: { opportunities: OpportunityFactor[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No aggregated opportunities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((opp, idx) => (
        <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{opp.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getOpportunityLevelBadgeClass(opp.potential || 'medium')}`}>
              {opp.potential}
            </span>
          </div>
          {opp.description && (
            <p className="text-xs text-gray-600 mb-2">{opp.description}</p>
          )}
          {opp.actionRequired && (
            <div className="bg-white rounded p-2">
              <p className="text-xs text-blue-700">
                <strong>Action:</strong> {opp.actionRequired}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InsightsTab({ contradictions, correlations }: { contradictions: DetectedContradiction[]; correlations: DetectedCorrelation[] }) {
  return (
    <div className="space-y-4">
      {/* Contradictions */}
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Contradictions ({contradictions.length})
        </h5>
        {contradictions.length === 0 ? (
          <p className="text-xs text-gray-500">No contradictions detected</p>
        ) : (
          <div className="space-y-2">
            {contradictions.map((contradiction, idx) => (
              <div key={idx} className="border border-orange-200 rounded p-2 bg-orange-50">
                <p className="text-xs text-gray-700">{contradiction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    contradiction.severity === 'high' ? 'bg-red-100 text-red-700' :
                    contradiction.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {contradiction.severity}
                  </span>
                  <span className="text-xs text-gray-400">
                    {contradiction.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correlations */}
      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
          Correlations ({correlations.length})
        </h5>
        {correlations.length === 0 ? (
          <p className="text-xs text-gray-500">No correlations detected</p>
        ) : (
          <div className="space-y-2">
            {correlations.map((correlation, idx) => (
              <div key={idx} className="border border-blue-200 rounded p-2 bg-blue-50">
                <p className="text-xs text-gray-700">{correlation.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    correlation.strength > 0.7 ? 'bg-green-100 text-green-700' :
                    correlation.strength > 0.4 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {correlation.strength > 0.7 ? 'strong' : correlation.strength > 0.4 ? 'moderate' : 'weak'}
                  </span>
                  <span className={`text-xs ${
                    correlation.type === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    r = {correlation.strength.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
