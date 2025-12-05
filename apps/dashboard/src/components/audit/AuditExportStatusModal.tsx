'use client';

/**
 * Audit Export Status Modal (Sprint S36)
 * Modal displaying export job progress and download link
 */

import { useCallback, useEffect, useState } from 'react';
import type { AuditExportJob } from '@/lib/auditApi';
import { formatFileSize, getExportDownloadUrl, getExportStatus } from '@/lib/auditApi';

interface AuditExportStatusModalProps {
  jobId: string;
  onClose: () => void;
}

export function AuditExportStatusModal({ jobId, onClose }: AuditExportStatusModalProps) {
  const [job, setJob] = useState<AuditExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getExportStatus(jobId);
      setJob(result.job);

      // Stop polling if job is complete
      if (result.job.status === 'success' || result.job.status === 'failed') {
        setPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get export status');
      setPolling(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchStatus();

    if (polling) {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchStatus, polling]);

  const statusColors: Record<string, string> = {
    queued: 'text-gray-600 bg-gray-100',
    processing: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Export Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {error ? (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : !job ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${statusColors[job.status]}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>

              {/* Progress indicator for processing */}
              {job.status === 'processing' && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
                    <div className="animate-pulse bg-blue-500 h-full w-full" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Processing audit logs...</p>
                </div>
              )}

              {/* Row count */}
              {job.rowCount !== null && job.rowCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Records</span>
                  <span className="text-sm font-medium text-gray-900">
                    {job.rowCount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* File size */}
              {job.fileSizeBytes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Size</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatFileSize(job.fileSizeBytes)}
                  </span>
                </div>
              )}

              {/* Error message */}
              {job.status === 'failed' && job.errorMessage && (
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">{job.errorMessage}</p>
                </div>
              )}

              {/* Download button */}
              {job.status === 'success' && (
                <div className="pt-2">
                  <a
                    href={getExportDownloadUrl(jobId)}
                    download
                    className="block w-full px-4 py-2 bg-green-600 text-white text-center text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Download CSV
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
