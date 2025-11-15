-- Create org_invites table
CREATE TABLE IF NOT EXISTS public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_member_role NOT NULL DEFAULT 'member',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_org_email_pending UNIQUE (org_id, email)
);

-- Enable RLS
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invites for their orgs"
  ON public.org_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_invites.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can create invites"
  ON public.org_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_invites.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update invites"
  ON public.org_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = org_invites.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Create function to clean up expired invites
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM public.org_invites
  WHERE expires_at < NOW()
  AND accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_org_invites_org_id ON public.org_invites(org_id);
CREATE INDEX idx_org_invites_email ON public.org_invites(email);
CREATE INDEX idx_org_invites_token ON public.org_invites(token);
CREATE INDEX idx_org_invites_expires_at ON public.org_invites(expires_at);
