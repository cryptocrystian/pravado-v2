'use client';

import {
  Microphone,
  ChatCircle,
  ListNumbers,
  ChartBar,
  Newspaper,
  PenNib,
  MagnifyingGlass,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import type { ContentTemplate, TemplateTag } from './content-mock-data';

const iconMap: Record<string, React.ComponentType<IconProps>> = {
  microphone: Microphone,
  'chat-circle': ChatCircle,
  'list-numbers': ListNumbers,
  'chart-bar': ChartBar,
  newspaper: Newspaper,
  'pen-nib': PenNib,
  'magnifying-glass': MagnifyingGlass,
  'envelope-simple': EnvelopeSimple,
};

const tagConfig: Record<TemplateTag, string> = {
  'High AEO Impact': 'bg-cc-cyan/10 text-cc-cyan',
  'PR-Ready': 'bg-brand-iris/10 text-brand-iris',
  'SEO-Focused': 'bg-blue-500/10 text-blue-400',
  'Quick <500 words': 'bg-amber-500/10 text-amber-500',
};

interface TemplateCardProps {
  template: ContentTemplate;
  onClick?: (template: ContentTemplate) => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const Icon = iconMap[template.icon] ?? Microphone;

  return (
    <button
      type="button"
      onClick={() => onClick?.(template)}
      className="bg-cc-surface border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-white/[0.16] transition-colors text-left w-full group"
    >
      <Icon size={28} className="text-cc-cyan" weight="regular" />

      <h4 className="text-base font-semibold text-white mt-3">{template.name}</h4>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-1.5 py-0.5 rounded ${tagConfig[tag] ?? 'bg-white/5 text-white/45'}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-sm text-white/70 mt-2 leading-relaxed">{template.description}</p>

      <p className="text-xs text-cc-cyan mt-3">Est. CiteMind boost: {template.citeMindBoost}</p>

      <span className="text-sm font-medium text-cc-cyan mt-3 opacity-0 group-hover:opacity-100 transition-opacity block">
        Use this template &rarr;
      </span>
    </button>
  );
}
