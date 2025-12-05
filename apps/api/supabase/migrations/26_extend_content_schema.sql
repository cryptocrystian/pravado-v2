/**
 * Migration 26: Extend Content Schema (Sprint S12)
 * Extends content tables for Content Intelligence Engine V1
 */

-- ========================================
-- EXTEND content_items
-- ========================================

-- Add new columns to content_items
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS primary_topic_id uuid,
  ADD COLUMN IF NOT EXISTS embeddings vector(1536),
  ADD COLUMN IF NOT EXISTS performance jsonb DEFAULT '{}'::jsonb;

-- Add check constraint for status
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

-- Add indexes for content_items
CREATE INDEX IF NOT EXISTS idx_content_items_org_status
  ON public.content_items(org_id, status);

CREATE INDEX IF NOT EXISTS idx_content_items_org_topic
  ON public.content_items(org_id, primary_topic_id);

-- Create HNSW index for vector similarity search on embeddings
CREATE INDEX IF NOT EXISTS idx_content_items_embeddings
  ON public.content_items
  USING hnsw (embeddings vector_cosine_ops);

-- ========================================
-- EXTEND content_briefs
-- ========================================

-- Add new columns to content_briefs
ALTER TABLE public.content_briefs
  ADD COLUMN IF NOT EXISTS target_keyword text,
  ADD COLUMN IF NOT EXISTS target_intent text,
  ADD COLUMN IF NOT EXISTS outline jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Add check constraint for status
ALTER TABLE public.content_briefs
  ADD CONSTRAINT content_briefs_status_check
  CHECK (status IN ('draft', 'in_progress', 'completed'));

-- Add index for content_briefs status
CREATE INDEX IF NOT EXISTS idx_content_briefs_org_status
  ON public.content_briefs(org_id, status);

-- ========================================
-- EXTEND content_topics
-- ========================================

-- Add new columns to content_topics
ALTER TABLE public.content_topics
  ADD COLUMN IF NOT EXISTS embeddings vector(1536),
  ADD COLUMN IF NOT EXISTS cluster_id uuid;

-- Create HNSW index for vector similarity search on topic embeddings
CREATE INDEX IF NOT EXISTS idx_content_topics_embeddings
  ON public.content_topics
  USING hnsw (embeddings vector_cosine_ops);

-- Add index for cluster_id
CREATE INDEX IF NOT EXISTS idx_content_topics_cluster
  ON public.content_topics(org_id, cluster_id);

-- ========================================
-- CREATE content_topic_clusters
-- ========================================

CREATE TABLE IF NOT EXISTS public.content_topic_clusters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for content_topic_clusters
CREATE INDEX IF NOT EXISTS idx_content_topic_clusters_org
  ON public.content_topic_clusters(org_id);

-- ========================================
-- RLS POLICIES for content_topic_clusters
-- ========================================

-- Enable RLS
ALTER TABLE public.content_topic_clusters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view clusters for their orgs
CREATE POLICY content_topic_clusters_select_policy
  ON public.content_topic_clusters
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert clusters for their orgs
CREATE POLICY content_topic_clusters_insert_policy
  ON public.content_topic_clusters
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update clusters for their orgs
CREATE POLICY content_topic_clusters_update_policy
  ON public.content_topic_clusters
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete clusters for their orgs
CREATE POLICY content_topic_clusters_delete_policy
  ON public.content_topic_clusters
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- ADD FOREIGN KEY for content_topics.cluster_id
-- ========================================

-- Add foreign key constraint (allow null)
ALTER TABLE public.content_topics
  ADD CONSTRAINT fk_content_topics_cluster
  FOREIGN KEY (cluster_id)
  REFERENCES public.content_topic_clusters(id)
  ON DELETE SET NULL;

-- Add foreign key constraint for content_items.primary_topic_id
ALTER TABLE public.content_items
  ADD CONSTRAINT fk_content_items_primary_topic
  FOREIGN KEY (primary_topic_id)
  REFERENCES public.content_topics(id)
  ON DELETE SET NULL;
