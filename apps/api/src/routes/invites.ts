/**
 * Invite routes (cross-org invite operations)
 */

import type { JoinOrgResponse } from '@pravado/types';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../middleware/requireUser';


export async function invitesRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.get<{
    Params: { token: string };
  }>(
    '/:token',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      const { token } = request.params;

      const { data: invite, error } = await supabase
        .from('org_invites')
        .select('*, orgs!inner(id, name)')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (error || !invite) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'INVITE_NOT_FOUND',
            message: 'Invite not found',
          },
        });
      }

      if (new Date(invite.expires_at) < new Date()) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVITE_EXPIRED',
            message: 'Invite has expired',
          },
        });
      }

      return {
        success: true,
        data: {
          invite: {
            id: invite.id,
            orgId: invite.org_id,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expires_at,
          },
          org: {
            id: invite.orgs.id,
            name: invite.orgs.name,
          },
        },
      };
    }
  );

  server.post<{
    Params: { token: string };
    Reply: JoinOrgResponse;
  }>(
    '/:token/accept',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      const { token } = request.params;
      const userId = request.user!.id;

      const { data: invite, error: inviteError } = await supabase
        .from('org_invites')
        .select('*, orgs!inner(id, name, created_at, updated_at)')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (inviteError || !invite) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'INVITE_NOT_FOUND',
            message: 'Invalid or expired invite',
          },
        });
      }

      if (new Date(invite.expires_at) < new Date()) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVITE_EXPIRED',
            message: 'Invite has expired',
          },
        });
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('org_members')
        .select('id')
        .eq('org_id', invite.org_id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'ALREADY_MEMBER',
            message: 'You are already a member of this organization',
          },
        });
      }

      const { data: membership, error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: invite.org_id,
          user_id: userId,
          role: invite.role,
        })
        .select()
        .single();

      if (memberError || !membership) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MEMBERSHIP_CREATE_FAILED',
            message: 'Failed to join organization',
          },
        });
      }

      await supabase
        .from('org_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id);

      return {
        success: true,
        data: {
          org: {
            id: invite.orgs.id,
            name: invite.orgs.name,
            createdAt: invite.orgs.created_at,
            updatedAt: invite.orgs.updated_at,
          },
          membership: {
            id: membership.id,
            orgId: membership.org_id,
            userId: membership.user_id,
            role: membership.role,
            createdAt: membership.created_at,
            updatedAt: membership.updated_at,
          },
        },
      };
    }
  );
}
