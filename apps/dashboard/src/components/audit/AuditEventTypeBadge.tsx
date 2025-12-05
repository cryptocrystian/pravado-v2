'use client';

/**
 * Audit Event Type Badge (Sprint S36)
 * Visual indicator for audit event types with category coloring
 */

import { formatEventType } from '@/lib/auditApi';

interface AuditEventTypeBadgeProps {
  eventType: string;
  className?: string;
}

const categoryStyles: Record<string, { bg: string; text: string }> = {
  auth: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  user: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  billing: { bg: 'bg-amber-100', text: 'text-amber-800' },
  llm: { bg: 'bg-violet-100', text: 'text-violet-800' },
  playbook: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  pr: { bg: 'bg-pink-100', text: 'text-pink-800' },
  seo: { bg: 'bg-teal-100', text: 'text-teal-800' },
  content: { bg: 'bg-orange-100', text: 'text-orange-800' },
  system: { bg: 'bg-slate-100', text: 'text-slate-800' },
  admin: { bg: 'bg-rose-100', text: 'text-rose-800' },
};

export function AuditEventTypeBadge({ eventType, className = '' }: AuditEventTypeBadgeProps) {
  const category = eventType.split('.')[0];
  const style = categoryStyles[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      {formatEventType(eventType)}
    </span>
  );
}
