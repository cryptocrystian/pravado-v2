/**
 * NarrativeStatusBadge Component (Sprint S70)
 *
 * Displays the workflow status of a unified narrative with appropriate colors
 */

'use client';

import React from 'react';
import {
  FileEdit,
  Loader2,
  Clock,
  CheckCircle2,
  Send,
  Archive,
} from 'lucide-react';
import type { NarrativeStatus } from '@pravado/types';
import { getStatusLabel, getStatusColor } from '@/lib/unifiedNarrativeApi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NarrativeStatusBadgeProps {
  status: NarrativeStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_ICONS: Record<NarrativeStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  generating: <Loader2 className="h-3 w-3 animate-spin" />,
  review: <Clock className="h-3 w-3" />,
  approved: <CheckCircle2 className="h-3 w-3" />,
  published: <Send className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
};

export default function NarrativeStatusBadge({
  status,
  className = '',
  showIcon = true,
}: NarrativeStatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);
  const icon = STATUS_ICONS[status];

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', colorClass, className)}
    >
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}
