import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useProfile } from "@/hooks/useProfile";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { verifyPayment } from "@/lib/api";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { CheckCircle, Loader2, ArrowRight, XCircle } from "lucide-react";

const PLATFORM_FEE = 150;

const CreatorPaymentSuccess: React.FC = () => {
  usePageTitle("Payment Successful");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();
  const { profile, refetch: refetchProfile } = useProfile();
  const supabase = useSupabaseWithAuth();

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verificationStarted = useRef(false);

  const transactionId = searchParams.get("transactionId");
  const paymentMethod = searchParams.get("paymentMethod");
  const paymentAmount = searchParams.get("paymentAmount");

  useEffect(() => {
    if (!transactionId || verificationStarted.current) return;
    if (!userLoaded || !profile) return;

    verificationStarted.current = true;
    handleVerification();
  }, [transactionId, userLoaded, profile]);

  const handleVerification = async () => {
    if (!transactionId || !profile?.id) {
      setError("Missing transaction or profile information");
      setVerifying(false);
      return;
    }

    try {
      // Verify payment with RupantorPay
      const result = await verifyPayment({
        transaction_id: transactionId,
        payment_method: paymentMethod || undefined,
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : PLATFORM_FEE,
      });

      if (!result.verified) {
        setError("Payment verification failed. Please contact support.");
        setVerifying(false);
        return;
      }

      // Update creator subscription
      const { error: subscriptionError } = await supabase
        .from("creator_subscriptions")
        .update({
          payment_status: "completed",
          transaction_id: transactionId,
          payment_method: paymentMethod || result.payment_method,
          amount: PLATFORM_FEE,
          billing_start: new Date().toISOString(),
          active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          promo: false,
        })
        .eq("profile_id", profile.id)
        .eq("payment_status", "pending");

      if (subscriptionError) {
        console.error("Subscription update error:", subscriptionError);
        // Try inserting if update fails
        await supabase.from("creator_subscriptions").insert({
          profile_id: profile.id,
          payment_status: "completed",
          transaction_id: transactionId,
          payment_method: paymentMethod || result.payment_method,
          amount: PLATFORM_FEE,
          billing_start: new Date().toISOString(),
          active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          promo: false,
        });
      }

      // Update profile onboarding status to 'profile' step
      await supabase
        .from("profiles")
        .update({ onboarding_status: "profile" })
        .eq("id", profile.id);

      await refetchProfile();
      setVerified(true);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong during verification.");
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="tipkoro-card text-center py-12 max-w-md w-full">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-accent" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
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
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't verify your payment."}
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              Go to Dashboard
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
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h1 className="text-2xl font-bold font-display mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your creator account has been activated.
          </p>

          {/* Payment Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium">৳{PLATFORM_FEE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">Paid by Creator</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription Period</span>
                <span className="font-medium">1 Month</span>
              </div>
              {transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{transactionId.slice(0, 16)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold text-accent-foreground mb-2">Next Step</h3>
            <p className="text-sm text-muted-foreground">
              Complete your profile to set up your creator page. Add your bio, social links, 
              and start receiving tips from your supporters!
            </p>
          </div>

          <Button
            onClick={() => navigate("/complete-profile")}
            className="w-full h-12 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-semibold"
          >
            Complete Your Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
      <MainFooter />
    </div>
  );
};

export default CreatorPaymentSuccess;
