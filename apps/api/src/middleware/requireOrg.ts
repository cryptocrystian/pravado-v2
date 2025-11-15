import { ForbiddenError } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    orgId?: string;
    orgRole?: 'owner' | 'admin' | 'member';
  }
}

export async function requireOrg(request: FastifyRequest) {
  if (!request.user) {
    throw new ForbiddenError('User not authenticated');
  }

  const orgId = (request.params as { id: string }).id;

  if (!orgId) {
    throw new ForbiddenError('Organization ID required');
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: membership, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', request.user.id)
    .single();

  if (error || !membership) {
    throw new ForbiddenError('Not a member of this organization');
  }

  request.orgId = orgId;
  request.orgRole = membership.role;
}
