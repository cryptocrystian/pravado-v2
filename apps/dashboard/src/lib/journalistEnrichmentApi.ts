/**
 * Journalist Enrichment API Client (Sprint S50)
 * Frontend API helper for enrichment engine
 */

import type {
  CreateEnrichmentRecordInput,
  UpdateEnrichmentRecordInput,
  CreateEnrichmentJobInput,
  MergeEnrichmentInput,
  EnrichmentRecordsQuery,
  EnrichmentJobsQuery,
  EnrichmentLinksQuery,
  BatchEnrichmentRequest,
  JournalistEnrichmentRecord,
  JournalistEnrichmentJob,
  JournalistEnrichmentLink,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get auth headers
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-org-id': localStorage.getItem('orgId') || '',
    'x-user-id': localStorage.getItem('userId') || '',
  };
}

// ========================================
// Enrichment Records
// ========================================

/**
 * Generate enrichment for single contact
 */
export async function generateEnrichment(
  input: CreateEnrichmentRecordInput
): Promise<JournalistEnrichmentRecord> {
  const response = await fetch(`${API_BASE}/api/v1/journalist-enrichment/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate enrichment');
  }

  return response.json();
}

/**
 * List enrichment records with filtering
 */
export async function listEnrichmentRecords(
  query: EnrichmentRecordsQuery = {}
): Promise<{
  records: JournalistEnrichmentRecord[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();

  if (query.sourceTypes) {
    query.sourceTypes.forEach((type) => params.append('sourceTypes', type));
  }
  if (query.status) {
    query.status.forEach((status) => params.append('status', status));
  }
  if (query.minConfidenceScore !== undefined) {
    params.append('minConfidenceScore', query.minConfidenceScore.toString());
  }
  if (query.maxConfidenceScore !== undefined) {
    params.append('maxConfidenceScore', query.maxConfidenceScore.toString());
  }
  if (query.minCompletenessScore !== undefined) {
    params.append('minCompletenessScore', query.minCompletenessScore.toString());
  }
  if (query.emailVerified !== undefined) {
    params.append('emailVerified', query.emailVerified.toString());
  }
  if (query.hasEmail !== undefined) {
    params.append('hasEmail', query.hasEmail.toString());
  }
  if (query.hasPhone !== undefined) {
    params.append('hasPhone', query.hasPhone.toString());
  }
  if (query.hasSocialProfiles !== undefined) {
    params.append('hasSocialProfiles', query.hasSocialProfiles.toString());
  }
  if (query.outlet) {
    params.append('outlet', query.outlet);
  }
  if (query.qualityFlags) {
    query.qualityFlags.forEach((flag) => params.append('qualityFlags', flag));
  }
  if (query.hasPotentialDuplicates !== undefined) {
    params.append('hasPotentialDuplicates', query.hasPotentialDuplicates.toString());
  }
  if (query.searchQuery) {
    params.append('searchQuery', query.searchQuery);
  }
  if (query.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.append('sortOrder', query.sortOrder);
  }
  if (query.limit) {
    params.append('limit', query.limit.toString());
  }
  if (query.offset) {
    params.append('offset', query.offset.toString());
  }

  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/records?${params.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list enrichment records');
  }

  return response.json();
}

/**
 * Get single enrichment record
 */
export async function getEnrichmentRecord(
  recordId: string
): Promise<JournalistEnrichmentRecord> {
  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/records/${recordId}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get enrichment record');
  }

  return response.json();
}

/**
 * Update enrichment record
 */
export async function updateEnrichmentRecord(
  recordId: string,
  input: UpdateEnrichmentRecordInput
): Promise<JournalistEnrichmentRecord> {
  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/records/${recordId}`,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update enrichment record');
  }

  return response.json();
}

/**
 * Delete enrichment record
 */
export async function deleteEnrichmentRecord(recordId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/records/${recordId}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete enrichment record');
  }
}

// ========================================
// Batch Enrichment
// ========================================

/**
 * Batch enrichment processing
 */
export async function batchEnrich(
  request: BatchEnrichmentRequest
): Promise<{
  jobId: string;
  status: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/api/v1/journalist-enrichment/batch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start batch enrichment');
  }

  return response.json();
}

// ========================================
// Enrichment Jobs
// ========================================

/**
 * List enrichment jobs
 */
export async function listEnrichmentJobs(
  query: EnrichmentJobsQuery = {}
): Promise<{
  jobs: JournalistEnrichmentJob[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();

  if (query.jobType) {
    query.jobType.forEach((type) => params.append('jobType', type));
  }
  if (query.status) {
    query.status.forEach((status) => params.append('status', status));
  }
  if (query.createdBy) {
    params.append('createdBy', query.createdBy);
  }
  if (query.minProgressPercentage !== undefined) {
    params.append('minProgressPercentage', query.minProgressPercentage.toString());
  }
  if (query.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.append('sortOrder', query.sortOrder);
  }
  if (query.limit) {
    params.append('limit', query.limit.toString());
  }
  if (query.offset) {
    params.append('offset', query.offset.toString());
  }

  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/jobs?${params.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list enrichment jobs');
  }

  return response.json();
}

/**
 * Create enrichment job
 */
export async function createEnrichmentJob(
  input: CreateEnrichmentJobInput
): Promise<JournalistEnrichmentJob> {
  const response = await fetch(`${API_BASE}/api/v1/journalist-enrichment/jobs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create enrichment job');
  }

  return response.json();
}

// ========================================
// Merge Suggestions
// ========================================

/**
 * Get merge suggestions for record
 */
export async function getMergeSuggestions(
  recordId: string
): Promise<{
  suggestions: any[];
  totalSuggestions: number;
}> {
  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/suggestions/${recordId}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get merge suggestions');
  }

  return response.json();
}

/**
 * Merge enrichment into journalist profile
 */
export async function mergeEnrichment(input: MergeEnrichmentInput): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/journalist-enrichment/merge`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to merge enrichment');
  }
}

// ========================================
// Enrichment Links
// ========================================

/**
 * List enrichment links
 */
export async function listEnrichmentLinks(
  query: EnrichmentLinksQuery = {}
): Promise<{
  links: JournalistEnrichmentLink[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();

  if (query.journalistId) {
    params.append('journalistId', query.journalistId);
  }
  if (query.enrichmentRecordId) {
    params.append('enrichmentRecordId', query.enrichmentRecordId);
  }
  if (query.linkType) {
    query.linkType.forEach((type) => params.append('linkType', type));
  }
  if (query.isMerged !== undefined) {
    params.append('isMerged', query.isMerged.toString());
  }
  if (query.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.append('sortOrder', query.sortOrder);
  }
  if (query.limit) {
    params.append('limit', query.limit.toString());
  }
  if (query.offset) {
    params.append('offset', query.offset.toString());
  }

  const response = await fetch(
    `${API_BASE}/api/v1/journalist-enrichment/links?${params.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list enrichment links');
  }

  return response.json();
}
