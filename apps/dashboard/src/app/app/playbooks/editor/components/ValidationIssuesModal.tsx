/**
 * ValidationIssuesModal Component (Sprint S20)
 * Modal displaying graph validation errors and warnings
 */

'use client';

import type { ValidationIssue } from '@pravado/types';

export interface ValidationIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationIssue[];
  errors: string[];
}

export function ValidationIssuesModal({
  isOpen,
  onClose,
  issues,
  errors,
}: ValidationIssuesModalProps) {
  if (!isOpen) return null;

  const errorIssues = issues.filter((i) => i.severity === 'error');
  const warningIssues = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Validation Issues
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Summary */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            {errorIssues.length > 0 && (
              <span className="text-red-600 font-medium">
                {errorIssues.length} error{errorIssues.length !== 1 ? 's' : ''}
              </span>
            )}
            {warningIssues.length > 0 && (
              <span className="text-yellow-600 font-medium">
                {warningIssues.length} warning{warningIssues.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Error messages */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Validation Errors
              </h3>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error issues */}
          {errorIssues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Critical Issues
              </h3>
              <div className="space-y-3">
                {errorIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 text-red-600">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <div className="flex-1">
                        <div className="text-xs text-red-600 font-mono mb-1">
                          {issue.code}
                        </div>
                        <div className="text-sm text-red-800">
                          {issue.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning issues */}
          {warningIssues.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Warnings
              </h3>
              <div className="space-y-3">
                {warningIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 text-yellow-600">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <div className="flex-1">
                        <div className="text-xs text-yellow-700 font-mono mb-1">
                          {issue.code}
                        </div>
                        <div className="text-sm text-yellow-800">
                          {issue.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No issues */}
          {errors.length === 0 && issues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No validation issues found!</p>
              <p className="text-xs mt-1">Your playbook graph is valid.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
