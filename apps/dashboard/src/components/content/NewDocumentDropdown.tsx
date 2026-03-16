'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightning, Layout, PencilSimple, CaretDown } from '@phosphor-icons/react';
import { mockBriefs } from './content-mock-data';

export function NewDocumentDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    {
      icon: <Lightning size={18} weight="regular" className="text-cc-cyan" />,
      label: 'From SAGE Brief',
      sublabel: `${mockBriefs.length} ready`,
      onClick: () => { setOpen(false); router.push('/app/content/new?view=briefs'); },
      highlight: true,
    },
    {
      icon: <Layout size={18} weight="regular" className="text-white/70" />,
      label: 'From Template',
      sublabel: '8 content types',
      onClick: () => { setOpen(false); router.push('/app/content/new?view=templates'); },
      highlight: false,
    },
    {
      icon: <PencilSimple size={18} weight="regular" className="text-white/70" />,
      label: 'Blank Document',
      sublabel: 'Open editor directly',
      onClick: () => { setOpen(false); router.push('/app/content/doc-new'); },
      highlight: false,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
      >
        + New
        <CaretDown size={14} weight="bold" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-cc-surface border border-white/12 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                i < options.length - 1 ? 'border-b border-white/8' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                opt.highlight ? 'bg-cc-cyan/10' : 'bg-white/5'
              }`}>
                {opt.icon}
              </div>
              <div>
                <p className={`text-sm font-medium ${opt.highlight ? 'text-white' : 'text-white/90'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-white/45">{opt.sublabel}</p>
              </div>
              {opt.highlight && (
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-cc-cyan bg-cc-cyan/10 px-1.5 py-0.5 rounded-full">
                  SAGE
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
