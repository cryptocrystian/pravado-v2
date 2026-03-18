import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';
import { requireUser } from '../../middleware/requireUser';

const logger = createLogger('api:notifications');

export async function notificationRoutes(server: FastifyInstance) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * POST /register-device
   * Registers or updates an Expo push token for the authenticated user.
   */
  server.post(
    '/register-device',
    { preHandler: requireUser },
    async (request, reply) => {
      const { expo_push_token, device_type } = request.body as {
        expo_push_token: string;
        device_type: 'ios' | 'android';
      };

      if (!expo_push_token || !device_type) {
        return reply.code(400).send({
          success: false,
          error: { message: 'expo_push_token and device_type are required' },
        });
      }

      if (!['ios', 'android'].includes(device_type)) {
        return reply.code(400).send({
          success: false,
          error: { message: 'device_type must be ios or android' },
        });
      }

      const user = (request as any).user;
      const orgId = (request as any).orgId;

      const { error } = await supabase
        .from('device_push_tokens')
        .upsert(
          {
            user_id: user.id,
            org_id: orgId || null,
            expo_push_token,
            device_type,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'user_id,expo_push_token' }
        );

      if (error) {
        logger.error('Failed to register device token', { error: error.message });
        return reply.code(500).send({
          success: false,
          error: { message: 'Failed to register device' },
        });
      }

      logger.info('Device token registered', { userId: user.id, deviceType: device_type });

      return { success: true };
    }
  );
}
