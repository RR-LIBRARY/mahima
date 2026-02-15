/**
 * Supabase Admin Client Utilities
 * ================================
 * Secure server-side wrapper for admin operations.
 * Uses service_role key for bypassing RLS when needed.
 * 
 * SECURITY NOTES:
 * - Never expose service_role key to client
 * - Always validate user permissions before admin ops
 * - Use RLS policies as primary security layer
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://yigafgqqypnzebrdlbgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZ2FmZ3FxeXBuemVicmRsYmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQ3NTgsImV4cCI6MjA4NDU3MDc1OH0.RyR6wvKM-zovCbQ4jleG_oXULDEa209mjc34yASAPAU';

// Re-export the standard client for most operations
export { supabase } from '@/integrations/supabase/client';

/**
 * Creates a Supabase client with the user's auth token
 * Used for operations that need to respect RLS
 */
export function createAuthenticatedClient(
  accessToken: string
): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Role types for authorization checks
 */
export type AppRole = 'admin' | 'teacher' | 'student';

/**
 * Check if user has a specific role using the has_role function
 */
export async function checkUserRole(
  client: SupabaseClient<Database>,
  userId: string,
  role: AppRole
): Promise<boolean> {
  const { data, error } = await client.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return !!data;
}

/**
 * Get user's current role
 */
export async function getUserRole(
  client: SupabaseClient<Database>,
  userId: string
): Promise<AppRole | null> {
  const { data, error } = await client.rpc('get_user_role', {
    _user_id: userId,
  });

  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }

  return data as AppRole | null;
}

/**
 * Validate that the current user is an admin
 * Throws error if not authorized
 */
export async function requireAdmin(
  client: SupabaseClient<Database>
): Promise<string> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const isAdmin = await checkUserRole(client, user.id, 'admin');
  
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user.id;
}

/**
 * Validate that current user is admin or teacher
 */
export async function requireAdminOrTeacher(
  client: SupabaseClient<Database>
): Promise<{ userId: string; role: AppRole }> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const isAdmin = await checkUserRole(client, user.id, 'admin');
  if (isAdmin) return { userId: user.id, role: 'admin' };

  const isTeacher = await checkUserRole(client, user.id, 'teacher');
  if (isTeacher) return { userId: user.id, role: 'teacher' };

  throw new Error('Forbidden: Admin or teacher access required');
}

/**
 * Get the current authenticated user with their role
 */
export async function getCurrentUserWithRole(
  client: SupabaseClient<Database>
): Promise<{ userId: string; role: AppRole | null } | null> {
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error || !user) return null;

  const role = await getUserRole(client, user.id);
  
  return { userId: user.id, role };
}
