import { useState, useEffect, useCallback } from 'react';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { useProfile } from '@/hooks/useProfile';
import { nanoid } from 'nanoid';
import { toast } from '@/hooks/use-toast';

export interface StreamerSettings {
  id: string;
  profile_id: string;
  is_enabled: boolean;
  alert_token: string | null;
  alert_duration: number;
  alert_sound: string | null;
  alert_animation: 'slide' | 'bounce' | 'fade' | 'pop';
  min_amount_for_alert: number;
  show_message: boolean;
  sound_enabled: boolean;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

export function useStreamerSettings() {
  const supabase = useSupabaseWithAuth();
  const { profile } = useProfile();
  const [settings, setSettings] = useState<StreamerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('streamer_settings')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streamer settings:', error);
    }
    
    setSettings(data as StreamerSettings | null);
    setLoading(false);
  }, [profile?.id, supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const generateToken = () => nanoid(12);

  const enableStreamerMode = async () => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const newToken = generateToken();
    
    const { data, error } = await supabase
      .from('streamer_settings')
      .upsert({
        profile_id: profile.id,
        is_enabled: true,
        alert_token: newToken,
        alert_duration: 5,
        alert_animation: 'slide',
        min_amount_for_alert: 0,
        show_message: true,
        sound_enabled: true,
      }, { onConflict: 'profile_id' })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to enable Streamer Mode",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: "Streamer Mode Enabled!",
      description: "Your alert URL is ready to use"
    });
    setSaving(false);
    return { data };
  };

  const disableStreamerMode = async () => {
    if (!profile?.id || !settings) return { error: 'No settings' };

    setSaving(true);
    const { error } = await supabase
      .from('streamer_settings')
      .update({ is_enabled: false })
      .eq('profile_id', profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to disable Streamer Mode",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings({ ...settings, is_enabled: false });
    toast({
      title: "Streamer Mode Disabled",
      description: "Alerts will no longer be shown"
    });
    setSaving(false);
    return { success: true };
  };

  const updateSettings = async (updates: Partial<StreamerSettings>) => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const { data, error } = await supabase
      .from('streamer_settings')
      .update(updates)
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: "Settings Saved!",
      description: "Your streamer settings have been updated"
    });
    setSaving(false);
    return { data };
  };

  const regenerateToken = async () => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const newToken = generateToken();
    
    const { data, error } = await supabase
      .from('streamer_settings')
      .update({ alert_token: newToken })
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate token",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: "Token Regenerated!",
      description: "Update your OBS browser source with the new URL"
    });
    setSaving(false);
    return { data };
  };

  const getAlertUrl = () => {
    if (!settings?.alert_token) return null;
    return `${window.location.origin}/alerts/${settings.alert_token}`;
  };

  return {
    settings,
    loading,
    saving,
    enableStreamerMode,
    disableStreamerMode,
    updateSettings,
    regenerateToken,
    getAlertUrl,
    refetch: fetchSettings,
  };
}
