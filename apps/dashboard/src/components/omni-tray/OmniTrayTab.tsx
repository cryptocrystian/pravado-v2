'use client';

import { Sparkle } from '@phosphor-icons/react';
import { useOmniTray, OmniTrayEdge } from './useOmniTray';

interface OmniTrayTabProps {
  edge: OmniTrayEdge;
}

export function OmniTrayTab({ edge }: OmniTrayTabProps) {
  const { proximityLevels, isOpen, activeEdge, open } = useOmniTray();
  const level = proximityLevels[edge];

  if (isOpen && activeEdge === edge) return null;

  // Sliver → full expansion driven by proximity level
  // At level 0: 4px sliver. At level 1: full tab size.
  const sliverMin = 4;
  const sliverMax = 40;
  const lengthMin = 20;
  const lengthMax = 72;

  const thickness = sliverMin + level * (sliverMax - sliverMin); // 4px → 40px
  const length = lengthMin + level * (lengthMax - lengthMin);     // 20px → 72px

  const glowOpacity = level * 0.5;
  const glowSize = level * 24;
  const iconOpacity = Math.max(0, (level - 0.3) / 0.7); // only visible above 30% proximity

  const positionStyles: Record<OmniTrayEdge, React.CSSProperties> = {
    left: {
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: `${thickness}px`,
      height: `${length}px`,
      borderRadius: '0 8px 8px 0',
      flexDirection: 'column',
    },
    right: {
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: `${thickness}px`,
      height: `${length}px`,
      borderRadius: '8px 0 0 8px',
      flexDirection: 'column',
    },
    bottom: {
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: `${length}px`,
      height: `${thickness}px`,
      borderRadius: '8px 8px 0 0',
      flexDirection: 'row',
    },
  };

  return (
    <button
      onClick={() => open(edge)}
      className="fixed z-40 flex items-center justify-center
        backdrop-blur-sm cursor-pointer overflow-hidden"
      style={{
        ...positionStyles[edge],
        background: `rgba(15, 15, 25, ${0.4 + level * 0.5})`,
        borderWidth: level > 0.05 ? '1px' : '0px',
        borderStyle: 'solid',
        borderColor: `rgba(0, 217, 255, ${level * 0.3})`,
        boxShadow: level > 0.05
          ? `0 0 ${glowSize}px rgba(0, 217, 255, ${glowOpacity})`
          : 'none',
        transition: 'width 120ms ease-out, height 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out',
      }}
      aria-label={`Open AI tray from ${edge}`}
    >
      <Sparkle
        weight="regular"
        className="w-4 h-4 text-brand-cyan flex-shrink-0"
        style={{
          opacity: iconOpacity,
          transition: 'opacity 100ms ease-out',
        }}
      />
    </button>
  );
}
