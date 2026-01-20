import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseWithAuth } from './useSupabaseWithAuth';
import type { Json } from '@/integrations/supabase/types';

export interface ShareImageConfig {
  backgroundColor: string;
  cardBackgroundColor: string;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  font: 'Fredoka' | 'DM Sans' | 'Inter' | 'Poppins';
  cardStyle: 'celebration' | 'minimal' | 'dark';
  showConfetti: boolean;
  brandingText: string;
  logoUrl: string | null;
}

export const defaultShareImageConfig: ShareImageConfig = {
  backgroundColor: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%)',
  cardBackgroundColor: '#ffffff',
  accentColor: '#d4a24a',
  textColor: '#2d1810',
  secondaryTextColor: '#5a4a3a',
  font: 'Fredoka',
  cardStyle: 'celebration',
  showConfetti: true,
  brandingText: 'Support creators with TipKoro',
  logoUrl: 'https://i.ibb.co.com/hF035hX2/2026-01-16-21-27-58-your-guide-to-lovable-Antigravity-tip-share-image-guide-txt-removebg-preview.png',
};

export function useShareImageConfig() {
  const supabaseAuth = useSupabaseWithAuth();
  const [config, setConfig] = useState<ShareImageConfig>(defaultShareImageConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'share_image_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching share image config:', error);
        return;
      }

      if (data?.value) {
        // Type assertion since we know the structure
        const configValue = data.value as unknown as ShareImageConfig;
        setConfig({ ...defaultShareImageConfig, ...configValue });
      }
    } catch (err) {
      console.error('Error fetching share image config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: Partial<ShareImageConfig>): Promise<boolean> => {
    setSaving(true);
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      // Check if config exists first
      const { data: existing } = await supabase
        .from('platform_config')
        .select('id')
        .eq('key', 'share_image_config')
        .single();
      
      // Convert config to Json type
      const jsonValue: Json = updatedConfig as unknown as Json;
      
      if (existing) {
        // Update existing
        const { error } = await supabaseAuth
          .from('platform_config')
          .update({
            value: jsonValue,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'share_image_config');
          
        if (error) {
          console.error('Error updating share image config:', error);
          return false;
        }
      } else {
        // Insert new - use RPC or direct SQL for insert since upsert has issues
        const { error } = await supabaseAuth
          .from('platform_config')
          .insert([{
            key: 'share_image_config',
            value: jsonValue,
          }]);
          
        if (error) {
          console.error('Error inserting share image config:', error);
          return false;
        }
      }

      setConfig(updatedConfig);
      return true;
    } catch (err) {
      console.error('Error updating share image config:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = async (): Promise<boolean> => {
    return updateConfig(defaultShareImageConfig);
  };

  return {
    config,
    loading,
    saving,
    updateConfig,
    resetConfig,
    refetch: fetchConfig,
  };
}
