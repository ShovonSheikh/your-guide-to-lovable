import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Share2, QrCode, Code2, Link2, Target, MoreHorizontal, Video } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { BioLinkDialog } from "@/components/BioLinkDialog";
import { EmbedCodeDialog } from "@/components/EmbedCodeDialog";
import { FundingGoalDialog } from "@/components/FundingGoalDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Actions */}
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
          
          <Button variant="outline" size="sm" onClick={shareProfile} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          {/* Secondary Actions in Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="w-4 h-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setQrOpen(true)} className="gap-2 cursor-pointer">
                <QrCode className="w-4 h-4" />
                QR Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEmbedOpen(true)} className="gap-2 cursor-pointer">
                <Code2 className="w-4 h-4" />
                Embed Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBioLinksOpen(true)} className="gap-2 cursor-pointer">
                <Link2 className="w-4 h-4" />
                Bio Links
              </DropdownMenuItem>
              {profileId && (
                <DropdownMenuItem onClick={() => setGoalsOpen(true)} className="gap-2 cursor-pointer">
                  <Target className="w-4 h-4" />
                  Funding Goals
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <Link to="/settings?tab=streamer">
                  <Video className="w-4 h-4" />
                  Streamer Mode
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          username={username}
          displayName={displayName}
        />
      )}
    </>
  );
}
