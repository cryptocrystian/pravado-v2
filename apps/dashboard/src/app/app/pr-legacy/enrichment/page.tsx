/**
 * Journalist Enrichment Page (Sprint S50)
 * Three-panel layout: Generator | Records | Details
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { EnrichmentRecordStatus, EnrichmentSourceType } from '@pravado/types';
import {
  EnrichmentGeneratorForm,
  type EnrichmentFormData,
} from '@/components/journalist-enrichment/EnrichmentGeneratorForm';
import { EnrichmentRecordList } from '@/components/journalist-enrichment/EnrichmentRecordCard';
import { EnrichmentRecordDetailDrawer } from '@/components/journalist-enrichment/EnrichmentRecordDetailDrawer';
import { EnrichmentSuggestionsPanel } from '@/components/journalist-enrichment/EnrichmentSuggestionsPanel';
import { BatchJobStatusTable } from '@/components/journalist-enrichment/BatchJobStatusTable';
import * as enrichmentApi from '@/lib/journalistEnrichmentApi';
import { ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function EnrichmentPage() {
  // State
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingEnrichment, setGeneratingEnrichment] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'suggestions' | 'jobs'>('details');

  // Filters
  const [filters, _setFilters] = useState({
    status: [] as EnrichmentRecordStatus[],
    sourceTypes: [] as EnrichmentSourceType[],
    minConfidenceScore: undefined as number | undefined,
  });

  // Load records on mount
  useEffect(() => {
    loadRecords();
    loadJobs();
  }, [filters]);

  // Load suggestions when record selected
  useEffect(() => {
    if (selectedRecord) {
      loadSuggestions(selectedRecord.id);
    }
  }, [selectedRecord]);

  // Load records
  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await enrichmentApi.listEnrichmentRecords({
        status: filters.status.length > 0 ? filters.status : undefined,
        sourceTypes: filters.sourceTypes.length > 0 ? filters.sourceTypes : undefined,
        minConfidenceScore: filters.minConfidenceScore,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 50,
      });
      setRecords(response.records);
    } catch (error) {
      console.error('Failed to load enrichment records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load jobs
  const loadJobs = async () => {
    try {
      const response = await enrichmentApi.listEnrichmentJobs({
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 20,
      });
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load enrichment jobs:', error);
    }
  };

  // Load suggestions
  const loadSuggestions = async (recordId: string) => {
    try {
      const response = await enrichmentApi.getMergeSuggestions(recordId);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to load merge suggestions:', error);
      setSuggestions([]);
    }
  };

  // Generate enrichment
  const handleGenerate = async (data: EnrichmentFormData) => {
    try {
      setGeneratingEnrichment(true);

      const input = {
        sourceType: data.sourceType as EnrichmentSourceType,
        email: data.email,
        outlet: data.outlet,
        jobTitle: data.jobTitle,
        beat: data.beat,
        location: data.location,
      };

      const record = await enrichmentApi.generateEnrichment(input);

      // Refresh records
      await loadRecords();

      // Select the new record
      setSelectedRecord(record);
      setDrawerOpen(true);
      setActiveTab('details');
    } catch (error: any) {
      console.error('Failed to generate enrichment:', error);
      alert(error.message || 'Failed to generate enrichment');
    } finally {
      setGeneratingEnrichment(false);
    }
  };

  // Handle record selection
  const handleSelectRecord = (record: any) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
    setActiveTab('details');
  };

  // Handle merge suggestion accept
  const handleAcceptSuggestion = async (suggestion: any) => {
    if (!selectedRecord) return;

    try {
      await enrichmentApi.mergeEnrichment({
        journalistId: suggestion.targetId,
        enrichmentRecordId: selectedRecord.id,
        mergeStrategy: 'append',
        fieldsToMerge: suggestion.fieldsToMerge,
      });

      alert('Enrichment merged successfully');
      await loadRecords();
      setDrawerOpen(false);
    } catch (error: any) {
      console.error('Failed to merge enrichment:', error);
      alert(error.message || 'Failed to merge enrichment');
    }
  };

  // Handle delete
  const handleDelete = async (recordId: string) => {
    try {
      await enrichmentApi.deleteEnrichmentRecord(recordId);
      await loadRecords();
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
        setDrawerOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to delete enrichment record:', error);
      alert(error.message || 'Failed to delete enrichment record');
    }
  };

  // Handle re-enrich
  const handleReEnrich = async (recordId: string) => {
    try {
      const record = records.find((r) => r.id === recordId);
      if (!record) return;

      // Create new enrichment with same data
      await handleGenerate({
        sourceType: record.sourceType,
        email: record.email,
        outlet: record.outlet,
        jobTitle: record.jobTitle,
        beat: record.beat,
        location: record.location,
      });
    } catch (error: any) {
      console.error('Failed to re-enrich:', error);
      alert(error.message || 'Failed to re-enrich');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contact Enrichment
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Enrich journalist contact data from multiple sources
              </p>
            </div>
            <button
              onClick={loadRecords}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Generator */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6">
              <EnrichmentGeneratorForm
                onGenerate={handleGenerate}
                loading={generatingEnrichment}
              />
            </div>
          </div>

          {/* Middle Panel - Records List */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Filters */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Enrichment Records
                </h2>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  <FunnelIcon className="h-4 w-4" />
                  Filter
                </button>
              </div>

              {/* Records List */}
              {loading ? (
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
                    <p className="text-sm text-gray-600">Loading records...</p>
                  </div>
                </div>
              ) : (
                <EnrichmentRecordList
                  records={records}
                  selectedId={selectedRecord?.id}
                  onSelect={handleSelectRecord}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Details / Suggestions / Jobs */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-6">
              {/* Tab Navigation */}
              <div className="bg-white border border-gray-200 rounded-t-lg">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === 'details'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === 'suggestions'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Suggestions
                    {suggestions.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {suggestions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === 'jobs'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Jobs
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg p-6">
                {activeTab === 'details' && !selectedRecord && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      Select a record to view details
                    </p>
                  </div>
                )}

                {activeTab === 'suggestions' && selectedRecord && (
                  <EnrichmentSuggestionsPanel
                    suggestions={suggestions}
                    onAccept={handleAcceptSuggestion}
                    loading={false}
                  />
                )}

                {activeTab === 'jobs' && (
                  <BatchJobStatusTable
                    jobs={jobs}
                    onViewJob={(job) => console.log('View job:', job)}
                    loading={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <EnrichmentRecordDetailDrawer
        record={selectedRecord}
        open={drawerOpen && activeTab === 'details'}
        onClose={() => setDrawerOpen(false)}
        onDelete={handleDelete}
        onUpdate={handleReEnrich}
        onMerge={(_recordId) => {
          setActiveTab('suggestions');
        }}
      />
    </div>
  );
}
