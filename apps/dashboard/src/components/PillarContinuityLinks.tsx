/**
 * Pillar Continuity Links (Sprint S93)
 *
 * Provides navigation links for cross-pillar insights:
 * - Source pillar (where the insight originated)
 * - Affected pillars (where the insight has impact)
 * - Action paths (what can be done in each pillar)
 */

'use client';

import Link from 'next/link';

// Types
export interface PillarLinkInfo {
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  role: 'source' | 'affected' | 'action';
  actionPath?: string;
  actionLabel?: string;
}

// Pillar metadata
const pillarMeta: Record<
  string,
  { label: string; href: string; color: string; bgColor: string; borderColor: string }
> = {
  pr: {
    label: 'PR Intelligence',
    href: '/app/pr',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/10',
    borderColor: 'border-brand-iris/20',
  },
  content: {
    label: 'Content Hub',
    href: '/app/content',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
    borderColor: 'border-brand-cyan/20',
  },
  seo: {
    label: 'SEO Performance',
    href: '/app/seo',
    color: 'text-brand-magenta',
    bgColor: 'bg-brand-magenta/10',
    borderColor: 'border-brand-magenta/20',
  },
  exec: {
    label: 'Executive Hub',
    href: '/app/exec',
    color: 'text-brand-amber',
    bgColor: 'bg-brand-amber/10',
    borderColor: 'border-brand-amber/20',
  },
  crisis: {
    label: 'Crisis Management',
    href: '/app/exec/crisis',
    color: 'text-semantic-danger',
    bgColor: 'bg-semantic-danger/10',
    borderColor: 'border-semantic-danger/20',
  },
};

// Role labels
const roleLabels: Record<string, string> = {
  source: 'From',
  affected: 'Affects',
  action: 'Act in',
};

interface PillarContinuityLinksProps {
  links: PillarLinkInfo[];
  layout?: 'inline' | 'stacked';
  showLabels?: boolean;
}

/**
 * Displays pillar links for cross-pillar navigation
 */
export function PillarContinuityLinks({
  links,
  layout = 'inline',
  showLabels = true,
}: PillarContinuityLinksProps) {
  if (links.length === 0) return null;

  const containerClass = layout === 'inline' ? 'flex flex-wrap items-center gap-2' : 'space-y-2';

  return (
    <div className={containerClass}>
      {links.map((link, idx) => {
        const meta = pillarMeta[link.pillar];
        if (!meta) return null;

        const href = link.actionPath || meta.href;

        return (
          <div key={idx} className="flex items-center gap-1.5">
            {showLabels && <span className="text-[10px] text-slate-6 uppercase">{roleLabels[link.role]}</span>}
            <Link
              href={href}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border transition-all hover:shadow-sm ${meta.bgColor} ${meta.color} ${meta.borderColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {link.actionLabel || meta.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Single pillar badge with navigation
 */
export function PillarBadge({
  pillar,
  actionPath,
  actionLabel,
  size = 'sm',
}: {
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  actionPath?: string;
  actionLabel?: string;
  size?: 'sm' | 'md';
}) {
  const meta = pillarMeta[pillar];
  if (!meta) return null;

  const href = actionPath || meta.href;
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded font-medium border transition-all hover:shadow-sm ${meta.bgColor} ${meta.color} ${meta.borderColor}`}
    >
      <span className={`rounded-full bg-current ${size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      {actionLabel || meta.label}
    </Link>
  );
}

/**
 * Helper to determine pillar from source system
 */
export function getPillarFromSource(sourceSystem: string): 'pr' | 'content' | 'seo' | 'exec' | 'crisis' {
  const sourceMap: Record<string, 'pr' | 'content' | 'seo' | 'exec' | 'crisis'> = {
    media_monitoring: 'pr',
    journalist_intel: 'pr',
    press_release: 'pr',
    content_quality: 'content',
    content_calendar: 'content',
    brief_generator: 'content',
    seo_tracking: 'seo',
    keyword_intel: 'seo',
    serp_analysis: 'seo',
    crisis_radar: 'crisis',
    risk_detection: 'crisis',
    executive_digest: 'exec',
    playbook_engine: 'exec',
    scenario_simulation: 'exec',
  };
  return sourceMap[sourceSystem] || 'exec';
}

/**
 * Helper to generate affected pillars based on insight type
 */
export function getAffectedPillars(
  sourcePillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis',
  isRisk: boolean,
  isOpportunity: boolean
): PillarLinkInfo[] {
  const affected: PillarLinkInfo[] = [];

  if (isRisk) {
    // Risks always affect executive layer
    if (sourcePillar !== 'exec') {
      affected.push({ pillar: 'exec', role: 'affected' });
    }
    // PR risks affect content messaging
    if (sourcePillar === 'pr') {
      affected.push({ pillar: 'content', role: 'affected' });
    }
    // Crisis affects all pillars
    if (sourcePillar === 'crisis') {
      affected.push({ pillar: 'pr', role: 'affected' });
      affected.push({ pillar: 'content', role: 'affected' });
    }
  }

  if (isOpportunity) {
    // Opportunities inform content
    if (sourcePillar !== 'content') {
      affected.push({ pillar: 'content', role: 'affected' });
    }
    // SEO opportunities affect content
    if (sourcePillar === 'seo') {
      affected.push({ pillar: 'content', role: 'action', actionLabel: 'Create Brief' });
    }
    // PR opportunities may have SEO impact
    if (sourcePillar === 'pr') {
      affected.push({ pillar: 'seo', role: 'affected' });
    }
  }

  return affected;
}

export default PillarContinuityLinks;
