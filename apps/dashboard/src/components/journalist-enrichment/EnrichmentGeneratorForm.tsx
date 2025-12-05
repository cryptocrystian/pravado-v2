/**
 * Enrichment Generator Form Component (Sprint S50)
 * Form for creating new enrichment records
 */

import React, { useState } from 'react';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface EnrichmentGeneratorFormProps {
  onGenerate: (data: EnrichmentFormData) => Promise<void>;
  loading?: boolean;
}

export interface EnrichmentFormData {
  sourceType: string;
  email?: string;
  outlet?: string;
  socialProfile?: string;
  name?: string;
  jobTitle?: string;
  location?: string;
  beat?: string[];
}

export function EnrichmentGeneratorForm({
  onGenerate,
  loading = false,
}: EnrichmentGeneratorFormProps) {
  const [sourceType, setSourceType] = useState<string>('email_verification');
  const [email, setEmail] = useState('');
  const [outlet, setOutlet] = useState('');
  const [socialProfile, setSocialProfile] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [beat, setBeat] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const beatArray = beat
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const formData: EnrichmentFormData = {
      sourceType,
      email: email || undefined,
      outlet: outlet || undefined,
      socialProfile: socialProfile || undefined,
      name: name || undefined,
      jobTitle: jobTitle || undefined,
      location: location || undefined,
      beat: beatArray.length > 0 ? beatArray : undefined,
    };

    await onGenerate(formData);
  };

  const resetForm = () => {
    setEmail('');
    setOutlet('');
    setSocialProfile('');
    setName('');
    setJobTitle('');
    setLocation('');
    setBeat('');
  };

  const sourceTypes = [
    { value: 'email_verification', label: 'Email Verification' },
    { value: 'social_scraping', label: 'Social Media' },
    { value: 'outlet_authority', label: 'Outlet Authority' },
    { value: 'manual_entry', label: 'Manual Entry' },
    { value: 'api_integration', label: 'API Integration' },
    { value: 'web_scraping', label: 'Web Scraping' },
    { value: 'media_database', label: 'Media Database' },
    { value: 'contact_import', label: 'Contact Import' },
  ];

  const isFormValid =
    email.length > 0 || outlet.length > 0 || socialProfile.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Generate Enrichment
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sourceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="journalist@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Outlet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Media Outlet
          </label>
          <input
            type="text"
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            placeholder="The New York Times"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Social Profile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Social Profile URL
          </label>
          <input
            type="url"
            value={socialProfile}
            onChange={(e) => setSocialProfile(e.target.value)}
            placeholder="https://twitter.com/username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title (Optional)
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Senior Reporter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="New York, NY"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Beat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beat / Topics (Optional)
          </label>
          <input
            type="text"
            value={beat}
            onChange={(e) => setBeat(e.target.value)}
            placeholder="Technology, Business, AI (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter multiple topics separated by commas
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                Generating...
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                Generate Enrichment
              </>
            )}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          Provide at least one of: email, outlet, or social profile URL to
          generate enrichment data.
        </p>
      </div>
    </div>
  );
}
