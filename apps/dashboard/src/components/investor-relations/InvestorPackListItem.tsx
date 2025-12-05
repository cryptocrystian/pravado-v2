/**
 * Investor Pack List Item Component (Sprint S64)
 * Displays a single pack in list view
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type InvestorPack,
  getFormatLabel,
  getStatusLabel,
  getStatusColor,
  getAudienceLabel,
  formatPeriodRange,
  formatFiscalQuarter,
  formatRelativeTime,
} from '@/lib/investorRelationsApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  ChevronRight,
  Calendar,
  Users,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface InvestorPackListItemProps {
  pack: InvestorPack;
  className?: string;
}

export function InvestorPackListItem({ pack, className }: InvestorPackListItemProps) {
  const statusColor = getStatusColor(pack.status);

  return (
    <Card className={cn('hover:bg-gray-50 transition-colors', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{pack.title}</h3>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  statusColor === 'green' && 'bg-green-100 text-green-700',
                  statusColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
                  statusColor === 'blue' && 'bg-blue-100 text-blue-700',
                  statusColor === 'indigo' && 'bg-indigo-100 text-indigo-700',
                  statusColor === 'gray' && 'bg-gray-100 text-gray-700'
                )}
              >
                {getStatusLabel(pack.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatPeriodRange(pack.periodStart, pack.periodEnd)}
              </span>
              {pack.fiscalQuarter && (
                <span>{formatFiscalQuarter(pack.fiscalQuarter, pack.fiscalYear)}</span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getAudienceLabel(pack.primaryAudience)}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {pack.sectionTypes.length} sections
              </span>
            </div>

            {pack.description && (
              <p className="mt-1 text-sm text-gray-600 truncate">{pack.description}</p>
            )}
          </div>

          {/* Meta */}
          <div className="text-right text-sm text-gray-400 flex-shrink-0">
            <div>{getFormatLabel(pack.format)}</div>
            <div>{formatRelativeTime(pack.createdAt)}</div>
          </div>

          {/* Action */}
          <Link href={`/app/exec/investors/${pack.id}`}>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
