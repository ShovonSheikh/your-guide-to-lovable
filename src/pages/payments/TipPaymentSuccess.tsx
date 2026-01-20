import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { verifyPayment } from "@/lib/api";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import TipKoroCard from "@/components/TipKoroCard";
import { toPng } from "html-to-image";
import {
  Heart,
  Loader2,
  Download,
  Image as ImageIcon,
  Home,
  XCircle,
  ExternalLink,
  LayoutDashboard
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TipPaymentSuccess: React.FC = () => {
  usePageTitle("Tip Sent Successfully");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const supabase = useSupabaseWithAuth();

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipData, setTipData] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const [creatorVerified, setCreatorVerified] = useState<boolean>(false);
  const [transactionIdForCard, setTransactionIdForCard] = useState<string>("");
  const [showImageCreator, setShowImageCreator] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const verificationStarted = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const transactionId = searchParams.get("transactionId");
  const paymentMethod = searchParams.get("paymentMethod");
  const paymentAmount = searchParams.get("paymentAmount");

  useEffect(() => {
    if (!transactionId || verificationStarted.current) return;
    verificationStarted.current = true;
    handleVerification();
  }, [transactionId]);

  const handleVerification = async () => {
    if (!transactionId) {
      setError("Missing transaction information");
      setVerifying(false);
      return;
    }

    try {
      // Get stored tip data
      const storedTipData = localStorage.getItem("tipkoro_tip_data");
      if (!storedTipData) {
        setError("Tip data not found. Please try again.");
        setVerifying(false);
        return;
      }

      const tipInfo = JSON.parse(storedTipData);
      setTipData(tipInfo);

      // Verify payment with RupantorPay
      const result = await verifyPayment({
        transaction_id: transactionId,
        payment_method: paymentMethod || undefined,
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : tipInfo.amount,
      });

      if (!result.verified) {
        setError("Payment verification failed. Please contact support.");
        setVerifying(false);
        return;
      }

      // Create tip via edge function
      const { data: tipResult, error: tipError } = await supabase.functions.invoke("create-tip", {
        body: {
          transaction_id: transactionId,
          creator_id: tipInfo.creator_id,
          supporter_name: tipInfo.supporter_name,
          supporter_email: tipInfo.supporter_email,
          amount: tipInfo.amount,
          message: tipInfo.message || null,
          is_anonymous: false,
          payment_method: paymentMethod || result.payment_method,
        },
      });

      if (tipError) {
        console.error("Tip creation error:", tipError);
        setError("Failed to record your tip. Please contact support.");
        setVerifying(false);
        return;
      }

      // Fetch creator name and verification status
      const { data: creator } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, is_verified")
        .eq("id", tipInfo.creator_id)
        .single();

      if (creator) {
        setCreatorName(
          creator.first_name
            ? `${creator.first_name} ${creator.last_name || ""}`.trim()
            : `@${creator.username}`
        );
        setCreatorVerified(creator.is_verified || false);
      }

      // Generate transaction ID for the card
      const shortId = transactionId.slice(0, 8).toUpperCase();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setTransactionIdForCard(`TIP-${dateStr}-${shortId}`);

      // Clear stored tip data
      localStorage.removeItem("tipkoro_tip_data");

      setVerified(true);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong during verification.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateImage = () => {
    setShowImageCreator(true);
  };

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f5e6d3',
        cacheBust: true,
        skipAutoScale: true,
      });
      setGeneratedImage(dataUrl);
    } catch (err) {
      console.error("Image generation error:", err);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
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

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-24">
          <div className="tipkoro-card text-center py-12 max-w-md w-full">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-accent" />
            <h2 className="text-xl font-semibold mb-2">Processing Your Tip...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-24">
          <div className="tipkoro-card text-center py-12 max-w-md w-full">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something Went Wrong</h2>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't process your tip."}
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti />
      <TopNavbar />
      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-24">
        <div className="tipkoro-card text-center py-12 max-w-lg w-full">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>

          <h1 className="text-2xl font-bold font-display mb-2">
            Tip Sent Successfully! 🎉
          </h1>
          <p className="text-muted-foreground mb-6">
            Your support means the world to {creatorName || "the creator"}.
          </p>

          {/* Tip Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount Sent</span>
              <span className="text-2xl font-bold text-primary">৳{tipData?.amount || paymentAmount}</span>
            </div>
            {tipData?.message && (
              <div className="mt-3 pt-3 border-t border-border text-left">
                <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm italic">"{tipData.message}"</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateImage}
              className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Create Donation Image
            </Button>

            <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Go to Dashboard
            </Button>

            <Link to="/explore" className="block">
              <Button variant="ghost" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" /> Discover More Creators
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Transaction ID: {transactionId?.slice(0, 16)}...
          </p>
        </div>

        {/* Image Creator Section */}
        {showImageCreator && (
          <div className="tipkoro-card mt-8 max-w-xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Create & Share Your Donation</h2>

            {/* TipKoroCard Preview */}
            <div className="flex justify-center mb-6 overflow-hidden rounded-xl border border-border">
              <TipKoroCard
                ref={cardRef}
                creatorName={creatorName || "Creator"}
                tipAmount={String(tipData?.amount || paymentAmount || "0")}
                userMessage={tipData?.message || ""}
                timestamp={formatTimestamp()}
                trxId={transactionIdForCard}
                verified={creatorVerified}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!generatedImage ? (
                <Button
                  onClick={handleGenerateImage}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" /> Generate Image
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleDownloadImage}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Image
                </Button>
              )}
            </div>

            {generatedImage && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  ✅ Image ready! Click download to save it.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <MainFooter />
    </div>
  );
};

export default TipPaymentSuccess;
