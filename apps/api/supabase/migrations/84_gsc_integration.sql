/**
 * Migration: GSC Integration (Sprint S-INT-06)
 * Stores Google Search Console OAuth connections per org
 */

-- GSC OAuth connections
CREATE TABLE IF NOT EXISTS public.gsc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  google_account_email TEXT NOT NULL,
  site_url TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id)
);

ALTER TABLE public.gsc_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage gsc" ON public.gsc_connections
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_gsc_connections_org_id ON public.gsc_connections(org_id);
CREATE INDEX idx_gsc_connections_sync_status ON public.gsc_connections(sync_status);
