import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Download, Share2, Copy, Check, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FundingGoal } from "@/hooks/useFundingGoals";
import { toPng } from "html-to-image";

interface GoalShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: FundingGoal;
  username: string;
  displayName?: string;
}

export function GoalShareCard({ open, onOpenChange, goal, username, displayName }: GoalShareCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const profileUrl = `${window.location.origin}/${username}`;
  const name = displayName || username;

  const downloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `${username}-goal-${goal.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Image downloaded!", description: "Share it on your social media." });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Error", description: "Failed to generate image.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }, [goal.title, username]);

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share your profile link." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Help me reach my goal: ${goal.title}`,
          text: `I'm ${Math.round(progress)}% of the way to my goal! Support me on TipKoro.`,
          url: profileUrl,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Goal Progress
          </DialogTitle>
          <DialogDescription>
            Download or share your goal progress on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Card Preview */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className="w-[340px] p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/80 shadow-sm">
                  <Target className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Funding Goal</p>
                  <h3 className="font-bold text-amber-900 text-lg leading-tight">{goal.title}</h3>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white/90 rounded-xl p-4 shadow-sm mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-amber-900">{Math.round(progress)}%</span>
                  <span className="text-sm text-amber-700">
                    ৳{goal.current_amount.toLocaleString()} / ৳{goal.target_amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">{name}</p>
                  <p className="text-xs text-amber-700">@{username}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-amber-600 uppercase tracking-wider">Support me on</p>
                  <p className="text-sm font-bold text-amber-800">TipKoro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={downloadImage} 
              disabled={downloading}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating..." : "Download"}
            </Button>
            <Button 
              variant="outline" 
              onClick={shareNative}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              onClick={copyLink}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Share this card to let your supporters know about your progress!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
