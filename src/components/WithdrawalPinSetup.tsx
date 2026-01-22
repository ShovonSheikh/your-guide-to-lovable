import React, { useState, useEffect, useRef } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Lock, ShieldCheck, KeyRound, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface WithdrawalPinSetupProps {
  onSuccess?: () => void;
}

export function WithdrawalPinSetup({ onSuccess }: WithdrawalPinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm' | 'success'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseWithAuth();
  const { refetch } = useProfile();
  const hasSubmittedRef = useRef(false);

  // Auto-advance to confirm step when first PIN is complete
  useEffect(() => {
    if (pin.length === 6 && step === 'enter') {
      // Small delay for visual feedback
      setTimeout(() => {
        setStep('confirm');
      }, 200);
    }
  }, [pin, step]);

  // Auto-focus confirm input when step changes
  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => {
        const firstSlot = document.querySelector('[data-confirm-otp] input') as HTMLInputElement;
        firstSlot?.focus();
      }, 100);
    }
  }, [step]);

  // Auto-submit when confirm PIN is complete and matches
  useEffect(() => {
    if (confirmPin.length === 6 && step === 'confirm' && !isLoading && !hasSubmittedRef.current) {
      handleSetPin();
    }
  }, [confirmPin, step, isLoading]);

  const handleSetPin = async () => {
    if (hasSubmittedRef.current) return;
    
    if (confirmPin !== pin) {
      toast({
        title: "PINs don't match",
        description: "Please try again from the beginning",
        variant: "destructive",
      });
      // Reset and start over
      setPin('');
      setConfirmPin('');
      setStep('enter');
      return;
    }

    hasSubmittedRef.current = true;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'set-pin', pin },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to set PIN');
      }

      // Show success state immediately
      setStep('success');

      toast({
        title: "PIN Set Successfully!",
        description: "Your withdrawal PIN has been securely saved",
      });

      // Refresh profile to update has_withdrawal_pin
      refetch();
      
      // Auto-call onSuccess after brief delay to show success state
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      hasSubmittedRef.current = false;
      toast({
        title: "Error",
        description: err.message || 'Failed to set PIN',
        variant: "destructive",
      });
      // Reset on error
      setPin('');
      setConfirmPin('');
      setStep('enter');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - shows immediately after PIN is set
  if (step === 'success') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">PIN Set Successfully!</h3>
          <p className="text-muted-foreground max-w-xs">
            Your withdrawal PIN has been securely saved. You'll need this PIN to process withdrawals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl border border-accent/20">
        <ShieldCheck className="w-8 h-8 text-accent-foreground" />
        <div>
          <h3 className="font-semibold">Secure Your Withdrawals</h3>
          <p className="text-sm text-muted-foreground">
            Set a 6-digit PIN to protect your funds
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 ${step === 'enter' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'enter' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          Enter PIN
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 ${step === 'confirm' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          Confirm
        </div>
      </div>

      {step === 'enter' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-center">Enter your 6-digit PIN</label>
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={pin} 
                onChange={setPin}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Choose a PIN you'll remember
            </p>
            <p className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Don't use obvious patterns like 123456
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-center">
              {isLoading ? "Setting your PIN..." : "Confirm your PIN"}
            </label>
            <div className="flex justify-center relative" data-confirm-otp>
              <InputOTP 
                maxLength={6} 
                value={confirmPin} 
                onChange={setConfirmPin}
                autoFocus
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Re-enter your PIN to confirm
            </p>
          </div>

          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            onClick={() => {
              setStep('enter');
              setPin('');
              setConfirmPin('');
            }}
          >
            ← Start over
          </button>
        </div>
      )}
    </div>
  );
}