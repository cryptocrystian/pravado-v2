'use client';

/**
 * Impact Strip V1.1 - DS 3.0
 *
 * Compact UI element showing SAGE/EVI/AUTOMATE context.
 * Makes the system feel like an "organism," not disconnected modules.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md (V1.1 section)
 * @see /docs/canon/SAGE_OPERATING_MODEL.md
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

import type {
  SAGEContribution,
  EVIImpact,
  AutomationMode,
  ImpactStripData,
  SAGEDimension,
  EVIDriver,
  EVIDirection,
} from '../types';

// ============================================
// SAGE DIMENSION STYLING - DS3
// ============================================

const SAGE_DIMENSION_CONFIG: Record<SAGEDimension, { label: string; color: string; bgColor: string }> = {
  signal: {
    label: 'Signal',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/15',
  },
  authority: {
    label: 'Authority',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/15',
  },
  growth: {
    label: 'Growth',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
  },
  exposure: {
    label: 'Exposure',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/15',
  },
};

// ============================================
// EVI DRIVER STYLING - DS3
// ============================================

const EVI_DRIVER_CONFIG: Record<EVIDriver, { label: string; abbrev: string }> = {
  visibility: { label: 'Visibility', abbrev: 'Vis' },
  authority: { label: 'Authority', abbrev: 'Auth' },
  momentum: { label: 'Momentum', abbrev: 'Mom' },
};

const EVI_DIRECTION_CONFIG: Record<EVIDirection, { icon: string; color: string; symbol: string }> = {
  positive: {
    icon: '↑',
    color: 'text-semantic-success',
    symbol: '+',
  },
  neutral: {
    icon: '→',
    color: 'text-white/55',
    symbol: '○',
  },
  negative: {
    icon: '↓',
    color: 'text-semantic-danger',
    symbol: '−',
  },
};

// ============================================
// AUTOMATION MODE STYLING - DS3
// ============================================

const MODE_CONFIG: Record<AutomationMode, { label: string; color: string; bgColor: string; description: string }> = {
  manual: {
    label: 'Manual',
    color: 'text-white/55',
    bgColor: 'bg-white/10',
    description: 'User initiates and executes all actions',
  },
  copilot: {
    label: 'Copilot',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/15',
    description: 'System proposes and assists; user approves',
  },
  autopilot: {
    label: 'Autopilot',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    description: 'System executes within guardrails',
  },
};

// ============================================
// SAGE TAG COMPONENT
// ============================================

interface SAGETagProps {
  contribution: SAGEContribution;
  compact?: boolean;
}

function SAGETag({ contribution, compact = false }: SAGETagProps) {
  const config = SAGE_DIMENSION_CONFIG[contribution.dimension];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgColor} ${config.color} ${
        contribution.isPrimary ? 'ring-1 ring-current/30' : 'opacity-70'
      }`}
      title={`${config.label}${contribution.isPrimary ? ' (Primary)' : ''}`}
    >
      {compact ? config.label.charAt(0) : config.label}
    </span>
  );
}

// ============================================
// EVI INDICATOR COMPONENT
// ============================================

interface EVIIndicatorProps {
  impact: EVIImpact;
  compact?: boolean;
}

function EVIIndicator({ impact, compact = false }: EVIIndicatorProps) {
  const driverConfig = EVI_DRIVER_CONFIG[impact.driver];
  const directionConfig = EVI_DIRECTION_CONFIG[impact.direction];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 ${directionConfig.color}`}
      title={impact.explanation || `${driverConfig.label} ${directionConfig.symbol}`}
    >
      <span className="font-bold">{directionConfig.icon}</span>
      {!compact && <span>{driverConfig.abbrev}</span>}
    </span>
  );
}

// ============================================
// MODE BADGE COMPONENT
// ============================================

interface ModeBadgeProps {
  mode: AutomationMode;
  rationale?: string;
  compact?: boolean;
}

function ModeBadge({ mode, rationale, compact = false }: ModeBadgeProps) {
  const config = MODE_CONFIG[mode];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgColor} ${config.color}`}
      title={rationale || config.description}
    >
      {compact ? config.label.charAt(0) : config.label}
    </span>
  );
}

// ============================================
// MAIN IMPACT STRIP COMPONENT
// ============================================

interface ImpactStripProps {
  /** Full impact data */
  data?: ImpactStripData;
  /** Individual SAGE contributions (alternative to data) */
  sageContributions?: SAGEContribution[];
  /** EVI impact (alternative to data) */
  eviImpact?: EVIImpact;
  /** Automation mode (alternative to data) */
  mode?: AutomationMode;
  /** Mode rationale for tooltip */
  modeRationale?: string;
  /** Compact mode for tight spaces */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ImpactStrip({
  data,
  sageContributions,
  eviImpact,
  mode,
  modeRationale,
  compact = false,
  className = '',
}: ImpactStripProps) {
  // Use data object or individual props
  const sage = data?.sageContributions ?? sageContributions ?? [];
  const evi = data?.eviImpact ?? eviImpact;
  const automationMode = data?.mode ?? mode ?? 'manual';
  const rationale = data?.modeRationale ?? modeRationale;

  // Sort SAGE contributions: primary first
  const sortedSage = [...sage].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  return (
    <div
      className={`flex items-center gap-1.5 flex-wrap ${className}`}
      role="group"
      aria-label="Impact context"
    >
      {/* SAGE Contributions */}
      {sortedSage.length > 0 && (
        <div className="flex items-center gap-1">
          {sortedSage.slice(0, compact ? 2 : 4).map((contribution, index) => (
            <SAGETag
              key={`${contribution.dimension}-${index}`}
              contribution={contribution}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* EVI Direction */}
      {evi && <EVIIndicator impact={evi} compact={compact} />}

      {/* Mode Badge */}
      <ModeBadge mode={automationMode} rationale={rationale} compact={compact} />
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { SAGETag, EVIIndicator, ModeBadge };
export type { SAGETagProps, EVIIndicatorProps, ModeBadgeProps, ImpactStripProps };
