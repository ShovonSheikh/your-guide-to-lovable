import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, Instagram, Twitter, Youtube, Globe, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BioLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName?: string;
}

interface BioTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  template: string;
}

export function BioLinkDialog({ open, onOpenChange, username, displayName }: BioLinkDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const profileUrl = `${window.location.origin}/${username}`;
  const name = displayName || username;

  const templates: BioTemplate[] = [
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="w-4 h-4" />,
      template: `Support my work ❤️\n${profileUrl}`,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: <Twitter className="w-4 h-4" />,
      template: `Send me a tip! 🎉 ${profileUrl}`,
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: <Youtube className="w-4 h-4" />,
      template: `☕ Tip me on TipKoro: ${profileUrl}`,
    },
    {
      id: "linktree",
      name: "Link in Bio",
      icon: <Link2 className="w-4 h-4" />,
      template: `💖 Support ${name}\n${profileUrl}`,
    },
    {
      id: "generic",
      name: "Generic",
      icon: <Globe className="w-4 h-4" />,
      template: `Support me on TipKoro!\n${profileUrl}`,
    },
  ];

  const copyTemplate = (template: BioTemplate) => {
    navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    toast({ 
      title: "Copied!", 
      description: `${template.name} bio link copied to clipboard.` 
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Social Bio Links
          </DialogTitle>
          <DialogDescription>
            Copy pre-formatted links for your social media bios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => copyTemplate(template)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{template.name}</p>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono bg-muted/50 p-2 rounded">
                      {template.template}
                    </pre>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyTemplate(template);
                  }}
                >
                  {copiedId === template.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Click any template to copy it to your clipboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
