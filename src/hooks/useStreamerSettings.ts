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
  alert_media_type?: 'emoji' | 'gif' | 'none' | null;
  alert_emoji?: string | null;
  alert_gif_url?: string | null;
  alert_animation: 'slide' | 'bounce' | 'fade' | 'pop';
  min_amount_for_alert: number;
  show_message: boolean;
  sound_enabled: boolean;
  custom_css: string | null;
  tts_enabled: boolean;
  tts_voice: string;
  tts_rate: number;
  tts_pitch: number;
  // Safety controls
  emergency_mute: boolean;
  sounds_paused: boolean;
  gifs_paused: boolean;
  // GIF settings
  gif_enabled: boolean;
  gif_id: string | null;
  gif_position: string;
  created_at: string;
  updated_at: string;
}

export interface TipSound {
  id: string;
  profile_id: string;
  trigger_amount: number;
  sound_url: string;
  display_name: string;
  cooldown_seconds: number;
  is_enabled: boolean;
  created_at: string;
}

export interface ApprovedGif {
  id: string;
  name: string;
  url: string;
  thumbnail_url: string | null;
  category: string | null;
  duration_seconds: number;
}

// Pre-approved sound options (royalty-free)
export const APPROVED_SOUNDS = [
  { amount: 20, name: 'Pop', url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', duration: 2 },
  { amount: 50, name: 'Meme Horn', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', duration: 3 },
  { amount: 100, name: 'Dramatic', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', duration: 4 },
  { amount: 200, name: 'Hype Crowd', url: 'https://assets.mixkit.co/active_storage/sfx/584/584-preview.mp3', duration: 4 },
  { amount: 500, name: 'Epic Victory', url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', duration: 5 },
];

export function useStreamerSettings() {
  const supabase = useSupabaseWithAuth();
  const { profile } = useProfile();
  const [settings, setSettings] = useState<StreamerSettings | null>(null);
  const [tipSounds, setTipSounds] = useState<TipSound[]>([]);
  const [approvedGifs, setApprovedGifs] = useState<ApprovedGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    
    // Fetch settings, tip sounds, and approved GIFs in parallel
    const [settingsRes, soundsRes, gifsRes] = await Promise.all([
      supabase
        .from('streamer_settings')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle(),
      supabase
        .from('tip_sounds')
        .select('*')
        .eq('profile_id', profile.id)
        .order('trigger_amount', { ascending: false }),
      supabase
        .from('approved_gifs')
        .select('*')
        .order('name'),
    ]);

    if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
      console.error('Error fetching streamer settings:', settingsRes.error);
    }
    
    setSettings(settingsRes.data as StreamerSettings | null);
    setTipSounds((soundsRes.data || []) as TipSound[]);
    setApprovedGifs((gifsRes.data || []) as ApprovedGif[]);
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
        alert_media_type: 'emoji',
        alert_emoji: '🎉',
        alert_gif_url: null,
        min_amount_for_alert: 0,
        show_message: true,
        sound_enabled: true,
        tts_enabled: false,
        tts_voice: 'default',
        tts_rate: 1.0,
        tts_pitch: 1.0,
        emergency_mute: false,
        sounds_paused: false,
        gifs_paused: false,
        gif_enabled: false,
        gif_id: null,
        gif_position: 'center',
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

  // Emergency mute toggle
  const toggleEmergencyMute = async () => {
    if (!profile?.id || !settings) return { error: 'No settings' };

    const newValue = !settings.emergency_mute;
    setSaving(true);
    
    const { data, error } = await supabase
      .from('streamer_settings')
      .update({ emergency_mute: newValue })
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to toggle emergency mute",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: newValue ? "Emergency Mute ON" : "Emergency Mute OFF",
      description: newValue ? "All alerts are silenced" : "Alerts resumed",
      variant: newValue ? "destructive" : "default"
    });
    setSaving(false);
    return { data };
  };

  // Tip sound management
  const addTipSound = async (triggerAmount: number, soundUrl: string, displayName: string, cooldownSeconds: number = 10) => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const { data, error } = await supabase
      .from('tip_sounds')
      .insert({
        profile_id: profile.id,
        trigger_amount: triggerAmount,
        sound_url: soundUrl,
        display_name: displayName,
        cooldown_seconds: cooldownSeconds,
        is_enabled: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add tip sound",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setTipSounds([...tipSounds, data as TipSound].sort((a, b) => b.trigger_amount - a.trigger_amount));
    toast({
      title: "Tip Sound Added!",
      description: `৳${triggerAmount} will play "${displayName}"`
    });
    setSaving(false);
    return { data };
  };

  const removeTipSound = async (soundId: string) => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const { error } = await supabase
      .from('tip_sounds')
      .delete()
      .eq('id', soundId)
      .eq('profile_id', profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove tip sound",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setTipSounds(tipSounds.filter(s => s.id !== soundId));
    toast({
      title: "Tip Sound Removed"
    });
    setSaving(false);
    return { success: true };
  };

  const updateTipSound = async (soundId: string, updates: Partial<TipSound>) => {
    if (!profile?.id) return { error: 'No profile' };

    setSaving(true);
    const { data, error } = await supabase
      .from('tip_sounds')
      .update(updates)
      .eq('id', soundId)
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update tip sound",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setTipSounds(tipSounds.map(s => s.id === soundId ? (data as TipSound) : s));
    toast({
      title: "Tip Sound Updated!"
    });
    setSaving(false);
    return { data };
  };

  const uploadAlertSound = async (file: File) => {
    if (!profile?.id) return { error: 'No profile' };
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return { error: 'File too large' };
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only MP3, WAV, or OGG files are allowed",
        variant: "destructive"
      });
      return { error: 'Invalid file type' };
    }

    setUploadingSound(true);
    
    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${profile.id}/alert-sound-${Date.now()}.${ext}`;

    // Delete old sound if exists
    if (settings?.alert_sound) {
      const oldPath = settings.alert_sound.split('/alert-sounds/')[1];
      if (oldPath) {
        await supabase.storage.from('alert-sounds').remove([oldPath]);
      }
    }

    // Upload new sound
    const { error: uploadError } = await supabase.storage
      .from('alert-sounds')
      .upload(filename, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload Failed",
        description: uploadError.message,
        variant: "destructive"
      });
      setUploadingSound(false);
      return { error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('alert-sounds')
      .getPublicUrl(filename);

    // Update settings with new URL
    const { data, error } = await supabase
      .from('streamer_settings')
      .update({ alert_sound: urlData.publicUrl })
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save sound URL",
        variant: "destructive"
      });
      setUploadingSound(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: "Sound Uploaded!",
      description: "Your custom alert sound is ready"
    });
    setUploadingSound(false);
    return { data };
  };

  const deleteAlertSound = async () => {
    if (!profile?.id || !settings?.alert_sound) return { error: 'No sound to delete' };

    setSaving(true);

    // Delete from storage
    const path = settings.alert_sound.split('/alert-sounds/')[1];
    if (path) {
      await supabase.storage.from('alert-sounds').remove([path]);
    }

    // Update settings
    const { data, error } = await supabase
      .from('streamer_settings')
      .update({ alert_sound: null })
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove sound",
        variant: "destructive"
      });
      setSaving(false);
      return { error: error.message };
    }

    setSettings(data as StreamerSettings);
    toast({
      title: "Sound Removed",
      description: "Reverted to default notification sound"
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
    tipSounds,
    approvedGifs,
    loading,
    saving,
    uploadingSound,
    enableStreamerMode,
    disableStreamerMode,
    updateSettings,
    regenerateToken,
    toggleEmergencyMute,
    addTipSound,
    removeTipSound,
    updateTipSound,
    uploadAlertSound,
    deleteAlertSound,
    getAlertUrl,
    refetch: fetchSettings,
    APPROVED_SOUNDS,
  };
}
