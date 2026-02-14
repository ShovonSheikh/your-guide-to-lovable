import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Coins,
  ArrowLeft,
  Wallet,
  CheckCircle,
  XCircle,
} from "lucide-react";

const presetAmounts = [100, 500, 1000, 5000];

export default function Deposit() {
  usePageTitle("Deposit Tokens");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useTokenBalance();
  const supabase = useSupabaseWithAuth();
  const [searchParams] = useSearchParams();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const depositStatus = searchParams.get("status");

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />
        <main className="container max-w-lg py-8 px-4 animate-fade-in">
          <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />
        </main>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/" replace />;

  // Block deposit if onboarding is not completed
  if (profile && profile.onboarding_status !== 'completed') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <div className="h-24" />
        <main className="container max-w-lg py-8 px-4 flex-1 animate-fade-in">
          <div className="tipkoro-card text-center py-12">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Coins className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Complete Your Profile First</h2>
            <p className="text-muted-foreground mb-6">
              You need to finish setting up your account before depositing tokens.
            </p>
            <Link to="/complete-profile">
              <Button className="bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover">
                Complete Profile
              </Button>
            </Link>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  const handleDeposit = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount < 10) {
      toast.error("Minimum deposit is ৳10");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("deposit-tokens", {
        body: { amount },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;

      if (data.dummy) {
        // Dummy mode - immediate credit
        toast.success(`৳${amount} tokens deposited successfully!`);
        refetchBalance();
        return;
      }

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.error("Failed to create payment link");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate deposit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-lg py-8 px-4 flex-1 animate-fade-in">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Deposit Status Messages */}
        {depositStatus === "success" && (
          <div className="tipkoro-card mb-6 border-2 border-green-400 bg-green-50/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Deposit Successful!</h3>
                <p className="text-sm text-green-700">Your tokens have been credited to your account.</p>
              </div>
            </div>
          </div>
        )}
        {depositStatus === "failed" && (
          <div className="tipkoro-card mb-6 border-2 border-red-400 bg-red-50/50">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Deposit Failed</h3>
                <p className="text-sm text-red-700">Your payment was not completed. Please try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="tipkoro-card mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Current Balance</span>
          </div>
          <p className="text-3xl font-display font-bold">
            {balanceLoading ? "..." : `৳${balance.toLocaleString()}`}
          </p>
        </div>

        {/* Deposit Card */}
        <div className="tipkoro-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Coins className="w-5 h-5 text-accent-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Buy Tokens</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            1 Token = ৳1 BDT. Tokens are used for tipping creators.
          </p>

          {/* Preset Amounts */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={`py-3 px-2 rounded-xl font-medium text-sm transition-all ${
                  selectedAmount === amount
                    ? "bg-accent text-accent-foreground shadow-md scale-105"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                ৳{amount}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <Input
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            placeholder="Or enter custom amount (min ৳10)"
            className="tipkoro-input mb-6"
            min={10}
          />

          <Button
            onClick={handleDeposit}
            disabled={isSubmitting || (!selectedAmount && !customAmount)}
            className="w-full h-14 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-semibold text-lg rounded-xl"
          >
            {isSubmitting ? "Processing..." : `Deposit ৳${selectedAmount || customAmount || 0}`}
          </Button>
        </div>

        {/* Link to transactions */}
        <div className="mt-6 text-center">
          <Link to="/transactions" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            View Transaction History →
          </Link>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
