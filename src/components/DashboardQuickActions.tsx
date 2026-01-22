import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, ImageIcon, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface DashboardQuickActionsProps {
  username: string | null | undefined;
}

export function DashboardQuickActions({ username }: DashboardQuickActionsProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = username 
    ? `${window.location.origin}/${username}` 
    : null;

  const copyProfileUrl = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Your profile URL has been copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareProfile = async () => {
    if (profileUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'Support me on TipKoro',
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        copyProfileUrl();
      }
    } else {
      copyProfileUrl();
    }
  };

  if (!username) return null;

  return (
    <div className="tipkoro-card mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copyProfileUrl} className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        
        <a href={profileUrl || '#'} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            View Profile
          </Button>
        </a>
        
        <Link to="/donation-image">
          <Button variant="outline" size="sm" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Create Image
          </Button>
        </Link>
        
        <Button variant="outline" size="sm" onClick={shareProfile} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
}