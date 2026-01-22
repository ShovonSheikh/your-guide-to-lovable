import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmbedCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName?: string;
}

type EmbedType = "button" | "widget" | "banner";

export function EmbedCodeDialog({ open, onOpenChange, username, displayName }: EmbedCodeDialogProps) {
  const [activeTab, setActiveTab] = useState<EmbedType>("button");
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/${username}`;
  const embedUrl = `${baseUrl}/embed/${username}`;
  const name = displayName || username;

  const embedCodes: Record<EmbedType, { code: string; description: string }> = {
    button: {
      description: "A simple styled button that links to your TipKoro profile",
      code: `<!-- TipKoro Support Button -->
<a href="${profileUrl}" 
   target="_blank" 
   rel="noopener noreferrer"
   style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-family: system-ui, sans-serif; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4); transition: transform 0.2s, box-shadow 0.2s;"
   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(245, 158, 11, 0.5)';"
   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(245, 158, 11, 0.4)';">
  ❤️ Support ${name} on TipKoro
</a>`,
    },
    widget: {
      description: "An embeddable widget showing your tip card",
      code: `<!-- TipKoro Embed Widget -->
<iframe 
  src="${embedUrl}" 
  width="320" 
  height="180" 
  frameborder="0" 
  scrolling="no"
  style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
</iframe>`,
    },
    banner: {
      description: "A larger promotional banner for your website",
      code: `<!-- TipKoro Support Banner -->
<div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; font-family: system-ui, sans-serif;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-size: 32px;">☕</span>
    <div>
      <p style="margin: 0; font-weight: 600; color: #92400e;">Support ${name}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #a16207;">Your tips help me create more content!</p>
    </div>
  </div>
  <a href="${profileUrl}" 
     target="_blank" 
     rel="noopener noreferrer"
     style="padding: 10px 20px; background: #d97706; color: white; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 10px;">
    Send a Tip ❤️
  </a>
</div>`,
    },
  };

  const copyCode = () => {
    navigator.clipboard.writeText(embedCodes[activeTab].code);
    setCopied(true);
    toast({ title: "Code copied!", description: "Embed code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            Embed Widget Code
          </DialogTitle>
          <DialogDescription>
            Add a TipKoro widget to your website or blog
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmbedType)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="button">Button</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
          </TabsList>

          {(["button", "widget", "banner"] as EmbedType[]).map((type) => (
            <TabsContent key={type} value={type} className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {embedCodes[type].description}
              </p>

              {/* Preview */}
              <Card className="p-6 bg-muted/30 overflow-auto">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Preview</p>
                <div 
                  className="flex justify-center"
                  dangerouslySetInnerHTML={{ __html: embedCodes[type].code }}
                />
              </Card>

              {/* Code */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">HTML Code</p>
                  <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <pre className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap break-all">
                  {embedCodes[type].code}
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Paste this code into your website's HTML
          </p>
          <a 
            href={profileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View your profile <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
