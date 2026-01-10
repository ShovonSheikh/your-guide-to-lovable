import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeTip {
  id: string;
  supporter_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  creator_id: string;
}

interface UseRealtimeTipsOptions {
  creatorId?: string;
  limit?: number;
}

export function useRealtimeTips(options: UseRealtimeTipsOptions = {}) {
  const { creatorId, limit = 10 } = options;
  const [tips, setTips] = useState<RealtimeTip[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial tips
  const fetchInitialTips = useCallback(async () => {
    try {
      let query = supabase
        .from('tips')
        .select('id, supporter_name, amount, message, is_anonymous, created_at, creator_id')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching initial tips:', error);
        return;
      }

      setTips((data || []).map(t => ({
        id: t.id,
        supporter_name: t.is_anonymous ? 'Anonymous' : t.supporter_name,
        amount: Number(t.amount),
        message: t.message,
        is_anonymous: t.is_anonymous || false,
        created_at: t.created_at || new Date().toISOString(),
        creator_id: t.creator_id,
      })));
    } finally {
      setLoading(false);
    }
  }, [creatorId, limit]);

  useEffect(() => {
    fetchInitialTips();

    // Set up realtime subscription
    const channel = supabase
      .channel('realtime-tips')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tips',
          filter: creatorId ? `creator_id=eq.${creatorId}` : undefined,
        },
        (payload) => {
          const newTip = payload.new as any;
          
          // Only add if payment is completed
          if (newTip.payment_status !== 'completed') return;

          const tip: RealtimeTip = {
            id: newTip.id,
            supporter_name: newTip.is_anonymous ? 'Anonymous' : newTip.supporter_name,
            amount: Number(newTip.amount),
            message: newTip.message,
            is_anonymous: newTip.is_anonymous || false,
            created_at: newTip.created_at || new Date().toISOString(),
            creator_id: newTip.creator_id,
          };

          setTips(prev => {
            // Prevent duplicates
            if (prev.some(t => t.id === tip.id)) return prev;
            // Add to beginning and limit
            return [tip, ...prev].slice(0, limit);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialTips, creatorId, limit]);

  return {
    tips,
    loading,
    refetch: fetchInitialTips,
  };
}
