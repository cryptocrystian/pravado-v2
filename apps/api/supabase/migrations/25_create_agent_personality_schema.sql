/**
 * Migration 25: Agent Personality Engine V1 (Sprint S11)
 * Creates tables for personality profiles and agent assignments
 */

-- ========================================
-- TABLE: agent_personalities
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_personalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agent_personalities IS 'Stores agent personality profiles that influence behavior, tone, and decision-making';
COMMENT ON COLUMN public.agent_personalities.slug IS 'URL-friendly identifier (e.g., pr-analyst, seo-strategist)';
COMMENT ON COLUMN public.agent_personalities.configuration IS 'Full personality profile including tone, style, biases, constraints';
COMMENT ON COLUMN public.agent_personalities.created_by IS 'User who created this personality (null for system personalities)';

-- Indexes for agent_personalities
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_personalities_org_slug
  ON public.agent_personalities(org_id, slug);

CREATE INDEX IF NOT EXISTS idx_agent_personalities_org
  ON public.agent_personalities(org_id);

-- ========================================
-- TABLE: agent_personality_assignments
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_personality_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  personality_id UUID NOT NULL REFERENCES public.agent_personalities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agent_personality_assignments IS 'Links agent definitions to personality profiles';
COMMENT ON COLUMN public.agent_personality_assignments.agent_id IS 'Agent identifier from agent definitions';
COMMENT ON COLUMN public.agent_personality_assignments.personality_id IS 'Reference to personality profile';

-- Indexes for agent_personality_assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_personality_assignments_unique
  ON public.agent_personality_assignments(org_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_personality_assignments_personality
  ON public.agent_personality_assignments(personality_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.agent_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_personality_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: agent_personalities
CREATE POLICY agent_personalities_org_isolation ON public.agent_personalities
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: agent_personality_assignments
CREATE POLICY agent_personality_assignments_org_isolation ON public.agent_personality_assignments
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );
