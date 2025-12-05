/**
 * Rule Editor Component (Sprint S59)
 * Create/edit governance rules with condition builder
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  GovernanceRule,
  GovernanceRuleType,
  GovernanceTargetSystem,
  GovernanceEvaluationMode,
  CreateGovernanceRuleInput,
  UpdateGovernanceRuleInput,
} from '@/lib/governanceApi';
import { getRuleTypeLabel, getTargetSystemLabel } from '@/lib/governanceApi';
import { Plus, Save, X, Settings, Zap, Clock, Tags } from 'lucide-react';

interface RuleEditorProps {
  rule?: GovernanceRule;
  policyId: string;
  onSave: (input: CreateGovernanceRuleInput | UpdateGovernanceRuleInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const ruleTypes: GovernanceRuleType[] = [
  'threshold',
  'pattern',
  'blacklist',
  'whitelist',
  'time_window',
  'compound',
  'frequency',
  'sentiment',
  'relationship',
  'approval_required',
];

const targetSystems: GovernanceTargetSystem[] = [
  'media_monitoring',
  'crisis',
  'reputation',
  'outreach',
  'briefings',
  'journalists',
  'press_releases',
  'pitches',
  'media_lists',
  'personas',
  'competitive_intel',
];

const evaluationModes: { value: GovernanceEvaluationMode; label: string; description: string }[] = [
  { value: 'on_event', label: 'On Event', description: 'Evaluate when events occur' },
  { value: 'scheduled', label: 'Scheduled', description: 'Run on a schedule (cron)' },
  { value: 'manual', label: 'Manual', description: 'Manually triggered only' },
];

interface ConditionBuilderProps {
  condition: Record<string, unknown>;
  onChange: (condition: Record<string, unknown>) => void;
  ruleType: GovernanceRuleType;
}

function ConditionBuilder({ condition, onChange, ruleType }: ConditionBuilderProps) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  // Simple field-based editor for common rule types
  const renderSimpleEditor = () => {
    switch (ruleType) {
      case 'threshold':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="field">Field to Check</Label>
              <Input
                id="field"
                value={(condition.field as string) || ''}
                onChange={(e) => onChange({ ...condition, field: e.target.value })}
                placeholder="e.g., sentiment_score"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="operator">Operator</Label>
                <select
                  id="operator"
                  value={(condition.operator as string) || 'gt'}
                  onChange={(e) => onChange({ ...condition, operator: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="gt">Greater than</option>
                  <option value="gte">Greater than or equal</option>
                  <option value="lt">Less than</option>
                  <option value="lte">Less than or equal</option>
                  <option value="eq">Equal to</option>
                  <option value="ne">Not equal to</option>
                </select>
              </div>
              <div>
                <Label htmlFor="value">Threshold Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={(condition.value as number) || 0}
                  onChange={(e) => onChange({ ...condition, value: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );

      case 'pattern':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="field">Field to Match</Label>
              <Input
                id="field"
                value={(condition.field as string) || ''}
                onChange={(e) => onChange({ ...condition, field: e.target.value })}
                placeholder="e.g., content, title"
              />
            </div>
            <div>
              <Label htmlFor="pattern">Regex Pattern</Label>
              <Input
                id="pattern"
                value={(condition.pattern as string) || ''}
                onChange={(e) => onChange({ ...condition, pattern: e.target.value })}
                placeholder="e.g., crisis|emergency|urgent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="caseSensitive"
                checked={(condition.caseSensitive as boolean) || false}
                onCheckedChange={(checked) => onChange({ ...condition, caseSensitive: checked })}
              />
              <Label htmlFor="caseSensitive">Case Sensitive</Label>
            </div>
          </div>
        );

      case 'blacklist':
      case 'whitelist':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="field">Field to Check</Label>
              <Input
                id="field"
                value={(condition.field as string) || ''}
                onChange={(e) => onChange({ ...condition, field: e.target.value })}
                placeholder="e.g., journalist_id, outlet_name"
              />
            </div>
            <div>
              <Label htmlFor="values">Values (comma-separated)</Label>
              <Textarea
                id="values"
                value={Array.isArray(condition.values) ? condition.values.join(', ') : ''}
                onChange={(e) =>
                  onChange({
                    ...condition,
                    values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                  })
                }
                placeholder="value1, value2, value3"
                rows={3}
              />
            </div>
          </div>
        );

      case 'sentiment':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="sentimentField">Sentiment Field</Label>
              <Input
                id="sentimentField"
                value={(condition.field as string) || 'sentiment'}
                onChange={(e) => onChange({ ...condition, field: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="minScore">Min Sentiment Score</Label>
                <Input
                  id="minScore"
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  value={(condition.minScore as number) ?? -1}
                  onChange={(e) => onChange({ ...condition, minScore: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxScore">Max Sentiment Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  value={(condition.maxScore as number) ?? 1}
                  onChange={(e) => onChange({ ...condition, maxScore: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );

      case 'frequency':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="event">Event Type</Label>
              <Input
                id="event"
                value={(condition.event as string) || ''}
                onChange={(e) => onChange({ ...condition, event: e.target.value })}
                placeholder="e.g., mention, outreach_sent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="count">Count Threshold</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={(condition.count as number) || 1}
                  onChange={(e) => onChange({ ...condition, count: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="windowMinutes">Time Window (minutes)</Label>
                <Input
                  id="windowMinutes"
                  type="number"
                  min="1"
                  value={(condition.windowMinutes as number) || 60}
                  onChange={(e) => onChange({ ...condition, windowMinutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Condition</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setJsonMode(!jsonMode)}
          className="text-xs"
        >
          {jsonMode ? 'Simple Editor' : 'JSON Editor'}
        </Button>
      </div>

      {jsonMode ? (
        <div className="space-y-2">
          <Textarea
            value={JSON.stringify(condition, null, 2)}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="font-mono text-sm"
            rows={8}
          />
          {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
        </div>
      ) : (
        renderSimpleEditor() || (
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            No simple editor available for this rule type. Use JSON mode.
          </div>
        )
      )}
    </div>
  );
}

interface ActionBuilderProps {
  action: Record<string, unknown>;
  onChange: (action: Record<string, unknown>) => void;
}

function ActionBuilder({ action, onChange }: ActionBuilderProps) {
  return (
    <div className="space-y-3">
      <Label>Action Configuration</Label>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="createFinding"
            checked={(action.createFinding as boolean) !== false}
            onCheckedChange={(checked) => onChange({ ...action, createFinding: checked })}
          />
          <Label htmlFor="createFinding">Create Finding</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="sendNotification"
            checked={(action.sendNotification as boolean) || false}
            onCheckedChange={(checked) => onChange({ ...action, sendNotification: checked })}
          />
          <Label htmlFor="sendNotification">Send Notification</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="autoEscalate"
            checked={(action.autoEscalate as boolean) || false}
            onCheckedChange={(checked) => onChange({ ...action, autoEscalate: checked })}
          />
          <Label htmlFor="autoEscalate">Auto-Escalate</Label>
        </div>
        {Boolean(action.autoEscalate) && (
          <div>
            <Label htmlFor="escalateTo">Escalate To</Label>
            <Input
              id="escalateTo"
              value={(action.escalateTo as string) || ''}
              onChange={(e) => onChange({ ...action, escalateTo: e.target.value })}
              placeholder="User ID or email"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function RuleEditor({
  rule,
  policyId,
  onSave,
  onCancel,
  loading,
  className,
}: RuleEditorProps) {
  const isEditing = !!rule;

  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [ruleType, setRuleType] = useState<GovernanceRuleType>(rule?.ruleType || 'threshold');
  const [targetSystem, setTargetSystem] = useState<GovernanceTargetSystem>(
    rule?.targetSystem || 'media_monitoring'
  );
  const [condition, setCondition] = useState<Record<string, unknown>>(rule?.condition || {});
  const [action, setAction] = useState<Record<string, unknown>>(
    rule?.action || { createFinding: true }
  );
  const [priority, setPriority] = useState(rule?.priority || 50);
  const [isActive, setIsActive] = useState(rule?.isActive !== false);
  const [evaluationMode, setEvaluationMode] = useState<GovernanceEvaluationMode>(
    rule?.evaluationMode || 'on_event'
  );
  const [scheduleCron, setScheduleCron] = useState(rule?.scheduleCron || '');
  const [cooldownMinutes, setCooldownMinutes] = useState(rule?.cooldownMinutes || 60);
  const [maxFindingsPerDay, setMaxFindingsPerDay] = useState<number | undefined>(
    rule?.maxFindingsPerDay
  );
  const [tags, setTags] = useState<string[]>(rule?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    const input = isEditing
      ? {
          name,
          description: description || null,
          ruleType,
          targetSystem,
          condition,
          action,
          priority,
          isActive,
          evaluationMode,
          scheduleCron: scheduleCron || null,
          cooldownMinutes,
          maxFindingsPerDay: maxFindingsPerDay || null,
          tags,
          metadata: {},
        }
      : {
          policyId,
          name,
          description: description || undefined,
          ruleType,
          targetSystem,
          condition,
          action,
          priority,
          isActive,
          evaluationMode,
          scheduleCron: scheduleCron || undefined,
          cooldownMinutes,
          maxFindingsPerDay,
          tags,
          metadata: {},
        };

    await onSave(input);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Rule' : 'Create Rule'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Crisis Keyword Detection"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule checks for..."
              rows={2}
            />
          </div>
        </div>

        {/* Rule Configuration */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Settings className="h-4 w-4" />
            Rule Configuration
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleType">Rule Type</Label>
              <select
                id="ruleType"
                value={ruleType}
                onChange={(e) => {
                  setRuleType(e.target.value as GovernanceRuleType);
                  setCondition({}); // Reset condition when type changes
                }}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
              >
                {ruleTypes.map((type) => (
                  <option key={type} value={type}>
                    {getRuleTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="targetSystem">Target System</Label>
              <select
                id="targetSystem"
                value={targetSystem}
                onChange={(e) => setTargetSystem(e.target.value as GovernanceTargetSystem)}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
              >
                {targetSystems.map((system) => (
                  <option key={system} value={system}>
                    {getTargetSystemLabel(system)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority (1-100)</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="100"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Condition Builder */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Zap className="h-4 w-4" />
            Condition
          </div>
          <ConditionBuilder
            condition={condition}
            onChange={setCondition}
            ruleType={ruleType}
          />
        </div>

        {/* Action Builder */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <ActionBuilder action={action} onChange={setAction} />
        </div>

        {/* Evaluation Settings */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            Evaluation Settings
          </div>

          <div>
            <Label>Evaluation Mode</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {evaluationModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setEvaluationMode(mode.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    evaluationMode === mode.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-sm font-medium">{mode.label}</div>
                  <div className="text-xs text-gray-500">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {evaluationMode === 'scheduled' && (
            <div>
              <Label htmlFor="scheduleCron">Cron Expression</Label>
              <Input
                id="scheduleCron"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                placeholder="e.g., 0 */6 * * * (every 6 hours)"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cooldownMinutes">Cooldown (minutes)</Label>
              <Input
                id="cooldownMinutes"
                type="number"
                min="0"
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxFindingsPerDay">Max Findings/Day</Label>
              <Input
                id="maxFindingsPerDay"
                type="number"
                min="0"
                value={maxFindingsPerDay || ''}
                onChange={(e) =>
                  setMaxFindingsPerDay(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Tags className="h-4 w-4" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">Active</div>
            <div className="text-sm text-gray-500">
              Enable or disable this rule
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name}>
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
