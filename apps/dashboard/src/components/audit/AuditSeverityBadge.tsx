'use client';

/**
 * Audit Severity Badge (Sprint S36)
 * Visual indicator for audit event severity levels
 */

import type { AuditSeverity } from '@/lib/auditApi';

interface AuditSeverityBadgeProps {
  severity: AuditSeverity;
  className?: string;
}

const severityStyles: Record<AuditSeverity, { bg: string; text: string; dot: string }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  error: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
  critical: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400' },
};

export function AuditSeverityBadge({ severity, className = '' }: AuditSeverityBadgeProps) {
  const style = severityStyles[severity] || severityStyles.info;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}
