import React, { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { HeartIcon } from "./icons/PaymentIcons";
import { toast } from "@/hooks/use-toast";
import { PLATFORM_FEE } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Rocket, Link as LinkIcon, ArrowLeft, Check, Loader2, Coins, Wallet } from "lucide-react";

type OnboardingStep = 'account_type' | 'payment' | 'profile';

export function Onboarding() {
  const { user } = useUser();
  const { profile, updateProfile, refetch } = useProfile();
  const supabase = useSupabaseWithAuth();
  const { balance: tokenBalance, refetch: refetchBalance } = useTokenBalance();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('account_type');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    twitter: '',
    instagram: '',
    youtube: '',
    facebook: '',
    other_link: ''
  });

  // Sync step with profile status on mount
  useEffect(() => {
    if (profile && !isInitialized) {
      const status = profile.onboarding_status;

      // Check if creator already paid - skip payment step
      if (profile.account_type === 'creator' && status === 'payment') {
        checkIfAlreadyPaid();
      } else if (status === 'pending' || status === 'account_type' || !profile.account_type) {
        setCurrentStep('account_type');
      } else if (status === 'payment') {
        setCurrentStep('payment');
      } else if (status === 'profile') {
        setCurrentStep('profile');
      }
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  const checkIfAlreadyPaid = async () => {
    if (!profile?.id) return;

    const { data: subscription } = await supabase
      .from('creator_subscriptions')
      .select('payment_status')
      .eq('profile_id', profile.id)
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (subscription) {
      // Already paid, go to profile step
      setCurrentStep('profile');
      await updateProfile({ onboarding_status: 'profile' });
    } else {
      setCurrentStep('payment');
    }
  };

  const handleAccountTypeSelect = async (type: 'supporter' | 'creator') => {
    setIsLoading(true);
    try {
      if (type === 'supporter') {
        await updateProfile({
          account_type: 'supporter',
          onboarding_status: 'profile'
        });
        setCurrentStep('profile');
      } else {
        await updateProfile({
          account_type: 'creator',
          onboarding_status: 'payment'
        });
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('Error selecting account type:', error);
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Profile not found. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    if (tokenBalance < PLATFORM_FEE) {
      toast({
        title: "Insufficient token balance",
        description: `You need ৳${PLATFORM_FEE} but have ৳${tokenBalance}. Please deposit tokens first.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Deduct creator fee from token balance
      const { data: result, error: rpcError } = await supabase.rpc('process_token_withdrawal', {
        p_profile_id: profile.id,
        p_amount: PLATFORM_FEE,
        p_reference_id: `creator_fee_${profile.id}_${Date.now()}`,
        p_description: `Creator account fee - ৳${PLATFORM_FEE}`,
      });

      if (rpcError || !(result as any)?.success) {
        const errorMsg = (result as any)?.error || rpcError?.message || 'Fee deduction failed';
        toast({ title: "Payment failed", description: errorMsg, variant: "destructive" });
        return;
      }

      // Create subscription record
      await supabase.from('creator_subscriptions').insert({
        profile_id: profile.id,
        amount: PLATFORM_FEE,
        payment_status: 'completed',
        payment_method: 'tokens',
        transaction_id: `token_fee_${Date.now()}`,
        promo: false,
        billing_start: new Date().toISOString(),
        active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Update onboarding status
      await updateProfile({ onboarding_status: 'profile' });
      refetchBalance();
      setCurrentStep('profile');

      toast({
        title: "Creator account activated! 🎉",
        description: `৳${PLATFORM_FEE} deducted from your token balance.`,
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    setIsLoading(true);
    try {
      if (currentStep === 'payment') {
        await updateProfile({
          account_type: 'supporter',
          onboarding_status: 'account_type'
        });
        setCurrentStep('account_type');
      } else if (currentStep === 'profile' && profile?.account_type === 'supporter') {
        await updateProfile({
          onboarding_status: 'account_type'
        });
        setCurrentStep('account_type');
      }
    } catch (error) {
      console.error('Error going back:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanLink = (link: string) => {
      if (!link) return null;
      return link.replace(/^https?:\/\//, '').trim() || null;
    };

    const profileUpdates: any = {
      bio: formData.bio || null,
      twitter: cleanLink(formData.twitter),
      instagram: cleanLink(formData.instagram),
      youtube: cleanLink(formData.youtube),
      facebook: cleanLink(formData.facebook),
      other_link: cleanLink(formData.other_link),
      onboarding_status: 'completed'
    };

    const result = await updateProfile(profileUpdates);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    } else {
      // Send welcome email for creators
      if (profile?.account_type === 'creator') {
        try {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              profile_id: profile.id,
              type: 'welcome_creator',
              data: {
                creator_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Creator',
                username: profile.username,
              },
            },
          });
        } catch (emailError) {
          console.log('Welcome email failed (non-critical):', emailError);
        }
      }

      toast({
        title: "Welcome to TipKoro!",
        description: "Your account is now set up."
      });
      refetch();
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const getStepNumber = () => {
    if (currentStep === 'account_type') return 1;
    if (currentStep === 'payment') return 2;
    return profile?.account_type === 'creator' ? 3 : 2;
  };

  const getTotalSteps = () => {
    return profile?.account_type === 'creator' ? 3 : 2;
  };

  const isCreator = profile?.account_type === 'creator';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <HeartIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">TipKoro</span>
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].slice(0, getTotalSteps()).map((step, idx) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${getStepNumber() >= step
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                  {getStepNumber() > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {idx < getTotalSteps() - 1 && (
                  <div className={`w-12 h-0.5 ${getStepNumber() > step ? 'bg-accent' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {getStepNumber()} of {getTotalSteps()}
          </p>
        </div>

        {/* Step Content */}
        <div className="tipkoro-card">
          {currentStep === 'account_type' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">Choose Your Account Type</h2>
                <p className="text-muted-foreground">How do you want to use TipKoro?</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleAccountTypeSelect('supporter')}
                  disabled={isLoading}
                  className="tipkoro-card flex items-start gap-4 p-5 text-left hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Supporter</h3>
                    <p className="text-sm text-muted-foreground">
                      Free forever. Support your favorite creators with tips.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleAccountTypeSelect('creator')}
                  disabled={isLoading}
                  className="tipkoro-card flex items-start gap-4 p-5 text-left hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer border-2 border-tipkoro-gold disabled:opacity-50"
                >
                  <div className="p-3 rounded-xl bg-accent/20">
                    <Rocket className="w-6 h-6 text-tipkoro-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Creator</h3>
                    <p className="text-sm text-muted-foreground">
                      ৳{PLATFORM_FEE}/month. Get your own page and receive tips from fans.
                    </p>
                  </div>
                </button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 'payment' && (
            <div className="space-y-6">
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">Activate Your Creator Account</h2>
                <p className="text-muted-foreground">Pay the Creator Fee to get started</p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Creator Fee</span>
                  <span>৳{PLATFORM_FEE}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly subscription. Paid from your token balance.
                </p>
              </div>

              {/* Token Balance Info */}
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Your Token Balance</span>
                  </div>
                  <span className="text-sm font-semibold">৳{tokenBalance.toLocaleString()}</span>
                </div>
                {tokenBalance < PLATFORM_FEE && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    You need ৳{PLATFORM_FEE} to activate.
                    <Link to="/deposit" className="underline font-medium">Deposit tokens →</Link>
                  </p>
                )}
              </div>

              <Button
                onClick={handlePayment}
                disabled={isLoading || tokenBalance < PLATFORM_FEE}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    {`Pay ৳${PLATFORM_FEE} from Tokens`}
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  updateProfile({
                    account_type: 'supporter',
                    onboarding_status: 'profile'
                  });
                  setCurrentStep('profile');
                }}
                disabled={isLoading}
                className="w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Continue as Supporter instead
              </button>
            </div>
          )}

          {currentStep === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {profile?.account_type === 'supporter' && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">Complete Your Profile</h2>
                <p className="text-muted-foreground">
                  {isCreator ? "Set up your creator page" : "Almost done!"}
                </p>
              </div>

              {profile?.username && (
                <div className="p-4 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Your TipKoro URL</p>
                  <p className="font-semibold">tipkoro.com/{profile.username}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="tipkoro-label">
                    Bio {!isCreator && <span className="text-muted-foreground font-normal">(optional)</span>}
                  </label>
                  <Textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={isCreator ? "Tell your supporters about yourself..." : "A little about you..."}
                    className="tipkoro-input min-h-[100px]"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/300</p>
                </div>

                {isCreator && (
                  <div className="space-y-3">
                    <label className="tipkoro-label flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Social Links <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      value={formData.twitter}
                      onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="twitter.com/username"
                      className="tipkoro-input"
                    />
                    <Input
                      value={formData.instagram}
                      onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="instagram.com/username"
                      className="tipkoro-input"
                    />
                    <Input
                      value={formData.youtube}
                      onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="youtube.com/@channel"
                      className="tipkoro-input"
                    />
                    <Input
                      value={formData.facebook}
                      onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="facebook.com/page"
                      className="tipkoro-input"
                    />
                    <Input
                      value={formData.other_link}
                      onChange={e => setFormData({ ...formData, other_link: e.target.value })}
                      placeholder="other website or link"
                      className="tipkoro-input"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
