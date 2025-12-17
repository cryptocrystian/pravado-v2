/**
 * Add embeddings column to pr_generated_releases
 *
 * First tries to enable pgvector extension, then adds the vector column.
 * If pgvector is not available, falls back to JSONB storage.
 */

-- Try to enable pgvector extension (may already be enabled or not available)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embeddings column as vector type if pgvector is available
DO $$
BEGIN
  -- Check if vector type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    -- Add vector column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'pr_generated_releases'
      AND column_name = 'embeddings'
    ) THEN
      ALTER TABLE public.pr_generated_releases ADD COLUMN embeddings vector(1536);
      RAISE NOTICE 'Added embeddings column with vector(1536) type';
    ELSE
      RAISE NOTICE 'embeddings column already exists';
    END IF;
  ELSE
    -- Fallback: use JSONB if vector type not available
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'pr_generated_releases'
      AND column_name = 'embeddings'
    ) THEN
      ALTER TABLE public.pr_generated_releases ADD COLUMN embeddings JSONB DEFAULT NULL;
      RAISE NOTICE 'Added embeddings column with JSONB fallback type';
    ELSE
      RAISE NOTICE 'embeddings column already exists';
    END IF;
  END IF;
END $$;

-- Verify column exists
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pr_generated_releases'
AND column_name = 'embeddings';
