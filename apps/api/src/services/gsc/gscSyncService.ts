/**
 * GSC Sync Service (Sprint S-INT-06)
 *
 * Syncs Google Search Console search analytics data into seo_keywords + seo_keyword_metrics.
 * Handles token refresh, API calls, and upsert logic.
 */

import { createLogger } from '@pravado/utils';

const logger = createLogger('service:gsc-sync');

// ============================================================================
// Types
// ============================================================================

interface GscConnection {
  id: string;
  org_id: string;
  google_account_email: string;
  site_url: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  last_synced_at: string | null;
  sync_status: string;
}

interface GscSearchRow {
  keys: string[];    // [query, page]
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscSyncResult {
  keywordsUpserted: number;
  metricsUpserted: number;
  errors: string[];
}

interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

// ============================================================================
// Token Refresh
// ============================================================================

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logger.error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(`Token refresh failed: ${res.status} ${body}`);
      return null;
    }

    const data = (await res.json()) as { access_token: string; expires_in?: number };
    return {
      access_token: data.access_token,
      expires_in: data.expires_in ?? 3600,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Token refresh error: ${msg}`);
    return null;
  }
}

// ============================================================================
// GSC API Calls
// ============================================================================

async function fetchSearchAnalytics(
  siteUrl: string,
  accessToken: string
): Promise<GscSearchRow[]> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // yesterday
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // 90 days ago

  const body = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query', 'page'],
    rowLimit: 500,
  };

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { rows?: GscSearchRow[] };
  return data.rows ?? [];
}

export async function fetchGscSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC sites list error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { siteEntry?: GscSite[] };
  return data.siteEntry ?? [];
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google userinfo error ${res.status}`);
  }

  const data = (await res.json()) as { email?: string };
  return data.email ?? 'unknown';
}

// ============================================================================
// Main Sync
// ============================================================================

export async function syncOrg(
  supabase: any,
  orgId: string
): Promise<GscSyncResult> {
  const result: GscSyncResult = { keywordsUpserted: 0, metricsUpserted: 0, errors: [] };

  // Load GSC connection
  const { data: connection, error: connError } = await supabase
    .from('gsc_connections')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (connError || !connection) {
    logger.info(`No GSC connection for org ${orgId} — skipping`);
    return result;
  }

  const conn = connection as GscConnection;

  // Update sync status
  await supabase
    .from('gsc_connections')
    .update({ sync_status: 'syncing', error_message: null })
    .eq('id', conn.id);

  try {
    // Refresh token if expiry within 5 minutes
    let accessToken = conn.access_token;
    const expiryDate = new Date(conn.token_expiry);
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (expiryDate <= fiveMinFromNow) {
      logger.info(`Refreshing GSC token for org ${orgId}`);
      const refreshed = await refreshAccessToken(conn.refresh_token);
      if (!refreshed) {
        await supabase
          .from('gsc_connections')
          .update({
            sync_status: 'error',
            error_message: 'Token expired — reconnect Google Search Console',
          })
          .eq('id', conn.id);
        result.errors.push('Token refresh failed');
        return result;
      }

      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
      await supabase
        .from('gsc_connections')
        .update({ access_token: accessToken, token_expiry: newExpiry.toISOString() })
        .eq('id', conn.id);
    }

    // Fetch search analytics
    logger.info(`Fetching GSC data for org ${orgId}, site ${conn.site_url}`);
    const rows = await fetchSearchAnalytics(conn.site_url, accessToken);
    logger.info(`Got ${rows.length} GSC rows for org ${orgId}`);

    // Upsert keywords and metrics
    for (const row of rows) {
      const keyword = row.keys[0];
      const pageUrl = row.keys[1];

      if (!keyword) continue;

      try {
        // Upsert into seo_keywords
        const { data: kwData, error: kwError } = await supabase
          .from('seo_keywords')
          .upsert(
            {
              org_id: orgId,
              keyword,
              tracked_url: pageUrl,
              current_position: Math.round(row.position),
              search_volume: row.impressions, // GSC impressions as proxy for volume
              status: 'active',
              metadata: { source: 'gsc', last_gsc_sync: new Date().toISOString() },
            },
            { onConflict: 'org_id,keyword,tracked_url' }
          )
          .select('id')
          .single();

        if (kwError) {
          result.errors.push(`Keyword upsert error for "${keyword}": ${kwError.message}`);
          continue;
        }

        result.keywordsUpserted++;

        // Upsert into seo_keyword_metrics
        if (kwData?.id) {
          const { error: metricError } = await supabase
            .from('seo_keyword_metrics')
            .upsert(
              {
                org_id: orgId,
                keyword_id: kwData.id,
                source: 'gsc',
                search_volume: row.impressions,
                click_through_rate: Math.round(row.ctr * 10000) / 100, // Convert to percentage
                priority_score: calculatePriorityScore(row),
                last_refreshed_at: new Date().toISOString(),
              },
              {
                onConflict: 'org_id,keyword_id,source',
                ignoreDuplicates: false,
              }
            );

          if (metricError) {
            result.errors.push(`Metric upsert error for "${keyword}": ${metricError.message}`);
          } else {
            result.metricsUpserted++;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Row error for "${keyword}": ${msg}`);
      }
    }

    // Update connection status
    await supabase
      .from('gsc_connections')
      .update({
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        error_message: result.errors.length > 0 ? `${result.errors.length} row errors` : null,
      })
      .eq('id', conn.id);

    logger.info(
      `GSC sync complete for org ${orgId}: ${result.keywordsUpserted} keywords, ${result.metricsUpserted} metrics, ${result.errors.length} errors`
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`GSC sync failed for org ${orgId}: ${msg}`);

    const isAuthError = msg.includes('401') || msg.includes('403');
    await supabase
      .from('gsc_connections')
      .update({
        sync_status: 'error',
        error_message: isAuthError
          ? 'Token expired — reconnect Google Search Console'
          : `Sync failed: ${msg}`,
      })
      .eq('id', conn.id);

    result.errors.push(msg);
  }

  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function calculatePriorityScore(row: GscSearchRow): number {
  // Priority based on impressions, clicks, and position
  // High impressions + low position = high priority (opportunity)
  // High clicks = already performing well
  const impressionScore = Math.min(row.impressions / 100, 50); // Max 50
  const positionScore = row.position <= 10 ? 20 : row.position <= 20 ? 30 : row.position <= 50 ? 40 : 50;
  const clickScore = Math.min(row.clicks / 10, 20);

  return Math.min(Math.round(impressionScore + positionScore - clickScore), 100);
}

/**
 * Get GSC connection status for an org
 */
export async function getGscStatus(supabase: any, orgId: string) {
  const { data: conn } = await supabase
    .from('gsc_connections')
    .select('site_url, last_synced_at, sync_status, error_message')
    .eq('org_id', orgId)
    .single();

  if (!conn) {
    return { connected: false, site_url: null, last_synced_at: null, sync_status: null, keyword_count: 0 };
  }

  // Count keywords with GSC source
  const { count } = await supabase
    .from('seo_keyword_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('source', 'gsc');

  return {
    connected: true,
    site_url: conn.site_url,
    last_synced_at: conn.last_synced_at,
    sync_status: conn.sync_status,
    error_message: conn.error_message,
    keyword_count: count ?? 0,
  };
}

/**
 * Disconnect GSC and revoke token
 */
export async function disconnectGsc(supabase: any, orgId: string): Promise<void> {
  const { data: conn } = await supabase
    .from('gsc_connections')
    .select('access_token')
    .eq('org_id', orgId)
    .single();

  if (conn?.access_token) {
    // Revoke Google token (best effort)
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch {
      logger.warn(`Failed to revoke Google token for org ${orgId} — continuing`);
    }
  }

  // Remove connection (does NOT delete synced keyword data)
  await supabase.from('gsc_connections').delete().eq('org_id', orgId);
  logger.info(`GSC disconnected for org ${orgId}`);
}
