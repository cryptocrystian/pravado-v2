'use client';

/**
 * Contact Table Component (Sprint S39)
 * Displays contacts in a sequence with status and actions
 */

import type { PRPitchContactWithJournalist } from '@pravado/types';

import {
  formatContactStatus,
  formatRelativeTime,
  getStatusColor,
} from '@/lib/prPitchApi';

interface ContactTableProps {
  contacts: PRPitchContactWithJournalist[];
  isLoading?: boolean;
  onPreview: (contact: PRPitchContactWithJournalist) => void;
  onQueue: (contactId: string) => void;
}

export function ContactTable({
  contacts,
  isLoading,
  onPreview,
  onQueue,
}: ContactTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No contacts in this sequence yet.</p>
        <p className="text-sm mt-1">Add journalists to start your outreach.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Journalist
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Beat / Outlet
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Step
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Activity
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {contact.journalist.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.journalist.name}
                    </p>
                    {contact.journalist.email && (
                      <p className="text-xs text-gray-500">{contact.journalist.email}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-gray-900">{contact.journalist.beat || '-'}</p>
                {contact.journalist.outlet && (
                  <p className="text-xs text-gray-500">
                    {contact.journalist.outlet}
                    {contact.journalist.tier && (
                      <span className="ml-1 text-gray-400">
                        ({contact.journalist.tier})
                      </span>
                    )}
                  </p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    contact.status
                  )}`}
                >
                  {formatContactStatus(contact.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Step {contact.currentStepPosition}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contact.lastEventAt
                  ? formatRelativeTime(contact.lastEventAt)
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onPreview(contact)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Preview
                </button>
                {contact.status === 'queued' && (
                  <button
                    onClick={() => onQueue(contact.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Send
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
