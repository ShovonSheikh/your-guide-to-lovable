import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TipData {
  id: string;
  supporter_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
}

interface StreamerSettings {
  profile_id: string;
  alert_duration: number;
  alert_animation: 'slide' | 'bounce' | 'fade' | 'pop';
  alert_sound: string | null;
  alert_media_type?: 'emoji' | 'gif' | 'none' | null;
  alert_emoji?: string | null;
  alert_gif_url?: string | null;
  min_amount_for_alert: number;
  show_message: boolean;
  sound_enabled: boolean;
  custom_css: string | null;
  tts_enabled: boolean;
  tts_voice: string;
  tts_rate: number;
  tts_pitch: number;
}

const DEFAULT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function StreamerAlert() {
  const { token } = useParams<{ token: string }>();
  const [settings, setSettings] = useState<StreamerSettings | null>(null);
  const [currentTip, setCurrentTip] = useState<TipData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

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
        .select('profile_id, alert_duration, alert_animation, alert_sound, alert_media_type, alert_emoji, alert_gif_url, min_amount_for_alert, show_message, sound_enabled, custom_css, tts_enabled, tts_voice, tts_rate, tts_pitch')
        .eq('alert_token', token)
        .eq('is_enabled', true)
        .single();

      if (error || !data) {
        setError('Invalid or disabled alert URL');
        return;
      }

      const normalized: StreamerSettings = {
        ...(data as any),
        min_amount_for_alert: Number((data as any).min_amount_for_alert) || 0,
        tts_enabled: Boolean((data as any).tts_enabled),
        tts_voice: (data as any).tts_voice ?? 'default',
        tts_rate: Number((data as any).tts_rate) || 1,
        tts_pitch: Number((data as any).tts_pitch) || 1,
        alert_media_type: ((data as any).alert_media_type ?? 'emoji') as any,
        alert_emoji: (data as any).alert_emoji ?? '🎉',
        alert_gif_url: (data as any).alert_gif_url ?? null,
      };

      setSettings(normalized);
    };

    fetchSettings();
    const intervalId = setInterval(fetchSettings, 10_000);
    return () => clearInterval(intervalId);
  }, [token]);

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
          
          // Check minimum amount
          if (amount < minAmount) {
             if (isDebug) console.log('StreamerAlert: Tip ignored (below min amount)');
             return;
          }

          if (isDebug) console.log('StreamerAlert: Triggering alert!');

          // Show the alert
          showAlert({
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
  }, [settings]);

  const speakTip = (tip: TipData) => {
    if (!settings?.tts_enabled) return;
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
  };

  const showAlert = (tip: TipData) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCurrentTip(tip);
    setIsVisible(true);

    // Play sound
    if (settings?.sound_enabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Speak tip after a short delay (let sound play first)
    if (settings?.tts_enabled) {
      setTimeout(() => speakTip(tip), 500);
    }

    // Hide after duration
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentTip(null), 500); // Wait for exit animation
    }, (settings?.alert_duration || 5) * 1000);
  };

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

  // Get sound URL (custom or default)
  const soundUrl = settings?.alert_sound || DEFAULT_SOUND_URL;

  const getMediaNode = () => {
    const mediaType = settings?.alert_media_type ?? 'emoji';
    if (mediaType === 'none') return null;
    if (mediaType === 'gif') {
      const url = settings?.alert_gif_url;
      const isValid = typeof url === 'string' && /^https:\/\//i.test(url);
      if (!isValid) return <div className="text-4xl mb-2">🎉</div>;
      return (
        <img
          src={url}
          alt="Alert"
          className="w-16 h-16 object-contain mx-auto mb-2"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      );
    }
    const emoji = (settings?.alert_emoji ?? '🎉').trim();
    return <div className="text-4xl mb-2">{emoji || '🎉'}</div>;
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
    <div className="min-h-screen flex items-center justify-center bg-transparent overflow-hidden">
      {/* Audio for notification sound */}
      <audio ref={audioRef} preload="auto" src={soundUrl} />

      {/* Alert Container */}
      {currentTip && (
        <div 
          className={`${getAnimationClass()}`}
          style={{ animationDuration: '0.5s', animationFillMode: 'forwards' }}
        >
          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-2xl p-6 text-white shadow-2xl min-w-[300px] max-w-[400px]">
            <div className="text-center">
              {getMediaNode()}
              <div className="text-lg font-bold mb-2 tracking-wide">NEW TIP!</div>
              
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {currentTip.supporter_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-lg">{currentTip.supporter_name}</span>
              </div>
              
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                tipped ৳{Number(currentTip.amount).toLocaleString()}!
              </div>
              
              {settings.show_message && currentTip.message && (
                <div className="mt-4 text-sm text-white/90 italic px-4 py-2 bg-white/10 rounded-xl">
                  "{currentTip.message}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      {settings.custom_css && (
        <style>{settings.custom_css}</style>
      )}

      {/* Animation Styles */}
      <style>{`
        body {
          background: transparent !important;
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
