/**
 * Board Report Audience List Component (Sprint S63)
 * Manages report audience members with add/remove functionality
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  type ExecBoardReportAudience,
  type AddExecBoardReportAudienceInput,
  getAccessLevelLabel,
  formatRelativeTime,
} from '@/lib/executiveBoardReportApi';
import { cn } from '@/lib/utils';
import {
  Users,
  Plus,
  Mail,
  Eye,
  MessageSquare,
  CheckCircle,
  Trash2,
  Send,
} from 'lucide-react';

interface BoardReportAudienceListProps {
  audience: ExecBoardReportAudience[];
  onAdd?: (data: AddExecBoardReportAudienceInput) => Promise<void>;
  onRemove?: (audienceId: string) => void;
  onToggleActive?: (audienceId: string, isActive: boolean) => void;
}

export function BoardReportAudienceList({
  audience,
  onAdd,
  onRemove,
  onToggleActive,
}: BoardReportAudienceListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddExecBoardReportAudienceInput>({
    email: '',
    name: '',
    role: '',
    accessLevel: 'view',
  });

  const handleAddSubmit = async () => {
    if (!formData.email) return;

    setIsSubmitting(true);
    try {
      await onAdd?.(formData);
      setAddDialogOpen(false);
      setFormData({ email: '', name: '', role: '', accessLevel: 'view' });
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'view':
        return <Eye className="h-3 w-3" />;
      case 'comment':
        return <MessageSquare className="h-3 w-3" />;
      case 'approve':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            Audience ({audience.length})
          </CardTitle>
          {onAdd && (
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {audience.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>No audience members added yet.</p>
              <p className="text-sm text-gray-400">
                Add team members who should receive this report.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {audience.map((member) => (
                <div key={member.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        member.isActive
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-medium',
                            member.isActive ? 'text-gray-900' : 'text-gray-400'
                          )}
                        >
                          {member.name || member.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getAccessIcon(member.accessLevel)}
                          <span className="ml-1">{getAccessLevelLabel(member.accessLevel)}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {member.email}
                        {member.role && (
                          <span className="text-gray-400">| {member.role}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.lastSentAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Send className="h-3 w-3" />
                        Sent {formatRelativeTime(member.lastSentAt)}
                      </div>
                    )}
                    {member.viewCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="h-3 w-3" />
                        {member.viewCount} views
                      </div>
                    )}
                    <Switch
                      checked={member.isActive}
                      onCheckedChange={(checked) => onToggleActive?.(member.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onRemove?.(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Audience Member</DialogTitle>
            <DialogDescription>
              Add a team member to receive this board report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="executive@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="CEO, CFO, Board Member..."
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select
                value={formData.accessLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    accessLevel: value as 'view' | 'comment' | 'approve',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Can Comment</SelectItem>
                  <SelectItem value="approve">Can Approve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit} disabled={isSubmitting || !formData.email}>
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
