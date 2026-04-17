'use client';

type BrandNameType = 'SAGE' | 'CRAFT' | 'CiteMind' | 'EVI';

interface BrandNameProps {
  name: BrandNameType;
  showTM?: boolean;
  className?: string;
}

/**
 * BrandName — renders a Pravado product name with consistent TM symbol.
 *
 * SAGE™    = Signal · Authority · Growth · Exposure
 * CRAFT™   = Coordinated Response & Action Flow Technology
 * CiteMind™ = AI citation intelligence engine
 * EVI™     = Earned Visibility Index
 */
export function BrandName({ name, showTM = true, className }: BrandNameProps) {
  return (
    <span className={className}>
      {name}
      {showTM && (
        <sup style={{ fontSize: '0.6em', verticalAlign: 'super', marginLeft: '0.05em', opacity: 0.8 }}>
          &trade;
        </sup>
      )}
    </span>
  );
}
