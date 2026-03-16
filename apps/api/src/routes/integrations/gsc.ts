/**
 * GSC Integration Routes (Sprint S-INT-06)
 *
 * OAuth flow + sync management for Google Search Console.
 * Prefix: /api/v1/integrations/gsc
 */

import { FLAGS } from '@pravado/feature-flags';
import { createLogger } from '@pravado/utils';
import type { FastifyInstance } from 'fastify';

import { getSupabaseClient } from '../../lib/supabase';

const logger = createLogger('routes:gsc');

export async function gscRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  // Helper to get user's org ID
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    return data?.org_id ?? null;
  }

  // ========================================================================
  // GET /auth-url — Generate Google OAuth2 URL
  // ========================================================================
  server.get('/auth-url', async (request, reply) => {
    if (!FLAGS.ENABLE_GSC_INTEGRATION) {
      return reply.code(404).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'GSC integration not enabled' } });
    }

    if (!(request as any).user) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const orgId = await getUserOrgId((request as any).user.id);
    if (!orgId) {
      return reply.code(403).send({ success: false, error: { code: 'NO_ORG', message: 'No organization found' } });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!clientId) {
      return reply.code(500).send({ success: false, error: { code: 'CONFIG_ERROR', message: 'Google OAuth not configured' } });
    }

    const redirectUri = `${appUrl}/api/integrations/gsc/callback`;

    // Encode orgId in state for validation on callback
    const state = Buffer.from(JSON.stringify({ orgId, userId: (request as any).user.id })).toString('base64');

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    return reply.send({ success: true, data: { auth_url: authUrl } });
  });

  // ========================================================================
  // GET /callback — Exchange auth code for tokens
  // ========================================================================
  server.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/callback',
    async (request, reply) => {
      if (!FLAGS.ENABLE_GSC_INTEGRATION) {
        return reply.code(404).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'GSC integration not enabled' } });
      }

      const { code, state, error: oauthError } = request.query;

      if (oauthError) {
        logger.warn(`GSC OAuth error: ${oauthError}`);
        return reply.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/seo?gsc=error&reason=${oauthError}`);
      }

      if (!code || !state) {
        return reply.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/seo?gsc=error&reason=missing_params`);
      }

      try {
        // Decode state
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const { orgId } = stateData;

        if (!orgId) {
          return reply.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/seo?gsc=error&reason=invalid_state`);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${appUrl}/api/integrations/gsc/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId!,
            client_secret: clientSecret!,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenRes.ok) {
          const text = await tokenRes.text();
          logger.error(`Token exchange failed: ${text}`);
          return reply.redirect(`${appUrl}/app/seo?gsc=error&reason=token_exchange`);
        }

        const tokens = (await tokenRes.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in?: number;
        };
        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;
        const expiresIn = tokens.expires_in ?? 3600;

        // Fetch user email
        const { fetchGoogleUserEmail, fetchGscSites } = await import('../../services/gsc/gscSyncService');
        const email = await fetchGoogleUserEmail(accessToken);

        // Fetch verified sites
        const sites = await fetchGscSites(accessToken);

        if (!sites.length) {
          return reply.redirect(`${appUrl}/app/seo?gsc=error&reason=no_sites`);
        }

        // Pick best matching site (or first)
        const { data: org } = await supabase.from('orgs').select('domain').eq('id', orgId).single();
        let selectedSite = sites[0];
        if (org?.domain) {
          const match = sites.find((s: { siteUrl: string }) =>
            s.siteUrl.includes(org.domain)
          );
          if (match) selectedSite = match;
        }

        // Save connection
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
        await supabase.from('gsc_connections').upsert(
          {
            org_id: orgId,
            google_account_email: email,
            site_url: selectedSite.siteUrl,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: tokenExpiry,
            sync_status: 'pending',
          },
          { onConflict: 'org_id' }
        );

        // Enqueue immediate sync
        try {
          const { enqueueGscSync } = await import('../../queue/bullmqQueue');
          await enqueueGscSync(orgId);
        } catch {
          logger.warn('Failed to enqueue GSC sync — will sync on next schedule');
        }

        logger.info(`GSC connected for org ${orgId}: ${selectedSite.siteUrl}`);
        return reply.redirect(`${appUrl}/app/seo?gsc=connected`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`GSC callback error: ${msg}`);
        return reply.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/app/seo?gsc=error&reason=server_error`);
      }
    }
  );

  // ========================================================================
  // GET /status — Connection status
  // ========================================================================
  server.get('/status', async (request, reply) => {
    if (!FLAGS.ENABLE_GSC_INTEGRATION) {
      return reply.code(404).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'GSC integration not enabled' } });
    }

    if (!(request as any).user) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const orgId = await getUserOrgId((request as any).user.id);
    if (!orgId) {
      return reply.code(403).send({ success: false, error: { code: 'NO_ORG', message: 'No organization found' } });
    }

    const { getGscStatus } = await import('../../services/gsc/gscSyncService');
    const status = await getGscStatus(supabase, orgId);

    return reply.send({ success: true, data: status });
  });

  // ========================================================================
  // DELETE /disconnect — Remove GSC connection
  // ========================================================================
  server.delete('/disconnect', async (request, reply) => {
    if (!FLAGS.ENABLE_GSC_INTEGRATION) {
      return reply.code(404).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'GSC integration not enabled' } });
    }

    if (!(request as any).user) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const orgId = await getUserOrgId((request as any).user.id);
    if (!orgId) {
      return reply.code(403).send({ success: false, error: { code: 'NO_ORG', message: 'No organization found' } });
    }

    const { disconnectGsc } = await import('../../services/gsc/gscSyncService');
    await disconnectGsc(supabase, orgId);

    return reply.send({ success: true, data: { disconnected: true } });
  });

  // ========================================================================
  // POST /sync — Trigger manual sync
  // ========================================================================
  server.post('/sync', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (request, reply) => {
    if (!FLAGS.ENABLE_GSC_INTEGRATION) {
      return reply.code(404).send({ success: false, error: { code: 'FEATURE_DISABLED', message: 'GSC integration not enabled' } });
    }

    if (!(request as any).user) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const orgId = await getUserOrgId((request as any).user.id);
    if (!orgId) {
      return reply.code(403).send({ success: false, error: { code: 'NO_ORG', message: 'No organization found' } });
    }

    try {
      const { enqueueGscSync } = await import('../../queue/bullmqQueue');
      await enqueueGscSync(orgId);
      return reply.send({ success: true, data: { queued: true } });
    } catch {
      // Direct sync fallback
      const { syncOrg } = await import('../../services/gsc/gscSyncService');
      const result = await syncOrg(supabase, orgId);
      return reply.send({ success: true, data: result });
    }
  });
}
