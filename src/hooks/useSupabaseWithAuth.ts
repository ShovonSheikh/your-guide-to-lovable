import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Custom hook that creates a Supabase client with Clerk user ID headers.
 * This is necessary for RLS policies that check `x-clerk-user-id` header.
 */
export function useSupabaseWithAuth(): SupabaseClient<Database> {
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
