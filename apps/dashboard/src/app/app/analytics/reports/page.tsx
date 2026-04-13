'use client';

/**
 * Reports — /app/analytics/reports
 * Report builder with PDF generation for all 4 templates.
 */

import { useState, useRef, useCallback } from 'react';
import { FileText, DownloadSimple, SpinnerGap } from '@phosphor-icons/react';
import { mockReportTemplates } from '@/components/analytics/analytics-mock-data';
import { ExecutiveSummaryReport } from '@/components/analytics/reports/ExecutiveSummaryReport';
import { PRCampaignReport } from '@/components/analytics/reports/PRCampaignReport';
import { BoardInvestorUpdate } from '@/components/analytics/reports/BoardInvestorUpdate';
import { SEOPresenceReport } from '@/components/analytics/reports/SEOPresenceReport';

const REPORT_FILENAMES: Record<string, string> = {
  'Monthly Executive Summary': 'pravado-executive-summary.pdf',
  'PR Campaign Report': 'pravado-pr-campaign-report.pdf',
  'Board / Investor Update': 'pravado-board-update.pdf',
  'Client Report': 'pravado-seo-presence-report.pdf',
};

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

  const handleGenerate = useCallback(async (templateTitle: string) => {
    const ref = refMap[templateTitle];
    if (!ref?.current || generating) return;
    setGenerating(templateTitle);

    try {
      const { generatePdf } = await import('@/lib/pdf-export');
      await generatePdf(ref.current, REPORT_FILENAMES[templateTitle] || 'pravado-report.pdf');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PDF] Generation failed:', msg, err);
      alert('PDF generation failed: ' + msg);
    } finally {
      setGenerating(null);
    }
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
            Select a template below to export as PDF.
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
                className="flex items-center gap-1.5 bg-brand-cyan text-slate-0 rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-cyan/90 transition-colors disabled:opacity-50"
              >
                {generating === tpl.title ? (
                  <>
                    <SpinnerGap size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DownloadSimple size={14} weight="bold" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden report render targets (off-screen, light theme for PDF) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
        <div ref={execRef}><ExecutiveSummaryReport orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={prRef}><PRCampaignReport orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={boardRef}><BoardInvestorUpdate orgName="Pravado" period="Last 30 Days" /></div>
        <div ref={seoRef}><SEOPresenceReport orgName="Pravado" period="Last 30 Days" /></div>
      </div>
    </div>
  );
}
