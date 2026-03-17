'use client';

/**
 * Pravado Logo System — "Orchestration Monolith" / Nexus-P
 *
 * Features:
 * - 1px "Silo Gap" (Drift Gap)
 * - 45-degree chamfered hexagon bowl
 * - Animated "Authority Node" Pulse Dot
 * - Cyber-Industrial color palette (#00D9FF cyan, #A855F7 iris)
 */

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function PravadoLogoIcon({ size = 48, className = '' }: LogoIconProps) {
  const strokeWidth = 14;
  const gap = 1.5;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* THE STEM (Infrastructure - Cyber Blue) */}
        <rect
          x="15"
          y="10"
          width={strokeWidth}
          height="80"
          fill="#00D9FF"
          rx="2"
        />

        {/* THE BOWL (Intelligence - Electric Purple) */}
        <path
          d={`
            M 31.5 10
            H 75
            L 90 25
            V 55
            L 75 70
            H 31.5
            V 10
            Z
          `}
          fill="#A855F7"
          style={{ transform: `translateX(${gap}px)` }}
        />

        {/* THE VOID (Inner Hexagon cutout) */}
        <path
          d={`
            M 45.5 24
            H 68
            L 76 32
            V 48
            L 68 56
            H 45.5
            V 24
            Z
          `}
          fill="currentColor"
          className="text-black"
          style={{ transform: `translateX(${gap}px)` }}
        />

        {/* THE AUTHORITY NODE (Pulse Dot) */}
        <circle
          cx={62 + gap}
          cy={40}
          r="4"
          fill="white"
        >
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

interface WordmarkProps {
  fontSize?: string;
  className?: string;
}

export function PravadoWordmark({ fontSize = '24px', className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-mono font-bold tracking-[0.15em] text-white ${className}`}
      style={{ fontSize, marginLeft: '0.5em' }}
    >
      PRAVADO
    </span>
  );
}

interface PravadoLogoProps {
  iconSize?: number;
  fontSize?: string;
  className?: string;
}

export function PravadoLogo({ iconSize = 48, fontSize = '24px', className = '' }: PravadoLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <PravadoLogoIcon size={iconSize} />
      <PravadoWordmark fontSize={fontSize} />
    </div>
  );
}
