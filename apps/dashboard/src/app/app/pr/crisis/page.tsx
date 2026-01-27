'use client';

/**
 * Crisis Hub - PR Pillar Deep Link Destination
 * Sprint S100.2: Command Center deep link support
 *
 * Renders a crisis management interface for PR incidents.
 * Accessible via: /app/pr/crisis?incident=<id>
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/COMMAND_CENTER_GOLDEN_FLOW.md
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface CrisisIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'monitoring' | 'resolved';
  detectedAt: string;
  summary: string;
  recommendedActions: string[];
  impactedRelationships: {
    name: string;
    outlet: string;
    relationship: 'key' | 'active' | 'dormant';
    riskLevel: 'high' | 'medium' | 'low';
  }[];
}

// ============================================
// MOCK DATA (for demo/empty states)
// ============================================

const MOCK_INCIDENT: CrisisIncident = {
  id: 'demo',
  title: 'Example Crisis Scenario',
  severity: 'high',
  status: 'active',
  detectedAt: new Date().toISOString(),
  summary: 'This is a demonstration of the Crisis Hub interface. When a real incident is detected, this page will show relevant details and recommended actions.',
  recommendedActions: [
    'Review the situation summary and assess severity',
    'Prepare a holding statement using the template below',
    'Identify key journalists who may cover this story',
    'Coordinate with internal stakeholders before external communication',
  ],
  impactedRelationships: [
    { name: 'Sarah Chen', outlet: 'TechCrunch', relationship: 'key', riskLevel: 'high' },
    { name: 'Michael Rodriguez', outlet: 'The Verge', relationship: 'active', riskLevel: 'medium' },
    { name: 'Emily Watson', outlet: 'Wired', relationship: 'dormant', riskLevel: 'low' },
  ],
};

// ============================================
// COMPONENTS
// ============================================

function SeverityBadge({ severity }: { severity: CrisisIncident['severity'] }) {
  const styles = {
    critical: 'bg-semantic-error/20 text-semantic-error border-semantic-error/30',
    high: 'bg-semantic-warning/20 text-semantic-warning border-semantic-warning/30',
    medium: 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30',
    low: 'bg-white/10 text-white/70 border-white/20',
  };

  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: CrisisIncident['status'] }) {
  const styles = {
    active: 'bg-semantic-error/10 text-semantic-error',
    monitoring: 'bg-semantic-warning/10 text-semantic-warning',
    resolved: 'bg-semantic-success/10 text-semantic-success',
  };

  const icons = {
    active: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" className="animate-pulse" />
      </svg>
    ),
    monitoring: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    resolved: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-medium rounded-lg ${styles[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'text-semantic-error',
    medium: 'text-semantic-warning',
    low: 'text-white/55',
  };

  return <span className={`text-[13px] font-medium ${styles[level]}`}>{level} risk</span>;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CrisisHubPage() {
  const searchParams = useSearchParams();
  const incidentId = searchParams?.get('incident') ?? null;

  // In a real implementation, this would fetch from API based on incidentId
  const incident = useMemo(() => {
    if (!incidentId) return null;
    // For now, return mock data for any incident ID
    return { ...MOCK_INCIDENT, id: incidentId, title: `Crisis Incident: ${incidentId}` };
  }, [incidentId]);

  const [holdingStatement, setHoldingStatement] = useState(
    `We are aware of the situation and are actively investigating. We take this matter seriously and will provide updates as more information becomes available. For media inquiries, please contact [media@company.com].`
  );

  // Empty state when no incident specified
  if (!incident) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-magenta/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Crisis Hub</h2>
          <p className="text-[15px] text-white/55 mb-6">
            No active incident selected. Crisis incidents will appear here when detected by SAGE or created manually.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/app/pr"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Back to PR
            </Link>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-magenta rounded-lg hover:bg-brand-magenta/90 transition-colors"
            >
              Create Incident
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/app/pr"
              className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-white">Crisis Hub</h1>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <p className="text-[15px] text-white/55 ml-9">
            Incident ID: <span className="text-white/70 font-mono">{incident.id}</span>
            <span className="mx-2 text-white/30">|</span>
            Detected: {new Date(incident.detectedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            View Timeline
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-brand-magenta rounded-lg hover:bg-brand-magenta/90 transition-colors"
          >
            Escalate
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Situation & Response */}
        <div className="lg:col-span-2 space-y-6">
          {/* Situation Summary */}
          <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Situation Summary
            </h3>
            <p className="text-[15px] text-white/70 leading-relaxed">{incident.summary}</p>
          </div>

          {/* Recommended Response */}
          <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Recommended Response
            </h3>
            <ul className="space-y-2">
              {incident.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[15px] text-white/70">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-cyan/10 text-brand-cyan text-[13px] font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Draft Holding Statement */}
          <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Draft Holding Statement
            </h3>
            <textarea
              value={holdingStatement}
              onChange={(e) => setHoldingStatement(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-[#13131A] border border-[#1A1A24] rounded-lg text-[15px] text-white/85 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-iris/30 focus:border-brand-iris resize-none"
              placeholder="Draft your holding statement..."
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[13px] text-white/40">{holdingStatement.length} characters</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-[13px] font-medium text-white/55 hover:text-white transition-colors"
                >
                  Reset to Template
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-[13px] font-medium text-brand-iris hover:text-brand-iris/80 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Relationships & Actions */}
        <div className="space-y-6">
          {/* Impacted Relationships */}
          <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Impacted Relationships
            </h3>
            <div className="space-y-3">
              {incident.impactedRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#13131A] border border-[#1A1A24]"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{rel.name}</div>
                    <div className="text-[13px] text-white/55">{rel.outlet}</div>
                  </div>
                  <RiskBadge level={rel.riskLevel} />
                </div>
              ))}
            </div>
            <Link
              href="/app/pr?view=database"
              className="block mt-3 text-center text-[13px] font-medium text-brand-magenta hover:text-brand-magenta/80 transition-colors"
            >
              View All Contacts
            </Link>
          </div>

          {/* Next Best Actions */}
          <div className="p-5 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Next Best Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/app/pr?view=inbox"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#13131A] border border-[#1A1A24] hover:border-white/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-magenta/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-brand-magenta transition-colors">PR Inbox</div>
                  <div className="text-[13px] text-white/55">Monitor incoming inquiries</div>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/55 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/app/pr?view=pitches"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#13131A] border border-[#1A1A24] hover:border-white/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-iris/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-brand-iris transition-colors">Pitch Pipeline</div>
                  <div className="text-[13px] text-white/55">Pause or adjust active pitches</div>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/55 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/app/pr?view=coverage"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#13131A] border border-[#1A1A24] hover:border-white/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">Coverage Monitor</div>
                  <div className="text-[13px] text-white/55">Track emerging coverage</div>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/55 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
