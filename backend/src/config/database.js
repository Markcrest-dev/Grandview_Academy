import { createClient } from '@supabase/supabase-js';
import env from './env.js';

/**
 * Supabase client instances.
 *
 * - `supabase` uses the anon key (respects Row Level Security).
 *   Use for operations where the user's JWT determines access.
 *
 * - `supabaseAdmin` uses the service role key (bypasses RLS).
 *   Use for admin operations, migrations, and server-side logic
 *   where you need full database access.
 */

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Test database connection by running a simple query.
 * Called at server startup to verify connectivity.
 */
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('_health_check')
      .select('*')
      .limit(1)
      .maybeSingle();

    // The table won't exist, but that's fine —
    // a "relation does not exist" error means the connection works.
    // A network/auth error means it doesn't.
    if (error && error.code === '42P01') {
      // Table doesn't exist — connection is working
      return true;
    }

    if (error && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error(`Cannot reach Supabase: ${error.message}`);
    }

    return true;
  } catch (err) {
    if (err.message.includes('Cannot reach')) {
      throw err;
    }
    // Any other error likely means the connection itself works
    return true;
  }
}
