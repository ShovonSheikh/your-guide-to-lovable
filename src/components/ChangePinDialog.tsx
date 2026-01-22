import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { toast } from "@/hooks/use-toast";
import { Lock, Loader2, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'send-otp' | 'verify-otp' | 'new' | 'confirm' | 'success';

export function ChangePinDialog({ open, onOpenChange }: ChangePinDialogProps) {
  const [step, setStep] = useState<Step>('send-otp');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const supabase = useSupabaseWithAuth();
  const hasSubmittedRef = useRef(false);

  // Cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const resetState = () => {
    setStep('send-otp');
    setOtp('');
    setNewPin('');
    setConfirmPin('');
    hasSubmittedRef.current = false;
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  // Auto-advance when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && step === 'verify-otp' && !isLoading) {
      handleVerifyOTP();
    }
  }, [otp, step, isLoading]);

  // Auto-advance when new PIN is complete
  useEffect(() => {
    if (newPin.length === 6 && step === 'new') {
      setTimeout(() => setStep('confirm'), 200);
    }
  }, [newPin, step]);

  // Auto-focus on step change
  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => {
        const input = document.querySelector('[data-confirm-new-pin] input') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
    if (step === 'verify-otp') {
      setTimeout(() => {
        const input = document.querySelector('[data-otp-input] input') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
    if (step === 'new') {
      setTimeout(() => {
        const input = document.querySelector('[data-new-pin] input') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
  }, [step]);

  // Auto-submit when confirm PIN is complete
  useEffect(() => {
    if (confirmPin.length === 6 && step === 'confirm' && !isLoading && !hasSubmittedRef.current) {
      handleChangePIN();
    }
  }, [confirmPin, step, isLoading]);

  const handleSendOTP = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'send-otp' },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to send verification code');
      }

      toast({
        title: "Code Sent!",
        description: "Check your email for the verification code",
      });

      setOtpCooldown(60);
      setStep('verify-otp');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to send verification code',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'verify-otp', otp },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Invalid verification code');
      }

      setStep('new');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Invalid verification code',
        variant: "destructive",
      });
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePIN = async () => {
    if (hasSubmittedRef.current) return;

    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please try again",
        variant: "destructive",
      });
      setConfirmPin('');
      setNewPin('');
      setStep('new');
      return;
    }

    hasSubmittedRef.current = true;
    setIsLoading(true);
    
    try {
      // For change-pin, we need to use a special action that doesn't require current PIN
      // since we've already verified via OTP
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { 
          action: 'set-pin-after-otp', 
          new_pin: newPin 
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to change PIN');
      }

      setStep('success');

      toast({
        title: "PIN Changed!",
        description: "Your withdrawal PIN has been updated successfully",
      });

      // Auto-close after success
      setTimeout(() => {
        handleClose(false);
      }, 2000);
    } catch (err: any) {
      hasSubmittedRef.current = false;
      toast({
        title: "Error",
        description: err.message || 'Failed to change PIN',
        variant: "destructive",
      });
      setConfirmPin('');
      setNewPin('');
      setStep('new');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Withdrawal PIN
          </DialogTitle>
          <DialogDescription>
            {step === 'send-otp' && "We'll send a verification code to your email first"}
            {step === 'verify-otp' && "Enter the 6-digit code sent to your email"}
            {step === 'new' && "Enter your new 6-digit PIN"}
            {step === 'confirm' && "Confirm your new PIN"}
            {step === 'success' && "Your PIN has been updated"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 'send-otp' || step === 'verify-otp' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'new' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'success' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {step === 'send-otp' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                For your security, we need to verify your identity before changing your PIN.
              </p>
              <Button 
                onClick={handleSendOTP} 
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Verification Code
              </Button>
            </div>
          )}

          {step === 'verify-otp' && (
            <div className="space-y-4">
              <div className="flex justify-center relative" data-otp-input>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus disabled={isLoading}>
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
              {otpCooldown > 0 ? (
                <p className="text-xs text-center text-muted-foreground">
                  Resend code in {otpCooldown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-xs text-primary hover:underline w-full text-center"
                  disabled={isLoading}
                >
                  Resend code
                </button>
              )}
            </div>
          )}

          {step === 'new' && (
            <div className="space-y-4">
              <div className="flex justify-center" data-new-pin>
                <InputOTP maxLength={6} value={newPin} onChange={setNewPin} autoFocus>
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
              <p className="text-xs text-center text-muted-foreground">
                Choose a secure 6-digit PIN
              </p>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex justify-center relative" data-confirm-new-pin>
                <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin} autoFocus disabled={isLoading}>
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
              <p className="text-xs text-center text-muted-foreground">
                Re-enter your new PIN to confirm
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium text-green-600">PIN Changed Successfully!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}