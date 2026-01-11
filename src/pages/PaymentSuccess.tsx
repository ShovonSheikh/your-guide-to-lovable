import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { verifyPayment } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useProfile } from "@/hooks/useProfile";
import { Check, Download, Share2, Home, ArrowRight, Loader2 } from "lucide-react";
import { Confetti } from "@/components/Confetti";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { profile, refetch: refetchProfile } = useProfile();
  const supabaseWithAuth = useSupabaseWithAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [paymentType, setPaymentType] = useState<"onboarding" | "tip" | null>(null);
  const [tipData, setTipData] = useState<any>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!isUserLoaded) return;
    if (hasVerified.current) return;

    const txnId = searchParams.get("transactionId");
    const paymentMethod = searchParams.get("paymentMethod");
    const paymentAmount = searchParams.get("paymentAmount");

    if (!txnId) {
      toast({
        title: "Invalid Request",
        description: "No transaction ID found. Redirecting to home...",
        variant: "destructive",
      });
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    hasVerified.current = true;

    const verify = async () => {
      try {
        // Check for tip data in localStorage FIRST (before any async operations)
        const storedTipData = localStorage.getItem("tipkoro_tip_data");
        
        const result = await verifyPayment({
          transaction_id: txnId,
          payment_method: paymentMethod || undefined,
          payment_amount: paymentAmount ? parseFloat(paymentAmount) : undefined,
        });

        if (result.verified) {
          setIsVerified(true);

          if (storedTipData) {
            // This is a tip payment
            setPaymentType("tip");
            const tipInfo = JSON.parse(storedTipData);
            setTipData(tipInfo);

            // Insert the tip via secure Edge Function (verifies payment server-side)
            try {
              const { error: tipError } = await supabase.functions.invoke('create-tip', {
                body: {
                  transaction_id: txnId,
                  creator_id: tipInfo.creatorId,
                  supporter_name: tipInfo.supporterName,
                  supporter_email: tipInfo.supporterEmail,
                  amount: tipInfo.amount,
                  message: tipInfo.message,
                  is_anonymous: tipInfo.isAnonymous,
                  payment_method: paymentMethod,
                },
              });

              if (tipError) {
                console.error("Error saving tip:", tipError);
              }
            } catch (tipFuncError) {
              console.error("Error calling create-tip function:", tipFuncError);
            }

            localStorage.removeItem("tipkoro_tip_data");
          } else if (profile?.id) {
            // This is likely an onboarding payment - find pending subscription
            // Use authenticated client for RLS-protected table
            const { data: pendingSubscription, error: findError } = await supabaseWithAuth
              .from("creator_subscriptions")
              .select("*")
              .eq("profile_id", profile.id)
              .eq("payment_status", "pending")
              .maybeSingle();

            if (pendingSubscription && !findError) {
              setPaymentType("onboarding");
              
              // Calculate billing dates
              const billingStart = new Date();
              const activeUntil = new Date();
              activeUntil.setMonth(activeUntil.getMonth() + 3); // 3 months for promo

              // Update the subscription using authenticated client
              const { error: updateSubError } = await supabaseWithAuth
                .from("creator_subscriptions")
                .update({
                  payment_status: "completed",
                  transaction_id: txnId,
                  payment_method: paymentMethod,
                  amount: paymentAmount ? parseFloat(paymentAmount) : 10,
                  billing_start: billingStart.toISOString(),
                  active_until: activeUntil.toISOString(),
                })
                .eq("id", pendingSubscription.id);

              if (updateSubError) {
                console.error("Error updating subscription:", updateSubError);
              } else {
                // Update profile onboarding status to move to profile step
                await supabaseWithAuth
                  .from("profiles")
                  .update({ onboarding_status: "profile" })
                  .eq("id", profile.id);
                
                refetchProfile();
              }
            } else {
              // No pending subscription found, but user is logged in - this is still onboarding
              setPaymentType("onboarding");
            }
          }

          toast({
            title: "Payment Verified! ✓",
            description: "Your payment was successful.",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: result.error || "Could not verify payment.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error) {
        console.error("Verification error:", error);
        toast({
          title: "Error",
          description: "An error occurred during verification.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [searchParams, navigate, isUserLoaded, profile?.id, refetchProfile, supabaseWithAuth]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="tipkoro-card text-center py-12 max-w-md w-full">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="tipkoro-card text-center py-12 max-w-md w-full">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">We couldn't verify your payment.</p>
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" /> Go Home
              </Button>
            </Link>
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
        <div className="tipkoro-card text-center py-12 max-w-md w-full">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          
          <h1 className="text-2xl font-bold font-display mb-2">
            {paymentType === "onboarding" ? "Welcome to TipKoro!" : "Thank You!"}
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {paymentType === "onboarding" 
              ? "Your creator subscription is now active. Complete your profile to start receiving tips!"
              : tipData 
                ? `Your tip of ৳${tipData.amount} has been sent successfully!`
                : "Your payment was successful."}
          </p>

          <div className="space-y-3">
            {paymentType === "onboarding" ? (
              <Button
                onClick={() => navigate("/complete-profile")}
                className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
              >
                Complete Profile <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Link to="/donation-image" className="block">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" /> Create Donation Image
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "I supported a creator on TipKoro!",
                        text: `I just sent a tip on TipKoro! Support your favorite creators too.`,
                        url: window.location.origin,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      toast({
                        title: "Link Copied",
                        description: "Share link copied to clipboard!",
                      });
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </>
            )}
            
            <Link to="/">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <MainFooter />
    </div>
  );
};

export default PaymentSuccess;
