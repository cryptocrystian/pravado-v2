/**
 * CrisisEscalationRuleEditor Component (Sprint S55)
 *
 * Panel for listing, creating, and editing escalation rules
 * with condition and action configuration
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type {
  CrisisEscalationRule,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  CrisisSeverity,
  EscalationRuleType,
  EscalationConditions,
  EscalationAction,
} from '@pravado/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CrisisEscalationRuleEditorProps {
  rules: CrisisEscalationRule[];
  onCreate: (input: CreateEscalationRuleRequest) => Promise<void>;
  onUpdate: (ruleId: string, updates: UpdateEscalationRuleRequest) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const SEVERITY_OPTIONS: CrisisSeverity[] = ['low', 'medium', 'high', 'critical', 'severe'];
const RULE_TYPE_OPTIONS: { value: EscalationRuleType; label: string }[] = [
  { value: 'threshold', label: 'Threshold-Based' },
  { value: 'pattern', label: 'Pattern-Based' },
  { value: 'time_based', label: 'Time-Based' },
];

// Action type options for V2 UI enhancement
// const ACTION_TYPE_OPTIONS = [
//   { value: 'notify', label: 'Send Notification', icon: Bell },
//   { value: 'create_incident', label: 'Create Incident', icon: AlertTriangle },
//   { value: 'generate_brief', label: 'Generate Brief', icon: Settings },
//   { value: 'webhook', label: 'Call Webhook', icon: Webhook },
//   { value: 'update_severity', label: 'Update Severity', icon: Shield },
// ];

export default function CrisisEscalationRuleEditor({
  rules,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
  onRefresh,
  className = '',
}: CrisisEscalationRuleEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<CrisisEscalationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateEscalationRuleRequest>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ruleType: 'threshold',
      conditions: {},
      escalationActions: [],
      escalationLevel: 1,
      cooldownMinutes: 30,
    });
  };

  const openCreateSheet = () => {
    resetForm();
    setEditingRule(null);
    setIsCreating(true);
  };

  const openEditSheet = (rule: CrisisEscalationRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      conditions: rule.conditions,
      escalationActions: rule.escalationActions,
      escalationLevel: rule.escalationLevel,
      cooldownMinutes: rule.cooldownMinutes,
      notifyChannels: rule.notifyChannels,
      notifyRoles: rule.notifyRoles,
    });
    setEditingRule(rule);
    setIsCreating(true);
  };

  const closeSheet = () => {
    setIsCreating(false);
    setEditingRule(null);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.ruleType) return;

    setIsSaving(true);
    try {
      if (editingRule) {
        await onUpdate(editingRule.id, formData as UpdateEscalationRuleRequest);
      } else {
        await onCreate(formData as CreateEscalationRuleRequest);
      }
      closeSheet();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = useCallback(
    async (rule: CrisisEscalationRule) => {
      await onUpdate(rule.id, { isActive: !rule.isActive });
    },
    [onUpdate]
  );

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    await onDelete(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatConditions = (conditions: EscalationConditions): string => {
    const parts: string[] = [];
    if (conditions.severityGte) parts.push(`Severity >= ${conditions.severityGte}`);
    if (conditions.sentimentLte !== undefined)
      parts.push(`Sentiment <= ${conditions.sentimentLte}`);
    if (conditions.mentionVelocityGte !== undefined)
      parts.push(`Velocity >= ${conditions.mentionVelocityGte}/hr`);
    if (conditions.propagationLevel?.length)
      parts.push(`Propagation: ${conditions.propagationLevel.join(', ')}`);
    if (conditions.riskScoreGte !== undefined)
      parts.push(`Risk >= ${(conditions.riskScoreGte * 100).toFixed(0)}%`);
    return parts.length > 0 ? parts.join(' AND ') : 'No conditions';
  };

  const formatActions = (actions: EscalationAction[]): string => {
    return actions.map((a) => a.type.replace('_', ' ')).join(', ') || 'No actions';
  };

  return (
    <>
      <Card className={cn('flex flex-col', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Escalation Rules</CardTitle>
              <Badge variant="secondary">{rules.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
              )}
              <Button size="sm" onClick={openCreateSheet}>
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[400px] px-4 pb-4">
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-sm">No escalation rules configured</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={openCreateSheet}
                >
                  Create your first rule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => {
                  const isExpanded = expandedId === rule.id;

                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        'border rounded-lg overflow-hidden',
                        !rule.isActive && 'opacity-60',
                        rule.isSystem && 'border-purple-200 bg-purple-50/30'
                      )}
                    >
                      {/* Rule Header */}
                      <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpand(rule.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                            )}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {rule.name}
                              </span>
                              {rule.isSystem && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatConditions(rule.conditions)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            L{rule.escalationLevel}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t space-y-3">
                          {/* Description */}
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">
                              {rule.description}
                            </p>
                          )}

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <span className="ml-1 capitalize">
                                {rule.ruleType.replace('_', ' ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cooldown:</span>
                              <span className="ml-1">{rule.cooldownMinutes}min</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Triggers:</span>
                              <span className="ml-1">{rule.triggerCount}</span>
                            </div>
                            {rule.lastTriggeredAt && (
                              <div>
                                <span className="text-muted-foreground">Last:</span>
                                <span className="ml-1">
                                  {new Date(rule.lastTriggeredAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions Summary */}
                          <div className="text-xs">
                            <span className="text-muted-foreground">Actions:</span>
                            <span className="ml-1 capitalize">
                              {formatActions(rule.escalationActions)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(rule);
                              }}
                            >
                              {rule.isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>
                            {!rule.isSystem && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditSheet(rule);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(rule.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={isCreating} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="w-[500px] max-w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingRule ? 'Edit Escalation Rule' : 'Create Escalation Rule'}
            </SheetTitle>
            <SheetDescription>
              Configure conditions and actions for automatic escalation
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Critical Severity Auto-Escalate"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe when this rule should trigger"
                rows={2}
              />
            </div>

            {/* Rule Type */}
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={formData.ruleType || 'threshold'}
                onValueChange={(value) =>
                  setFormData({ ...formData, ruleType: value as EscalationRuleType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escalation Level */}
            <div className="space-y-2">
              <Label>Escalation Level</Label>
              <Select
                value={String(formData.escalationLevel || 1)}
                onValueChange={(value) =>
                  setFormData({ ...formData, escalationLevel: parseInt(value, 10) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditions Section */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Conditions</Label>

              {/* Severity Threshold */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Minimum Severity
                </Label>
                <Select
                  value={formData.conditions?.severityGte || ''}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        severityGte: value as CrisisSeverity,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {SEVERITY_OPTIONS.map((sev) => (
                      <SelectItem key={sev} value={sev} className="capitalize">
                        {sev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sentiment Threshold */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Sentiment Score (max)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  placeholder="-0.5"
                  value={formData.conditions?.sentimentLte ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        sentimentLte: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>

              {/* Mention Velocity */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Mention Velocity (min per hour)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.conditions?.mentionVelocityGte ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        mentionVelocityGte: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Cooldown */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Cooldown Period (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={formData.cooldownMinutes || 30}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldownMinutes: parseInt(e.target.value, 10) || 30,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Prevent re-triggering within this period
              </p>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={closeSheet}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingRule ? (
                'Update Rule'
              ) : (
                'Create Rule'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Escalation Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted
              and will no longer trigger escalations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
