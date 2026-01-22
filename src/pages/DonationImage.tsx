import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { TopNavbar } from "@/components/TopNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Download, Share2, ArrowLeft, Heart, Sparkles, Loader2 } from "lucide-react";
import DynamicShareCard from "@/components/DynamicShareCard";
import { toPng } from "html-to-image";

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
  const previewRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const displayName = profile?.first_name 
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : profile?.username || 'Anonymous';

  const isCreator = profile?.account_type === 'creator';

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const generateImage = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
      });
      setGeneratedImage(dataUrl);

      toast({
        title: "Image Generated!",
        description: "Your donation image is ready to download or share.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `tipkoro-${isCreator ? 'received' : 'sent'}-${amount}-${Date.now()}.png`;
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
          text: isCreator 
            ? 'I received a tip on TipKoro! ❤️' 
            : 'I supported a creator on TipKoro! ❤️',
        });
      } else {
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
                {isCreator ? 'Supporter Name' : 'Creator Name'}
              </label>
              <Input
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder={isCreator ? 'Who sent the tip?' : 'Who did you support?'}
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
              disabled={isGenerating}
              className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>

          {/* Preview */}
          <div className="tipkoro-card">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            
            {/* Dynamic Share Card Preview */}
            <div className="relative overflow-hidden rounded-xl border border-border mb-4">
              <DynamicShareCard
                ref={previewRef}
                creatorName={isCreator ? displayName : (supporterName || 'Creator')}
                tipAmount={amount || '0'}
                userMessage={message}
                timestamp={formatTimestamp()}
                supporterName={isCreator ? supporterName : displayName}
                currency="৳"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {!generatedImage ? (
                <Button 
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Generate Image
                    </>
                  )}
                </Button>
              ) : (
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
              )}
            </div>
            
            {!generatedImage && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Click "Generate Image" to create your shareable donation image
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
