/**
 * Journalist Enrichment Service (Sprint S-INT-06, updated ENV-CLEANUP)
 *
 * Primary: People Data Labs (PDL) for journalist enrichment.
 * Fallback: Hunter.io if PDL returns no result and HUNTER_API_KEY is set.
 * Rate limited: max 1 API call/second per provider.
 */

import { createLogger } from '@pravado/utils';

import { resolvePublicationDomain } from './publicationResolver';

const logger = createLogger('service:journalist-enrichment');

const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich';
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

// ============================================================================
// Types
// ============================================================================

interface PDLResponse {
  status: number;
  data: {
    work_email: string | null;
    personal_emails: string[];
    likelihood: number; // 1-10
    job_title: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    full_name: string;
  };
}

interface HunterEmailFinderResult {
  data: {
    email: string | null;
    score: number; // 0-100 confidence
    first_name: string;
    last_name: string;
    position: string | null;
    twitter: string | null;
    linkedin_url: string | null;
    sources: Array<{ domain: string; uri: string }>;
  };
}

interface HunterDomainSearchResult {
  data: {
    domain: string;
    emails: Array<{
      value: string;
      type: string;
      confidence: number;
      first_name: string;
      last_name: string;
      position: string | null;
      department: string | null;
      twitter: string | null;
      linkedin_url: string | null;
    }>;
    organization: string;
  };
  meta: {
    results: number;
    limit: number;
    offset: number;
  };
}

export interface EnrichmentResult {
  email: string | null;
  email_confidence: number;
  twitter_handle: string | null;
  linkedin_url: string | null;
  position: string | null;
  enrichment_source: string;
}

interface DomainJournalist {
  name: string;
  email: string;
  confidence: number;
  position: string | null;
  twitter: string | null;
  linkedin_url: string | null;
  publication_domain: string;
}

// ============================================================================
// Helpers
// ============================================================================

function getPDLApiKey(): string | null {
  return process.env.PEOPLE_DATA_LABS_API_KEY || null;
}

function getHunterApiKey(): string | null {
  return process.env.HUNTER_API_KEY || null;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PDL API (Primary)
// ============================================================================

async function pdlEnrich(
  name: string,
  company: string
): Promise<EnrichmentResult | null> {
  const apiKey = getPDLApiKey();
  if (!apiKey) {
    logger.warn('PEOPLE_DATA_LABS_API_KEY not set — PDL enrichment disabled');
    return null;
  }

  try {
    const res = await fetch(PDL_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        name,
        company,
        min_likelihood: 6,
      }),
    });

    if (res.status === 429) {
      logger.warn('PDL rate limit reached');
      return null;
    }

    if (res.status === 404) {
      logger.info(`PDL: no match for "${name}" at "${company}"`);
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      logger.error(`PDL enrich error ${res.status}: ${text}`);
      return null;
    }

    const json = (await res.json()) as PDLResponse;
    const d = json.data;

    const email = d.work_email || d.personal_emails?.[0] || null;
    const confidence = d.likelihood * 10; // PDL likelihood 1-10 → 10-100

    // Extract twitter handle from URL if present
    let twitterHandle: string | null = null;
    if (d.twitter_url) {
      const match = d.twitter_url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
      twitterHandle = match ? match[1] : null;
    }

    return {
      email: confidence >= 70 ? email : null,
      email_confidence: confidence,
      twitter_handle: twitterHandle,
      linkedin_url: d.linkedin_url || null,
      position: d.job_title || null,
      enrichment_source: 'people_data_labs',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`PDL enrich error: ${msg}`);
    return null;
  }
}

// ============================================================================
// Hunter.io API (Fallback)
// ============================================================================

async function hunterEmailFinder(
  name: string,
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = getHunterApiKey();
  if (!apiKey) {
    return null;
  }

  const [firstName, ...lastParts] = name.split(' ');
  const lastName = lastParts.join(' ');

  if (!firstName || !lastName) {
    logger.warn(`Cannot parse name "${name}" — need first and last name`);
    return null;
  }

  const params = new URLSearchParams({
    domain,
    first_name: firstName,
    last_name: lastName,
    api_key: apiKey,
  });

  try {
    const res = await fetch(`${HUNTER_BASE_URL}/email-finder?${params}`);

    if (res.status === 429) {
      logger.warn('Hunter.io rate limit reached');
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      logger.error(`Hunter email-finder error ${res.status}: ${text}`);
      return null;
    }

    const json = (await res.json()) as HunterEmailFinderResult;
    const d = json.data;

    return {
      email: d.score >= 70 ? d.email : null, // Only use high-confidence emails
      email_confidence: d.score,
      twitter_handle: d.twitter || null,
      linkedin_url: d.linkedin_url || null,
      position: d.position || null,
      enrichment_source: 'hunter.io',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Hunter email-finder error: ${msg}`);
    return null;
  }
}

async function hunterDomainSearch(
  domain: string,
  limit: number = 10
): Promise<DomainJournalist[]> {
  const apiKey = getHunterApiKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    domain,
    limit: String(limit),
    api_key: apiKey,
  });

  try {
    const res = await fetch(`${HUNTER_BASE_URL}/domain-search?${params}`);

    if (res.status === 429) {
      logger.warn('Hunter.io rate limit reached');
      return [];
    }

    if (!res.ok) {
      const text = await res.text();
      logger.error(`Hunter domain-search error ${res.status}: ${text}`);
      return [];
    }

    const json = (await res.json()) as HunterDomainSearchResult;

    return json.data.emails.map((e) => ({
      name: `${e.first_name} ${e.last_name}`.trim(),
      email: e.value,
      confidence: e.confidence,
      position: e.position || null,
      twitter: e.twitter || null,
      linkedin_url: e.linkedin_url || null,
      publication_domain: domain,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Hunter domain-search error: ${msg}`);
    return [];
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Enrich a single journalist. Tries PDL first, falls back to Hunter.io.
 * Does NOT overwrite manually-entered data if enriched within 30 days.
 */
export async function enrichJournalist(
  supabase: any,
  journalistId: string,
  orgId: string
): Promise<EnrichmentResult | null> {
  // Fetch journalist
  const { data: journalist, error } = await supabase
    .from('journalists')
    .select('*, media_outlets!media_outlet_id(name, domain)')
    .eq('id', journalistId)
    .eq('org_id', orgId)
    .single();

  if (error || !journalist) {
    logger.warn(`Journalist ${journalistId} not found in org ${orgId}`);
    return null;
  }

  // Skip if enriched within 30 days
  const enrichedAt = journalist.metadata?.enriched_at;
  if (enrichedAt) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (new Date(enrichedAt) > thirtyDaysAgo) {
      logger.info(`Journalist ${journalistId} enriched recently — skipping`);
      return null;
    }
  }

  // Resolve publication domain
  const outletName = journalist.media_outlets?.name;
  const outletDomain = journalist.media_outlets?.domain;
  let domain: string | null = outletDomain || null;

  if (!domain && outletName) {
    const resolved = resolvePublicationDomain(outletName);
    domain = resolved?.domain ?? null;
  }

  if (!domain) {
    logger.warn(`Cannot resolve domain for journalist ${journalistId}`);
    return null;
  }

  // Try PDL first
  let result = await pdlEnrich(journalist.name, outletName || domain);
  await delay(1000);

  // Fall back to Hunter.io if PDL returned no result and Hunter key is set
  if (!result && getHunterApiKey()) {
    logger.info(`PDL returned no result for ${journalistId}, trying Hunter.io fallback`);
    result = await hunterEmailFinder(journalist.name, domain);
    await delay(1000);
  }

  if (!result) return null;

  // Update journalist record
  const updateData: Record<string, unknown> = {
    metadata: {
      ...(journalist.metadata || {}),
      enriched_at: new Date().toISOString(),
      enrichment_source: result.enrichment_source,
      email_confidence: result.email_confidence,
      linkedin_url: result.linkedin_url,
      position: result.position,
    },
  };

  // Only update email if confidence >= 70 and no manual email exists
  if (result.email && (!journalist.email || journalist.metadata?.enrichment_source)) {
    updateData.email = result.email;
  }

  // Update twitter if found and no manual entry
  if (result.twitter_handle && !journalist.twitter_handle) {
    updateData.twitter_handle = result.twitter_handle;
  }

  await supabase
    .from('journalists')
    .update(updateData)
    .eq('id', journalistId);

  logger.info(
    `Enriched journalist ${journalistId}: email=${result.email ? 'found' : 'not found'}, confidence=${result.email_confidence}, source=${result.enrichment_source}`
  );

  return result;
}

/**
 * Batch enrich all unenriched or stale journalists for an org.
 * Max 20 per batch to respect API rate limits.
 */
export async function enrichBatch(
  supabase: any,
  orgId: string
): Promise<{ enriched: number; skipped: number; errors: number }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Find journalists needing enrichment
  const { data: journalists, error } = await supabase
    .from('journalists')
    .select('id')
    .eq('org_id', orgId)
    .or(`metadata->>enriched_at.is.null,metadata->>enriched_at.lt.${thirtyDaysAgo}`)
    .limit(20);

  if (error || !journalists) {
    logger.error(`Failed to fetch journalists for enrichment: ${error?.message}`);
    return { enriched: 0, skipped: 0, errors: 1 };
  }

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (const j of journalists) {
    try {
      const result = await enrichJournalist(supabase, j.id, orgId);
      if (result) {
        enriched++;
      } else {
        skipped++;
      }
    } catch {
      errors++;
    }
  }

  logger.info(`Batch enrichment for org ${orgId}: enriched=${enriched}, skipped=${skipped}, errors=${errors}`);
  return { enriched, skipped, errors };
}

/**
 * Search a publication domain for journalists (used by discovery service).
 * Uses Hunter.io domain search (PDL doesn't have a domain search equivalent).
 */
export async function searchPublication(
  domain: string,
  limit: number = 10
): Promise<DomainJournalist[]> {
  const results = await hunterDomainSearch(domain, limit);
  await delay(1000); // Rate limit
  return results;
}
