import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { TopNavbar } from "@/components/TopNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Download, Share2, ArrowLeft, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      // Call edge function to generate SVG
      const { data, error } = await supabase.functions.invoke('generate-share-image', {
        body: {
          amount,
          creatorName: displayName,
          supporterName,
          message,
          displayName,
          username: profile?.username,
          isCreator,
        }
      });

      if (error) throw error;

      // Convert SVG response to data URL for preview and download
      const svgBlob = new Blob([data], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create an image from SVG to convert to PNG
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          setGeneratedImage(pngUrl);
        }
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        // Fallback: use SVG directly
        setGeneratedImage(svgUrl);
      };
      img.src = svgUrl;

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
            
            {/* Live Preview - This is what gets captured */}
            <div className="relative overflow-hidden rounded-xl border border-border mb-4">
              <div 
                ref={previewRef}
                className="w-full aspect-square relative"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }}
              >
                {/* Decorative circles */}
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '150px',
                    height: '150px',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                  }}
                />
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '200px',
                    height: '200px',
                    bottom: '40px',
                    left: '-50px',
                    background: 'rgba(251, 191, 36, 0.08)',
                  }}
                />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  {/* TipKoro branding with extra padding */}
                  <div className="pt-2">
                    <span className="text-5xl mb-3 block">💛</span>
                    <span 
                      className="text-xl font-bold mb-4 block"
                      style={{ color: '#FBBF24' }}
                    >
                      TipKoro
                    </span>
                  </div>
                  
                  {/* Status text */}
                  <span className="text-white text-lg mb-2">
                    {isCreator ? 'I received a tip!' : 'I sent a tip!'}
                  </span>
                  
                  {/* Amount */}
                  <span 
                    className="text-4xl font-bold mb-3"
                    style={{ color: '#FBBF24' }}
                  >
                    ৳{amount || '0'}
                  </span>
                  
                  {/* From/To text */}
                  {supporterName && (
                    <>
                      <span className="text-sm" style={{ color: '#a0aec0' }}>
                        {isCreator ? 'from' : 'to'}
                      </span>
                      <span className="text-xl font-bold text-white mt-1">
                        {supporterName}
                      </span>
                    </>
                  )}
                  
                  {/* Message */}
                  {message && (
                    <p 
                      className="italic text-sm mt-4 max-w-[80%]"
                      style={{ color: '#a0aec0' }}
                    >
                      "{message}"
                    </p>
                  )}
                  
                  {/* Creator/Supporter name */}
                  <div className="mt-auto pt-6">
                    <span className="text-lg font-bold text-white block">
                      {displayName}
                    </span>
                    {profile?.username && (
                      <span 
                        className="text-sm"
                        style={{ color: '#FBBF24' }}
                      >
                        tipkoro.com/{profile.username}
                      </span>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <span 
                    className="text-xs mt-4"
                    style={{ color: '#64748b' }}
                  >
                    Support creators with TipKoro
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action buttons - only show after generation */}
            {generatedImage && (
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
            
            {!generatedImage && (
              <p className="text-center text-sm text-muted-foreground">
                Click "Generate Image" to create your shareable donation image
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
