import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useProfile } from './useProfile';

interface MonthlyEarning {
  month_start: string;
  month_label: string;
  total_amount: number;
  tip_count: number;
  unique_supporters: number;
}

interface CreatorStats {
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
  totalReceived: number;
  totalSupporters: number;
  monthlyEarnings: MonthlyEarning[];
}

interface RecentTip {
  id: string;
  supporter_name: string;
  supporter_email: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export function useCreatorStats() {
  const supabase = useSupabase();
  const { profile } = useProfile();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!profile?.id || profile.account_type !== 'creator') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch current month stats using RPC function
      const { data: monthStats, error: monthError } = await supabase
        .rpc('get_creator_current_month_stats', { p_creator_id: profile.id });

      if (monthError) {
        console.error('Error fetching month stats:', monthError);
      }

      // Fetch monthly earnings history (last 12 months)
      const { data: earningsHistory, error: earningsError } = await supabase
        .rpc('get_creator_monthly_earnings', { 
          p_creator_id: profile.id,
          p_months: 12
        });

      if (earningsError) {
        console.error('Error fetching earnings history:', earningsError);
      }

      // Fetch recent tips
      const { data: tips, error: tipsError } = await supabase
        .from('tips')
        .select('id, supporter_name, supporter_email, amount, message, is_anonymous, created_at')
        .eq('creator_id', profile.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (tipsError) {
        console.error('Error fetching recent tips:', tipsError);
      }

      const monthData = monthStats?.[0] || { this_month_total: 0, last_month_total: 0, growth_percentage: 0 };

      setStats({
        thisMonth: Number(monthData.this_month_total) || 0,
        lastMonth: Number(monthData.last_month_total) || 0,
        growthPercentage: Number(monthData.growth_percentage) || 0,
        totalReceived: Number(profile.total_received) || 0,
        totalSupporters: profile.total_supporters || 0,
        monthlyEarnings: (earningsHistory || []).map((e: any) => ({
          month_start: e.month_start,
          month_label: e.month_label || '',
          total_amount: Number(e.total_amount) || 0,
          tip_count: e.tip_count || 0,
          unique_supporters: e.unique_supporters || 0,
        })),
      });

      setRecentTips((tips || []).map((t: any) => ({
        id: t.id,
        supporter_name: t.is_anonymous ? 'Anonymous' : t.supporter_name,
        supporter_email: t.supporter_email,
        amount: Number(t.amount),
        message: t.message,
        is_anonymous: t.is_anonymous,
        created_at: t.created_at,
      })));

    } catch (err) {
      console.error('Error fetching creator stats:', err);
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [supabase, profile?.id, profile?.account_type, profile?.total_received, profile?.total_supporters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    recentTips,
    loading,
    error,
    refetch: fetchStats,
  };
}
