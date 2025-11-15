/**
 * Content Intelligence API routes (S3 stub implementation)
 */

import type {
  ListContentItemsResponse,
  ListContentBriefsResponse,
} from '@pravado/types';
import { listContentItemsSchema } from '@pravado/validators';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';

export async function contentRoutes(server: FastifyInstance) {
  // GET /api/v1/content/items - List content items
  server.get<{
    Querystring: { limit?: string; offset?: string; contentType?: string; status?: string };
    Reply: ListContentItemsResponse;
  }>(
    '/items',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      // Validate query params
      const validation = listContentItemsSchema.safeParse({
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
        contentType: request.query.contentType,
        status: request.query.status,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      // S3 Stub: Return empty array
      // Full implementation in S4+
      return {
        success: true,
        data: {
          items: [],
        },
      };
    }
  );

  // GET /api/v1/content/briefs - List content briefs
  server.get<{
    Reply: ListContentBriefsResponse;
  }>(
    '/briefs',
    {
      preHandler: requireUser,
    },
    async () => {
      // S3 Stub: Return empty array
      return {
        success: true,
        data: {
          items: [],
        },
      };
    }
  );
}
