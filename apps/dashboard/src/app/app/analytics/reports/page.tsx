'use client';

/**
 * Reports — /app/analytics/reports
 * Report builder with PDF generation for Monthly Executive Summary.
 */

import { useState, useRef, useCallback } from 'react';
import { FileText, DownloadSimple, SpinnerGap } from '@phosphor-icons/react';
import { mockReportTemplates } from '@/components/analytics/analytics-mock-data';
import { ExecutiveSummaryReport } from '@/components/analytics/reports/ExecutiveSummaryReport';

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGenerateExecutiveSummary = useCallback(async () => {
    if (!reportRef.current || generating) return;
    setGenerating(true);

    try {
      // Dynamic import to avoid loading jspdf/html2canvas on page load
      const { generatePdf } = await import('@/lib/pdf-export');
      await generatePdf(reportRef.current, 'pravado-executive-summary.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  const templateActions: Record<string, (() => void) | null> = {
    'Monthly Executive Summary': handleGenerateExecutiveSummary,
    'PR Campaign Report': null,
    'Board / Investor Update': null,
    'Client Report': null,
  };

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto">
        {/* Report Builder */}
        <div className="bg-cc-surface border border-white/8 rounded-2xl p-8 text-center mb-6">
          <FileText size={48} className="text-cc-cyan mx-auto" weight="regular" />
          <h2 className="text-xl font-bold text-white mt-4">Report Builder</h2>
          <p className="text-sm text-white/70 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            Generate shareable reports for leadership, clients, or boards.
            Select a template below to export as PDF.
          </p>
        </div>

        {/* Templates */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Report Templates
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {mockReportTemplates.map((tpl) => {
            const action = templateActions[tpl.title];
            const isReady = !!action;

            return (
              <div
                key={tpl.title}
                className={`bg-cc-surface border border-white/8 rounded-xl p-4 ${isReady ? '' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">{tpl.title}</h4>
                  {!isReady && (
                    <span className="bg-white/5 text-white/45 text-xs px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/45 leading-relaxed mb-3">{tpl.desc}</p>
                {isReady && (
                  <button
                    type="button"
                    onClick={action}
                    disabled={generating}
                    className="flex items-center gap-1.5 bg-brand-cyan text-slate-0 rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-cyan/90 transition-colors disabled:opacity-50"
                  >
                    {generating ? (
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden report render target (off-screen, light theme for PDF) */}
      <div
        ref={reportRef}
        style={{ position: 'absolute', left: '-9999px', top: 0 }}
        aria-hidden="true"
      >
        <ExecutiveSummaryReport orgName="Pravado" period="Last 30 Days" />
      </div>
    </div>
  );
}
