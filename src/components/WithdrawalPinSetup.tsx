import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Lock, Check, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from "lucide-react";

interface WithdrawalPinSetupProps {
  onSuccess?: () => void;
}

export function WithdrawalPinSetup({ onSuccess }: WithdrawalPinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseWithAuth();
  const { refetch } = useProfile();

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

      toast({
        title: "PIN Set Successfully!",
        description: "Your withdrawal PIN has been securely saved",
      });

      // Refresh profile to update has_withdrawal_pin
      refetch();
      onSuccess?.();
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

      {step === 'enter' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter your 6-digit PIN</label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={pin} onChange={setPin}>
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
            className="w-full" 
            onClick={handlePinEntered}
            disabled={pin.length !== 6}
          >
            Continue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Confirm your PIN</label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin}>
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
