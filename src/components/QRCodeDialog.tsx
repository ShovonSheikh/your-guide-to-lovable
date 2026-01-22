import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

type QRSize = "small" | "medium" | "large";

const sizeMap: Record<QRSize, number> = {
  small: 128,
  medium: 200,
  large: 300,
};

export function QRCodeDialog({ open, onOpenChange, username }: QRCodeDialogProps) {
  const [size, setSize] = useState<QRSize>("medium");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileUrl = `${window.location.origin}/${username}`;
  const qrSize = sizeMap[size];

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Profile URL copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl]);

  const downloadQR = useCallback(() => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Create canvas and draw SVG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 20;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      URL.revokeObjectURL(url);

      // Download
      const link = document.createElement("a");
      link.download = `tipkoro-${username}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({ title: "QR Code downloaded!", description: "Your QR code has been saved." });
    };
    img.src = url;
  }, [qrSize, username]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code Generator
          </DialogTitle>
          <DialogDescription>
            Share your profile with a scannable QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div 
            ref={qrRef}
            className="flex justify-center p-6 bg-white rounded-xl border border-border"
          >
            <QRCodeSVG
              value={profileUrl}
              size={qrSize}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Size</Label>
            <RadioGroup
              value={size}
              onValueChange={(v) => setSize(v as QRSize)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small" className="cursor-pointer">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large" className="cursor-pointer">Large</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Profile URL */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm text-muted-foreground truncate">
              {profileUrl}
            </code>
            <Button variant="ghost" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={downloadQR} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button variant="outline" onClick={copyLink} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
