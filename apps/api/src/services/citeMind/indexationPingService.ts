/**
 * Indexation Ping Service — CiteMind Engine 1 (Lane D)
 *
 * On content publish, notify search / AI-ingestion surfaces that a URL is new
 * or updated. Two mechanisms, per canon:
 *
 *   • IndexNow  (CITEMIND_SYSTEM §2.5, SEO_AEO_PILLAR_CANON §3D): free, instant,
 *     Autopilot-eligible, fired on every publish. Keyed POST to api.indexnow.org.
 *   • Google Indexing API (§2.5): Copilot / high-priority only ("Confirm"),
 *     direct indexing request authenticated with a service-account access token.
 *
 * Credentials come from env (INDEXNOW_KEY, INDEXNOW_KEY_LOCATION,
 * GOOGLE_INDEXING_SA_EMAIL, GOOGLE_INDEXING_SA_PRIVATE_KEY). When a credential
 * is absent the corresponding ping is skipped (never throws) so publish is never
 * blocked by indexation. `fetch` is injectable for testing.
 */

import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('citemind:indexation');

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const GOOGLE_INDEXING_ENDPOINT =
  'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';

export type FetchLike = typeof fetch;

// ============================================================================
// Types
// ============================================================================

export interface IndexNowResult {
  submitted: boolean;
  status: number | null;
  urls: string[];
  endpoint: string;
  skippedReason?: string;
}

export interface GoogleIndexResult {
  submitted: boolean;
  status: number | null;
  url: string;
  skippedReason?: string;
}

export interface IndexationPingResult {
  url: string;
  indexnow: IndexNowResult;
  google: GoogleIndexResult;
}

interface ServiceAccount {
  email: string;
  privateKey: string;
}

// ============================================================================
// IndexNow
// ============================================================================

/**
 * Submit one or more URLs to IndexNow. Returns a structured result; never
 * throws (network/HTTP failures are captured as submitted:false).
 */
export async function submitIndexNow(
  urls: string[],
  opts: { key?: string; keyLocation?: string } = {},
  fetchImpl: FetchLike = fetch
): Promise<IndexNowResult> {
  const key = opts.key ?? process.env.INDEXNOW_KEY;
  const cleanUrls = urls.filter((u) => /^https?:\/\//i.test(u));

  if (!key) {
    return { submitted: false, status: null, urls: cleanUrls, endpoint: INDEXNOW_ENDPOINT, skippedReason: 'INDEXNOW_KEY not configured' };
  }
  if (cleanUrls.length === 0) {
    return { submitted: false, status: null, urls: [], endpoint: INDEXNOW_ENDPOINT, skippedReason: 'no valid URLs' };
  }

  let host: string;
  try {
    host = new URL(cleanUrls[0]).host;
  } catch {
    return { submitted: false, status: null, urls: cleanUrls, endpoint: INDEXNOW_ENDPOINT, skippedReason: 'invalid URL host' };
  }

  const keyLocation =
    opts.keyLocation ?? process.env.INDEXNOW_KEY_LOCATION ?? `https://${host}/${key}.txt`;

  const body = { host, key, keyLocation, urlList: cleanUrls };

  try {
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // IndexNow returns 200 (OK) or 202 (Accepted) on success.
    const ok = res.status === 200 || res.status === 202;
    if (!ok) logger.warn(`IndexNow returned ${res.status} for host ${host}`);
    return { submitted: ok, status: res.status, urls: cleanUrls, endpoint: INDEXNOW_ENDPOINT };
  } catch (err) {
    logger.warn(`IndexNow submit failed: ${err instanceof Error ? err.message : String(err)}`);
    return { submitted: false, status: null, urls: cleanUrls, endpoint: INDEXNOW_ENDPOINT, skippedReason: 'request failed' };
  }
}

// ============================================================================
// Google Indexing API
// ============================================================================

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Mint a short-lived Google access token from a service account using a
 * signed (RS256) JWT bearer grant. Returns null when SA creds are missing.
 */
export async function getGoogleIndexingAccessToken(
  sa?: ServiceAccount,
  fetchImpl: FetchLike = fetch
): Promise<string | null> {
  const email = sa?.email ?? process.env.GOOGLE_INDEXING_SA_EMAIL;
  // Private keys arrive with literal "\n"; normalize to real newlines.
  const privateKey = (sa?.privateKey ?? process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY)?.replace(
    /\\n/g,
    '\n'
  );

  if (!email || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: email,
    scope: GOOGLE_INDEXING_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  let assertion: string;
  try {
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
    assertion = `${signingInput}.${base64url(signature)}`;
  } catch (err) {
    logger.warn(`Failed to sign Google SA JWT: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }

  try {
    const res = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
    });
    if (!res.ok) {
      logger.warn(`Google token endpoint returned ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (err) {
    logger.warn(`Google token request failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Send a URL_UPDATED notification to the Google Indexing API. Never throws.
 */
export async function pingGoogleIndexing(
  url: string,
  accessToken: string,
  fetchImpl: FetchLike = fetch
): Promise<GoogleIndexResult> {
  if (!/^https?:\/\//i.test(url)) {
    return { submitted: false, status: null, url, skippedReason: 'invalid URL' };
  }
  try {
    const res = await fetchImpl(GOOGLE_INDEXING_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) logger.warn(`Google Indexing returned ${res.status} for ${url}`);
    return { submitted: ok, status: res.status, url };
  } catch (err) {
    logger.warn(`Google Indexing ping failed: ${err instanceof Error ? err.message : String(err)}`);
    return { submitted: false, status: null, url, skippedReason: 'request failed' };
  }
}

// ============================================================================
// Orchestrator — called by the publish path on publish
// ============================================================================

/**
 * On publish, fire IndexNow (always, Autopilot) and — when the content is
 * high-priority and SA creds exist — the Google Indexing API (Copilot). Records
 * the outcome to indexation_pings. Never throws.
 */
export async function pingIndexationOnPublish(
  supabase: SupabaseClient,
  params: { orgId: string; contentItemId: string; url: string; highPriority?: boolean },
  fetchImpl: FetchLike = fetch
): Promise<IndexationPingResult> {
  const { orgId, contentItemId, url, highPriority } = params;

  const indexnow = await submitIndexNow([url], {}, fetchImpl);

  let google: GoogleIndexResult = {
    submitted: false,
    status: null,
    url,
    skippedReason: highPriority ? 'no Google SA token' : 'not high-priority',
  };
  if (highPriority) {
    const token = await getGoogleIndexingAccessToken(undefined, fetchImpl);
    if (token) {
      google = await pingGoogleIndexing(url, token, fetchImpl);
    }
  }

  try {
    await supabase.from('indexation_pings').insert({
      org_id: orgId,
      content_item_id: contentItemId,
      url,
      indexnow_submitted: indexnow.submitted,
      indexnow_status: indexnow.status,
      google_submitted: google.submitted,
      google_status: google.status,
      response: { indexnow, google },
    });
  } catch (err) {
    logger.warn(
      `Failed to record indexation ping: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { url, indexnow, google };
}
