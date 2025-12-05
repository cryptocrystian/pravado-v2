/**
 * NarrativeTypeBadge Component (Sprint S70)
 *
 * Displays the type of a unified narrative with appropriate icon and colors
 */

'use client';

import React from 'react';
import {
  Briefcase,
  Target,
  TrendingUp,
  AlertTriangle,
  Eye,
  Star,
  Calendar,
  MessageCircle,
  FileText,
  Users,
  Zap,
  Edit3,
} from 'lucide-react';
import type { NarrativeType } from '@pravado/types';
import { getNarrativeTypeLabel } from '@/lib/unifiedNarrativeApi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NarrativeTypeBadgeProps {
  type: NarrativeType;
  className?: string;
  showIcon?: boolean;
}

const TYPE_ICONS: Record<NarrativeType, React.ReactNode> = {
  executive: <Briefcase className="h-3 w-3" />,
  strategy: <Target className="h-3 w-3" />,
  investor: <TrendingUp className="h-3 w-3" />,
  crisis: <AlertTriangle className="h-3 w-3" />,
  competitive_intelligence: <Eye className="h-3 w-3" />,
  reputation: <Star className="h-3 w-3" />,
  quarterly_context: <Calendar className="h-3 w-3" />,
  talking_points: <MessageCircle className="h-3 w-3" />,
  analyst_brief: <FileText className="h-3 w-3" />,
  internal_alignment_memo: <Users className="h-3 w-3" />,
  tldr_synthesis: <Zap className="h-3 w-3" />,
  custom: <Edit3 className="h-3 w-3" />,
};

const TYPE_COLORS: Record<NarrativeType, string> = {
  executive: 'bg-purple-100 text-purple-800 border-purple-300',
  strategy: 'bg-blue-100 text-blue-800 border-blue-300',
  investor: 'bg-green-100 text-green-800 border-green-300',
  crisis: 'bg-red-100 text-red-800 border-red-300',
  competitive_intelligence: 'bg-orange-100 text-orange-800 border-orange-300',
  reputation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  quarterly_context: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  talking_points: 'bg-teal-100 text-teal-800 border-teal-300',
  analyst_brief: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  internal_alignment_memo: 'bg-pink-100 text-pink-800 border-pink-300',
  tldr_synthesis: 'bg-lime-100 text-lime-800 border-lime-300',
  custom: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function NarrativeTypeBadge({
  type,
  className = '',
  showIcon = true,
}: NarrativeTypeBadgeProps) {
  const colorClass = TYPE_COLORS[type] || 'bg-gray-100 text-gray-800';
  const label = getNarrativeTypeLabel(type);
  const icon = TYPE_ICONS[type];

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
