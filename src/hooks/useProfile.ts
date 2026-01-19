import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabaseWithAuth } from './useSupabaseWithAuth';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  account_type: 'supporter' | 'creator' | null;
  onboarding_status: 'pending' | 'account_type' | 'payment' | 'profile' | 'completed';
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  other_link: string | null;
  is_verified: boolean;
  is_admin: boolean;
  total_received: number;
  total_supporters: number;
  created_at: string;
  updated_at: string;
  // Withdrawal security
  has_withdrawal_pin: boolean;
  withdrawal_pin_set_at: string | null;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

export function useProfile() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseWithAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database row to Profile (adds computed fields)
  const transformProfile = (row: any): Profile => ({
    ...row,
    is_admin: row.is_admin ?? false,
    has_withdrawal_pin: !!row.withdrawal_pin_hash,
    withdrawal_pin_set_at: row.withdrawal_pin_set_at || null,
  });

  const createFallbackProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    
    console.log('Creating fallback profile for user:', user.id);
    
    const email = user.primaryEmailAddress?.emailAddress || null;
    const emailPrefix = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : null;
    const username = emailPrefix || `user${Math.random().toString(36).substring(2, 8)}`;
    
    const newProfile = {
      user_id: user.id,
      email,
      first_name: user.firstName || null,
      last_name: user.lastName || null,
      username,
      avatar_url: user.imageUrl || null,
      onboarding_status: 'account_type' as const,
      // Don't set account_type - let user choose during onboarding
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (error) {
      // If insert fails due to conflict (profile already exists), fetch it
      if (error.code === '23505') {
        console.log('Profile already exists, fetching...');
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        return existingProfile ? transformProfile(existingProfile) : null;
      }
      console.error('Error creating fallback profile:', error);
      return null;
    }
    
    console.log('Fallback profile created:', data);
    return transformProfile(data);
  }, [user, supabase]);

  const fetchProfile = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user) return;

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        setProfile(transformProfile(existingProfile));
        setError(null);
      } else if (retryCount < MAX_RETRIES) {
        // Profile not found - Clerk webhook might not have created it yet
        // Wait and retry with exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Profile not found, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchProfile(retryCount + 1);
      } else {
        // Max retries exceeded - create profile locally as fallback
        console.log('Max retries exceeded, creating fallback profile...');
        const fallbackProfile = await createFallbackProfile();
        if (fallbackProfile) {
          setProfile(fallbackProfile);
          setError(null);
        } else {
          setError('Could not create profile. Please try refreshing the page.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    }
  }, [user, supabase, createFallbackProfile]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProfile().finally(() => setLoading(false));
  }, [user, isLoaded, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: 'No user or profile' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(transformProfile(data));
      return { data };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { error: err.message };
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchProfile().finally(() => setLoading(false));
  };

  return { profile, loading, error, updateProfile, refetch };
}
