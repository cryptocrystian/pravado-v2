/**
 * Migration 24: Agent Memory System V2 (Sprint S10)
 * Creates tables for semantic memory, episodic traces, and memory links
 */

-- ========================================
-- ENABLE PGVECTOR EXTENSION
-- ========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- TABLE: agent_memories
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('semantic', 'episodic')),
  embedding vector(1536),
  content JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('step', 'user', 'agent', 'system')),
  importance FLOAT8 NOT NULL DEFAULT 0 CHECK (importance >= 0 AND importance <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_seconds INTEGER
);

COMMENT ON TABLE public.agent_memories IS 'Stores long-term semantic and episodic memory entries for agents';
COMMENT ON COLUMN public.agent_memories.type IS 'Memory type: semantic (general knowledge) or episodic (specific events)';
COMMENT ON COLUMN public.agent_memories.embedding IS '1536-dimensional vector for semantic similarity search';
COMMENT ON COLUMN public.agent_memories.content IS 'Memory content as flexible JSON structure';
COMMENT ON COLUMN public.agent_memories.source IS 'Source of memory: step, user, agent, or system';
COMMENT ON COLUMN public.agent_memories.importance IS 'Importance score (0-1) for retrieval ranking';
COMMENT ON COLUMN public.agent_memories.ttl_seconds IS 'Time-to-live in seconds; null means permanent';

-- Indexes for agent_memories
CREATE INDEX IF NOT EXISTS idx_agent_memories_org_type
  ON public.agent_memories(org_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memories_importance
  ON public.agent_memories(org_id, importance DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding
  ON public.agent_memories USING hnsw (embedding vector_cosine_ops);

-- ========================================
-- TABLE: agent_episode_runs
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_episode_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES public.playbook_runs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  content JSONB NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agent_episode_runs IS 'Stores episodic traces for each playbook step execution';
COMMENT ON COLUMN public.agent_episode_runs.run_id IS 'Reference to the playbook run';
COMMENT ON COLUMN public.agent_episode_runs.step_key IS 'Key of the playbook step that generated this episode';
COMMENT ON COLUMN public.agent_episode_runs.content IS 'Episode content including inputs, outputs, context';
COMMENT ON COLUMN public.agent_episode_runs.embedding IS 'Vector embedding for episode similarity search';

-- Indexes for agent_episode_runs
CREATE INDEX IF NOT EXISTS idx_agent_episode_runs_lookup
  ON public.agent_episode_runs(org_id, run_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_episode_runs_embedding
  ON public.agent_episode_runs USING hnsw (embedding vector_cosine_ops);

-- ========================================
-- TABLE: agent_memory_links
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_memory_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.agent_memories(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  weight FLOAT8 NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agent_memory_links IS 'Links memories to entities (keywords, journalists, content items, etc.)';
COMMENT ON COLUMN public.agent_memory_links.entity_type IS 'Type of entity: keyword, journalist, content_item, pr_list, etc.';
COMMENT ON COLUMN public.agent_memory_links.entity_id IS 'UUID of the linked entity';
COMMENT ON COLUMN public.agent_memory_links.weight IS 'Link strength/importance (0+)';

-- Indexes for agent_memory_links
CREATE INDEX IF NOT EXISTS idx_agent_memory_links_entity
  ON public.agent_memory_links(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_agent_memory_links_memory
  ON public.agent_memory_links(memory_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_episode_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: agent_memories
CREATE POLICY agent_memories_org_isolation ON public.agent_memories
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: agent_episode_runs
CREATE POLICY agent_episode_runs_org_isolation ON public.agent_episode_runs
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: agent_memory_links (indirect via memory_id)
CREATE POLICY agent_memory_links_org_isolation ON public.agent_memory_links
  FOR ALL
  USING (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
      )
    )
  );
