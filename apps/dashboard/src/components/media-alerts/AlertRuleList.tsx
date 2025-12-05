/**
 * Alert Rule List Component (Sprint S43)
 * Displays alert rules with filtering and selection
 */

import type { MediaAlertRule, MediaAlertType } from '@pravado/types';
import { useState } from 'react';

import { AlertRuleForm } from './AlertRuleForm';

interface AlertRuleListProps {
  rules: MediaAlertRule[];
  selectedRule: MediaAlertRule | null;
  onRuleSelect: (rule: MediaAlertRule) => void;
  onRuleChange: () => void;
  isLoading: boolean;
}

export function AlertRuleList({
  rules,
  selectedRule,
  onRuleSelect,
  onRuleChange,
  isLoading,
}: AlertRuleListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MediaAlertRule | null>(null);
  const [filterType, setFilterType] = useState<MediaAlertType | 'all'>('all');
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');

  const filteredRules = rules.filter((rule) => {
    if (filterType !== 'all' && rule.alertType !== filterType) return false;
    if (filterActive !== 'all' && rule.isActive !== filterActive) return false;
    return true;
  });

  const handleNewRule = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEditRule = (rule: MediaAlertRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRule(null);
    onRuleChange();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <button
          onClick={handleNewRule}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          + New Rule
        </button>

        <div className="space-y-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MediaAlertType | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Types</option>
            <option value="mention_match">Mention Match</option>
            <option value="volume_spike">Volume Spike</option>
            <option value="sentiment_shift">Sentiment Shift</option>
            <option value="tier_coverage">Tier Coverage</option>
          </select>

          <select
            value={filterActive === 'all' ? 'all' : String(filterActive)}
            onChange={(e) =>
              setFilterActive(e.target.value === 'all' ? 'all' : e.target.value === 'true')
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredRules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No rules found</p>
            <p className="text-sm mt-1">Create a new rule to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => onRuleSelect(rule)}
                onDoubleClick={() => handleEditRule(rule)}
                className={`p-3 rounded cursor-pointer border transition-colors ${
                  selectedRule?.id === rule.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-gray-900 text-sm">{rule.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {rule.description || 'No description'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {rule.alertType.replace('_', ' ')}
                  </span>
                  {rule.lastTriggeredAt && (
                    <span className="text-xs text-gray-500">
                      Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Rule Form Modal */}
      {showForm && (
        <AlertRuleForm
          rule={editingRule}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </div>
  );
}
