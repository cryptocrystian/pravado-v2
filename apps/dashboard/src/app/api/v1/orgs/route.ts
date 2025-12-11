/**
 * API route for creating organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Organization name is required' } },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Create Supabase client with user's session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API /orgs] User error:', userError);
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    console.log('[API /orgs] Creating org for user:', user.id);

    // Ensure user exists in public.users table (might not exist if trigger didn't run)
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error('[API /orgs] User check error:', userCheckError);
    }

    if (!existingUser) {
      console.log('[API /orgs] User not in public.users, creating...');
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        });

      if (createUserError) {
        console.error('[API /orgs] Create user error:', createUserError);
        return NextResponse.json(
          { error: { message: `Failed to create user profile: ${createUserError.message}` } },
          { status: 500 }
        );
      }
      console.log('[API /orgs] User created in public.users');
    }

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (orgError) {
      console.error('[API /orgs] Org creation error:', orgError);
      return NextResponse.json(
        { error: { message: `Failed to create organization: ${orgError.message}` } },
        { status: 500 }
      );
    }

    console.log('[API /orgs] Org created:', org.id);

    // Add the user as owner of the organization
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('[API /orgs] Member creation error:', memberError);
      // Try to clean up the org if member creation failed
      await supabase.from('orgs').delete().eq('id', org.id);
      return NextResponse.json(
        { error: { message: `Failed to add you as organization owner: ${memberError.message}` } },
        { status: 500 }
      );
    }

    console.log('[API /orgs] User added as owner');

    return NextResponse.json({
      data: {
        id: org.id,
        name: org.name,
        createdAt: org.created_at,
      },
    });
  } catch (error) {
    console.error('[API /orgs] Unexpected error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
