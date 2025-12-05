/**
 * NarrativeWorkflowActions Component (Sprint S70)
 *
 * Workflow action buttons for narrative lifecycle management
 */

'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Send,
  Archive,
  RefreshCw,
  Download,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import type { UnifiedNarrative } from '@pravado/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NarrativeWorkflowActionsProps {
  narrative: UnifiedNarrative;
  onApprove?: (comments?: string) => Promise<void>;
  onPublish?: (channels?: string[]) => Promise<void>;
  onArchive?: (reason?: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
  onExport?: (format: 'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json') => Promise<void>;
  className?: string;
}

type DialogType = 'approve' | 'publish' | 'archive' | 'export' | null;

export default function NarrativeWorkflowActions({
  narrative,
  onApprove,
  onPublish,
  onArchive,
  onRegenerate,
  onExport,
  className = '',
}: NarrativeWorkflowActionsProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json'>('pdf');

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
      setActiveDialog(null);
      setComments('');
      setArchiveReason('');
    } finally {
      setIsLoading(false);
    }
  };

  const canApprove =
    narrative.status === 'draft' || narrative.status === 'review';
  const canPublish = narrative.status === 'approved';
  const canArchive = narrative.status !== 'archived';
  const canRegenerate =
    narrative.status === 'draft' || narrative.status === 'review';

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Primary Actions */}
        {canApprove && onApprove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveDialog('approve')}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve
          </Button>
        )}

        {canPublish && onPublish && (
          <Button size="sm" onClick={() => setActiveDialog('publish')}>
            <Send className="h-4 w-4 mr-1" />
            Publish
          </Button>
        )}

        {canRegenerate && onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(onRegenerate)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Regenerate
          </Button>
        )}

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onExport && (
              <DropdownMenuItem onClick={() => setActiveDialog('export')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            )}
            {canArchive && onArchive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setActiveDialog('archive')}
                  className="text-red-600"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={activeDialog === 'approve'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Narrative</DialogTitle>
            <DialogDescription>
              Approving this narrative will mark it ready for publication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalComments">Comments (Optional)</Label>
              <Textarea
                id="approvalComments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any approval comments..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleAction(() => onApprove!(comments || undefined))
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog
        open={activeDialog === 'publish'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Narrative</DialogTitle>
            <DialogDescription>
              Publishing will make this narrative available to stakeholders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(() => onPublish!())}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog
        open={activeDialog === 'archive'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Narrative</DialogTitle>
            <DialogDescription>
              Archiving will remove this narrative from active views. This action
              can be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archiveReason">Reason (Optional)</Label>
              <Textarea
                id="archiveReason"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="Why are you archiving this narrative?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleAction(() => onArchive!(archiveReason || undefined))
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={activeDialog === 'export'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Narrative</DialogTitle>
            <DialogDescription>
              Choose an export format for this narrative.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as typeof exportFormat)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="md">Markdown</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialog(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(() => onExport!(exportFormat))}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
