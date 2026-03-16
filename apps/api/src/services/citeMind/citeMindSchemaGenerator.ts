/**
 * CiteMind Schema Generator (Sprint S-INT-04)
 *
 * Generates JSON-LD structured data for content items.
 * Detects content type from title + body heuristics and generates
 * the appropriate schema (Article, BlogPosting, HowTo, FAQPage).
 * Saves to citemind_schemas table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('citemind:schema');

// ============================================================================
// Types
// ============================================================================

type SchemaType = 'Article' | 'BlogPosting' | 'HowTo' | 'FAQPage';

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
}

// ============================================================================
// Schema Detection
// ============================================================================

function detectSchemaType(title: string, body: string): SchemaType {
  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();

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
    titleLower.includes('guide') ||
    titleLower.includes('tutorial') ||
    titleLower.includes('step-by-step') ||
    (bodyLower.includes('step 1') && bodyLower.includes('step 2'));

  if (hasHowTo) return 'HowTo';

  // BlogPosting: shorter content, blog-style
  if (titleLower.includes('blog') || (body.split(/\s+/).length < 1500)) {
    return 'BlogPosting';
  }

  return 'Article';
}

// ============================================================================
// Schema Templates
// ============================================================================

function generateArticleSchema(
  item: ContentItemForSchema,
  orgName: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    author: {
      '@type': 'Organization',
      name: orgName,
    },
    publisher: {
      '@type': 'Organization',
      name: orgName,
    },
    datePublished: item.published_at || new Date().toISOString(),
    dateModified: new Date().toISOString(),
    ...(item.url ? { url: item.url } : {}),
    ...(item.word_count ? { wordCount: item.word_count } : {}),
    description: (item.body || '').substring(0, 200).replace(/\n/g, ' ').trim(),
  };
}

function generateBlogPostingSchema(
  item: ContentItemForSchema,
  orgName: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: item.title,
    author: {
      '@type': 'Organization',
      name: orgName,
    },
    publisher: {
      '@type': 'Organization',
      name: orgName,
    },
    datePublished: item.published_at || new Date().toISOString(),
    dateModified: new Date().toISOString(),
    ...(item.url ? { url: item.url } : {}),
    ...(item.word_count ? { wordCount: item.word_count } : {}),
    description: (item.body || '').substring(0, 200).replace(/\n/g, ' ').trim(),
  };
}

function generateHowToSchema(
  item: ContentItemForSchema,
  orgName: string
): Record<string, unknown> {
  const body = item.body || '';

  // Extract steps from numbered lists or "Step N" patterns
  const steps: Array<{ '@type': string; text: string; position: number }> = [];
  const stepMatches = body.match(/(?:^|\n)\s*(?:\d+[.)]\s+|step\s+\d+[:.]\s*)(.+)/gim) || [];

  stepMatches.forEach((match, idx) => {
    const text = match.replace(/^\s*(?:\d+[.)]\s+|step\s+\d+[:.]\s*)/i, '').trim();
    if (text.length > 5) {
      steps.push({
        '@type': 'HowToStep',
        text,
        position: idx + 1,
      });
    }
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: item.title,
    description: body.substring(0, 200).replace(/\n/g, ' ').trim(),
    ...(steps.length > 0 ? { step: steps } : {}),
    author: {
      '@type': 'Organization',
      name: orgName,
    },
    datePublished: item.published_at || new Date().toISOString(),
    ...(item.url ? { url: item.url } : {}),
  };
}

function generateFAQSchema(
  item: ContentItemForSchema,
  _orgName: string
): Record<string, unknown> {
  const body = item.body || '';

  // Extract Q&A pairs: lines ending with ? followed by answer text
  const faqEntries: Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }> = [];

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith('?') && line.length > 10) {
      // Get next non-empty line as answer
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
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
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
  // Get content item
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('id, org_id, title, body, content_type, url, published_at, word_count')
    .eq('id', contentItemId)
    .eq('org_id', orgId)
    .single();

  if (itemError || !item) {
    throw new Error(`Content item ${contentItemId} not found: ${itemError?.message}`);
  }

  // Get org name
  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single();

  const orgName = (org as { name: string } | null)?.name || 'Unknown Organization';
  const content = item as ContentItemForSchema;

  // Detect type and generate schema
  const schemaType = detectSchemaType(content.title, content.body || '');
  let schemaJson: Record<string, unknown>;

  switch (schemaType) {
    case 'HowTo':
      schemaJson = generateHowToSchema(content, orgName);
      break;
    case 'FAQPage':
      schemaJson = generateFAQSchema(content, orgName);
      break;
    case 'BlogPosting':
      schemaJson = generateBlogPostingSchema(content, orgName);
      break;
    default:
      schemaJson = generateArticleSchema(content, orgName);
  }

  // Upsert to citemind_schemas (delete old, insert new)
  await supabase
    .from('citemind_schemas')
    .delete()
    .eq('content_item_id', contentItemId)
    .eq('org_id', orgId);

  const { error: insertError } = await supabase.from('citemind_schemas').insert({
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
