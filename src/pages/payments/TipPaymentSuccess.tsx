import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { verifyPayment } from "@/lib/api";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { 
  Heart, 
  Loader2, 
  Share2, 
  Image as ImageIcon, 
  Home, 
  XCircle,
  ExternalLink 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TipPaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const supabase = useSupabaseWithAuth();

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipData, setTipData] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const verificationStarted = useRef(false);

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

      // Fetch creator name
      const { data: creator } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("id", tipInfo.creator_id)
        .single();

      if (creator) {
        setCreatorName(
          creator.first_name 
            ? `${creator.first_name} ${creator.last_name || ""}`.trim() 
            : `@${creator.username}`
        );
      }

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

  const handleShare = async () => {
    const shareText = `I just supported ${creatorName} on TipKoro! 💛`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title: "TipKoro", text: shareText, url: shareUrl });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({ title: "Copied to clipboard!", description: "Share it with your friends." });
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
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
        <main className="flex-1 flex items-center justify-center p-6">
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
      <main className="flex-1 flex items-center justify-center p-6">
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
              onClick={() => navigate("/donation-image")}
              className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Create Donation Image
            </Button>

            <Button onClick={handleShare} variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" /> Share Your Support
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
      </main>
      <MainFooter />
    </div>
  );
};

export default TipPaymentSuccess;
