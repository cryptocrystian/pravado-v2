/**
 * Playbook Templates (Sprint S8)
 * Static templates for common playbook patterns
 */

import type { PlaybookRuntimeTemplate } from '@pravado/types';

/**
 * Template: SEO Site Audit
 * Performs comprehensive SEO analysis and generates recommendations
 */
const seoSiteAuditTemplate: PlaybookRuntimeTemplate = {
  id: 'tpl-seo-site-audit',
  slug: 'seo-site-audit',
  name: 'SEO Site Audit',
  description:
    'Comprehensive SEO analysis covering on-page, technical, and content factors with actionable recommendations',
  category: 'seo',
  templateTags: ['seo', 'audit', 'analysis'],
  definition: {
    playbook: {
      id: '', // will be generated
      orgId: '', // will be set
      name: 'SEO Site Audit',
      version: 1,
      status: 'DRAFT',
      inputSchema: { url: 'string', depth: 'number' },
      outputSchema: { report: 'object', score: 'number', recommendations: 'array' },
      timeoutSeconds: 300,
      maxRetries: 2,
      tags: ['seo', 'audit'],
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    },
    steps: [
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'fetch-page',
        name: 'Fetch Page Content',
        type: 'API',
        config: {
          method: 'GET',
          url: '{{input.url}}',
          headers: { 'User-Agent': 'Pravado SEO Audit Bot' },
        },
        position: 0,
        nextStepKey: 'analyze-onpage',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'analyze-onpage',
        name: 'Analyze On-Page SEO',
        type: 'AGENT',
        config: {
          agentId: 'seo-analyzer',
          prompt: 'Analyze the following page for on-page SEO factors: {{previous.fetch-page.output}}',
          model: 'gpt-4',
          temperature: 0.3,
        },
        position: 1,
        nextStepKey: 'extract-recommendations',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'extract-recommendations',
        name: 'Extract Recommendations',
        type: 'DATA',
        config: {
          operation: 'pluck',
          sourceKey: 'analyze-onpage',
          fields: ['recommendations', 'score', 'issues'],
        },
        position: 2,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
};

/**
 * Template: SEO Opportunity Review
 * Analyzes SEO opportunities from keyword research and competitor analysis
 */
const seoOpportunityReviewTemplate: PlaybookRuntimeTemplate = {
  id: 'tpl-seo-opportunity-review',
  slug: 'seo-opportunity-review',
  name: 'SEO Opportunity Review',
  description: 'Identify and prioritize SEO opportunities based on keyword research and competitive analysis',
  category: 'seo',
  templateTags: ['seo', 'keywords', 'opportunities'],
  definition: {
    playbook: {
      id: '',
      orgId: '',
      name: 'SEO Opportunity Review',
      version: 1,
      status: 'DRAFT',
      inputSchema: { keywords: 'array', competitors: 'array' },
      outputSchema: { opportunities: 'array', priority: 'string' },
      timeoutSeconds: 180,
      maxRetries: 1,
      tags: ['seo', 'research'],
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    },
    steps: [
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'analyze-keywords',
        name: 'Analyze Keyword Opportunities',
        type: 'AGENT',
        config: {
          agentId: 'keyword-analyzer',
          prompt:
            'Analyze these keywords for SEO opportunity: {{input.keywords}}. Consider search volume, difficulty, and intent.',
          model: 'gpt-4',
          temperature: 0.5,
        },
        position: 0,
        nextStepKey: 'check-priority',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'check-priority',
        name: 'Check Priority Level',
        type: 'BRANCH',
        config: {
          sourceKey: 'analyze-keywords',
          conditions: [
            {
              operator: 'contains',
              value: 'high-priority',
              nextStepKey: 'create-priority-report',
            },
          ],
          defaultStepKey: 'create-standard-report',
        },
        position: 1,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'create-priority-report',
        name: 'Create Priority Report',
        type: 'DATA',
        config: {
          operation: 'merge',
          sourceKey: 'analyze-keywords',
        },
        position: 2,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'create-standard-report',
        name: 'Create Standard Report',
        type: 'DATA',
        config: {
          operation: 'pluck',
          sourceKey: 'analyze-keywords',
          fields: ['keywords', 'difficulty'],
        },
        position: 3,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
};

/**
 * Template: PR Media List Curation
 * Curates relevant journalists and media contacts for PR campaigns
 */
const prMediaListCurationTemplate: PlaybookRuntimeTemplate = {
  id: 'tpl-pr-media-list',
  slug: 'pr-media-list-curation',
  name: 'PR Media List Curation',
  description: 'Automatically curate and qualify media contacts based on campaign criteria',
  category: 'pr',
  templateTags: ['pr', 'media', 'outreach'],
  definition: {
    playbook: {
      id: '',
      orgId: '',
      name: 'PR Media List Curation',
      version: 1,
      status: 'DRAFT',
      inputSchema: { campaign: 'object', targetTopics: 'array' },
      outputSchema: { journalists: 'array', qualified: 'number' },
      timeoutSeconds: 240,
      maxRetries: 1,
      tags: ['pr', 'outreach'],
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    },
    steps: [
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'search-journalists',
        name: 'Search for Journalists',
        type: 'API',
        config: {
          method: 'POST',
          url: '/api/v1/pr/journalists/search',
          body: {
            topics: '{{input.targetTopics}}',
            limit: 50,
          },
        },
        position: 0,
        nextStepKey: 'qualify-contacts',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'qualify-contacts',
        name: 'Qualify Contacts',
        type: 'AGENT',
        config: {
          agentId: 'pr-qualifier',
          prompt:
            'Review these journalists and determine their fit for the campaign: {{input.campaign}}. Journalists: {{previous.search-journalists.output}}',
          model: 'gpt-4',
          temperature: 0.4,
        },
        position: 1,
        nextStepKey: 'extract-qualified',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'extract-qualified',
        name: 'Extract Qualified List',
        type: 'DATA',
        config: {
          operation: 'pluck',
          sourceKey: 'qualify-contacts',
          fields: ['qualified', 'recommendations'],
        },
        position: 2,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
};

/**
 * Template: Content Quality Review
 * Reviews content for quality, SEO optimization, and brand compliance
 */
const contentQualityReviewTemplate: PlaybookRuntimeTemplate = {
  id: 'tpl-content-quality',
  slug: 'content-quality-review',
  name: 'Content Quality Review',
  description: 'Automated content review for quality, SEO, readability, and brand alignment',
  category: 'content',
  templateTags: ['content', 'quality', 'review'],
  definition: {
    playbook: {
      id: '',
      orgId: '',
      name: 'Content Quality Review',
      version: 1,
      status: 'DRAFT',
      inputSchema: { content: 'string', targetKeywords: 'array' },
      outputSchema: { score: 'number', feedback: 'object', approved: 'boolean' },
      timeoutSeconds: 120,
      maxRetries: 0,
      tags: ['content', 'qa'],
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    },
    steps: [
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'analyze-content',
        name: 'Analyze Content Quality',
        type: 'AGENT',
        config: {
          agentId: 'content-reviewer',
          prompt:
            'Review this content for quality, SEO optimization (keywords: {{input.targetKeywords}}), and readability: {{input.content}}',
          model: 'gpt-4',
          temperature: 0.3,
        },
        position: 0,
        nextStepKey: 'check-approval',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'check-approval',
        name: 'Check Approval Threshold',
        type: 'BRANCH',
        config: {
          sourceKey: 'analyze-content',
          conditions: [
            {
              operator: 'contains',
              value: 'approved',
              nextStepKey: 'generate-approval',
            },
          ],
          defaultStepKey: 'generate-revision',
        },
        position: 1,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'generate-approval',
        name: 'Generate Approval Report',
        type: 'DATA',
        config: {
          operation: 'merge',
          sourceKey: 'analyze-content',
        },
        position: 2,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        orgId: '',
        playbookId: '',
        key: 'generate-revision',
        name: 'Generate Revision Suggestions',
        type: 'DATA',
        config: {
          operation: 'pluck',
          sourceKey: 'analyze-content',
          fields: ['revisions', 'issues', 'score'],
        },
        position: 3,
        nextStepKey: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
};

/**
 * All available templates
 */
const PLAYBOOK_TEMPLATES: PlaybookRuntimeTemplate[] = [
  seoSiteAuditTemplate,
  seoOpportunityReviewTemplate,
  prMediaListCurationTemplate,
  contentQualityReviewTemplate,
];

/**
 * List all available playbook templates
 */
export function listPlaybookTemplates(): PlaybookRuntimeTemplate[] {
  return PLAYBOOK_TEMPLATES;
}

/**
 * Get a template by slug
 */
export function getPlaybookTemplateBySlug(slug: string): PlaybookRuntimeTemplate | undefined {
  return PLAYBOOK_TEMPLATES.find((t) => t.slug === slug);
}
