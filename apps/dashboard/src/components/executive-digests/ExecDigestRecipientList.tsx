/**
 * Executive Digest Recipient List Component (Sprint S62)
 * Manages digest recipients with add/remove functionality
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  type ExecDigestRecipient,
} from '@/lib/executiveDigestApi';
import type { AddExecDigestRecipientInput } from '@pravado/validators';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Mail,
  FileText,
  Eye,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface ExecDigestRecipientListProps {
  recipients: ExecDigestRecipient[];
  isLoading?: boolean;
  onAdd?: (data: AddExecDigestRecipientInput) => Promise<void>;
  onRemove?: (recipientId: string) => Promise<void>;
  onToggleActive?: (recipientId: string, isActive: boolean) => Promise<void>;
  className?: string;
}

export function ExecDigestRecipientList({
  recipients,
  isLoading: _isLoading,
  onAdd,
  onRemove,
  onToggleActive,
  className,
}: ExecDigestRecipientListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState<AddExecDigestRecipientInput>({
    email: '',
    name: '',
    role: '',
    includePdf: true,
    includeInlineSummary: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRecipient = async () => {
    if (!newRecipient.email || !onAdd) return;

    setIsSubmitting(true);
    try {
      await onAdd(newRecipient);
      setNewRecipient({
        email: '',
        name: '',
        role: '',
        includePdf: true,
        includeInlineSummary: true,
      });
      setIsAddDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRecipients = recipients.filter((r) => r.isActive);
  const inactiveRecipients = recipients.filter((r) => !r.isActive);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />
          Recipients ({activeRecipients.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recipient</DialogTitle>
              <DialogDescription>
                Add an email address to receive digest deliveries.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="executive@company.com"
                  value={newRecipient.email}
                  onChange={(e) =>
                    setNewRecipient({ ...newRecipient, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={newRecipient.name || ''}
                  onChange={(e) =>
                    setNewRecipient({ ...newRecipient, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="CEO, VP Marketing, etc."
                  value={newRecipient.role || ''}
                  onChange={(e) =>
                    setNewRecipient({ ...newRecipient, role: e.target.value })
                  }
                />
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include PDF Attachment</Label>
                    <p className="text-xs text-gray-500">
                      Attach the digest as a PDF file
                    </p>
                  </div>
                  <Switch
                    checked={newRecipient.includePdf}
                    onCheckedChange={(checked) =>
                      setNewRecipient({ ...newRecipient, includePdf: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Inline Summary</Label>
                    <p className="text-xs text-gray-500">
                      Include summary content in email body
                    </p>
                  </div>
                  <Switch
                    checked={newRecipient.includeInlineSummary}
                    onCheckedChange={(checked) =>
                      setNewRecipient({ ...newRecipient, includeInlineSummary: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRecipient}
                disabled={!newRecipient.email || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Recipient'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No recipients added yet.</p>
            <p className="text-sm mt-1">Add recipients to receive digest deliveries.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active Recipients */}
            {activeRecipients.map((recipient) => (
              <RecipientRow
                key={recipient.id}
                recipient={recipient}
                onRemove={onRemove}
                onToggleActive={onToggleActive}
              />
            ))}

            {/* Inactive Recipients */}
            {inactiveRecipients.length > 0 && (
              <>
                <div className="text-xs text-gray-500 pt-4 pb-2 border-t">
                  Inactive ({inactiveRecipients.length})
                </div>
                {inactiveRecipients.map((recipient) => (
                  <RecipientRow
                    key={recipient.id}
                    recipient={recipient}
                    onRemove={onRemove}
                    onToggleActive={onToggleActive}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecipientRowProps {
  recipient: ExecDigestRecipient;
  onRemove?: (recipientId: string) => Promise<void>;
  onToggleActive?: (recipientId: string, isActive: boolean) => Promise<void>;
}

function RecipientRow({ recipient, onRemove, onToggleActive }: RecipientRowProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsRemoving(true);
    try {
      await onRemove(recipient.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border bg-white',
        !recipient.isActive && 'opacity-60 bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
            recipient.isActive ? 'bg-indigo-500' : 'bg-gray-400'
          )}
        >
          {recipient.name?.charAt(0).toUpperCase() || recipient.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {recipient.name || recipient.email}
            </span>
            {recipient.isValidated && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
          </div>
          {recipient.name && (
            <div className="text-xs text-gray-500">{recipient.email}</div>
          )}
          {recipient.role && (
            <div className="text-xs text-gray-400">{recipient.role}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Delivery preferences badges */}
        <div className="flex items-center gap-1">
          {recipient.includePdf && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              PDF
            </Badge>
          )}
          {recipient.includeInlineSummary && (
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Inline
            </Badge>
          )}
        </div>

        {/* Toggle active */}
        <Switch
          checked={recipient.isActive}
          onCheckedChange={(checked) => onToggleActive?.(recipient.id, checked)}
        />

        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
