import { useState, useRef, useEffect } from 'react';
import { 
  Coins, 
  Plus, 
  Play, 
  Square, 
  Trash, 
  Upload, 
  Music, 
  Image as ImageIcon, 
  X,
  Loader2,
  Clock,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TipSound, ApprovedGif } from '@/hooks/useStreamerSettings';
import { cn } from '@/lib/utils';

interface TipSoundManagerProps {
  tipSounds: TipSound[];
  approvedGifs: ApprovedGif[];
  approvedSounds: { amount: number; name: string; url: string; duration: number }[];
  onAdd: (
    triggerAmount: number,
    soundUrl: string,
    displayName: string,
    cooldownSeconds: number,
    media?: {
      media_type?: 'none' | 'library' | 'url' | 'upload';
      gif_id?: string | null;
      gif_url?: string | null;
      gif_duration_seconds?: number | null;
    }
  ) => Promise<any>;
  onRemove: (id: string) => Promise<any>;
  onUploadSound: (file: File) => Promise<{ data?: { publicUrl: string }; error?: string }>;
  onUploadGif: (file: File) => Promise<{ data?: { publicUrl: string }; error?: string }>;
  onDetectGifDuration: (url: string) => Promise<{ data?: { seconds: number; ceilSeconds: number }; error?: string }>;
  isLoading?: boolean;
}

export function TipSoundManager({
  tipSounds,
  approvedGifs,
  approvedSounds,
  onAdd,
  onRemove,
  onUploadSound,
  onUploadGif,
  onDetectGifDuration,
  isLoading
}: TipSoundManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [amount, setAmount] = useState<number>(50);
  const [soundSource, setSoundSource] = useState<'approved' | 'url' | 'upload'>('approved');
  const [selectedSoundUrl, setSelectedSoundUrl] = useState<string>('');
  const [customSoundUrl, setCustomSoundUrl] = useState('');
  const [soundName, setSoundName] = useState('');
  const [soundFile, setSoundFile] = useState<File | null>(null);

  const [visualSource, setVisualSource] = useState<'none' | 'library' | 'url' | 'upload'>('none');
  const [selectedGifId, setSelectedGifId] = useState<string>('');
  const [customGifUrl, setCustomGifUrl] = useState('');
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifDuration, setGifDuration] = useState<number | null>(null);
  const [detectingDuration, setDetectingDuration] = useState(false);

  const soundFileInputRef = useRef<HTMLInputElement>(null);
  const gifFileInputRef = useRef<HTMLInputElement>(null);

  // Stop audio when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopPreview();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setAmount(50);
    setSoundSource('approved');
    setSelectedSoundUrl('');
    setCustomSoundUrl('');
    setSoundName('');
    setSoundFile(null);
    setVisualSource('none');
    setSelectedGifId('');
    setCustomGifUrl('');
    setGifFile(null);
    setGifDuration(null);
  };

  const playPreview = (url: string) => {
    if (playingUrl === url) {
      stopPreview();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(url);
    audio.onended = () => setPlayingUrl(null);
    audio.play().catch(() => setPlayingUrl(null));
    audioRef.current = audio;
    setPlayingUrl(url);
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingUrl(null);
  };

  const handleSoundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSoundFile(file);
      setSoundName(file.name.split('.')[0]);
    }
  };

  const handleGifFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGifFile(file);
      // Try to detect duration? Client-side detection for file is hard without lib.
      // We'll rely on server detection after upload, or user input.
    }
  };

  const handleDetectDuration = async () => {
    if (!customGifUrl) return;
    setDetectingDuration(true);
    const result = await onDetectGifDuration(customGifUrl);
    setDetectingDuration(false);
    if (result.data) {
      setGifDuration(result.data.seconds);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalSoundUrl = '';
      let finalSoundName = soundName;

      // 1. Handle Sound
      if (soundSource === 'approved') {
        finalSoundUrl = selectedSoundUrl;
        const sound = approvedSounds.find(s => s.url === selectedSoundUrl);
        if (sound) finalSoundName = sound.name;
      } else if (soundSource === 'url') {
        finalSoundUrl = customSoundUrl;
      } else if (soundSource === 'upload' && soundFile) {
        const res = await onUploadSound(soundFile);
        if (res.error || !res.data) throw new Error(res.error || 'Sound upload failed');
        finalSoundUrl = res.data.publicUrl;
      }

      if (!finalSoundUrl) return;

      // 2. Handle Visuals
      let finalGifId: string | null = null;
      let finalGifUrl: string | null = null;
      let finalGifDuration: number | null = gifDuration;

      if (visualSource === 'library') {
        finalGifId = selectedGifId;
        const gif = approvedGifs.find(g => g.id === selectedGifId);
        if (gif) finalGifDuration = gif.duration_seconds; // Use library duration
      } else if (visualSource === 'url') {
        finalGifUrl = customGifUrl;
      } else if (visualSource === 'upload' && gifFile) {
        const res = await onUploadGif(gifFile);
        if (res.error || !res.data) throw new Error(res.error || 'GIF upload failed');
        finalGifUrl = res.data.publicUrl;
        
        // Auto-detect duration for uploaded GIF if not set
        if (!finalGifDuration && finalGifUrl) {
            const detectRes = await onDetectGifDuration(finalGifUrl);
            if (detectRes.data) finalGifDuration = detectRes.data.seconds;
        }
      }

      // 3. Add Rule
      await onAdd(
        amount,
        finalSoundUrl,
        finalSoundName || `Sound for ${amount}`,
        10,
        {
          media_type: visualSource,
          gif_id: finalGifId,
          gif_url: finalGifUrl,
          gif_duration_seconds: finalGifDuration
        }
      );

      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = () => {
    if (!amount) return false;
    if (soundSource === 'approved' && !selectedSoundUrl) return false;
    if (soundSource === 'url' && !customSoundUrl) return false;
    if (soundSource === 'upload' && !soundFile) return false;
    
    if (visualSource === 'library' && !selectedGifId) return false;
    if (visualSource === 'url' && !customGifUrl) return false;
    if (visualSource === 'upload' && !gifFile) return false;
    
    return true;
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-500" />
            Tip-to-Play Rules
          </CardTitle>
          <CardDescription>
            Customize sounds and visuals for specific tip amounts
          </CardDescription>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tip Rule</DialogTitle>
              <DialogDescription>
                Set a trigger amount and choose what happens when it's tipped.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Trigger */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Trigger Amount (BDT)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">৳</span>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="pl-8 text-lg font-semibold" 
                    min={1}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Alert triggers when this exact amount is tipped.</p>
              </div>

              {/* Sound Section */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Sound
                </Label>
                <Tabs value={soundSource} onValueChange={(v: any) => setSoundSource(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="approved">Library</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                  </TabsList>
                  
                  <div className="pt-4 p-1 min-h-[120px]">
                    <TabsContent value="approved" className="mt-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {approvedSounds.map((sound) => (
                          <div 
                            key={sound.url}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                              selectedSoundUrl === sound.url 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-border hover:bg-secondary/50"
                            )}
                            onClick={() => setSelectedSoundUrl(sound.url)}
                          >
                            <span className="text-sm font-medium">{sound.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                playPreview(sound.url);
                              }}
                            >
                              {playingUrl === sound.url ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-0 space-y-3">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://example.com/sound.mp3" 
                          value={customSoundUrl}
                          onChange={(e) => setCustomSoundUrl(e.target.value)}
                        />
                        {customSoundUrl && (
                          <Button variant="outline" size="icon" onClick={() => playPreview(customSoundUrl)}>
                             {playingUrl === customSoundUrl ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      <Input 
                        placeholder="Sound Name (e.g. Funny Horn)" 
                        value={soundName}
                        onChange={(e) => setSoundName(e.target.value)}
                      />
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0 space-y-3">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-secondary/50 transition-colors cursor-pointer"
                           onClick={() => soundFileInputRef.current?.click()}>
                        <input 
                          ref={soundFileInputRef}
                          type="file" 
                          accept="audio/*" 
                          className="hidden" 
                          onChange={handleSoundFileChange}
                        />
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">{soundFile ? soundFile.name : "Click to upload audio"}</p>
                        <p className="text-xs text-muted-foreground mt-1">MP3, WAV, OGG (Max 5MB)</p>
                      </div>
                      <Input 
                        placeholder="Sound Name" 
                        value={soundName}
                        onChange={(e) => setSoundName(e.target.value)}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Visuals Section (Optional) */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="visuals" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="text-base font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Visuals (Optional)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <Tabs value={visualSource} onValueChange={(v: any) => setVisualSource(v)} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="none">None</TabsTrigger>
                        <TabsTrigger value="library">Library</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                      </TabsList>

                      <div className="pt-4 p-1">
                        <TabsContent value="none" className="mt-0 text-center text-sm text-muted-foreground py-4">
                          No specific visual media. Will use default settings or global GIF.
                        </TabsContent>

                        <TabsContent value="library" className="mt-0">
                          <ScrollArea className="h-[200px] rounded-md border p-2">
                            <div className="grid grid-cols-3 gap-2">
                              {approvedGifs.map((gif) => (
                                <div 
                                  key={gif.id}
                                  className={cn(
                                    "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                                    selectedGifId === gif.id ? "border-primary" : "border-transparent hover:border-border"
                                  )}
                                  onClick={() => setSelectedGifId(gif.id)}
                                >
                                  <img src={gif.thumbnail_url || gif.url} alt={gif.name} className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white p-1 truncate">
                                    {gif.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="url" className="mt-0 space-y-3">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://media.giphy.com/..." 
                              value={customGifUrl}
                              onChange={(e) => setCustomGifUrl(e.target.value)}
                            />
                            {customGifUrl && (
                               <Button variant="outline" size="sm" onClick={handleDetectDuration} disabled={detectingDuration}>
                                 {detectingDuration ? <Loader2 className="w-4 h-4 animate-spin" /> : "Detect"}
                               </Button>
                            )}
                          </div>
                          {customGifUrl && (
                             <div className="relative aspect-video w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border bg-black/5">
                               <img src={customGifUrl} alt="Preview" className="w-full h-full object-contain" />
                             </div>
                          )}
                        </TabsContent>

                        <TabsContent value="upload" className="mt-0 space-y-3">
                           <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-secondary/50 transition-colors cursor-pointer"
                                onClick={() => gifFileInputRef.current?.click()}>
                            <input 
                              ref={gifFileInputRef}
                              type="file" 
                              accept="image/gif" 
                              className="hidden" 
                              onChange={handleGifFileChange}
                            />
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">{gifFile ? gifFile.name : "Click to upload GIF"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>

                    {/* Duration Input (Common for URL/Upload) */}
                    {(visualSource === 'url' || visualSource === 'upload') && (
                      <div className="mt-4 flex items-center gap-3">
                        <Label className="shrink-0 flex items-center gap-1.5 text-sm">
                          <Clock className="w-3.5 h-3.5" /> Duration (s)
                        </Label>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Auto"
                          value={gifDuration || ''} 
                          onChange={(e) => setGifDuration(e.target.value ? Number(e.target.value) : null)}
                          className="w-24 h-8"
                        />
                        <span className="text-xs text-muted-foreground">Optional</span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Rule'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {tipSounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tip rules configured yet.</p>
            <Button variant="link" onClick={() => setIsOpen(true)}>Add your first rule</Button>
          </div>
        ) : (
          <div className="space-y-2">
             {tipSounds.map((sound) => (
               <div key={sound.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow group">
                 <div className="flex items-center gap-4">
                   <Badge variant="outline" className="text-lg px-3 py-1 bg-secondary/50 border-primary/20">
                     ৳{sound.trigger_amount}
                   </Badge>
                   <div className="flex flex-col">
                     <span className="font-medium text-sm flex items-center gap-2">
                       {sound.display_name}
                     </span>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          {sound.sound_url ? 'Sound' : 'Muted'}
                        </span>
                        {(sound.media_type !== 'none' && (sound.gif_id || sound.gif_url)) && (
                           <span className="flex items-center gap-1 border-l pl-2 ml-1">
                             <ImageIcon className="w-3 h-3" />
                             {sound.media_type === 'library' ? 'Library GIF' : 'Custom GIF'}
                           </span>
                        )}
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-1">
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => playPreview(sound.sound_url)}
                    >
                      {playingUrl === sound.sound_url ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemove(sound.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
