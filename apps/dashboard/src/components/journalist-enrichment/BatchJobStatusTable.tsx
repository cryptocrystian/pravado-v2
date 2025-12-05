/**
 * Batch Job Status Table Component (Sprint S50)
 * Table showing status of batch enrichment jobs
 */

import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

interface BatchJob {
  id: string;
  jobType: string;
  status: string;
  inputRecordCount: number;
  successfulRecords: number;
  failedRecords: number;
  progressPercentage: number;
  createdAt: string | Date;
  startedAt?: string | Date;
  completedAt?: string | Date;
  errorMessage?: string;
  createdBy?: string;
}

interface BatchJobStatusTableProps {
  jobs: BatchJob[];
  onViewJob?: (job: BatchJob) => void;
  onRetryJob?: (jobId: string) => void;
  onCancelJob?: (jobId: string) => void;
  loading?: boolean;
}

export function BatchJobStatusTable({
  jobs,
  onViewJob,
  onRetryJob,
  onCancelJob,
  loading = false,
}: BatchJobStatusTableProps) {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'processing':
        return (
          <svg
            className="animate-spin h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'pending':
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'retrying':
        return <ArrowPathIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <QueueListIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'retrying':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    const labels: Record<string, string> = {
      single_enrichment: 'Single Enrichment',
      batch_enrichment: 'Batch Enrichment',
      email_verification_batch: 'Email Verification',
      social_scraping_batch: 'Social Scraping',
      outlet_scoring_batch: 'Outlet Scoring',
      deduplication_scan: 'Deduplication',
      auto_merge: 'Auto Merge',
    };
    return labels[jobType] || jobType;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-sm text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <QueueListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No batch jobs found</p>
          <p className="text-sm text-gray-500 mt-1">
            Start a batch enrichment to see jobs here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewJob?.(job)}
              >
                {/* Job Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getJobTypeLabel(job.jobType)}
                      </div>
                      <div className="text-xs text-gray-500">ID: {job.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  {job.errorMessage && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      Error
                    </div>
                  )}
                </td>

                {/* Progress */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(job.progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          job.status === 'completed'
                            ? 'bg-green-600'
                            : job.status === 'failed'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${job.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                {/* Records */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {job.inputRecordCount} total
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600">
                      {job.successfulRecords} success
                    </span>
                    {job.failedRecords > 0 && (
                      <span className="text-red-600">
                        {job.failedRecords} failed
                      </span>
                    )}
                  </div>
                </td>

                {/* Created */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(job.createdAt)}
                  </div>
                  {job.completedAt && (
                    <div className="text-xs text-gray-500">
                      Completed: {formatDate(job.completedAt)}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {job.status === 'failed' && onRetryJob && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryJob(job.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Retry
                      </button>
                    )}
                    {(job.status === 'pending' ||
                      job.status === 'queued' ||
                      job.status === 'processing') &&
                      onCancelJob && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelJob(job.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewJob?.(job);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
