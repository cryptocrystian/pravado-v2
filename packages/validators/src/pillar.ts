/**
 * Zod schemas for pillar data validation
 */

import { z } from 'zod';

// ========================================
// PLAYBOOK VALIDATION SCHEMAS
// ========================================

export const validatePlaybookRequestSchema = z.object({
  playbook: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    category: z.enum(['pr', 'content', 'seo', 'general']),
    nodes: z.array(
      z.object({
        id: z.string(),
        agentId: z.string(),
        label: z.string().optional(),
        input: z.union([z.record(z.unknown()), z.string()]),
        dependsOn: z.array(z.string()).optional(),
        condition: z
          .object({
            nodeId: z.string(),
            operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']),
            value: z.unknown(),
          })
          .optional(),
        retryPolicy: z
          .object({
            maxAttempts: z.number().int().positive(),
            backoffMs: z.number().int().positive(),
          })
          .optional(),
      })
    ),
    expectedOutputs: z.array(z.string()),
    estimatedDuration: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type ValidatePlaybookRequest = z.infer<typeof validatePlaybookRequestSchema>;

// ========================================
// PR PILLAR SCHEMAS (S3 + S6)
// ========================================

export const listPRSourcesSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  sourceType: z.enum(['press_release', 'backlink', 'mention', 'earned_media']).optional(),
  status: z.string().optional(),
});

export type ListPRSourcesParams = z.infer<typeof listPRSourcesSchema>;

// S6 - Journalist search and filtering
export const listJournalistsQuerySchema = z.object({
  q: z.string().optional(), // Search query for name, email, outlet, bio
  beatId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
  country: z.string().optional(),
  tier: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListJournalistsQueryParams = z.infer<typeof listJournalistsQuerySchema>;

// S6 - PR Lists
export const listPRListsQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListPRListsQueryParams = z.infer<typeof listPRListsQuerySchema>;

export const createPRListSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export type CreatePRListParams = z.infer<typeof createPRListSchema>;

export const updatePRListMembersSchema = z.object({
  journalistIds: z.array(z.string().uuid()).min(1),
});

export type UpdatePRListMembersParams = z.infer<typeof updatePRListMembersSchema>;

// ========================================
// CONTENT PILLAR SCHEMAS (S3 + S12)
// ========================================

// S12: Enhanced content item listing with filters
export const listContentItemsSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  q: z.string().optional(), // Search query for title/body
  topicId: z.string().uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  contentType: z
    .enum(['blog_post', 'social_post', 'long_form', 'video_script', 'newsletter'])
    .optional(),
});

export type ListContentItemsParams = z.infer<typeof listContentItemsSchema>;

// S12: Create content item
export const createContentItemSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).optional(),
  contentType: z.enum(['blog_post', 'social_post', 'long_form', 'video_script', 'newsletter']),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  body: z.string().optional(),
  url: z.string().url().optional(),
  primaryTopicId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type CreateContentItemParams = z.infer<typeof createContentItemSchema>;

// S12: Update content item
export const updateContentItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(200).optional(),
  contentType: z.enum(['blog_post', 'social_post', 'long_form', 'video_script', 'newsletter']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  body: z.string().optional(),
  url: z.string().url().optional(),
  primaryTopicId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateContentItemParams = z.infer<typeof updateContentItemSchema>;

// S12: Content brief schemas
export const listContentBriefsSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'completed']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListContentBriefsParams = z.infer<typeof listContentBriefsSchema>;

export const createContentBriefSchema = z.object({
  title: z.string().min(1).max(500),
  targetKeyword: z.string().optional(),
  targetIntent: z.string().optional(),
  outline: z.record(z.unknown()).optional(),
  targetAudience: z.string().optional(),
  targetKeywords: z.array(z.string()).optional().default([]),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']).optional(),
  minWordCount: z.number().int().positive().optional(),
  maxWordCount: z.number().int().positive().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional().default('draft'),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type CreateContentBriefParams = z.infer<typeof createContentBriefSchema>;

export const updateContentBriefSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  targetKeyword: z.string().optional(),
  targetIntent: z.string().optional(),
  outline: z.record(z.unknown()).optional(),
  targetAudience: z.string().optional(),
  targetKeywords: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']).optional(),
  minWordCount: z.number().int().positive().optional(),
  maxWordCount: z.number().int().positive().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateContentBriefParams = z.infer<typeof updateContentBriefSchema>;

// S12: Content gaps schema
export const listContentGapsSchema = z.object({
  keyword: z.string().optional(),
  minScore: z.number().min(0).max(100).optional(),
  topicId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type ListContentGapsParams = z.infer<typeof listContentGapsSchema>;

// ========================================
// SEO PILLAR SCHEMAS (S4 - Real Implementation)
// ========================================

export const seoKeywordIntentSchema = z.enum([
  'informational',
  'navigational',
  'commercial',
  'transactional',
]);

export const listSEOKeywordsSchema = z.object({
  q: z.string().optional(), // search query
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  intent: seoKeywordIntentSchema.optional(),
  sortBy: z
    .enum(['keyword', 'searchVolume', 'difficulty', 'priorityScore', 'createdAt'])
    .optional()
    .default('priorityScore'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListSEOKeywordsParams = z.infer<typeof listSEOKeywordsSchema>;

export const getSEOSerpSnapshotSchema = z.object({
  keywordId: z.string().uuid(),
});

export type GetSEOSerpSnapshotParams = z.infer<typeof getSEOSerpSnapshotSchema>;

export const listSEOOpportunitiesSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  opportunityType: z
    .enum(['keyword_gap', 'content_refresh', 'broken_link', 'missing_meta', 'low_content'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'dismissed']).optional(),
  minPriorityScore: z.number().min(0).max(100).optional(),
});

export type ListSEOOpportunitiesParams = z.infer<typeof listSEOOpportunitiesSchema>;

// ========================================
// SEO ON-PAGE OPTIMIZATION SCHEMAS (S5)
// ========================================

export const getSEOPageAuditSchema = z.object({
  pageId: z.string().uuid(),
  auditType: z.string().optional(), // 'onpage', 'technical', 'content', etc.
});

export type GetSEOPageAuditParams = z.infer<typeof getSEOPageAuditSchema>;

export const listSEOPageAuditsSchema = z.object({
  pageId: z.string().uuid().optional(),
  auditType: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListSEOPageAuditsParams = z.infer<typeof listSEOPageAuditsSchema>;

// ========================================
// SEO BACKLINK INTELLIGENCE SCHEMAS (S5)
// ========================================

export const getSEOBacklinkProfileSchema = z.object({
  pageId: z.string().uuid().optional(), // If omitted, return org-wide profile
});

export type GetSEOBacklinkProfileParams = z.infer<typeof getSEOBacklinkProfileSchema>;

export const listSEOBacklinksSchema = z.object({
  pageId: z.string().uuid().optional(),
  linkType: z.enum(['dofollow', 'nofollow', 'ugc', 'sponsored']).optional(),
  includeActive: z.boolean().optional().default(true),
  includeLost: z.boolean().optional().default(false),
  referringDomainId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z.enum(['discoveredAt', 'lastSeenAt', 'lostAt']).optional().default('lastSeenAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListSEOBacklinksParams = z.infer<typeof listSEOBacklinksSchema>;

export const listSEOReferringDomainsSchema = z.object({
  minDomainAuthority: z.number().min(0).max(100).optional(),
  maxSpamScore: z.number().min(0).max(100).optional(),
  minBacklinks: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z.enum(['domainAuthority', 'totalBacklinks', 'firstSeenAt']).optional().default('domainAuthority'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListSEOReferringDomainsParams = z.infer<typeof listSEOReferringDomainsSchema>;
