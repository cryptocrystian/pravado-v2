/**
 * Migration: SEO Keyword Intent
 * Sprint: S4
 * Description: Add intent classification to keywords for better opportunity detection
 */

-- Create intent enum type
CREATE TYPE public.seo_keyword_intent AS ENUM (
  'informational',
  'navigational',
  'commercial',
  'transactional'
);

-- Add intent column to seo_keywords table
ALTER TABLE public.seo_keywords
ADD COLUMN intent public.seo_keyword_intent NULL;

-- Add index for filtering by intent
CREATE INDEX idx_seo_keywords_intent ON public.seo_keywords(intent);

-- Add comment explaining intent types
COMMENT ON TYPE public.seo_keyword_intent IS
  'Keyword search intent classification:
   - informational: seeking information/answers
   - navigational: looking for specific website/page
   - commercial: researching before purchase
   - transactional: ready to take action/purchase';
