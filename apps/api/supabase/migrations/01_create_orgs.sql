-- Create orgs table
CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view orgs they are members of"
  ON public.orgs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orgs"
  ON public.orgs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org owners can update their org"
  ON public.orgs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );

-- Create indexes
CREATE INDEX idx_orgs_created_at ON public.orgs(created_at);
