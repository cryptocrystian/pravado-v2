'use client';

/**
 * RealityNodeDetailDrawer Component (Sprint S73)
 * Side drawer for displaying node details
 */

import type { RealityMapGraphNode, RealityMapNode, KeyDriver, RealityMapRiskFactor, OpportunityFactor } from '@pravado/types';
import {
  NODE_TYPE_LABELS,
  getNodeTypeBadgeClass,
  formatProbability,
  formatScore,
  getRiskLevelBadgeClass,
  getOpportunityLevelBadgeClass,
  getRiskLevel,
  getOpportunityLevel,
} from '../../lib/realityMapApi';

interface RealityNodeDetailDrawerProps {
  node: RealityMapGraphNode | RealityMapNode | null;
  fullNode?: RealityMapNode | null;
  onClose: () => void;
  isOpen: boolean;
}

export function RealityNodeDetailDrawer({
  node,
  fullNode,
  onClose,
  isOpen,
}: RealityNodeDetailDrawerProps) {
  if (!isOpen || !node) {
    return null;
  }

  // Use fullNode data if available, otherwise use graph node
  const displayNode = fullNode || node;
  const nodeType = 'nodeType' in displayNode ? displayNode.nodeType : (displayNode as RealityMapGraphNode).type;
  const summary = 'aiSummary' in displayNode ? displayNode.aiSummary : (displayNode as RealityMapGraphNode).summary;
  const keyDrivers: KeyDriver[] = 'keyDrivers' in displayNode ? displayNode.keyDrivers : [];
  const riskFactors: RealityMapRiskFactor[] = 'riskFactors' in displayNode ? displayNode.riskFactors : [];
  const opportunityFactors: OpportunityFactor[] = 'opportunityFactors' in displayNode ? displayNode.opportunityFactors : [];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getNodeTypeBadgeClass(nodeType)}`}>
            {NODE_TYPE_LABELS[nodeType]}
          </span>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {node.label || 'Node Details'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Probability & Scores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {formatProbability(node.probability)}
            </div>
            <div className="text-xs text-gray-500">Probability</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {formatScore(node.riskScore)}
            </div>
            <div className="text-xs text-gray-500">Risk Score</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatScore(node.opportunityScore)}
            </div>
            <div className="text-xs text-gray-500">Opportunity</div>
          </div>
        </div>

        {/* Risk & Opportunity Levels */}
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelBadgeClass(getRiskLevel(node.riskScore))}`}>
            Risk: {getRiskLevel(node.riskScore)}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityLevelBadgeClass(getOpportunityLevel(node.opportunityScore))}`}>
            Opportunity: {getOpportunityLevel(node.opportunityScore)}
          </span>
        </div>

        {/* AI Summary */}
        {summary && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">AI Summary</h4>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {summary}
            </p>
          </div>
        )}

        {/* Key Drivers */}
        {keyDrivers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Drivers</h4>
            <div className="space-y-2">
              {keyDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${
                    driver.direction === 'positive' ? 'bg-green-500' :
                    driver.direction === 'negative' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    {driver.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{driver.description}</div>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    driver.impact === 'high' ? 'bg-red-100 text-red-800' :
                    driver.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {driver.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors</h4>
            <div className="space-y-2">
              {riskFactors.map((risk, idx) => (
                <div key={idx} className="p-2 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{risk.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRiskLevelBadgeClass(risk.severity || 'medium')}`}>
                      {risk.severity}
                    </span>
                  </div>
                  {risk.description && (
                    <p className="text-xs text-gray-600">{risk.description}</p>
                  )}
                  {risk.mitigation && (
                    <p className="text-xs text-green-700 mt-1">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunity Factors */}
        {opportunityFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Opportunities</h4>
            <div className="space-y-2">
              {opportunityFactors.map((opp, idx) => (
                <div key={idx} className="p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{opp.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getOpportunityLevelBadgeClass(opp.potential || 'medium')}`}>
                      {opp.potential}
                    </span>
                  </div>
                  {opp.description && (
                    <p className="text-xs text-gray-600">{opp.description}</p>
                  )}
                  {opp.actionRequired && (
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>Action:</strong> {opp.actionRequired}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Metadata</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-500">Depth</div>
            <div className="text-gray-900">{node.depth}</div>
            {'cumulativeProbability' in node && (
              <>
                <div className="text-gray-500">Cumulative Prob</div>
                <div className="text-gray-900">{formatProbability(node.cumulativeProbability)}</div>
              </>
            )}
            {node.parentId && (
              <>
                <div className="text-gray-500">Parent ID</div>
                <div className="text-gray-900 font-mono truncate">{node.parentId.slice(0, 8)}...</div>
              </>
            )}
            {node.childIds && (
              <>
                <div className="text-gray-500">Children</div>
                <div className="text-gray-900">{node.childIds.length}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
