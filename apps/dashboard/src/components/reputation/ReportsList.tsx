/**
 * ReportsList Component (Sprint S57)
 *
 * Displays a list of executive reports with actions to view, generate, and download.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandReputationReport } from '@pravado/types';
import {
  listReports,
  getReportStatusLabel,
  getReportStatusColor,
  getReportStatusBgColor,
  getReportStatusIcon,
  getReportFrequencyLabel,
  getReportFormatLabel,
  formatDate,
  formatReportPeriod,
} from '@/lib/brandReputationAlertsApi';

interface ReportsListProps {
  onViewReport?: (report: BrandReputationReport) => void;
  onGenerateReport?: () => void;
  refreshTrigger?: number;
}

export function ReportsList({
  onViewReport,
  onGenerateReport,
  refreshTrigger = 0,
}: ReportsListProps) {
  const [reports, setReports] = useState<BrandReputationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listReports({
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setReports(response.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Executive Reports</h2>
        {onGenerateReport && (
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Generate Report
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No reports generated yet.</p>
          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Generate Your First Report
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map((report) => (
            <li
              key={report.id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onViewReport?.(report)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getReportStatusIcon(report.status)}</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatReportPeriod(report.reportPeriodStart, report.reportPeriodEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportStatusBgColor(report.status)} ${getReportStatusColor(report.status)}`}
                  >
                    {getReportStatusLabel(report.status)}
                  </span>

                  <div className="text-sm text-gray-500">
                    {getReportFormatLabel(report.format)}
                  </div>

                  <div className="text-sm text-gray-400">
                    {getReportFrequencyLabel(report.frequency)}
                  </div>

                  <div className="text-xs text-gray-400">
                    {formatDate(report.createdAt)}
                  </div>

                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {report.overallScoreSnapshot && (
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">Overall:</span>
                    <span className="font-medium">
                      {report.overallScoreSnapshot.overallScore.toFixed(1)}
                    </span>
                  </div>
                  {report.keyMetrics && (
                    <>
                      <div className="text-gray-300">|</div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">Alerts:</span>
                        <span className="font-medium">
                          {String((report.keyMetrics as unknown as Record<string, unknown>)?.alertsTriggered ?? 0)}
                        </span>
                      </div>
                      <div className="text-gray-300">|</div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">Crises:</span>
                        <span className="font-medium">
                          {String((report.keyMetrics as unknown as Record<string, unknown>)?.crisisCount ?? 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
