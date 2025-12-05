/**
 * Audience Persona API Client (Sprint S51)
 * Frontend helper for persona builder endpoints
 */

import type {
  AudiencePersona,
  AudiencePersonaTrait,
  AudiencePersonaInsight,
  CreatePersonaInput,
  UpdatePersonaInput,
  GenerationContext,
  AddTraitRequest,
  AddInsightRequest,
  PersonasQuery,
  PersonasListResponse,
  PersonaDetailResponse,
  PersonaInsightsResponse,
  PersonaHistoryResponse,
  PersonaComparisonResult,
  PersonaTrendsResponse,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ========================================
// Helper Functions
// ========================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join(',')}`;
      }
      return `${key}=${encodeURIComponent(String(value))}`;
    });

  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
}

// ========================================
// Persona CRUD
// ========================================

/**
 * Generate a persona using LLM from source text
 */
export async function generatePersona(
  context: GenerationContext
): Promise<{
  persona: AudiencePersona;
  traits: AudiencePersonaTrait[];
  insights: AudiencePersonaInsight[];
  extraction: any;
  message: string;
}> {
  return request('/api/v1/personas/generate', {
    method: 'POST',
    body: JSON.stringify({ generationContext: context }),
  });
}

/**
 * Create a new persona manually
 */
export async function createPersona(
  input: CreatePersonaInput
): Promise<AudiencePersona> {
  return request('/api/v1/personas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update an existing persona
 */
export async function updatePersona(
  personaId: string,
  input: UpdatePersonaInput
): Promise<AudiencePersona> {
  return request(`/api/v1/personas/${personaId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a persona
 */
export async function deletePersona(personaId: string): Promise<void> {
  return request(`/api/v1/personas/${personaId}`, {
    method: 'DELETE',
  });
}

/**
 * Get a single persona with full details
 */
export async function getPersona(personaId: string): Promise<PersonaDetailResponse> {
  return request(`/api/v1/personas/${personaId}`);
}

/**
 * List personas with filtering and pagination
 */
export async function listPersonas(
  query: PersonasQuery = {}
): Promise<PersonasListResponse> {
  const queryString = buildQueryString(query);
  return request(`/api/v1/personas${queryString}`);
}

// ========================================
// Traits
// ========================================

/**
 * Add a trait to a persona
 */
export async function addTrait(
  personaId: string,
  trait: AddTraitRequest
): Promise<AudiencePersonaTrait> {
  return request(`/api/v1/personas/${personaId}/traits`, {
    method: 'POST',
    body: JSON.stringify(trait),
  });
}

// ========================================
// Insights
// ========================================

/**
 * Add an insight to a persona
 */
export async function addInsight(
  personaId: string,
  insight: AddInsightRequest
): Promise<AudiencePersonaInsight> {
  return request(`/api/v1/personas/${personaId}/insights`, {
    method: 'POST',
    body: JSON.stringify(insight),
  });
}

/**
 * Get insights for a persona with filtering
 */
export async function getPersonaInsights(
  personaId: string,
  query: any = {}
): Promise<PersonaInsightsResponse> {
  const queryString = buildQueryString(query);
  return request(`/api/v1/personas/${personaId}/insights${queryString}`);
}

// ========================================
// History & Trends
// ========================================

/**
 * Get persona history snapshots
 */
export async function getPersonaHistory(
  personaId: string,
  query: any = {}
): Promise<PersonaHistoryResponse> {
  const queryString = buildQueryString(query);
  return request(`/api/v1/personas/${personaId}/history${queryString}`);
}

/**
 * Get persona trends over time
 */
export async function getPersonaTrends(
  personaId: string,
  daysBack: number = 90
): Promise<PersonaTrendsResponse> {
  return request(`/api/v1/personas/${personaId}/trends?daysBack=${daysBack}`);
}

// ========================================
// Comparison & Merging
// ========================================

/**
 * Compare two personas
 */
export async function comparePersonas(
  personaId1: string,
  personaId2: string
): Promise<{ comparison: PersonaComparisonResult }> {
  return request(`/api/v1/personas/${personaId1}/compare`, {
    method: 'POST',
    body: JSON.stringify({ personaId2 }),
  });
}

/**
 * Merge two personas
 */
export async function mergePersonas(mergeRequest: {
  sourcePersonaId: string;
  targetPersonaId: string;
  mergeTraits: boolean;
  mergeInsights: boolean;
  archiveSource: boolean;
}): Promise<{
  mergedPersona: AudiencePersona;
  traitsAdded: number;
  insightsAdded: number;
  message: string;
}> {
  return request('/api/v1/personas/merge', {
    method: 'POST',
    body: JSON.stringify(mergeRequest),
  });
}

// ========================================
// Utility Functions
// ========================================

/**
 * Calculate overall score from component scores
 */
export function calculateOverallScore(
  relevance: number,
  engagement: number,
  alignment: number
): number {
  return relevance * 0.4 + engagement * 0.35 + alignment * 0.25;
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Get persona type label
 */
export function getPersonaTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    primary_audience: 'Primary Audience',
    secondary_audience: 'Secondary Audience',
    stakeholder: 'Stakeholder',
    influencer: 'Influencer',
  };
  return labels[type] || type;
}

/**
 * Get trait category label
 */
export function getTraitCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    skill: 'Skill',
    demographic: 'Demographic',
    psychographic: 'Psychographic',
    behavioral: 'Behavioral',
    interest: 'Interest',
  };
  return labels[category] || category;
}

/**
 * Get insight type label
 */
export function getInsightTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    content_preference: 'Content Preference',
    media_consumption: 'Media Consumption',
    engagement_pattern: 'Engagement Pattern',
    pain_point: 'Pain Point',
    opportunity: 'Opportunity',
  };
  return labels[type] || type;
}

/**
 * Format persona name for display
 */
export function formatPersonaName(persona: AudiencePersona): string {
  if (persona.role && persona.industry) {
    return `${persona.role} in ${persona.industry}`;
  } else if (persona.role) {
    return persona.role;
  } else if (persona.industry) {
    return `${persona.industry} Professional`;
  }
  return persona.name;
}

/**
 * Get seniority level label
 */
export function getSeniorityLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    individual_contributor: 'Individual Contributor',
    manager: 'Manager',
    director: 'Director',
    executive: 'Executive',
    c_level: 'C-Level',
  };
  return labels[level] || level;
}

/**
 * Get company size label
 */
export function getCompanySizeLabel(size: string): string {
  const labels: Record<string, string> = {
    startup: 'Startup',
    smb: 'SMB',
    enterprise: 'Enterprise',
  };
  return labels[size] || size;
}
