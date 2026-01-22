import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Share2, QrCode, Code2, Link2, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { BioLinkDialog } from "@/components/BioLinkDialog";
import { EmbedCodeDialog } from "@/components/EmbedCodeDialog";
import { FundingGoalDialog } from "@/components/FundingGoalDialog";

interface DashboardQuickActionsProps {
  username: string | null | undefined;
  profileId?: string;
  displayName?: string;
}

export function DashboardQuickActions({ username, profileId, displayName }: DashboardQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [bioLinksOpen, setBioLinksOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);

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
    <>
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
          
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)} className="gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </Button>
          
          <Button variant="outline" size="sm" onClick={shareProfile} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setEmbedOpen(true)} className="gap-2">
            <Code2 className="w-4 h-4" />
            Embed
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setBioLinksOpen(true)} className="gap-2">
            <Link2 className="w-4 h-4" />
            Bio Links
          </Button>
          
          {profileId && (
            <Button variant="outline" size="sm" onClick={() => setGoalsOpen(true)} className="gap-2">
              <Target className="w-4 h-4" />
              Goals
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <QRCodeDialog 
        open={qrOpen} 
        onOpenChange={setQrOpen} 
        username={username} 
      />
      
      <BioLinkDialog 
        open={bioLinksOpen} 
        onOpenChange={setBioLinksOpen} 
        username={username}
        displayName={displayName}
      />
      
      <EmbedCodeDialog 
        open={embedOpen} 
        onOpenChange={setEmbedOpen} 
        username={username}
        displayName={displayName}
      />
      
      {profileId && (
        <FundingGoalDialog 
          open={goalsOpen} 
          onOpenChange={setGoalsOpen} 
          profileId={profileId}
        />
      )}
    </>
  );
}
