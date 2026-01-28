import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

interface AlertPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animation: 'slide' | 'bounce' | 'fade' | 'pop';
  duration: number;
  mediaType?: 'emoji' | 'gif' | 'none';
  emoji?: string;
  gifUrl?: string;
  showMessage: boolean;
  soundEnabled?: boolean;
  soundUrl?: string;
  ttsEnabled?: boolean;
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
}

export function AlertPreview({ 
  open, 
  onOpenChange, 
  animation, 
  duration, 
  mediaType = 'emoji',
  emoji = '🎉',
  gifUrl = '',
  showMessage,
  soundEnabled = true,
  soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  ttsEnabled = false,
  ttsVoice = 'default',
  ttsRate = 1,
  ttsPitch = 1,
}: AlertPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load TTS voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

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

  const getMediaNode = () => {
    if (mediaType === 'none') return null;
    if (mediaType === 'gif') {
      const isValid = typeof gifUrl === 'string' && /^https:\/\//i.test(gifUrl);
      if (!isValid) return <div className="text-3xl mb-2">🎉</div>;
      return (
        <img
          src={gifUrl}
          alt="Alert"
          className="w-14 h-14 object-contain mx-auto mb-2"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      );
    }
    const value = (emoji ?? '🎉').trim();
    return <div className="text-3xl mb-2">{value || '🎉'}</div>;
  };

  const playAnimation = () => {
    setIsPlaying(true);
    setKey(k => k + 1);

    // Play sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Play TTS after a short delay
    if (ttsEnabled && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
        } catch {
          return;
        }
        const utterance = new SpeechSynthesisUtterance("Omar Ali tipped 500 taka. Love your content, keep going!");
        
        if (ttsVoice && ttsVoice !== 'default') {
          const selectedVoice = voices.find(v => v.name === ttsVoice);
          if (selectedVoice) utterance.voice = selectedVoice;
        }
        
        utterance.rate = ttsRate;
        utterance.pitch = ttsPitch;
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
        }
      }, 500);
    }

    setTimeout(() => setIsPlaying(false), duration * 1000);
  };

  useEffect(() => {
    if (open) {
      // Auto-play on open
      setTimeout(playAnimation, 300);
    } else {
      // Cancel TTS when closing
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
        }
      }
    }
  }, [open]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'slide':
        return 'animate-slide-in-preview';
      case 'bounce':
        return 'animate-bounce-in-preview';
      case 'fade':
        return 'animate-fade-in-preview';
      case 'pop':
        return 'animate-pop-in-preview';
      default:
        return 'animate-slide-in-preview';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Alert Preview</DialogTitle>
        </DialogHeader>

        {/* Audio for preview */}
        <audio ref={audioRef} src={soundUrl} preload="auto" />

        {/* Preview Container */}
        <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden h-64 flex items-center justify-center">
          {/* Simulated Stream Background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
            <div className="absolute bottom-4 left-4 text-white/50 text-xs">
              Your Stream Here
            </div>
          </div>

          {/* Alert Component */}
          {isPlaying && (
            <div 
              key={key}
              className={`relative z-10 ${getAnimationClass()}`}
              style={{ 
                animationDuration: '0.5s',
                animationFillMode: 'forwards'
              }}
            >
              <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-white shadow-2xl min-w-[300px]">
                <div className="text-center">
                  {getMediaNode()}
                  <div className="text-lg font-bold mb-1">NEW TIP!</div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                      O
                    </div>
                    <span className="font-semibold">Omar Ali</span>
                  </div>
                  <div className="text-2xl font-bold text-white/90">
                    tipped ৳500!
                  </div>
                  {showMessage && (
                    <div className="mt-3 text-sm text-white/80 italic px-4">
                      "Love your content, keep going!"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isPlaying && (
            <div className="text-white/50 text-sm">
              Click "Play" to preview the alert
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2 pt-4">
          <Button onClick={playAnimation} className="gap-2">
            <Play className="w-4 h-4" />
            Play Alert
          </Button>
          <Button variant="outline" onClick={() => { speechSynthesis.cancel(); setKey(k => k + 1); }} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Duration: {duration}s • Animation: {animation}
          {soundEnabled && " • Sound"}{ttsEnabled && " • TTS"}
        </p>

        {/* Animation Styles */}
        <style>{`
          @keyframes slide-in-preview {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes bounce-in-preview {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            70% {
              transform: scale(0.95);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes fade-in-preview {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes pop-in-preview {
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
          
          .animate-slide-in-preview {
            animation-name: slide-in-preview;
          }
          .animate-bounce-in-preview {
            animation-name: bounce-in-preview;
          }
          .animate-fade-in-preview {
            animation-name: fade-in-preview;
          }
          .animate-pop-in-preview {
            animation-name: pop-in-preview;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
