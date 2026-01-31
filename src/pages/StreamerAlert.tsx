import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TipData {
  id: string;
  supporter_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
}

interface TipSound {
  id: string;
  trigger_amount: number;
  sound_url: string;
  display_name: string;
  cooldown_seconds: number;
  is_enabled: boolean;
  media_type: 'none' | 'library' | 'url' | 'upload';
  gif_id: string | null;
  gif_url: string | null;
  gif_duration_seconds: number | null;
}

interface ApprovedGif {
  id: string;
  name: string;
  url: string;
  thumbnail_url: string | null;
  category: string | null;
  duration_seconds: number;
}

interface StreamerSettings {
  profile_id: string;
  alert_duration: number;
  alert_animation: 'slide' | 'bounce' | 'fade' | 'pop';
  alert_sound: string | null;
  alert_media_type?: 'emoji' | 'gif' | 'none' | null;
  alert_emoji?: string | null;
  alert_gif_url?: string | null;
  match_gif_duration: boolean;
  custom_gif_duration_seconds: number | null;
  min_amount_for_alert: number;
  show_message: boolean;
  sound_enabled: boolean;
  custom_css: string | null;
  tts_enabled: boolean;
  tts_voice: string;
  tts_rate: number;
  tts_pitch: number;
  // New safety controls
  emergency_mute: boolean;
  sounds_paused: boolean;
  gifs_paused: boolean;
  // GIF settings
  gif_enabled: boolean;
  gif_id: string | null;
  gif_position: string;
}

// Tier thresholds for smart combination logic
const TIERS = [
  { min: 500, name: 'epic', scale: 1.5, glow: true, border: true, tts: true },
  { min: 200, name: 'hype', scale: 1.3, glow: true, border: true, tts: true },
  { min: 100, name: 'medium', scale: 1.15, glow: true, border: false, tts: false },
  { min: 50, name: 'small', scale: 1.0, glow: false, border: false, tts: false },
  { min: 0, name: 'tiny', scale: 0.9, glow: false, border: false, tts: false },
];

const getTierForAmount = (amount: number) => {
  return TIERS.find(t => amount >= t.min) || TIERS[TIERS.length - 1];
};

const DEFAULT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function StreamerAlert() {
  const { token } = useParams<{ token: string }>();
  const [settings, setSettings] = useState<StreamerSettings | null>(null);
  const [tipSounds, setTipSounds] = useState<TipSound[]>([]);
  const [approvedGifs, setApprovedGifs] = useState<ApprovedGif[]>([]);
  const [approvedGif, setApprovedGif] = useState<ApprovedGif | null>(null);
  const [currentTip, setCurrentTip] = useState<TipData | null>(null);
  const [currentTier, setCurrentTier] = useState<typeof TIERS[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [libraryGifFailed, setLibraryGifFailed] = useState(false);
  const [customGifFailed, setCustomGifFailed] = useState(false);
  const [tipGifFailed, setTipGifFailed] = useState(false);
  const [activeTipSound, setActiveTipSound] = useState<TipSound | null>(null);
  const [debugName, setDebugName] = useState('Shirin Sultana');
  const [debugAmount, setDebugAmount] = useState(100);
  const [debugMessage, setDebugMessage] = useState('This is a long test message to verify wrapping and clipping inside 512×512.');
  
  // Queue system refs
  const alertQueue = useRef<TipData[]>([]);
  const isProcessing = useRef(false);
  const processedTipIds = useRef<Set<string>>(new Set());
  const activeAlertResolve = useRef<(() => void) | null>(null);
  const activeAlertTimeouts = useRef<number[]>([]);
  
  // Cooldown tracking for tip sounds
  const soundCooldowns = useRef<Map<string, number>>(new Map());

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

  const normalizeSettings = useCallback((data: any): StreamerSettings => {
    return {
      ...(data as any),
      min_amount_for_alert: Number((data as any).min_amount_for_alert) || 0,
      tts_enabled: Boolean((data as any).tts_enabled),
      tts_voice: (data as any).tts_voice ?? 'default',
      tts_rate: Number((data as any).tts_rate) || 1,
      tts_pitch: Number((data as any).tts_pitch) || 1,
      alert_media_type: ((data as any).alert_media_type ?? 'emoji') as any,
      alert_emoji: (data as any).alert_emoji ?? '🎉',
      alert_gif_url: (data as any).alert_gif_url ?? null,
      match_gif_duration: (data as any).match_gif_duration ?? true,
      custom_gif_duration_seconds: (data as any).custom_gif_duration_seconds != null ? Number((data as any).custom_gif_duration_seconds) : null,
      emergency_mute: Boolean((data as any).emergency_mute),
      sounds_paused: Boolean((data as any).sounds_paused),
      gifs_paused: Boolean((data as any).gifs_paused),
      gif_enabled: Boolean((data as any).gif_enabled),
      gif_id: (data as any).gif_id ?? null,
      gif_position: (data as any).gif_position ?? 'center',
    };
  }, []);

  useEffect(() => {
    setLibraryGifFailed(false);
    setCustomGifFailed(false);
    setTipGifFailed(false);
  }, [settings?.gif_id, settings?.alert_gif_url]);

  useEffect(() => {
    setTipGifFailed(false);
  }, [activeTipSound?.id, activeTipSound?.gif_url, activeTipSound?.gif_id]);

  // Load available TTS voices
  useEffect(() => {
    if (!isSpeechSupported) return;

    const loadVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      } catch {
        setVoices([]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Fetch settings and subscribe to tips
  useEffect(() => {
    if (!token) {
      setError('Invalid alert token');
      return;
    }

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamer_settings')
        .select('profile_id, alert_duration, alert_animation, alert_sound, alert_media_type, alert_emoji, alert_gif_url, match_gif_duration, custom_gif_duration_seconds, min_amount_for_alert, show_message, sound_enabled, custom_css, tts_enabled, tts_voice, tts_rate, tts_pitch, emergency_mute, sounds_paused, gifs_paused, gif_enabled, gif_id, gif_position')
        .eq('alert_token', token)
        .eq('is_enabled', true)
        .single();

      if (error || !data) {
        setError('Invalid or disabled alert URL');
        return;
      }

      const normalized = normalizeSettings(data);

      setSettings(normalized);

      const [soundsRes, gifsRes] = await Promise.all([
        supabase
          .from('tip_sounds')
          .select('*')
          .eq('profile_id', normalized.profile_id)
          .eq('is_enabled', true)
          .order('trigger_amount', { ascending: false }),
        supabase.from('approved_gifs').select('*'),
      ]);

      setTipSounds(((soundsRes.data as any[]) ?? []) as TipSound[]);
      setApprovedGifs(((gifsRes.data as any[]) ?? []) as ApprovedGif[]);

      if (normalized.gif_id && gifsRes.data) {
        const gif = (gifsRes.data as any[]).find((g) => g.id === normalized.gif_id);
        setApprovedGif((gif as ApprovedGif) ?? null);
      } else {
        setApprovedGif(null);
      }
    };

    fetchSettings();
    const intervalId = setInterval(fetchSettings, 10_000);
    return () => clearInterval(intervalId);
  }, [token]);

  const speakTip = useCallback((tip: TipData, tier: typeof TIERS[0]) => {
    if (!settings?.tts_enabled) return;
    // Check if TTS should play based on tier or explicit enable
    if (!tier.tts && !settings.tts_enabled) return;
    if (settings.emergency_mute) return;
    if (!isSpeechSupported) {
      if (isDebug) console.log('StreamerAlert: speechSynthesis not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      return;
    }

    const text = tip.message 
      ? `${tip.supporter_name} tipped ${tip.amount} taka. ${tip.message}`
      : `${tip.supporter_name} tipped ${tip.amount} taka.`;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (settings.tts_voice && settings.tts_voice !== 'default') {
      const selectedVoice = voices.find(v => v.name === settings.tts_voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    utterance.rate = settings.tts_rate || 1;
    utterance.pitch = settings.tts_pitch || 1;
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (isDebug) console.log('StreamerAlert: speak failed', e);
    }
  }, [settings, voices, isSpeechSupported, isDebug]);

  const clearActiveAlertTimeouts = useCallback(() => {
    for (const id of activeAlertTimeouts.current) {
      window.clearTimeout(id);
    }
    activeAlertTimeouts.current = [];
  }, []);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const stopCurrentAlert = useCallback((options?: { clearQueue?: boolean }) => {
    clearActiveAlertTimeouts();
    stopAudio();

    if (isSpeechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }

    setIsVisible(false);
    setCurrentTip(null);
    setCurrentTier(null);
    setActiveTipSound(null);

    if (options?.clearQueue) {
      alertQueue.current = [];
    }

    const resolve = activeAlertResolve.current;
    activeAlertResolve.current = null;
    resolve?.();
  }, [clearActiveAlertTimeouts, isSpeechSupported, stopAudio]);

  // Get the appropriate sound URL based on tip amount
  const getTipSoundForAmount = useCallback((amount: number): TipSound | null => {
    const normalizedAmount = Math.round(amount * 100);

    // Find matching tip sound (exact match)
    for (const sound of tipSounds) {
      const normalizedTrigger = Math.round(sound.trigger_amount * 100);
      if (normalizedAmount === normalizedTrigger) {
        // Check cooldown
        const lastPlayed = soundCooldowns.current.get(sound.id) || 0;
        const now = Date.now();
        if (now - lastPlayed < sound.cooldown_seconds * 1000) {
          if (isDebug) console.log(`StreamerAlert: Sound ${sound.display_name} on cooldown`);
          continue;
        }
        // Update cooldown
        soundCooldowns.current.set(sound.id, now);
        return sound;
      }
    }
    return null;
  }, [tipSounds, isDebug]);

  const showAlert = useCallback(async (tip: TipData) => {
    stopCurrentAlert();

    const tier = getTierForAmount(tip.amount);
    setCurrentTier(tier);
    setCurrentTip(tip);
    setIsVisible(true);

    // Reset failure states for new alert
    setTipGifFailed(false);
    setLibraryGifFailed(false);
    setCustomGifFailed(false);

    const tipSound = getTipSoundForAmount(tip.amount);
    setActiveTipSound(tipSound);
    const soundUrl = tipSound?.sound_url || settings?.alert_sound || DEFAULT_SOUND_URL;

    if (settings?.sound_enabled && !settings?.sounds_paused && !settings?.emergency_mute && audioRef.current) {
      const audioEl = audioRef.current;
      const fallbackSoundUrl = settings?.alert_sound || DEFAULT_SOUND_URL;
      let triedFallback = false;

      const tryPlay = async (url: string) => {
        audioEl.src = url;
        audioEl.currentTime = 0;
        try {
          await audioEl.play();
          return true;
        } catch {
          return false;
        }
      };

      const tryFallback = async () => {
        if (triedFallback) return;
        triedFallback = true;
        if (soundUrl !== fallbackSoundUrl) {
          await tryPlay(fallbackSoundUrl);
        }
      };

      audioEl.onerror = () => {
        void tryFallback();
      };

      const ok = await tryPlay(soundUrl);
      if (!ok) {
        await tryFallback();
      }
    }

    const durationMs = (() => {
      const fallback = (settings?.alert_duration || 5) * 1000;
      if (!settings?.match_gif_duration) return fallback;

      if (tipSound?.media_type && tipSound.media_type !== 'none') {
        if (tipSound.media_type === 'library' && tipSound.gif_id) {
          const gif = approvedGifs.find((g) => g.id === tipSound.gif_id);
          const seconds = tipSound.gif_duration_seconds ?? gif?.duration_seconds ?? null;
          if (seconds) return Math.max(500, seconds * 1000);
        } else if ((tipSound.media_type === 'url' || tipSound.media_type === 'upload') && tipSound.gif_duration_seconds) {
          return Math.max(500, tipSound.gif_duration_seconds * 1000);
        }
      }

      if (settings?.gif_enabled && !settings?.gifs_paused && approvedGif?.duration_seconds) {
        return Math.max(500, approvedGif.duration_seconds * 1000);
      }

      const mediaType = settings?.alert_media_type ?? 'emoji';
      if (mediaType === 'gif' && !settings?.gifs_paused && settings?.custom_gif_duration_seconds) {
        return Math.max(500, settings.custom_gif_duration_seconds * 1000);
      }

      return fallback;
    })();

    await new Promise<void>((resolve) => {
      activeAlertResolve.current = resolve;

      if (settings?.tts_enabled && !settings?.emergency_mute) {
        const ttsTimeout = window.setTimeout(() => speakTip(tip, tier), 500);
        activeAlertTimeouts.current.push(ttsTimeout);
      }

      const hideTimeout = window.setTimeout(() => {
        stopAudio();
        setIsVisible(false);

        const cleanupTimeout = window.setTimeout(() => {
          setCurrentTip(null);
          setCurrentTier(null);
          const done = activeAlertResolve.current;
          activeAlertResolve.current = null;
          done?.();
        }, 500);

        activeAlertTimeouts.current.push(cleanupTimeout);
      }, durationMs);

      activeAlertTimeouts.current.push(hideTimeout);
    });
  }, [approvedGif?.duration_seconds, approvedGifs, getTipSoundForAmount, settings, speakTip, stopAudio, stopCurrentAlert]);

  // Process alert queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current || alertQueue.current.length === 0) return;
    
    isProcessing.current = true;
    
    while (alertQueue.current.length > 0) {
      const tip = alertQueue.current.shift();
      if (tip) {
        await showAlert(tip);
        // Small buffer between alerts
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    isProcessing.current = false;
  }, [showAlert]);

  const addToQueue = useCallback((tip: TipData) => {
    alertQueue.current.push(tip);
    processQueue();
  }, [processQueue]);

  const triggerDebugAlert = useCallback(() => {
    addToQueue({
      id: `debug-${Date.now()}`,
      supporter_name: debugName.trim() || 'Test Supporter',
      amount: Number(debugAmount) || 0,
      message: debugMessage.trim() ? debugMessage.trim() : null,
      is_anonymous: false,
    });
  }, [addToQueue, debugAmount, debugMessage, debugName]);

  useEffect(() => {
    if (!token) return;

    const channel = supabase
      .channel(`streamer-settings-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streamer_settings',
          filter: `alert_token=eq.${token}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row) return;

          if (row.is_enabled === false) {
            stopCurrentAlert({ clearQueue: true });
            setError('Invalid or disabled alert URL');
            return;
          }

          setError(null);
          const normalized = normalizeSettings(row);

          if (normalized.emergency_mute) {
            stopCurrentAlert({ clearQueue: true });
          } else if (normalized.sounds_paused || !normalized.sound_enabled) {
            stopAudio();
          }

          setSettings(normalized);

          if (normalized.gif_id) {
            const { data: gif } = await supabase
              .from('approved_gifs')
              .select('*')
              .eq('id', normalized.gif_id)
              .single();

            if (gif) setApprovedGif(gif as ApprovedGif);
          } else {
            setApprovedGif(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, normalizeSettings, stopAudio, stopCurrentAlert]);

  // Subscribe to real-time tips
  useEffect(() => {
    if (!settings?.profile_id) return;

    const channel = supabase
      .channel('streamer-tips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tips',
          filter: `creator_id=eq.${settings.profile_id}`,
        },
        (payload) => {
          const tip = payload.new as any;
          
          if (!tip) {
             if (isDebug) console.log('StreamerAlert: No tip data in payload', payload);
             return;
          }

          const amount = Number(tip.amount) || 0;
          const minAmount = Number(settings.min_amount_for_alert) || 0;

          if (isDebug) {
            console.log('StreamerAlert: Realtime event received', payload);
            console.log('StreamerAlert: Tip status:', tip.payment_status, 'Amount:', amount, 'Min:', minAmount);
          }

          // Only show for completed payments
          if (tip.payment_status !== 'completed') {
            if (isDebug) console.log('StreamerAlert: Tip ignored (not completed)');
            return;
          }

          if (processedTipIds.current.has(tip.id)) {
            if (isDebug) console.log('StreamerAlert: Tip ignored (already processed)');
            return;
          }
          
          // Check minimum amount
          if (amount < minAmount) {
             if (isDebug) console.log('StreamerAlert: Tip ignored (below min amount)');
             return;
          }

          // Check emergency mute
          if (settings.emergency_mute) {
            if (isDebug) console.log('StreamerAlert: Emergency mute active, skipping alert');
            return;
          }

          if (isDebug) console.log('StreamerAlert: Adding to queue!');

          // Add to queue instead of showing directly
          processedTipIds.current.add(tip.id);
          if (processedTipIds.current.size > 2000) {
            processedTipIds.current.clear();
          }
          addToQueue({
            id: tip.id,
            supporter_name: tip.is_anonymous ? 'Anonymous' : tip.supporter_name,
            amount,
            message: tip.message,
            is_anonymous: tip.is_anonymous,
          });
        }
      )
      .subscribe((status) => {
        if (isDebug) console.log('StreamerAlert: Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings, addToQueue, isDebug]);

  const getAnimationClass = () => {
    if (!isVisible) return 'animate-fade-out-alert';
    
    switch (settings?.alert_animation) {
      case 'slide':
        return 'animate-slide-in-alert';
      case 'bounce':
        return 'animate-bounce-in-alert';
      case 'fade':
        return 'animate-fade-in-alert';
      case 'pop':
        return 'animate-pop-in-alert';
      default:
        return 'animate-slide-in-alert';
    }
  };

  // Get tier-based CSS classes
  const getTierClasses = () => {
    if (!currentTier) return '';
    const classes: string[] = [];
    if (currentTier.glow) classes.push('shadow-glow');
    if (currentTier.border) classes.push('ring-2 ring-yellow-400/50');
    return classes.join(' ');
  };

  const getMediaNode = () => {
    if (settings?.gifs_paused) return null;

    if (activeTipSound?.media_type && activeTipSound.media_type !== 'none' && !tipGifFailed) {
      const tier = currentTier || TIERS[TIERS.length - 1];
      const size = Math.min(320, 220 * tier.scale);

      if (activeTipSound.media_type === 'library' && activeTipSound.gif_id) {
        const gif = approvedGifs.find((g) => g.id === activeTipSound.gif_id);
        if (gif?.url) {
          return (
            <img
              src={gif.url}
              alt={gif.name}
              className="object-contain mx-auto"
              style={{ width: size, height: size }}
              loading="eager"
              referrerPolicy="no-referrer"
              onError={() => setTipGifFailed(true)}
            />
          );
        }
      }

      if ((activeTipSound.media_type === 'url' || activeTipSound.media_type === 'upload') && activeTipSound.gif_url) {
        return (
          <img
            src={activeTipSound.gif_url}
            alt="Alert"
            className="object-contain mx-auto"
            style={{ width: size, height: size }}
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => setTipGifFailed(true)}
          />
        );
      }
    }

    // If GIF is enabled and not paused, show approved GIF
    if (settings?.gif_enabled && approvedGif && !libraryGifFailed) {
      const tier = currentTier || TIERS[TIERS.length - 1];
      const scale = tier.scale;
      const size = Math.min(320, 220 * scale);
      
      return (
        <img
          src={approvedGif.url}
          alt={approvedGif.name}
          className="object-contain mx-auto"
          style={{ width: size, height: size }}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => setLibraryGifFailed(true)}
        />
      );
    }

    const mediaType = settings?.alert_media_type ?? 'emoji';
    if (mediaType === 'none') return null;
    if (mediaType === 'gif' && !customGifFailed) {
      const url = settings?.alert_gif_url;
      const isValid = typeof url === 'string' && /^https:\/\//i.test(url);
      if (!isValid) return <div className="text-4xl mb-2">🎉</div>;
      const tier = currentTier || TIERS[TIERS.length - 1];
      const size = Math.min(320, 220 * tier.scale);
      return (
        <img
          src={url}
          alt="Alert"
          className="object-contain mx-auto"
          style={{ width: size, height: size }}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => setCustomGifFailed(true)}
        />
      );
    }
    const emoji = (settings?.alert_emoji ?? '🎉').trim();
    return <div className="text-7xl">{emoji || '🎉'}</div>;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white/50 text-sm">{error}</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent overflow-visible">
      {/* Audio for notification sound */}
      <audio ref={audioRef} preload="auto" />

      {/* Alert Container */}
      {currentTip && (
        <div
          className={`${getAnimationClass()} overflow-visible`}
          style={{ animationDuration: '0.5s', animationFillMode: 'forwards' }}
        >
          <div
            className={`px-8 py-8 flex flex-col items-center justify-start text-center overflow-visible ${getTierClasses()}`}
            style={{ width: 'min(512px, 100vw)', height: 'min(512px, 100vh)' }}
          >
            {getMediaNode()}

            <div className="mt-6 max-w-full text-white text-outline text-[28px] font-semibold leading-tight break-words">
              {currentTip.supporter_name} tipped ৳{Number(currentTip.amount).toLocaleString()}!
            </div>

            {settings.show_message && currentTip.message && (
              <div className="mt-3 max-w-full text-white/95 text-outline text-[20px] font-medium leading-snug break-words">
                {currentTip.message}
              </div>
            )}
          </div>
        </div>
      )}

      {isDebug && (
        <div
          style={{
            position: 'fixed',
            right: 12,
            bottom: 12,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 12,
            width: 320,
            color: 'white',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Debug Alerts</div>
          <input
            value={debugName}
            onChange={(e) => setDebugName(e.target.value)}
            placeholder="Supporter name"
            style={{
              width: '100%',
              marginBottom: 8,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
            }}
          />
          <input
            type="number"
            value={debugAmount}
            onChange={(e) => setDebugAmount(Number(e.target.value))}
            placeholder="Amount"
            style={{
              width: '100%',
              marginBottom: 8,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
            }}
          />
          <input
            value={debugMessage}
            onChange={(e) => setDebugMessage(e.target.value)}
            placeholder="Message (optional)"
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={triggerDebugAlert}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Trigger
            </button>
            <button
              onClick={() => stopCurrentAlert({ clearQueue: true })}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      {settings.custom_css && (
        <style>{settings.custom_css}</style>
      )}

      {/* Animation Styles */}
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        body {
          background: transparent !important;
        }
        
        .shadow-glow {
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2);
        }

        .text-outline {
          text-shadow:
            0 2px 0 rgba(0, 0, 0, 0.9),
            0 -2px 0 rgba(0, 0, 0, 0.9),
            2px 0 0 rgba(0, 0, 0, 0.9),
            -2px 0 0 rgba(0, 0, 0, 0.9),
            2px 2px 0 rgba(0, 0, 0, 0.9),
            -2px -2px 0 rgba(0,  0, 0, 0.9),
            2px -2px 0 rgba(0, 0, 0, 0.9),
            -2px 2px 0 rgba(0, 0, 0, 0.9);
        }
        
        @keyframes slide-in-alert {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce-in-alert {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-alert {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes pop-in-alert {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          80% {
            transform: scale(1.1) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes fade-out-alert {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        .animate-slide-in-alert {
          animation-name: slide-in-alert;
        }
        .animate-bounce-in-alert {
          animation-name: bounce-in-alert;
        }
        .animate-fade-in-alert {
          animation-name: fade-in-alert;
        }
        .animate-pop-in-alert {
          animation-name: pop-in-alert;
        }
        .animate-fade-out-alert {
          animation-name: fade-out-alert;
        }
      `}</style>
    </div>
  );
}
