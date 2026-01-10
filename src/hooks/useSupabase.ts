import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Unified Supabase hook that creates a single authenticated client.
 * Injects Clerk user ID as a custom header for RLS policies.
 * 
 * Usage:
 * const supabase = useSupabase();
 * const { data } = await supabase.from('table').select();
 */
export function useSupabase(): SupabaseClient<Database> {
  const { user } = useUser();
  
  return useMemo(() => {
    const headers: Record<string, string> = {};
    
    if (user?.id) {
      headers['x-clerk-user-id'] = user.id;
    }
    
    return createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers
        }
      }
    );
  }, [user?.id]);
}
