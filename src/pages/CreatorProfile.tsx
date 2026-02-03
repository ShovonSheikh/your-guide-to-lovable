import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useUser } from "@clerk/clerk-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreatorStats } from "@/components/CreatorStats";
import { RecentSupporters } from "@/components/RecentSupporters";
import { FundingGoalCard } from "@/components/FundingGoalCard";
import { usePublicFundingGoals } from "@/hooks/useFundingGoals";
import { supabase } from "@/integrations/supabase/client";
import { createTipCheckout } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { 
  Heart, 
  Twitter, 
  Instagram, 
  Youtube, 
  Facebook,
  Link as LinkIcon,
  BadgeCheck,
  Sparkles
} from "lucide-react";

interface CreatorData {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  total_supporters: number;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  other_link: string | null;
  created_at: string | null;
}

interface TipSound {
  trigger_amount: number;
  display_name: string;
}

const tipAmounts = [50, 100, 200, 500, 1000];

export default function CreatorProfile() {
  const { username } = useParams<{ username: string }>();
  const { user, isLoaded } = useUser();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageTitle(creator ? `${creator.first_name || creator.username} - Creator` : "Creator Profile");
  
  // Fetch public funding goals for this creator
  const { goals: fundingGoals } = usePublicFundingGoals(creator?.id);
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamerTipOptions, setStreamerTipOptions] = useState<{
    isStreamerEnabled: boolean;
    tipSounds: TipSound[];
  }>({ isStreamerEnabled: false, tipSounds: [] });

  useEffect(() => {
    if (username) {
      fetchCreator();
    }
  }, [username]);

  // Fetch streamer options when creator is loaded
  useEffect(() => {
    const fetchStreamerOptions = async () => {
      if (!creator?.id) return;
      
      // Check if streamer mode is enabled via tip_sounds RLS (it checks streamer_settings internally)
      const { data: sounds } = await supabase
        .from('tip_sounds')
        .select('trigger_amount, display_name')
        .eq('profile_id', creator.id)
        .eq('is_enabled', true)
        .order('trigger_amount', { ascending: true });
      
      if (sounds && sounds.length > 0) {
        setStreamerTipOptions({
          isStreamerEnabled: true,
          tipSounds: sounds
        });
      }
    };
    
    fetchStreamerOptions();
  }, [creator?.id]);

  const fetchCreator = async () => {
    try {
      // Use public_profiles view to avoid exposing sensitive data like email/pin hashes
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, first_name, last_name, bio, avatar_url, is_verified, total_supporters, twitter, instagram, youtube, facebook, other_link, created_at')
        .eq('username', username?.toLowerCase())
        .eq('account_type', 'creator')
        .eq('onboarding_status', 'completed')
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setCreator(data as CreatorData);
    } catch (error) {
      console.error('Error fetching creator:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 10) {
      toast({
        title: "Minimum amount is ৳10",
        description: "Please enter a valid tip amount.",
        variant: "destructive",
      });
      return;
    }

    if (!isLoaded) {
      toast({
        title: "Please wait",
        description: "Loading your account...",
        variant: "destructive",
      });
      return;
    }

    const fullName = user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous'
      : 'Anonymous';
    const email = user?.primaryEmailAddress?.emailAddress || '';

    if (!email) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send a tip.",
        variant: "destructive",
      });
      return;
    }

    // Prevent self-tipping: check if the logged-in user's email matches the creator's email
    // or if their user_id matches via a profile lookup
    if (user) {
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userProfile && userProfile.id === creator?.id) {
          toast({
            title: "Cannot tip yourself",
            description: "You cannot send a tip to your own account.",
            variant: "destructive",
          });
          return;
        }
      } catch (err) {
        // If profile check fails, continue anyway (non-blocking)
        console.log("Profile check failed:", err);
      }
    }

    setIsSubmitting(true);

    try {
      localStorage.setItem('tipkoro_tip_data', JSON.stringify({
        creator_id: creator?.id,
        amount,
        message,
        supporter_name: fullName,
        supporter_email: email
      }));

      const result = await createTipCheckout({
        fullname: fullName,
        email,
        amount,
        creator_id: creator?.id,
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create payment link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />
        <main className="container max-w-5xl py-8 px-4 animate-fade-in">
          {/* Skeleton Hero */}
          <div className="tipkoro-card mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
              <div className="text-center md:text-left flex-1 space-y-3">
                <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto md:mx-0" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded mx-auto md:mx-0" />
                <div className="h-16 w-full max-w-xl bg-muted animate-pulse rounded mt-4" />
              </div>
            </div>
          </div>
          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 tipkoro-card h-96 bg-muted/20 animate-pulse" />
            <div className="space-y-6">
              <div className="tipkoro-card h-32 bg-muted/20 animate-pulse" />
              <div className="tipkoro-card h-48 bg-muted/20 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/explore" replace />;
  }

  const socialLinks = [
    { key: 'twitter', icon: Twitter, url: creator?.twitter },
    { key: 'instagram', icon: Instagram, url: creator?.instagram },
    { key: 'youtube', icon: Youtube, url: creator?.youtube },
    { key: 'facebook', icon: Facebook, url: creator?.facebook },
    { key: 'other', icon: LinkIcon, url: creator?.other_link },
  ].filter(link => link.url);

  const creatorName = creator?.first_name 
    ? `${creator.first_name} ${creator.last_name || ''}`.trim()
    : creator?.username || 'Creator';

  return (
    <>
      <SEO 
        title={`Support ${creatorName} on TipKoro`}
        description={creator?.bio || `Send tips to ${creatorName} via bKash, Nagad, Rocket on TipKoro. Support your favorite Bangladeshi creator!`}
        keywords={`${creatorName}, support creator, bKash tips, Nagad tips, TipKoro, Bangladeshi creator`}
        url={`https://tipkoro.com/${creator?.username}`}
        image={creator?.avatar_url || undefined}
        type="profile"
        creatorName={creator?.username || undefined}
      />
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />

        <main className="container max-w-5xl py-8 px-4 animate-fade-in">
          {/* Hero Section */}
          <div className="tipkoro-card mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <Avatar size="x-large" image={creator?.avatar_url || undefined}>
                  {(creator?.first_name?.[0] || creator?.username?.[0] || '?').toUpperCase()}
                </Avatar>
                {creator?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                    <BadgeCheck className="w-6 h-6 text-green-600" />
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold">
                  {creator?.first_name} {creator?.last_name}
                </h1>
                <p className="text-muted-foreground">@{creator?.username}</p>
                
                {creator?.bio && (
                  <p className="mt-4 text-foreground/80 max-w-xl">{DOMPurify.sanitize(creator.bio)}</p>
                )}
                
                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                    {socialLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.url?.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                      >
                        <link.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tip Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="tipkoro-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Support {creator?.first_name || 'this creator'}</h2>
                </div>
                
                <p className="text-muted-foreground text-sm mb-6">
                  Show your appreciation by sending a tip. 100% goes directly to the creator!
                </p>

                {/* Streamer Tip-to-Play Section */}
                {streamerTipOptions.isStreamerEnabled && streamerTipOptions.tipSounds.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Tip-to-Play Sounds</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      These amounts trigger special sounds & visuals on {creator?.first_name}'s stream!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {streamerTipOptions.tipSounds.map((sound) => (
                        <button
                          key={sound.trigger_amount}
                          onClick={() => {
                            setSelectedAmount(sound.trigger_amount);
                            setCustomAmount('');
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                            selectedAmount === sound.trigger_amount
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary/50 hover:bg-primary/10 border-primary/30'
                          }`}
                        >
                          <span className="block">৳{sound.trigger_amount}</span>
                          <span className="text-[10px] opacity-80">{sound.display_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Amount Selection */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                  {tipAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-2 rounded-xl font-medium text-sm transition-all ${
                        selectedAmount === amount
                          ? 'bg-accent text-accent-foreground shadow-md scale-105'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      ৳{amount}
                    </button>
                  ))}
                </div>
                
                {/* Custom Amount */}
                <div className="mb-4">
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    placeholder="Or enter custom amount (min ৳10)"
                    className="tipkoro-input"
                    min={10}
                  />
                </div>
                
                {/* Message */}
                <div className="mb-6">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add an encouraging message (optional)"
                    className="tipkoro-input min-h-[100px]"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {message.length}/200
                  </p>
                </div>
                
                {/* Send Button */}
                <Button
                  onClick={handleTip}
                  disabled={isSubmitting || (!selectedAmount && !customAmount)}
                  className="w-full h-14 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-semibold text-lg rounded-xl"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Send ৳{selectedAmount || customAmount || 0} Tip
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column - Stats, Goals & Recent Supporters */}
            <div className="space-y-6">
              {/* Funding Goals */}
              {fundingGoals.length > 0 && (
                <div className="space-y-3">
                  {fundingGoals.map((goal) => (
                    <FundingGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
              
              <CreatorStats 
                totalSupporters={creator?.total_supporters || 0}
                createdAt={creator?.created_at || null}
              />
              
              {creator?.id && (
                <RecentSupporters creatorId={creator.id} />
              )}
            </div>
          </div>
        </main>

        <MainFooter />
      </div>
    </>
  );
}