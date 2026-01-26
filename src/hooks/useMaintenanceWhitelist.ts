import { useState, useEffect, useCallback } from 'react';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { toast } from '@/hooks/use-toast';

interface WhitelistEntry {
  id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    username: string | null;
  };
}

export function useMaintenanceWhitelist() {
  const supabase = useSupabaseWithAuth();
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWhitelist = useCallback(async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Fetch whitelist entries
      const { data: whitelistData, error } = await supabase
        .from('maintenance_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile info for each whitelisted user
      const enrichedData = await Promise.all(
        (whitelistData || []).map(async (entry) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, username')
            .eq('user_id', entry.user_id)
            .single();

          return {
            ...entry,
            profile: profileData || undefined,
          };
        })
      );

      setWhitelist(enrichedData);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch whitelist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const addToWhitelist = async (userId: string, reason?: string) => {
    if (!supabase) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('maintenance_whitelist')
        .insert({ user_id: userId, reason: reason || null });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'User is already whitelisted' };
        }
        throw error;
      }

      toast({
        title: 'User whitelisted',
        description: 'User has been added to the maintenance whitelist',
      });

      await fetchWhitelist();
      return { success: true };
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      return { success: false, error: 'Failed to add user to whitelist' };
    }
  };

  const removeFromWhitelist = async (id: string) => {
    if (!supabase) return { success: false };

    try {
      const { error } = await supabase
        .from('maintenance_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'User removed',
        description: 'User has been removed from the whitelist',
      });

      await fetchWhitelist();
      return { success: true };
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user from whitelist',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateWhitelistReason = async (id: string, reason: string) => {
    if (!supabase) return { success: false };

    try {
      const { error } = await supabase
        .from('maintenance_whitelist')
        .update({ reason })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Reason updated',
        description: 'Whitelist entry has been updated',
      });

      await fetchWhitelist();
      return { success: true };
    } catch (error) {
      console.error('Error updating whitelist:', error);
      return { success: false };
    }
  };

  return {
    whitelist,
    loading,
    addToWhitelist,
    removeFromWhitelist,
    updateWhitelistReason,
    refetch: fetchWhitelist,
  };
}
