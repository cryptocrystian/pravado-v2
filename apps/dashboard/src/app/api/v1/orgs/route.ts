/**
 * API route for creating organizations
 * Uses service role key to bypass RLS for server-side operations
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('[API /orgs] POST request received');

  // Check environment variables first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[API /orgs] Env check - URL:', supabaseUrl ? 'present' : 'MISSING');
  console.log('[API /orgs] Env check - Anon Key:', supabaseAnonKey ? 'present' : 'MISSING');
  console.log('[API /orgs] Env check - Service Role Key:', serviceRoleKey ? 'present' : 'MISSING');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API /orgs] Missing Supabase URL or Anon Key');
    return NextResponse.json(
      { error: { message: 'Server configuration error: Missing Supabase credentials' } },
      { status: 500 }
    );
  }

  if (!serviceRoleKey) {
    console.error('[API /orgs] Missing Service Role Key');
    return NextResponse.json(
      { error: { message: 'Server configuration error: Missing service role key' } },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name } = body;

    console.log('[API /orgs] Request body:', { name });

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Organization name is required' } },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    console.log('[API /orgs] Got cookie store');

    // Create Supabase client with user's session (for authentication check)
    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
    console.log('[API /orgs] Getting user...');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.error('[API /orgs] User error:', userError);
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    console.log('[API /orgs] Creating org for user:', user.id);

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Ensure user exists in public.users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      console.log('[API /orgs] User not in public.users, creating...');
      const { error: createUserError } = await supabaseAdmin
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
    const { data: org, error: orgError } = await supabaseAdmin
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
    const { error: memberError } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('[API /orgs] Member creation error:', memberError);
      // Try to clean up the org if member creation failed
      await supabaseAdmin.from('orgs').delete().eq('id', org.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[API /orgs] Error message:', errorMessage);
    console.error('[API /orgs] Error stack:', errorStack);
    return NextResponse.json(
      { error: { message: `Internal server error: ${errorMessage}` } },
      { status: 500 }
    );
  }
}
