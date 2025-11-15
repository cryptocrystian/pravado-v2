import type {
  CreateOrgRequest,
  CreateOrgResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  JoinOrgRequest,
  JoinOrgResponse,
  InviteEmailContext,
  ListOrgsResponse,
  ListMembersResponse,
  ResendInviteResponse,
} from '@pravado/types';
import { buildInviteEmailHtml, buildInviteEmailText, createLogger } from '@pravado/utils';
import {
  validateEnv,
  apiEnvSchema,
  createOrgSchema,
  createInviteSchema,
  joinOrgSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireOrg } from '../middleware/requireOrg';
import { requireRole } from '../middleware/requireRole';
import { requireUser } from '../middleware/requireUser';


const logger = createLogger('api:orgs');

export async function orgsRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  server.post<{ Body: CreateOrgRequest; Reply: CreateOrgResponse }>(
    '/',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      // Validate request body
      const validation = createOrgSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { name } = validation.data;
      const userId = request.user!.id;

      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .insert({ name })
        .select()
        .single();

      if (orgError || !org) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ORG_CREATE_FAILED',
            message: 'Failed to create organization',
          },
        });
      }

      const { data: membership, error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: userId,
          role: 'owner',
        })
        .select()
        .single();

      if (memberError || !membership) {
        await supabase.from('orgs').delete().eq('id', org.id);

        return reply.code(500).send({
          success: false,
          error: {
            code: 'MEMBERSHIP_CREATE_FAILED',
            message: 'Failed to create organization membership',
          },
        });
      }

      return {
        success: true,
        data: {
          org: {
            id: org.id,
            name: org.name,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
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

  server.get<{ Reply: ListOrgsResponse }>(
    '/',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const { data: memberships, error } = await supabase
        .from('org_members')
        .select('*, orgs!inner(*)')
        .eq('user_id', userId);

      if (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'ORGS_FETCH_FAILED',
            message: 'Failed to fetch organizations',
          },
        });
      }

      const orgs = (memberships || []).map((m: any) => ({
        id: m.orgs.id,
        name: m.orgs.name,
        createdAt: m.orgs.created_at,
        updatedAt: m.orgs.updated_at,
        role: m.role,
      }));

      return {
        success: true,
        data: { orgs },
      };
    }
  );

  server.get<{
    Params: { id: string };
    Reply: ListMembersResponse;
  }>(
    '/:id/members',
    {
      preHandler: [requireUser, requireOrg],
    },
    async (request, reply) => {
      const { id: orgId } = request.params;

      const [membersResult, invitesResult] = await Promise.all([
        supabase
          .from('org_members')
          .select('*, users!inner(id, full_name, avatar_url, email)')
          .eq('org_id', orgId),
        supabase
          .from('org_invites')
          .select('*, users!org_invites_created_by_fkey(full_name)')
          .eq('org_id', orgId)
          .is('accepted_at', null),
      ]);

      if (membersResult.error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MEMBERS_FETCH_FAILED',
            message: 'Failed to fetch members',
          },
        });
      }

      if (invitesResult.error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INVITES_FETCH_FAILED',
            message: 'Failed to fetch invites',
          },
        });
      }

      const members = (membersResult.data || []).map((m: any) => ({
        id: m.id,
        orgId: m.org_id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        user: {
          id: m.users.id,
          fullName: m.users.full_name,
          avatarUrl: m.users.avatar_url,
          email: m.users.email,
        },
      }));

      const invites = (invitesResult.data || []).map((i: any) => ({
        id: i.id,
        orgId: i.org_id,
        email: i.email,
        role: i.role,
        token: i.token,
        expiresAt: i.expires_at,
        createdBy: i.created_by,
        acceptedAt: i.accepted_at,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        createdByUser: {
          fullName: i.users?.full_name || null,
        },
      }));

      return {
        success: true,
        data: { members, invites },
      };
    }
  );

  server.post<{
    Params: { id: string };
    Body: CreateInviteRequest;
    Reply: CreateInviteResponse;
  }>(
    '/:id/invite',
    {
      preHandler: [requireUser, requireOrg, requireRole('admin')],
    },
    async (request, reply) => {
      // Validate request body
      const validation = createInviteSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { id: orgId } = request.params;
      const { email, role } = validation.data;
      const userId = request.user!.id;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invite, error } = await supabase
        .from('org_invites')
        .insert({
          org_id: orgId,
          email,
          role,
          expires_at: expiresAt.toISOString(),
          created_by: userId,
        })
        .select()
        .single();

      if (error || !invite) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INVITE_CREATE_FAILED',
            message: 'Failed to create invite',
          },
        });
      }

      // Send invite email
      try {
        // Fetch org name
        const { data: org } = await supabase
          .from('orgs')
          .select('name')
          .eq('id', orgId)
          .single();

        // Fetch inviter info
        const { data: inviter } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

        const inviteLink = `${env.DASHBOARD_URL}/invite/${invite.token}`;

        const emailContext: InviteEmailContext = {
          orgName: org?.name || 'Unknown Organization',
          inviteLink,
          inviterName: inviter?.full_name || null,
          inviterEmail: request.user!.email,
          role: invite.role,
          recipientEmail: invite.email,
        };

        await server.mailer.sendMail({
          to: invite.email,
          subject: `You've been invited to join ${emailContext.orgName} on Pravado`,
          html: buildInviteEmailHtml(emailContext),
          text: buildInviteEmailText(emailContext),
        });

        logger.info('Invite email sent', {
          inviteId: invite.id,
          to: invite.email,
          orgId,
        });
      } catch (emailError) {
        // Log but don't fail the request - invite was created successfully
        logger.error('Failed to send invite email', {
          error: emailError,
          inviteId: invite.id,
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
            token: invite.token,
            expiresAt: invite.expires_at,
            createdBy: invite.created_by,
            acceptedAt: invite.accepted_at,
            createdAt: invite.created_at,
            updatedAt: invite.created_at,
          },
        },
      };
    }
  );

  server.post<{
    Params: { id: string };
    Body: JoinOrgRequest;
    Reply: JoinOrgResponse;
  }>(
    '/:id/join',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      // Validate request body
      const validation = joinOrgSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
          },
        });
      }

      const { id: orgId } = request.params;
      const { token } = validation.data;
      const userId = request.user!.id;

      const { data: invite, error: inviteError } = await supabase
        .from('org_invites')
        .select('*, users!inner(email)')
        .eq('org_id', orgId)
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

      const { data: org } = await supabase
        .from('orgs')
        .select('*')
        .eq('id', orgId)
        .single();

      if (!org) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found',
          },
        });
      }

      const { data: membership, error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: orgId,
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
            id: org.id,
            name: org.name,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
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

  server.post<{
    Params: { id: string; inviteId: string };
    Reply: ResendInviteResponse;
  }>(
    '/:id/invites/:inviteId/resend',
    {
      preHandler: [requireUser, requireOrg, requireRole('admin')],
    },
    async (request, reply) => {
      const { id: orgId, inviteId } = request.params;
      const userId = request.user!.id;

      const { data: invite, error: inviteError } = await supabase
        .from('org_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('org_id', orgId)
        .is('accepted_at', null)
        .single();

      if (inviteError || !invite) {
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

      // Send invite email
      try {
        const { data: org } = await supabase
          .from('orgs')
          .select('name')
          .eq('id', orgId)
          .single();

        const { data: inviter } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

        const inviteLink = `${env.DASHBOARD_URL}/invite/${invite.token}`;

        const emailContext: InviteEmailContext = {
          orgName: org?.name || 'Unknown Organization',
          inviteLink,
          inviterName: inviter?.full_name || null,
          inviterEmail: request.user!.email,
          role: invite.role,
          recipientEmail: invite.email,
        };

        await server.mailer.sendMail({
          to: invite.email,
          subject: `Reminder: You've been invited to join ${emailContext.orgName} on Pravado`,
          html: buildInviteEmailHtml(emailContext),
          text: buildInviteEmailText(emailContext),
        });

        logger.info('Invite email resent', {
          inviteId: invite.id,
          to: invite.email,
          orgId,
        });
      } catch (emailError) {
        logger.error('Failed to resend invite email', {
          error: emailError,
          inviteId: invite.id,
        });

        return reply.code(500).send({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: 'Failed to send invite email',
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
            token: invite.token,
            expiresAt: invite.expires_at,
            createdBy: invite.created_by,
            acceptedAt: invite.accepted_at,
            createdAt: invite.created_at,
            updatedAt: invite.updated_at,
          },
        },
      };
    }
  );
}
