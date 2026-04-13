'use client';

/**
 * Reports — /app/analytics/reports
 * Report builder with print-to-PDF generation for all 4 templates.
 */

import { useRef, useCallback, useState } from 'react';
import { FileText, Printer, SpinnerGap } from '@phosphor-icons/react';
import { mockReportTemplates } from '@/components/analytics/analytics-mock-data';
import { ExecutiveSummaryReport } from '@/components/analytics/reports/ExecutiveSummaryReport';
import { PRCampaignReport } from '@/components/analytics/reports/PRCampaignReport';
import { BoardInvestorUpdate } from '@/components/analytics/reports/BoardInvestorUpdate';
import { SEOPresenceReport } from '@/components/analytics/reports/SEOPresenceReport';
import { generatePdf } from '@/lib/pdf-export';

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const execRef = useRef<HTMLDivElement>(null);
  const prRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const seoRef = useRef<HTMLDivElement>(null);

  const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
    'Monthly Executive Summary': execRef,
    'PR Campaign Report': prRef,
    'Board / Investor Update': boardRef,
    'Client Report': seoRef,
  };

  const handleGenerate = useCallback((templateTitle: string) => {
    const ref = refMap[templateTitle];
    if (!ref?.current || generating) return;

    setGenerating(templateTitle);

    // setTimeout lets React paint the loading state before window.print() blocks
    setTimeout(() => {
      try {
        generatePdf(ref.current!, `pravado-${templateTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[PDF] Generation failed:', msg);
        alert('PDF generation failed: ' + msg);
      } finally {
        setGenerating(null);
      }
    }, 50);
  }, [generating]);

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto">
        {/* Report Builder */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-8 text-center mb-6">
          <FileText size={48} className="text-cc-cyan mx-auto" weight="regular" />
          <h2 className="text-xl font-bold text-white mt-4">Report Builder</h2>
          <p className="text-sm text-white/70 mt-2 mb-2 max-w-md mx-auto leading-relaxed">
            Generate shareable reports for leadership, clients, or boards.
            Select a template and use &ldquo;Save as PDF&rdquo; in the print dialog.
          </p>
        </div>

        {/* Templates */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Report Templates
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {mockReportTemplates.map((tpl) => (
            <div
              key={tpl.title}
              className="bg-cc-surface border border-white/8 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{tpl.title}</h4>
              </div>
              <p className="text-xs text-white/45 leading-relaxed mb-3">{tpl.desc}</p>
              <button
                type="button"
                onClick={() => handleGenerate(tpl.title)}
                disabled={generating !== null}
                className="flex items-center gap-1.5 bg-brand-cyan text-slate-0 rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === tpl.title ? (
                  <>
                    <SpinnerGap size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Printer size={14} weight="bold" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden report render targets (off-screen, light theme for print capture) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
        <div ref={execRef}><ExecutiveSummaryReport orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={prRef}><PRCampaignReport orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={boardRef}><BoardInvestorUpdate orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={seoRef}><SEOPresenceReport orgName="Pravado" period="Last 30 Days" /></div>
      </div>
    </div>
  );
}
