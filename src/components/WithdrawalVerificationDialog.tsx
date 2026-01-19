import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { toast } from "@/hooks/use-toast";
import { Lock, Mail, CheckCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";

interface WithdrawalVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  payoutMethod: string;
  payoutDetails: string;
  onSuccess: () => void;
}

type Step = 'pin' | 'otp' | 'confirm';

export function WithdrawalVerificationDialog({
  open,
  onOpenChange,
  amount,
  payoutMethod,
  payoutDetails,
  onSuccess,
}: WithdrawalVerificationDialogProps) {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600);
  const supabase = useSupabaseWithAuth();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('pin');
      setPin('');
      setOtp('');
      setOtpSent(false);
      setOtpCooldown(0);
      setExpiresIn(600);
    }
  }, [open]);

  // OTP expiry countdown
  useEffect(() => {
    if (otpSent && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, expiresIn]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpCooldown]);

  const formatPayoutMethod = (method: string) => {
    const [provider, type] = method.split('-');
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const typeName = type ? ` (${type.charAt(0).toUpperCase() + type.slice(1)})` : '';
    return `${providerName}${typeName}`;
  };

  const verifyPin = async () => {
    if (pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'verify-pin', pin },
      });

      if (error || !data.success) {
        const errorMsg = data?.error || error?.message || 'PIN verification failed';
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        });
        setPin('');
        return;
      }

      // PIN verified, move to OTP step and automatically send OTP
      setStep('otp');
      await sendOTP();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'send-otp', withdrawal_amount: amount },
      });

      if (error || !data.success) {
        const errorMsg = data?.error || error?.message || 'Failed to send verification code';
        if (data?.wait_seconds) {
          setOtpCooldown(data.wait_seconds);
        }
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      setOtpSent(true);
      setExpiresIn(data.expires_in_seconds || 600);
      toast({
        title: "Code Sent!",
        description: "Check your email for the verification code",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to send code',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { action: 'verify-otp', otp },
      });

      if (error || !data.success) {
        const errorMsg = data?.error || error?.message || 'Verification failed';
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        });
        setOtp('');
        return;
      }

      // OTP verified, move to confirmation
      setStep('confirm');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'pin' && <><Lock className="w-5 h-5" /> Enter Withdrawal PIN</>}
            {step === 'otp' && <><Mail className="w-5 h-5" /> Email Verification</>}
            {step === 'confirm' && <><CheckCircle className="w-5 h-5 text-success" /> Confirm Withdrawal</>}
          </DialogTitle>
          <DialogDescription>
            {step === 'pin' && "Enter your 6-digit withdrawal PIN to continue"}
            {step === 'otp' && "Enter the verification code sent to your email"}
            {step === 'confirm' && "Review and confirm your withdrawal request"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'pin' ? 'bg-accent text-accent-foreground' : 'bg-success text-white'}`}>
              {step === 'pin' ? '1' : '✓'}
            </div>
            <div className={`w-12 h-0.5 ${step !== 'pin' ? 'bg-success' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'otp' ? 'bg-accent text-accent-foreground' : step === 'confirm' ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>
              {step === 'confirm' ? '✓' : '2'}
            </div>
            <div className={`w-12 h-0.5 ${step === 'confirm' ? 'bg-success' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'confirm' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
          </div>

          {/* PIN Step */}
          {step === 'pin' && (
            <div className="space-y-6">
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
              <Button 
                className="w-full gap-2" 
                onClick={verifyPin}
                disabled={pin.length !== 6 || isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Verify PIN
              </Button>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
              
              {otpSent && expiresIn > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Code expires in <span className="font-medium text-foreground">{formatTime(expiresIn)}</span>
                </p>
              )}

              <div className="space-y-2">
                <Button 
                  className="w-full gap-2" 
                  onClick={verifyOTP}
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Verify Code
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full gap-2" 
                  onClick={sendOTP}
                  disabled={isLoading || otpCooldown > 0}
                >
                  <RefreshCw className="w-4 h-4" />
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">৳{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{formatPayoutMethod(payoutMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-mono">{payoutDetails}</span>
                </div>
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                Withdrawals are processed within 3-5 business days
              </p>

              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover gap-2" 
                onClick={onSuccess}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Withdrawal
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
