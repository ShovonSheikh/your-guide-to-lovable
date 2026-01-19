import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { createTipCheckout } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { 
  Heart, 
  ExternalLink, 
  Twitter, 
  Instagram, 
  Youtube, 
  Facebook,
  Link as LinkIcon,
  CheckCircle
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
}

const tipAmounts = [50, 100, 200, 500, 1000];

export default function CreatorProfile() {
  const { username } = useParams<{ username: string }>();
  const { user, isLoaded } = useUser();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Dynamic page title based on creator
  usePageTitle(creator ? `${creator.first_name || creator.username} - Creator` : "Creator Profile");
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (username) {
      fetchCreator();
    }
  }, [username]);

  const fetchCreator = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username?.toLowerCase())
        .eq('account_type', 'creator')
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

    setIsSubmitting(true);

    try {
      // Store tip info in localStorage to complete after payment
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-4xl py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator Info */}
          <div className="lg:col-span-2">
            <div className="tipkoro-card">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar size="x-large" image={creator?.avatar_url || undefined}>
                  {(creator?.first_name?.[0] || creator?.username?.[0] || '?').toUpperCase()}
                </Avatar>
                
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-display font-bold">
                      {creator?.first_name} {creator?.last_name}
                    </h1>
                    {creator?.is_verified && (
                      <CheckCircle className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{creator?.username}</p>
                  
                  {creator?.bio && (
                    <p className="mt-4 text-foreground/80">{creator.bio}</p>
                  )}
                  
                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                      {socialLinks.map((link) => (
                        <a
                          key={link.key}
                          href={`https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                        >
                          <link.icon className="w-5 h-5" />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4 mt-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {creator?.total_supporters || 0} supporters
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="lg:col-span-1">
            <div className="tipkoro-card sticky top-28">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                Send a Tip
              </h3>
              
              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {tipAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                      selectedAmount === amount
                        ? 'bg-accent text-accent-foreground'
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
                  placeholder="Custom amount (min ৳10)"
                  className="tipkoro-input"
                  min={10}
                />
              </div>
              
              {/* Message */}
              <div className="mb-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  className="tipkoro-input min-h-[80px]"
                  maxLength={200}
                />
              </div>
              
              {/* Send Button */}
              <Button
                onClick={handleTip}
                disabled={isSubmitting || (!selectedAmount && !customAmount)}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-semibold"
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Send ৳{selectedAmount || customAmount || 0}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                100% goes to the creator (minus platform fee)
              </p>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
