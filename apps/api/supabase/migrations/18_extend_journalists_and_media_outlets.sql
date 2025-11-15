/**
 * Migration: Extend Journalists and Media Outlets
 * Sprint: S6
 * Description: Add detailed fields to journalists and media_outlets for PR Intelligence
 */

-- ========================================
-- EXTEND JOURNALISTS TABLE
-- ========================================

-- Add new columns to journalists (if they don't exist)
DO $$ BEGIN
  -- Add first_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='first_name') THEN
    ALTER TABLE public.journalists ADD COLUMN first_name TEXT;
  END IF;

  -- Add last_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='last_name') THEN
    ALTER TABLE public.journalists ADD COLUMN last_name TEXT;
  END IF;

  -- Add full_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='full_name') THEN
    ALTER TABLE public.journalists ADD COLUMN full_name TEXT;
  END IF;

  -- Add linkedin_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='linkedin_url') THEN
    ALTER TABLE public.journalists ADD COLUMN linkedin_url TEXT;
  END IF;

  -- Add website_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='website_url') THEN
    ALTER TABLE public.journalists ADD COLUMN website_url TEXT;
  END IF;

  -- Add primary_outlet_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='primary_outlet_id') THEN
    ALTER TABLE public.journalists ADD COLUMN primary_outlet_id UUID REFERENCES public.media_outlets(id);
  END IF;

  -- Add location if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='location') THEN
    ALTER TABLE public.journalists ADD COLUMN location TEXT;
  END IF;

  -- Add timezone if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='timezone') THEN
    ALTER TABLE public.journalists ADD COLUMN timezone TEXT;
  END IF;

  -- Add bio if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='bio') THEN
    ALTER TABLE public.journalists ADD COLUMN bio TEXT;
  END IF;

  -- Add is_freelancer if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journalists' AND column_name='is_freelancer') THEN
    ALTER TABLE public.journalists ADD COLUMN is_freelancer BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for journalists
CREATE INDEX IF NOT EXISTS idx_journalists_org_email ON public.journalists(org_id, email);
CREATE INDEX IF NOT EXISTS idx_journalists_org_full_name ON public.journalists(org_id, full_name);
CREATE INDEX IF NOT EXISTS idx_journalists_org_primary_outlet ON public.journalists(org_id, primary_outlet_id);

-- ========================================
-- EXTEND MEDIA_OUTLETS TABLE
-- ========================================

-- Add new columns to media_outlets (if they don't exist)
DO $$ BEGIN
  -- Add website_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_outlets' AND column_name='website_url') THEN
    ALTER TABLE public.media_outlets ADD COLUMN website_url TEXT;
  END IF;

  -- Add country if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_outlets' AND column_name='country') THEN
    ALTER TABLE public.media_outlets ADD COLUMN country TEXT;
  END IF;

  -- Add language if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_outlets' AND column_name='language') THEN
    ALTER TABLE public.media_outlets ADD COLUMN language TEXT;
  END IF;

  -- Add tier if not exists (e.g., 'top_tier', 'trade', 'niche')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_outlets' AND column_name='tier') THEN
    ALTER TABLE public.media_outlets ADD COLUMN tier TEXT;
  END IF;

  -- Add distribution if not exists (e.g., 'national', 'regional', 'local', 'global')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_outlets' AND column_name='distribution') THEN
    ALTER TABLE public.media_outlets ADD COLUMN distribution TEXT;
  END IF;
END $$;

-- Create indexes for media_outlets
CREATE INDEX IF NOT EXISTS idx_media_outlets_org_name ON public.media_outlets(org_id, name);
CREATE INDEX IF NOT EXISTS idx_media_outlets_org_tier ON public.media_outlets(org_id, tier);
