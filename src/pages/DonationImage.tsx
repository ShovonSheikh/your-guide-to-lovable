import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Download, Share2, ArrowLeft, Heart, Sparkles } from "lucide-react";

interface PrefilledData {
  amount?: string;
  recipientName?: string;
  message?: string;
  senderName?: string;
}

export default function DonationImage() {
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading } = useProfile();
  const location = useLocation();
  const prefilledData = location.state as PrefilledData | null;

  const [amount, setAmount] = useState("100");
  const [supporterName, setSupporterName] = useState("");
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Pre-fill from tip success page
  useEffect(() => {
    if (prefilledData) {
      if (prefilledData.amount) setAmount(prefilledData.amount);
      if (prefilledData.recipientName) setSupporterName(prefilledData.recipientName);
      if (prefilledData.senderName) setSupporterName(prefilledData.senderName);
      if (prefilledData.message) setMessage(prefilledData.message);
    }
  }, [prefilledData]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1080;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circles
    ctx.beginPath();
    ctx.arc(900, 100, 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(100, 900, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.fill();

    // Heart icon
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💛', canvas.width / 2, 200);

    // TipKoro branding
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText('TipKoro', canvas.width / 2, 280);

    // "I received a tip!" text
    ctx.font = '32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(profile?.account_type === 'creator' ? 'I received a tip!' : 'I sent a tip!', canvas.width / 2, 360);

    // Amount
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`৳${amount}`, canvas.width / 2, 520);

    // From/To text
    if (supporterName) {
      ctx.font = '28px Arial';
      ctx.fillStyle = '#a0aec0';
      ctx.fillText(profile?.account_type === 'creator' ? 'from' : 'to', canvas.width / 2, 600);
      
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(supporterName, canvas.width / 2, 660);
    }

    // Message (if any)
    if (message) {
      ctx.font = 'italic 24px Arial';
      ctx.fillStyle = '#a0aec0';
      const maxWidth = canvas.width - 160;
      const words = message.split(' ');
      let line = '';
      let y = 750;
      
      ctx.fillText('"', 100, y);
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, canvas.width / 2, y);
          line = word + ' ';
          y += 35;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line + '"', canvas.width / 2, y);
    }

    // Creator/Supporter name
    const displayName = profile?.first_name 
      ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
      : profile?.username || 'Anonymous';
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayName, canvas.width / 2, 920);

    if (profile?.username) {
      ctx.font = '24px Arial';
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(`tipkoro.com/${profile.username}`, canvas.width / 2, 970);
    }

    // Footer
    ctx.font = '20px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Support creators with TipKoro', canvas.width / 2, 1040);

    // Convert to image
    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImage(dataUrl);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `tipkoro-donation-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: "Your donation image has been downloaded.",
    });
  };

  const shareImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'tipkoro-donation.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'TipKoro Donation',
          text: profile?.account_type === 'creator' 
            ? 'I received a tip on TipKoro! ❤️' 
            : 'I supported a creator on TipKoro! ❤️',
        });
      } else {
        // Fallback to copying URL
        navigator.clipboard.writeText(`${window.location.origin}/${profile?.username || ''}`);
        toast({
          title: "Link Copied",
          description: "Profile link copied to clipboard!",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Could not share the image. Try downloading instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-4xl py-8 px-4 flex-1">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-display font-bold">Create Donation Image</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Create a beautiful image to share your tips on social media!
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="tipkoro-card space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Customize Your Image
            </h2>

            <div>
              <label className="tipkoro-label">Amount (৳)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="tipkoro-input"
              />
            </div>

            <div>
              <label className="tipkoro-label">
                {profile?.account_type === 'creator' ? 'Supporter Name' : 'Creator Name'}
              </label>
              <Input
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder={profile?.account_type === 'creator' ? 'Who sent the tip?' : 'Who did you support?'}
                className="tipkoro-input"
              />
            </div>

            <div>
              <label className="tipkoro-label">Message (optional)</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a short message..."
                className="tipkoro-input"
                maxLength={100}
              />
            </div>

            <Button 
              onClick={generateImage}
              className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Image
            </Button>
          </div>

          {/* Preview */}
          <div className="tipkoro-card">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            
            {generatedImage ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-border">
                  <img 
                    src={generatedImage} 
                    alt="Generated donation image" 
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={downloadImage} className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button onClick={shareImage} variant="outline" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground text-center px-8">
                  Fill in the details and click "Generate Image" to create your shareable donation image
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      <MainFooter />
    </div>
  );
}
