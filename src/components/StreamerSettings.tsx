import { useState, useEffect, useRef } from "react";
import { useStreamerSettings } from "@/hooks/useStreamerSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Video, 
  Copy, 
  Check, 
  RefreshCw, 
  Play, 
  Square,
  Volume2, 
  VolumeX,
  Eye,
  Clock,
  MessageSquare,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Upload,
  Trash,
  Music,
  AlertTriangle,
  Image,
  Settings2,
  Palette,
  Code,
  Coins
} from "lucide-react";
import { AlertPreview } from "@/components/AlertPreview";
import { TipSoundManager } from "@/components/streamer/TipSoundManager";

export function StreamerSettings() {
  const { 
    settings, 
    tipSounds,
    approvedGifs,
    APPROVED_SOUNDS,
    loading, 
    saving,
    uploadingSound,
    detectingGifDuration,
    enableStreamerMode, 
    disableStreamerMode, 
    updateSettings,
    regenerateToken,
    toggleEmergencyMute,
    addTipSound,
    removeTipSound,
    updateTipSound,
    uploadAlertSound,
    uploadTipSound,
    uploadTipGif,
    detectGifDuration,
    deleteAlertSound,
    getAlertUrl 
  } = useStreamerSettings();
  
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [playingSoundUrl, setPlayingSoundUrl] = useState<string | null>(null);
  const previewCleanupRef = useRef<(() => void) | null>(null);
  
  type AnimationType = 'slide' | 'bounce' | 'fade' | 'pop';
  
  const [localSettings, setLocalSettings] = useState<{
    alert_duration: number;
    alert_animation: AnimationType;
    alert_media_type: 'emoji' | 'gif' | 'none';
    alert_emoji: string;
    alert_gif_url: string;
    match_gif_duration: boolean;
    custom_gif_duration_seconds: number | null;
    min_amount_for_alert: number;
    show_message: boolean;
    sound_enabled: boolean;
    custom_css: string;
    tts_enabled: boolean;
    tts_voice: string;
    tts_rate: number;
    tts_pitch: number;
    sounds_paused: boolean;
    gifs_paused: boolean;
    gif_enabled: boolean;
    gif_id: string | null;
    gif_position: string;
  }>({
    alert_duration: settings?.alert_duration ?? 5,
    alert_animation: (settings?.alert_animation as AnimationType) ?? 'slide',
    alert_media_type: (settings?.alert_media_type as any) ?? 'emoji',
    alert_emoji: settings?.alert_emoji ?? '🎉',
    alert_gif_url: settings?.alert_gif_url ?? '',
    match_gif_duration: settings?.match_gif_duration ?? true,
    custom_gif_duration_seconds: settings?.custom_gif_duration_seconds ?? null,
    min_amount_for_alert: settings?.min_amount_for_alert ?? 0,
    show_message: settings?.show_message ?? true,
    sound_enabled: settings?.sound_enabled ?? true,
    custom_css: settings?.custom_css ?? '',
    tts_enabled: settings?.tts_enabled ?? false,
    tts_voice: settings?.tts_voice ?? 'default',
    tts_rate: settings?.tts_rate ?? 1.0,
    tts_pitch: settings?.tts_pitch ?? 1.0,
    sounds_paused: settings?.sounds_paused ?? false,
    gifs_paused: settings?.gifs_paused ?? false,
    gif_enabled: settings?.gif_enabled ?? false,
    gif_id: settings?.gif_id ?? null,
    gif_position: settings?.gif_position ?? 'center',
  });

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

  // Update local settings when server settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        alert_duration: settings.alert_duration ?? 5,
        alert_animation: (settings.alert_animation as AnimationType) ?? 'slide',
        alert_media_type: (settings.alert_media_type as any) ?? 'emoji',
        alert_emoji: settings.alert_emoji ?? '🎉',
        alert_gif_url: settings.alert_gif_url ?? '',
        match_gif_duration: settings.match_gif_duration ?? true,
        custom_gif_duration_seconds: settings.custom_gif_duration_seconds ?? null,
        min_amount_for_alert: settings.min_amount_for_alert ?? 0,
        show_message: settings.show_message ?? true,
        sound_enabled: settings.sound_enabled ?? true,
        custom_css: settings.custom_css ?? '',
        tts_enabled: settings.tts_enabled ?? false,
        tts_voice: settings.tts_voice ?? 'default',
        tts_rate: settings.tts_rate ?? 1.0,
        tts_pitch: settings.tts_pitch ?? 1.0,
        sounds_paused: settings.sounds_paused ?? false,
        gifs_paused: settings.gifs_paused ?? false,
        gif_enabled: settings.gif_enabled ?? false,
        gif_id: settings.gif_id ?? null,
        gif_position: settings.gif_position ?? 'center',
      });
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="tipkoro-card animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/3 mb-4" />
        <div className="h-24 bg-secondary rounded" />
      </div>
    );
  }

  const alertUrl = getAlertUrl();

  const copyUrl = () => {
    if (alertUrl) {
      navigator.clipboard.writeText(alertUrl);
      setCopied(true);
      toast({ title: "Copied!", description: "Alert URL copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSettings = async () => {
    await updateSettings(localSettings);
  };

  const openInNewTab = () => {
    if (alertUrl) {
      window.open(alertUrl, '_blank');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAlertSound(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopPreviewSound = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
      audioPreviewRef.current.onended = null;
    }
    setPlayingSoundUrl(null);
    const cleanup = previewCleanupRef.current;
    previewCleanupRef.current = null;
    cleanup?.();
  };

  const playPreviewSound = (url: string, onStopCleanup?: () => void) => {
    stopPreviewSound();
    if (!audioPreviewRef.current) return;

    previewCleanupRef.current = onStopCleanup ?? null;
    audioPreviewRef.current.src = url;
    audioPreviewRef.current.currentTime = 0;
    setPlayingSoundUrl(url);
    audioPreviewRef.current.play().catch(() => {});
    audioPreviewRef.current.onended = () => stopPreviewSound();
  };

  const testTTS = () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "TTS Not Supported",
        description: "Your browser doesn't support Text-to-Speech",
        variant: "destructive"
      });
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Omar Ali tipped 500 taka. Love your content, keep going!");
    
    if (localSettings.tts_voice && localSettings.tts_voice !== 'default') {
      const selectedVoice = voices.find(v => v.name === localSettings.tts_voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    utterance.rate = localSettings.tts_rate;
    utterance.pitch = localSettings.tts_pitch;
    
    speechSynthesis.speak(utterance);
  };

  const defaultSoundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
  const selectedGif = approvedGifs.find(g => g.id === localSettings.gif_id);

  return (
    <div className="space-y-6">
      {/* Hidden audio element for previews */}
      <audio ref={audioPreviewRef} preload="auto" />

      {/* Emergency Controls - Always visible when enabled */}
      {settings?.is_enabled && (
        <div className={`tipkoro-card ${settings.emergency_mute ? 'border-destructive bg-destructive/10' : 'border-amber-500/50 bg-amber-500/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${settings.emergency_mute ? 'bg-destructive/20' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={`w-6 h-6 ${settings.emergency_mute ? 'text-destructive' : 'text-amber-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold">Emergency Mute</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.emergency_mute ? 'All alerts are silenced!' : 'Instantly silence all alerts during stream'}
                </p>
              </div>
            </div>
            <Button 
              variant={settings.emergency_mute ? "destructive" : "outline"}
              onClick={toggleEmergencyMute}
              disabled={saving}
              className="min-w-[100px]"
            >
              {settings.emergency_mute ? 'Unmute All' : 'Mute All'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Toggle Card */}
      <div className="tipkoro-card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <Video className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Streamer Mode</h2>
              <p className="text-sm text-muted-foreground">
                Show animated tip alerts on your stream
              </p>
            </div>
          </div>
          
          <Switch
            checked={settings?.is_enabled || false}
            onCheckedChange={(checked) => {
              if (checked) {
                enableStreamerMode();
              } else {
                disableStreamerMode();
              }
            }}
            disabled={saving}
          />
        </div>

        {/* Setup Instructions - Only when disabled */}
        {!settings?.is_enabled && (
          <div className="p-4 bg-secondary/50 rounded-xl">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Quick Start Guide
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Enable Streamer Mode to get a unique alert URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Add it as a Browser Source in OBS (400x200 recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>When you receive tips, animated alerts appear on stream!</span>
              </li>
            </ol>
          </div>
        )}

        {/* Alert URL Section - Only when enabled */}
        {settings?.is_enabled && alertUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
              <Label className="text-sm font-medium mb-2 block">Your Alert URL</Label>
              <div className="flex gap-2">
                <Input 
                  value={alertUrl} 
                  readOnly 
                  className="font-mono text-sm bg-background"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyUrl}
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={openInNewTab}
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add this URL as a Browser Source in OBS/Streamlabs. <strong>This URL stays the same</strong> even when you toggle Streamer Mode off and on.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Preview Alert
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={regenerateToken}
                disabled={saving}
                className="gap-2 text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate URL
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Tabs - Only show when enabled */}
      {settings?.is_enabled && (
        <div className="tipkoro-card">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic" className="gap-2">
                <Settings2 className="w-4 h-4 hidden sm:block" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="sounds" className="gap-2">
                <Volume2 className="w-4 h-4 hidden sm:block" />
                Sounds
              </TabsTrigger>
              <TabsTrigger value="visuals" className="gap-2">
                <Palette className="w-4 h-4 hidden sm:block" />
                Visuals
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <Code className="w-4 h-4 hidden sm:block" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  Animation Style
                </Label>
                <Select 
                  value={localSettings.alert_animation}
                  onValueChange={(value: AnimationType) => 
                    setLocalSettings(s => ({ ...s, alert_animation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slide">Slide In</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="fade">Fade In</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How the alert enters the screen</p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Alert Duration
                  </span>
                  <span className="text-sm font-medium bg-secondary px-2 py-1 rounded">
                    {localSettings.alert_duration}s
                  </span>
                </Label>
                <Slider
                  value={[localSettings.alert_duration]}
                  onValueChange={([value]) => 
                    setLocalSettings(s => ({ ...s, alert_duration: value }))
                  }
                  min={3}
                  max={15}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">How long the alert stays visible</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  Minimum Amount for Alert
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">৳</span>
                  <Input 
                    type="number"
                    value={localSettings.min_amount_for_alert}
                    onChange={(e) => 
                      setLocalSettings(s => ({ ...s, min_amount_for_alert: Number(e.target.value) }))
                    }
                    min={0}
                    className="w-32"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set to 0 to show all tips. Tips below this amount won't trigger alerts.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Show Message
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Display the tip message on alerts</p>
                </div>
                <Switch
                  checked={localSettings.show_message}
                  onCheckedChange={(checked) => 
                    setLocalSettings(s => ({ ...s, show_message: checked }))
                  }
                />
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Basic Settings"}
              </Button>
            </TabsContent>

            {/* Sounds Tab */}
            <TabsContent value="sounds" className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    {localSettings.sound_enabled ? (
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                    Sound Enabled
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Play sounds when alerts appear</p>
                </div>
                <Switch
                  checked={localSettings.sound_enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(s => ({ ...s, sound_enabled: checked }))
                  }
                />
              </div>

              {/* Default Alert Sound */}
              <div className="space-y-3 p-4 border border-border rounded-xl">
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  Default Alert Sound
                </Label>
                
                {settings?.alert_sound ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (playingSoundUrl === settings.alert_sound) stopPreviewSound();
                          else playPreviewSound(settings.alert_sound!);
                        }}
                        className="gap-2"
                      >
                        {playingSoundUrl === settings.alert_sound ? (
                          <>
                            <Square className="w-4 h-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={deleteAlertSound}
                        disabled={saving}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Using custom sound</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (playingSoundUrl === defaultSoundUrl) stopPreviewSound();
                          else playPreviewSound(defaultSoundUrl);
                        }}
                        className="gap-2"
                      >
                        {playingSoundUrl === defaultSoundUrl ? (
                          <>
                            <Square className="w-4 h-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Preview Default
                          </>
                        )}
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/ogg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingSound}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingSound ? "Uploading..." : "Upload Custom Sound"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Max 5MB. MP3, WAV, or OGG format.</p>
                  </div>
                )}
              </div>

              {/* Tip-to-Play Sounds Manager */}
              <TipSoundManager
                tipSounds={tipSounds}
                approvedGifs={approvedGifs}
                approvedSounds={APPROVED_SOUNDS}
                onAdd={addTipSound}
                onRemove={removeTipSound}
                onUpdate={updateTipSound}
                onUploadSound={async (file) => {
                  const res = await uploadTipSound(file);
                  return res as any;
                }}
                onUploadGif={async (file) => {
                  const res = await uploadTipGif(file);
                  return res as any;
                }}
                onDetectGifDuration={async (url) => {
                  const res = await detectGifDuration(url);
                  return res as any;
                }}
                isLoading={loading}
              />

              {/* TTS Settings */}
              <div className="space-y-4 p-4 border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Mic className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Text-to-Speech (TTS)</h4>
                      <p className="text-sm text-muted-foreground">Read tip messages aloud</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.tts_enabled}
                    onCheckedChange={(checked) => 
                      setLocalSettings(s => ({ ...s, tts_enabled: checked }))
                    }
                  />
                </div>
                
                {localSettings.tts_enabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Voice</Label>
                      <Select 
                        value={localSettings.tts_voice}
                        onValueChange={(value) => 
                          setLocalSettings(s => ({ ...s, tts_voice: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          {voices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Speed</span>
                        <span className="text-muted-foreground">{localSettings.tts_rate.toFixed(1)}x</span>
                      </Label>
                      <Slider
                        value={[localSettings.tts_rate]}
                        onValueChange={([value]) => 
                          setLocalSettings(s => ({ ...s, tts_rate: value }))
                        }
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Pitch</span>
                        <span className="text-muted-foreground">{localSettings.tts_pitch.toFixed(1)}</span>
                      </Label>
                      <Slider
                        value={[localSettings.tts_pitch]}
                        onValueChange={([value]) => 
                          setLocalSettings(s => ({ ...s, tts_pitch: value }))
                        }
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={testTTS}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Test TTS
                    </Button>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Sound Settings"}
              </Button>
            </TabsContent>

            {/* Visuals Tab */}
            <TabsContent value="visuals" className="space-y-6">
              {/* Default Alert Media */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Default Alert Media
                </Label>
                <Select
                  value={localSettings.alert_media_type}
                  onValueChange={(value: 'emoji' | 'gif' | 'none') =>
                    setLocalSettings(s => ({ ...s, alert_media_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emoji">Emoji</SelectItem>
                    <SelectItem value="gif">Custom GIF URL</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">
                  Used as the default media. If “Library GIF Alerts” is enabled below, the selected library GIF will be shown instead.
                </p>

                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <Label className="text-sm">Match Media Duration</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      End the alert when the GIF ends (uses library duration or your custom duration)
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.match_gif_duration}
                    onCheckedChange={(checked) =>
                      setLocalSettings(s => ({ ...s, match_gif_duration: checked }))
                    }
                  />
                </div>

                {localSettings.alert_media_type === 'emoji' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Emoji</Label>
                    <Input
                      value={localSettings.alert_emoji}
                      onChange={(e) => setLocalSettings(s => ({ ...s, alert_emoji: e.target.value }))}
                      placeholder="🎉"
                      className="w-24 text-center text-2xl"
                    />
                  </div>
                )}

                {localSettings.alert_media_type === 'gif' && (
                  <div className="space-y-2">
                    <Label className="text-sm">GIF URL</Label>
                    <Input
                      value={localSettings.alert_gif_url}
                      onChange={(e) => setLocalSettings(s => ({ ...s, alert_gif_url: e.target.value }))}
                      placeholder="https://.../alert.gif"
                    />
                    {localSettings.match_gif_duration && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label className="text-sm text-muted-foreground">GIF duration (seconds)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          step={0.01}
                          value={localSettings.custom_gif_duration_seconds ?? ''}
                          onChange={(e) =>
                            setLocalSettings(s => ({
                              ...s,
                              custom_gif_duration_seconds: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={detectingGifDuration || !localSettings.alert_gif_url?.trim()}
                          onClick={async () => {
                            const url = localSettings.alert_gif_url.trim();
                            const res = await detectGifDuration(url);
                            if ((res as any)?.data?.seconds) {
                              const seconds = Number((res as any).data.seconds.toFixed(2));
                              setLocalSettings(s => ({ ...s, custom_gif_duration_seconds: seconds }));
                              toast({ title: "GIF duration detected", description: `${seconds}s` });
                            } else {
                              toast({ title: "Couldn't detect GIF duration", description: (res as any)?.error ?? 'Failed', variant: "destructive" });
                            }
                          }}
                        >
                          {detectingGifDuration ? "Detecting..." : "Detect"}
                        </Button>
                      </div>
                    )}
                    {localSettings.alert_gif_url?.startsWith('http') && (
                      <div className="flex items-center justify-center p-3 bg-background rounded-xl border border-border">
                        <img
                          src={localSettings.alert_gif_url}
                          alt="GIF preview"
                          className="w-16 h-16 object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GIF Alerts */}
              <div className="space-y-4 p-4 border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-500/10">
                      <Image className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Library GIF Alerts</h4>
                      <p className="text-sm text-muted-foreground">Use a built-in GIF from our library (overrides Default Alert Media)</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.gif_enabled}
                    onCheckedChange={(checked) => 
                      setLocalSettings(s => ({ ...s, gif_enabled: checked }))
                    }
                  />
                </div>

                {localSettings.gif_enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Select GIF</Label>
                      <Select 
                        value={localSettings.gif_id || ''} 
                        onValueChange={(value) => setLocalSettings(s => ({ ...s, gif_id: value || null }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a GIF" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedGifs.map((gif) => (
                            <SelectItem key={gif.id} value={gif.id}>
                              {gif.name} ({gif.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedGif && (
                      <div className="flex items-center justify-center p-4 bg-secondary/50 rounded-xl">
                        <img
                          src={selectedGif.url}
                          alt={selectedGif.name}
                          className="w-20 h-20 object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <Label className="text-sm text-muted-foreground">Pause GIFs</Label>
                      <Switch
                        checked={localSettings.gifs_paused}
                        onCheckedChange={(checked) => 
                          setLocalSettings(s => ({ ...s, gifs_paused: checked }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Visual Settings"}
              </Button>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              {/* Custom CSS */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-muted-foreground" />
                  Custom CSS
                </Label>
                <Textarea
                  value={localSettings.custom_css}
                  onChange={(e) => 
                    setLocalSettings(s => ({ ...s, custom_css: e.target.value }))
                  }
                  placeholder=".alert-container { background: rgba(0,0,0,0.8); }"
                  className="font-mono text-xs h-32"
                />
                <p className="text-xs text-muted-foreground">
                  Override default styles with your own CSS
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Advanced Settings"}
              </Button>

              {/* OBS Setup Guide */}
              <div className="p-4 border border-border rounded-xl">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  OBS Setup Guide
                </h4>
                <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                  <li>In OBS, click <span className="text-foreground font-medium">+</span> under Sources and select <span className="text-foreground font-medium">Browser</span></li>
                  <li>Paste your Alert URL in the URL field</li>
                  <li>Set width to <span className="text-foreground font-medium">400</span> and height to <span className="text-foreground font-medium">200</span> (or larger)</li>
                  <li>Check "Shutdown source when not visible" for better performance</li>
                  <li>Position the overlay where you want alerts to appear</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Preview Dialog */}
      <AlertPreview 
        open={previewOpen} 
        onOpenChange={setPreviewOpen}
        animation={localSettings.alert_animation}
        duration={localSettings.alert_duration}
        mediaType={localSettings.alert_media_type}
        emoji={localSettings.alert_emoji}
        gifUrl={localSettings.alert_gif_url}
        showMessage={localSettings.show_message}
        soundEnabled={localSettings.sound_enabled}
        soundUrl={settings?.alert_sound || defaultSoundUrl}
      />
    </div>
  );
}
