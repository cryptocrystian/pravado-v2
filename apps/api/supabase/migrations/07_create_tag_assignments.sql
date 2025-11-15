-- Create tag_assignments table (polymorphic - links tags to any entity)
CREATE TABLE IF NOT EXISTS public.tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  taggable_type TEXT NOT NULL, -- e.g., 'pr_source', 'content_item', 'seo_keyword'
  taggable_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tag_id, taggable_type, taggable_id)
);

-- Enable RLS
ALTER TABLE public.tag_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tag assignments in their org"
  ON public.tag_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tag_assignments.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tag assignments in their org"
  ON public.tag_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tag_assignments.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tag assignments in their org"
  ON public.tag_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = tag_assignments.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_tag_assignments_org_id ON public.tag_assignments(org_id);
CREATE INDEX idx_tag_assignments_tag_id ON public.tag_assignments(tag_id);
CREATE INDEX idx_tag_assignments_taggable ON public.tag_assignments(taggable_type, taggable_id);
