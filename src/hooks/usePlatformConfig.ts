import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface PlatformConfig {
  creator_account_fee: { amount: number; currency: string };
  min_withdrawal: { amount: number; currency: string };
  max_withdrawal: { amount: number; currency: string };
  payout_methods: string[];
}

const DEFAULT_CONFIG: PlatformConfig = {
  creator_account_fee: { amount: 150, currency: 'BDT' },
  min_withdrawal: { amount: 100, currency: 'BDT' },
  max_withdrawal: { amount: 50000, currency: 'BDT' },
  payout_methods: ['bKash', 'Nagad', 'Rocket']
};

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('platform_config')
        .select('key, value');

      if (fetchError) {
        console.error('Error fetching platform config:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        const configMap: Partial<PlatformConfig> = {};
        data.forEach((item: { key: string; value: unknown }) => {
          if (item.key === 'creator_account_fee') {
            configMap.creator_account_fee = item.value as { amount: number; currency: string };
          } else if (item.key === 'min_withdrawal') {
            configMap.min_withdrawal = item.value as { amount: number; currency: string };
          } else if (item.key === 'max_withdrawal') {
            configMap.max_withdrawal = item.value as { amount: number; currency: string };
          } else if (item.key === 'payout_methods') {
            configMap.payout_methods = item.value as string[];
          }
        });
        
        setConfig({ ...DEFAULT_CONFIG, ...configMap });
      }
    } catch (err) {
      console.error('Error in fetchConfig:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: Json): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: updateError } = await supabase
        .from('platform_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Refresh config
      await fetchConfig();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}
