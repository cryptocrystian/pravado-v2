/**
 * CiteMind Schema Generator (Sprint S-INT-04; Lane D / Engine 1 expansion)
 *
 * Generates JSON-LD structured data for content items.
 * Detects content type from title + body + content_type heuristics and
 * generates the appropriate schema, then saves to citemind_schemas.
 *
 * Canon: CITEMIND_SYSTEM.md §2.3 + SEO_AEO_PILLAR_CANON.md §3D require the
 * full canonical set of Engine-1 schema types:
 *   Article, BlogPosting, HowTo, FAQPage (original)
 *   NewsArticle, Organization, Person       (Lane D — added here)
 */

import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('citemind:schema');

// ============================================================================
// Types
// ============================================================================

export type SchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'HowTo'
  | 'FAQPage'
  | 'Organization'
  | 'Person';

interface SchemaGenerationResult {
  schema_type: SchemaType;
  schema_json: Record<string, unknown>;
  content_item_id: string;
}

interface ContentItemForSchema {
  id: string;
  org_id: string;
  title: string;
  body: string | null;
  content_type: string;
  url: string | null;
  published_at: string | null;
  word_count: number | null;
  metadata: Record<string, unknown> | null;
}

interface OrgForSchema {
  name: string;
  website_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

// ============================================================================
// Schema Detection
// ============================================================================

/**
 * Detect the most appropriate schema.org type for a content item.
 *
 * Precedence (highest first):
 *   1. Explicit `metadata.schema_type` override
 *   2. Format-driven: FAQPage, HowTo
 *   3. Entity-driven: NewsArticle (press release), Person (bio), Organization (about)
 *   4. Generic: BlogPosting, Article
 */
export function detectSchemaType(
  title: string,
  body: string,
  contentType?: string | null,
  metadata?: Record<string, unknown> | null
): SchemaType {
  const override = metadata?.schema_type;
  if (
    typeof override === 'string' &&
    [
      'Article',
      'BlogPosting',
      'NewsArticle',
      'HowTo',
      'FAQPage',
      'Organization',
      'Person',
    ].includes(override)
  ) {
    return override as SchemaType;
  }

  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();
  const ct = (contentType || '').toLowerCase();

  // --- Format-driven -------------------------------------------------------

  // FAQ detection: multiple questions in content
  const questionCount = (body.match(/\?[\s\n]/g) || []).length;
  const hasFAQPattern =
    titleLower.includes('faq') ||
    titleLower.includes('frequently asked') ||
    questionCount >= 3;
  if (hasFAQPattern) return 'FAQPage';

  // HowTo detection: step-by-step instructions
  const hasHowTo =
    titleLower.includes('how to') ||
    titleLower.includes('tutorial') ||
    titleLower.includes('step-by-step') ||
    (bodyLower.includes('step 1') && bodyLower.includes('step 2'));
  if (hasHowTo) return 'HowTo';

  // --- Entity-driven -------------------------------------------------------

  // NewsArticle: press releases / news announcements
  const isNews =
    ct === 'press_release' ||
    ct === 'news' ||
    titleLower.includes('press release') ||
    bodyLower.includes('for immediate release') ||
    /\b(today\s+)?announced?\b/.test(titleLower) ||
    /\b(today\s+)?announced?\b/.test(bodyLower.slice(0, 400));
  if (isNews) return 'NewsArticle';

  // Person: executive bio / spokesperson content
  const isPerson =
    ct === 'bio' ||
    ct === 'executive_bio' ||
    titleLower.includes(' bio') ||
    titleLower.includes('biography') ||
    (/\b(ceo|cto|cfo|coo|founder|co-founder|president|vice president|spokesperson|chief\s+\w+\s+officer)\b/.test(
      bodyLower.slice(0, 300)
    ) &&
      /\bis (the|a|our)\b/.test(bodyLower.slice(0, 300)));
  if (isPerson) return 'Person';

  // Organization: about / brand-entity content
  const isOrg =
    ct === 'about' ||
    ct === 'company' ||
    titleLower.startsWith('about') ||
    titleLower.includes('about us') ||
    titleLower.includes('company overview') ||
    bodyLower.slice(0, 300).includes('founded in');
  if (isOrg) return 'Organization';

  // --- Generic -------------------------------------------------------------

  if (
    titleLower.includes('blog') ||
    ct === 'blog_post' ||
    body.split(/\s+/).length < 1500
  ) {
    return 'BlogPosting';
  }

  return 'Article';
}

// ============================================================================
// Schema Templates — Article family
// ============================================================================

function articleFamilySchema(
  atType: 'Article' | 'BlogPosting' | 'NewsArticle',
  item: ContentItemForSchema,
  org: OrgForSchema
): Record<string, unknown> {
  const body = item.body || '';
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': atType,
    headline: item.title,
    author: {
      '@type': 'Organization',
      name: org.name,
    },
    publisher: {
      '@type': 'Organization',
      name: org.name,
      ...(org.logo_url
        ? { logo: { '@type': 'ImageObject', url: org.logo_url } }
        : {}),
    },
    datePublished: item.published_at || new Date().toISOString(),
    dateModified: new Date().toISOString(),
    ...(item.url ? { url: item.url } : {}),
    ...(item.word_count ? { wordCount: item.word_count } : {}),
    description: body.substring(0, 200).replace(/\n/g, ' ').trim(),
  };

  // NewsArticle carries the full articleBody + image per canon §2.3
  if (atType === 'NewsArticle') {
    schema.articleBody = body.replace(/\n{2,}/g, '\n').trim();
    const image =
      metaString(item.metadata, 'image') ||
      metaString(item.metadata, 'image_url');
    if (image) schema.image = image;
  }

  return schema;
}

function generateHowToSchema(
  item: ContentItemForSchema,
  org: OrgForSchema
): Record<string, unknown> {
  const body = item.body || '';

  const steps: Array<{ '@type': string; text: string; position: number }> = [];
  const stepMatches =
    body.match(/(?:^|\n)\s*(?:\d+[.)]\s+|step\s+\d+[:.]\s*)(.+)/gim) || [];

  stepMatches.forEach((match, idx) => {
    const text = match
      .replace(/^\s*(?:\d+[.)]\s+|step\s+\d+[:.]\s*)/i, '')
      .trim();
    if (text.length > 5) {
      steps.push({ '@type': 'HowToStep', text, position: idx + 1 });
    }
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: item.title,
    description: body.substring(0, 200).replace(/\n/g, ' ').trim(),
    ...(steps.length > 0 ? { step: steps } : {}),
    author: { '@type': 'Organization', name: org.name },
    datePublished: item.published_at || new Date().toISOString(),
    ...(item.url ? { url: item.url } : {}),
  };
}

function generateFAQSchema(
  item: ContentItemForSchema
): Record<string, unknown> {
  const body = item.body || '';
  const faqEntries: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: { '@type': string; text: string };
  }> = [];

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith('?') && line.length > 10) {
      let answer = '';
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.length > 0 && !nextLine.endsWith('?')) {
          answer = nextLine;
          break;
        }
      }
      if (answer) {
        faqEntries.push({
          '@type': 'Question',
          name: line.replace(/^#+\s*/, ''),
          acceptedAnswer: { '@type': 'Answer', text: answer },
        });
      }
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.length > 0 ? faqEntries : undefined,
    name: item.title,
    ...(item.url ? { url: item.url } : {}),
  };
}

// ============================================================================
// Schema Templates — Entity family (Lane D additions)
// ============================================================================

/**
 * Organization schema — canon fields: name, url, logo, sameAs, description,
 * founder, foundingDate. Values are drawn from org record + content metadata.
 */
function generateOrganizationSchema(
  item: ContentItemForSchema,
  org: OrgForSchema
): Record<string, unknown> {
  const md = item.metadata || {};
  const description =
    metaString(md, 'description') ||
    org.description ||
    (item.body || '').substring(0, 250).replace(/\n/g, ' ').trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: metaString(md, 'name') || org.name,
    ...(item.url || org.website_url
      ? { url: item.url || org.website_url }
      : {}),
    ...(org.logo_url || metaString(md, 'logo')
      ? { logo: org.logo_url || metaString(md, 'logo') }
      : {}),
    ...(metaStringArray(md, 'sameAs')
      ? { sameAs: metaStringArray(md, 'sameAs') }
      : {}),
    ...(description ? { description } : {}),
    ...(metaString(md, 'founder')
      ? { founder: { '@type': 'Person', name: metaString(md, 'founder') } }
      : {}),
    ...(metaString(md, 'foundingDate')
      ? { foundingDate: metaString(md, 'foundingDate') }
      : {}),
  };
}

/**
 * Person schema — canon fields: name, jobTitle, worksFor, sameAs, image,
 * description. Name/jobTitle are extracted from metadata or heuristically
 * from the opening of the body ("Jane Doe is the CEO of ...").
 */
function generatePersonSchema(
  item: ContentItemForSchema,
  org: OrgForSchema
): Record<string, unknown> {
  const md = item.metadata || {};
  const body = item.body || '';

  const name =
    metaString(md, 'name') || extractPersonName(item.title, body) || item.title;
  const jobTitle = metaString(md, 'jobTitle') || extractJobTitle(body);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(jobTitle ? { jobTitle } : {}),
    worksFor: {
      '@type': 'Organization',
      name: metaString(md, 'worksFor') || org.name,
    },
    ...(metaStringArray(md, 'sameAs')
      ? { sameAs: metaStringArray(md, 'sameAs') }
      : {}),
    ...(metaString(md, 'image') ? { image: metaString(md, 'image') } : {}),
    description: body.substring(0, 250).replace(/\n/g, ' ').trim(),
    ...(item.url ? { url: item.url } : {}),
  };
}

// ============================================================================
// Extraction helpers
// ============================================================================

function metaString(
  md: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const v = md?.[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function metaStringArray(
  md: Record<string, unknown> | null | undefined,
  key: string
): string[] | null {
  const v = md?.[key];
  if (Array.isArray(v)) {
    const arr = v.filter(
      (x): x is string => typeof x === 'string' && x.length > 0
    );
    return arr.length > 0 ? arr : null;
  }
  return null;
}

function extractPersonName(title: string, body: string): string | null {
  // "Jane Doe is the CEO ..." — capture leading proper-noun name
  const m = body.match(
    /^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z.]+){1,2})\s+is\s+(?:the|a|our)\b/
  );
  if (m) return m[1];
  // Fall back to a title that looks like a bare person name
  const t = title.trim();
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z.]+){1,2}$/.test(t)) return t;
  return null;
}

function extractJobTitle(body: string): string | null {
  const m = body
    .slice(0, 400)
    .match(
      /\bis\s+(?:the|a|our)\s+((?:Chief\s+\w+\s+Officer)|CEO|CTO|CFO|COO|President|Vice President|Founder|Co-Founder|Head of [A-Z][a-z]+|Director of [A-Z][a-z]+)/
    );
  return m ? m[1] : null;
}

// ============================================================================
// Main Generator
// ============================================================================

/**
 * Generate JSON-LD schema for a content item and save it.
 */
export async function generateSchema(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<SchemaGenerationResult> {
  // Get content item (now including metadata for entity schema fields)
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select(
      'id, org_id, title, body, content_type, url, published_at, word_count, metadata'
    )
    .eq('id', contentItemId)
    .eq('org_id', orgId)
    .single();

  if (itemError || !item) {
    throw new Error(
      `Content item ${contentItemId} not found: ${itemError?.message}`
    );
  }

  // Get org (name + branding fields for publisher/logo/url)
  const { data: orgRow } = await supabase
    .from('orgs')
    .select('name, website_url, logo_url, description')
    .eq('id', orgId)
    .single();

  const org: OrgForSchema = {
    name: (orgRow as OrgForSchema | null)?.name || 'Unknown Organization',
    website_url: (orgRow as OrgForSchema | null)?.website_url ?? null,
    logo_url: (orgRow as OrgForSchema | null)?.logo_url ?? null,
    description: (orgRow as OrgForSchema | null)?.description ?? null,
  };

  const content = item as ContentItemForSchema;

  const schemaType = detectSchemaType(
    content.title,
    content.body || '',
    content.content_type,
    content.metadata
  );

  let schemaJson: Record<string, unknown>;
  switch (schemaType) {
    case 'HowTo':
      schemaJson = generateHowToSchema(content, org);
      break;
    case 'FAQPage':
      schemaJson = generateFAQSchema(content);
      break;
    case 'Organization':
      schemaJson = generateOrganizationSchema(content, org);
      break;
    case 'Person':
      schemaJson = generatePersonSchema(content, org);
      break;
    case 'NewsArticle':
      schemaJson = articleFamilySchema('NewsArticle', content, org);
      break;
    case 'BlogPosting':
      schemaJson = articleFamilySchema('BlogPosting', content, org);
      break;
    default:
      schemaJson = articleFamilySchema('Article', content, org);
  }

  // Upsert to citemind_schemas (delete old, insert new)
  await supabase
    .from('citemind_schemas')
    .delete()
    .eq('content_item_id', contentItemId)
    .eq('org_id', orgId);

  const { error: insertError } = await supabase
    .from('citemind_schemas')
    .insert({
      org_id: orgId,
      content_item_id: contentItemId,
      schema_type: schemaType,
      schema_json: schemaJson,
    });

  if (insertError) {
    logger.error(`Failed to save schema: ${insertError.message}`);
    throw new Error(`Failed to save schema: ${insertError.message}`);
  }

  logger.info(`Generated ${schemaType} schema for content ${contentItemId}`);

  return {
    schema_type: schemaType,
    schema_json: schemaJson,
    content_item_id: contentItemId,
  };
}

// Exported for reuse by the AEO ingestion gate (schema-coverage component).
export { articleFamilySchema, generateHowToSchema, generateFAQSchema };
