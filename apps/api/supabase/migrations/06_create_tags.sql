-- Create tags table (shared across all pillars)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- hex color for UI display
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Add trigger for updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tags in their org"
  ON public.tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tags.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags in their org"
  ON public.tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tags.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in their org"
  ON public.tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tags.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their org"
  ON public.tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tags.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_tags_org_id ON public.tags(org_id);
CREATE INDEX idx_tags_name ON public.tags(org_id, name);
