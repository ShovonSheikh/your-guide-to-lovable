import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';

interface Donation {
  id: string;
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  amount: number;
  message: string | null;
  created_at: string;
}

interface DonationStats {
  totalDonated: number;
  creatorsSupported: number;
  donations: Donation[];
}

export function useSupporterDonations() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [data, setData] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch supporter's donation history using RPC function
      const { data: donations, error: donationsError } = await supabase
        .rpc('get_supporter_donations', { p_user_email: email });

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
        throw donationsError;
      }

      const donationList: Donation[] = (donations || []).map((d: any) => ({
        id: d.id,
        creator_username: d.creator_username || '',
        creator_name: d.creator_name || 'Unknown Creator',
        creator_avatar: d.creator_avatar,
        amount: Number(d.amount),
        message: d.message,
        created_at: d.created_at,
      }));

      // Calculate stats
      const totalDonated = donationList.reduce((sum, d) => sum + d.amount, 0);
      const uniqueCreators = new Set(donationList.map(d => d.creator_username)).size;

      setData({
        totalDonated,
        creatorsSupported: uniqueCreators,
        donations: donationList,
      });

    } catch (err) {
      console.error('Error fetching supporter donations:', err);
      setError('Failed to fetch donation history');
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return {
    data,
    loading,
    error,
    refetch: fetchDonations,
  };
}
