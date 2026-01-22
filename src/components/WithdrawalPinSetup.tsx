import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Lock, Check, Loader2, ShieldCheck, KeyRound, CheckCircle2, ArrowRight } from "lucide-react";

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
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on confirm input when step changes to 'confirm'
  useEffect(() => {
    if (step === 'confirm') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstSlot = document.querySelector('[data-confirm-otp] input') as HTMLInputElement;
        firstSlot?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handlePinEntered = () => {
    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN",
        variant: "destructive",
      });
      return;
    }
    setStep('confirm');
  };

  const handleSetPin = async () => {
    if (confirmPin !== pin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs match",
        variant: "destructive",
      });
      setConfirmPin('');
      return;
    }

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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to set PIN',
        variant: "destructive",
      });
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

        <Button 
          className="w-full" 
          onClick={() => onSuccess?.()}
        >
          Done
        </Button>
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

          <Button 
            className="w-full gap-2" 
            onClick={handlePinEntered}
            disabled={pin.length !== 6}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-center">Confirm your PIN</label>
            <div className="flex justify-center" data-confirm-otp>
              <InputOTP 
                maxLength={6} 
                value={confirmPin} 
                onChange={setConfirmPin}
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
            <p className="text-xs text-muted-foreground text-center mt-2">
              Re-enter your PIN to confirm
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setStep('enter');
                setConfirmPin('');
              }}
            >
              Back
            </Button>
            <Button 
              className="flex-1 gap-2" 
              onClick={handleSetPin}
              disabled={confirmPin.length !== 6 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Set PIN
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
