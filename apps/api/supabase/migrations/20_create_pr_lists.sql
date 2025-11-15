/**
 * Migration: PR Lists and List Members
 * Sprint: S6
 * Description: Create PR lists for organizing journalists and tracking relationships
 */

-- ========================================
-- CREATE PR_LISTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for pr_lists
CREATE INDEX idx_pr_lists_org_id ON public.pr_lists(org_id);
CREATE INDEX idx_pr_lists_org_name ON public.pr_lists(org_id, name);
CREATE INDEX idx_pr_lists_created_by ON public.pr_lists(created_by);

-- Enable RLS on pr_lists
ALTER TABLE public.pr_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_lists
CREATE POLICY "Users can view lists in their org"
  ON public.pr_lists FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lists in their org"
  ON public.pr_lists FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lists in their org"
  ON public.pr_lists FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lists in their org"
  ON public.pr_lists FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at on pr_lists
CREATE TRIGGER update_pr_lists_updated_at
  BEFORE UPDATE ON public.pr_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE PR_LIST_MEMBERS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.pr_lists(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalists(id) ON DELETE CASCADE,
  added_by UUID REFERENCES public.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_list_members_list_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.pr_lists WHERE id = list_id)
  ),
  CONSTRAINT fk_list_members_journalist_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.journalists WHERE id = journalist_id)
  ),

  -- Prevent duplicate list-journalist pairs
  UNIQUE(list_id, journalist_id)
);

-- Indexes for pr_list_members
CREATE INDEX idx_pr_list_members_org_id ON public.pr_list_members(org_id);
CREATE INDEX idx_pr_list_members_list_id ON public.pr_list_members(list_id);
CREATE INDEX idx_pr_list_members_journalist_id ON public.pr_list_members(journalist_id);
CREATE INDEX idx_pr_list_members_added_by ON public.pr_list_members(added_by);
CREATE INDEX idx_pr_list_members_org_list ON public.pr_list_members(org_id, list_id);

-- Enable RLS on pr_list_members
ALTER TABLE public.pr_list_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pr_list_members
CREATE POLICY "Users can view list members in their org"
  ON public.pr_list_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert list members in their org"
  ON public.pr_list_members FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update list members in their org"
  ON public.pr_list_members FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete list members in their org"
  ON public.pr_list_members FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );
