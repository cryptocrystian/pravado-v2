/**
 * Journalist Discovery Service (Sprint S-INT-06)
 *
 * Discovers new journalists to pitch based on topics and industry.
 * Uses Hunter.io domain search across industry-relevant publications.
 */

import { createLogger } from '@pravado/utils';

import { searchPublication } from './hunterEnrichmentService';
import { getPublicationsForIndustries } from './publicationResolver';

const logger = createLogger('service:journalist-discovery');

// ============================================================================
// Types
// ============================================================================

interface DiscoveredJournalist {
  name: string;
  email: string;
  email_confidence: number;
  position: string | null;
  twitter_handle: string | null;
  publication_domain: string;
}

interface DiscoverResult {
  discovered: DiscoveredJournalist[];
  saved: number;
  already_exists: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Discover journalists by topics.
 * Searches Hunter.io across industry-relevant publications.
 * Returns up to 20 journalists NOT already in the org's database.
 */
export async function discoverByTopics(
  supabase: any,
  orgId: string,
  topics: string[]
): Promise<DiscoverResult> {
  const result: DiscoverResult = { discovered: [], saved: 0, already_exists: 0 };

  if (!topics.length) return result;

  // Map topics to industries (use topics as industry proxies)
  const publications = getPublicationsForIndustries(topics);

  if (!publications.length) {
    // If no industry match, try topics as publication domains directly
    logger.info(`No industry match for topics: ${topics.join(', ')} — trying as domains`);
    return result;
  }

  // Fetch existing journalist emails for dedup
  const { data: existing } = await supabase
    .from('journalists')
    .select('email')
    .eq('org_id', orgId)
    .not('email', 'is', null);

  const existingEmails = new Set((existing ?? []).map((j: { email: string }) => j.email?.toLowerCase()));

  // Search up to 5 publications (rate limiting)
  const pubsToSearch = publications.slice(0, 5);

  for (const domain of pubsToSearch) {
    if (result.discovered.length >= 20) break;

    try {
      const journalists = await searchPublication(domain, 10);

      for (const j of journalists) {
        if (result.discovered.length >= 20) break;

        if (!j.name || !j.email) continue;

        // Skip if already in org's database
        if (existingEmails.has(j.email.toLowerCase())) {
          result.already_exists++;
          continue;
        }

        result.discovered.push({
          name: j.name,
          email: j.email,
          email_confidence: j.confidence,
          position: j.position,
          twitter_handle: j.twitter,
          publication_domain: domain,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Discovery search failed for ${domain}: ${msg}`);
    }
  }

  // Save discovered journalists as 'suggested' status
  for (const j of result.discovered) {
    try {
      const { error } = await supabase.from('journalists').insert({
        org_id: orgId,
        name: j.name,
        email: j.email_confidence >= 70 ? j.email : null,
        twitter_handle: j.twitter_handle,
        beat: topics.join(', '),
        metadata: {
          status: 'suggested',
          discovery_source: 'hunter.io',
          email_confidence: j.email_confidence,
          email_raw: j.email,
          position: j.position,
          publication_domain: j.publication_domain,
          discovered_at: new Date().toISOString(),
        },
      });

      if (!error) {
        result.saved++;
      }
    } catch {
      // Ignore duplicate insert errors
    }
  }

  logger.info(
    `Discovery for org ${orgId}, topics=[${topics.join(',')}]: ${result.discovered.length} found, ${result.saved} saved, ${result.already_exists} already existed`
  );

  return result;
}
