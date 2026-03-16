'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  PencilLine,
  Paragraph,
  Article,
  ListBullets,
  ArrowsClockwise,
  TextAlignLeft,
  MagnifyingGlassPlus,
  CheckCircle,
  Image,
  Table,
  Info,
  Minus,
  TextHTwo,
  TextHThree,
  ListNumbers,
  Microphone,
} from '@phosphor-icons/react';
import { slashCommands, slashCommandCategories } from './editor-mock-data';
import type { SlashCommand } from './editor-mock-data';

const iconMap: Record<string, typeof PencilLine> = {
  PencilLine,
  Paragraph,
  Article,
  ListBullets,
  ArrowsClockwise,
  TextAlignLeft,
  MagnifyingGlassPlus,
  CheckCircle,
  Image,
  Table,
  Info,
  Minus,
  TextHTwo,
  TextHThree,
  ListNumbers,
  Microphone,
};

const categoryColors: Record<string, string> = {
  'ai-generate': 'text-cc-cyan',
  rewrite: 'text-brand-iris',
  insert: 'text-cc-cyan',
  structure: 'text-white/70',
  brand: 'text-amber-400',
};

interface SlashCommandPaletteProps {
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  filter: string;
}

export function SlashCommandPalette({
  position,
  onSelect,
  onClose,
  filter,
}: SlashCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCommands = useMemo(() => {
    if (!filter) return slashCommands;
    const lower = filter.toLowerCase();
    return slashCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower),
    );
  }, [filter]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; label: string; commands: SlashCommand[] }[] = [];
    for (const cat of slashCommandCategories) {
      const cmds = filteredCommands.filter((c) => c.category === cat.id);
      if (cmds.length > 0) {
        groups.push({ category: cat.id, label: cat.label, commands: cmds });
      }
    }
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(
    () => grouped.flatMap((g) => g.commands),
    [grouped],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + flatCommands.length) % flatCommands.length,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          onSelect(flatCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flatCommands, selectedIndex, onSelect, onClose]);

  if (flatCommands.length === 0) {
    return (
      <div
        className="fixed z-50 bg-cc-surface border border-white/8 rounded-xl shadow-2xl p-3 w-[280px]"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-xs text-white/30 text-center py-2">
          No matching commands
        </p>
      </div>
    );
  }

  let flatIndex = 0;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-cc-surface border border-white/8 rounded-xl shadow-2xl py-2 w-[280px] max-h-[360px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {grouped.map((group) => (
        <div key={group.category}>
          <div className="px-3 py-1.5">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${categoryColors[group.category] ?? 'text-white/45'}`}
            >
              {group.label}
            </span>
          </div>
          {group.commands.map((cmd) => {
            const Icon = iconMap[cmd.iconName] ?? PencilLine;
            const isCurrent = flatIndex === selectedIndex;
            const currentIdx = flatIndex;
            flatIndex++;
            return (
              <button
                key={cmd.id}
                type="button"
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(currentIdx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  isCurrent ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <Icon size={16} className="text-white/45 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white/90 block">{cmd.name}</span>
                  <span className="text-xs text-white/30 block truncate">
                    {cmd.description}
                  </span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-white/30 font-mono flex-shrink-0">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
