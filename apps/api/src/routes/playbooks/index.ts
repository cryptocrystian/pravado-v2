/**
 * Playbooks API routes (S3 stub implementation)
 */

import type {
  ListPlaybooksResponse,
  ValidatePlaybookResponse,
  PlaybookTemplate,
} from '@pravado/types';
import { validatePlaybookShape } from '@pravado/utils';
import { validatePlaybookRequestSchema } from '@pravado/validators';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';

export async function playbooksRoutes(server: FastifyInstance) {
  // GET /api/v1/playbooks - List playbook templates
  server.get<{
    Reply: ListPlaybooksResponse;
  }>(
    '/',
    {
      preHandler: requireUser,
    },
    async () => {
      // S3 Stub: Return static playbook templates
      const staticPlaybooks: PlaybookTemplate[] = [
        {
          id: crypto.randomUUID(),
          name: 'PR Campaign Launch',
          description:
            'Automated workflow for launching a comprehensive PR campaign with media outreach and content distribution',
          category: 'pr',
          nodes: [
            {
              id: 'research-journalists',
              agentId: 'journalist-researcher',
              label: 'Research target journalists',
              input: { topic: 'tech', tier: 'tier1' },
            },
            {
              id: 'draft-pitch',
              agentId: 'pitch-writer',
              label: 'Draft personalized pitch emails',
              input: '${research-journalists.output.journalists}',
              dependsOn: ['research-journalists'],
            },
            {
              id: 'send-outreach',
              agentId: 'email-sender',
              label: 'Send outreach emails',
              input: '${draft-pitch.output.pitches}',
              dependsOn: ['draft-pitch'],
            },
          ],
          expectedOutputs: ['journalist_list', 'pitch_emails', 'outreach_metrics'],
          estimatedDuration: '15-25 minutes',
          difficulty: 'intermediate',
          tags: ['pr', 'outreach', 'automation'],
          isPublic: true,
        },
        {
          id: crypto.randomUUID(),
          name: 'SEO Content Optimizer',
          description:
            'Analyze existing content and generate optimization recommendations based on keyword research and competitor analysis',
          category: 'seo',
          nodes: [
            {
              id: 'keyword-research',
              agentId: 'keyword-analyzer',
              label: 'Research target keywords',
              input: { seedKeywords: [], competitorUrls: [] },
            },
            {
              id: 'content-audit',
              agentId: 'content-auditor',
              label: 'Audit existing content',
              input: { url: '' },
            },
            {
              id: 'generate-recommendations',
              agentId: 'seo-strategist',
              label: 'Generate optimization plan',
              input: {
                keywords: '${keyword-research.output.keywords}',
                auditResults: '${content-audit.output.analysis}',
              },
              dependsOn: ['keyword-research', 'content-audit'],
            },
          ],
          expectedOutputs: ['keywords', 'content_gaps', 'optimization_plan'],
          estimatedDuration: '10-15 minutes',
          difficulty: 'beginner',
          tags: ['seo', 'content', 'optimization'],
          isPublic: true,
        },
        {
          id: crypto.randomUUID(),
          name: 'Content Calendar Generator',
          description:
            'Generate a month-long content calendar with topic ideation, briefs, and scheduling',
          category: 'content',
          nodes: [
            {
              id: 'topic-ideation',
              agentId: 'topic-generator',
              label: 'Generate content topics',
              input: { industry: '', targetAudience: '', count: 20 },
            },
            {
              id: 'create-briefs',
              agentId: 'brief-creator',
              label: 'Create content briefs',
              input: '${topic-ideation.output.topics}',
              dependsOn: ['topic-ideation'],
            },
            {
              id: 'schedule-calendar',
              agentId: 'calendar-planner',
              label: 'Schedule content',
              input: '${create-briefs.output.briefs}',
              dependsOn: ['create-briefs'],
            },
          ],
          expectedOutputs: ['topics', 'briefs', 'calendar'],
          estimatedDuration: '8-12 minutes',
          difficulty: 'beginner',
          tags: ['content', 'planning', 'calendar'],
          isPublic: true,
        },
      ];

      return {
        success: true,
        data: {
          playbooks: staticPlaybooks,
        },
      };
    }
  );

  // POST /api/v1/playbooks/validate - Validate playbook structure
  server.post<{
    Body: { playbook: PlaybookTemplate };
    Reply: ValidatePlaybookResponse;
  }>(
    '/validate',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      // Validate request body
      const validation = validatePlaybookRequestSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid playbook structure',
          },
        });
      }

      // Validate playbook shape using utility function
      const validationResult = validatePlaybookShape(validation.data.playbook);

      return {
        success: true,
        data: {
          valid: validationResult.valid,
          errors: validationResult.errors,
        },
      };
    }
  );
}
