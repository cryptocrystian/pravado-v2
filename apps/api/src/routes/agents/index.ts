/**
 * Agents API routes (S3 stub implementation)
 */

import type { ListAgentsResponse, AgentDefinition } from '@pravado/types';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';

export async function agentsRoutes(server: FastifyInstance) {
  // GET /api/v1/agents - List available agents
  server.get<{
    Reply: ListAgentsResponse;
  }>(
    '/',
    {
      preHandler: requireUser,
    },
    async () => {
      // S3 Stub: Return static agent definitions
      const staticAgents: AgentDefinition[] = [
        {
          id: 'journalist-researcher',
          name: 'Journalist Researcher',
          description:
            'Researches and identifies relevant journalists based on beat, outlet, and topic relevance',
          category: 'pr',
          capabilities: ['research', 'data-mining', 'relevance-scoring'],
          requiredInputs: ['topic'],
          outputSchema: {
            journalists: {
              type: 'array',
              items: {
                name: 'string',
                email: 'string',
                outlet: 'string',
                relevanceScore: 'number',
              },
            },
          },
          estimatedDuration: '3-5 minutes',
        },
        {
          id: 'pitch-writer',
          name: 'Pitch Email Writer',
          description: 'Generates personalized pitch emails for journalist outreach',
          category: 'pr',
          capabilities: ['writing', 'personalization', 'email-generation'],
          requiredInputs: ['journalists', 'pitchTopic', 'companyInfo'],
          outputSchema: {
            pitches: {
              type: 'array',
              items: {
                recipientEmail: 'string',
                subject: 'string',
                body: 'string',
              },
            },
          },
          estimatedDuration: '2-4 minutes',
        },
        {
          id: 'keyword-analyzer',
          name: 'Keyword Analyzer',
          description:
            'Analyzes keywords for search volume, difficulty, and opportunity based on seed keywords and competitor analysis',
          category: 'seo',
          capabilities: ['keyword-research', 'serp-analysis', 'opportunity-scoring'],
          requiredInputs: ['seedKeywords'],
          outputSchema: {
            keywords: {
              type: 'array',
              items: {
                keyword: 'string',
                searchVolume: 'number',
                difficulty: 'number',
                opportunityScore: 'number',
              },
            },
          },
          estimatedDuration: '4-6 minutes',
        },
        {
          id: 'content-auditor',
          name: 'Content Auditor',
          description:
            'Audits web pages for SEO health, content quality, and optimization opportunities',
          category: 'seo',
          capabilities: ['analysis', 'content-scoring', 'recommendation-generation'],
          requiredInputs: ['url'],
          outputSchema: {
            analysis: {
              type: 'object',
              properties: {
                seoScore: 'number',
                contentQuality: 'number',
                issues: 'array',
                recommendations: 'array',
              },
            },
          },
          estimatedDuration: '2-3 minutes',
        },
        {
          id: 'seo-strategist',
          name: 'SEO Strategist',
          description: 'Generates comprehensive SEO optimization plans based on audits and research',
          category: 'seo',
          capabilities: ['strategy', 'planning', 'prioritization'],
          requiredInputs: ['keywords', 'auditResults'],
          outputSchema: {
            optimizationPlan: {
              type: 'object',
              properties: {
                quickWins: 'array',
                longTermGoals: 'array',
                estimatedImpact: 'string',
              },
            },
          },
          estimatedDuration: '3-5 minutes',
        },
        {
          id: 'topic-generator',
          name: 'Topic Generator',
          description: 'Generates content topic ideas based on industry, audience, and trends',
          category: 'content',
          capabilities: ['ideation', 'trend-analysis', 'audience-research'],
          requiredInputs: ['industry', 'targetAudience'],
          outputSchema: {
            topics: {
              type: 'array',
              items: {
                title: 'string',
                description: 'string',
                relevanceScore: 'number',
                trendScore: 'number',
              },
            },
          },
          estimatedDuration: '2-4 minutes',
        },
        {
          id: 'brief-creator',
          name: 'Content Brief Creator',
          description: 'Creates detailed content briefs with structure, keywords, and guidelines',
          category: 'content',
          capabilities: ['brief-generation', 'structure-planning', 'keyword-integration'],
          requiredInputs: ['topics'],
          outputSchema: {
            briefs: {
              type: 'array',
              items: {
                title: 'string',
                outline: 'array',
                targetKeywords: 'array',
                tone: 'string',
                wordCount: 'number',
              },
            },
          },
          estimatedDuration: '3-5 minutes',
        },
        {
          id: 'calendar-planner',
          name: 'Calendar Planner',
          description:
            'Schedules content across a calendar with optimal timing and distribution',
          category: 'content',
          capabilities: ['scheduling', 'timing-optimization', 'calendar-management'],
          requiredInputs: ['briefs'],
          outputSchema: {
            calendar: {
              type: 'object',
              properties: {
                entries: 'array',
                publishDates: 'array',
                distribution: 'object',
              },
            },
          },
          estimatedDuration: '2-3 minutes',
        },
        {
          id: 'data-analyzer',
          name: 'Data Analyzer',
          description: 'Analyzes structured data and generates insights and visualizations',
          category: 'general',
          capabilities: ['data-analysis', 'insights-generation', 'visualization'],
          requiredInputs: ['data'],
          outputSchema: {
            insights: {
              type: 'array',
              items: {
                insight: 'string',
                confidence: 'number',
                supportingData: 'array',
              },
            },
          },
          estimatedDuration: '2-4 minutes',
        },
        {
          id: 'report-generator',
          name: 'Report Generator',
          description: 'Generates comprehensive reports from data and analysis results',
          category: 'general',
          capabilities: ['report-generation', 'formatting', 'summarization'],
          requiredInputs: ['data', 'reportType'],
          outputSchema: {
            report: {
              type: 'object',
              properties: {
                summary: 'string',
                sections: 'array',
                visualizations: 'array',
              },
            },
          },
          estimatedDuration: '3-6 minutes',
        },
      ];

      return {
        success: true,
        data: {
          agents: staticAgents,
        },
      };
    }
  );
}
