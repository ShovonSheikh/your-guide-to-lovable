import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { User, Link as LinkIcon, Bell, Shield, CreditCard, ArrowLeft, Info, Calendar, CheckCircle, Clock, Mail, MailOpen, BadgeCheck } from "lucide-react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { VerificationForm } from "@/components/VerificationForm";

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'links', label: 'Social Links', icon: LinkIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'verification', label: 'Verification', icon: BadgeCheck, creatorOnly: true },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function Settings() {
  usePageTitle("Settings");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading, updateProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'profile';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Filter tabs based on account type
  const visibleTabs = tabs.filter(tab => 
    !tab.creatorOnly || profile?.account_type === 'creator'
  );

  // Notification settings hook
  const {
    settings: notificationSettings,
    updateSettings,
    loading: notificationsLoading
  } = useNotifications();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    twitter: '',
    instagram: '',
    youtube: '',
    facebook: '',
    other_link: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || '',
        youtube: profile.youtube || '',
        facebook: profile.facebook || '',
        other_link: profile.other_link || ''
      });
    }
  }, [profile]);

  // Fetch subscription data for creators
  useEffect(() => {
    async function fetchSubscription() {
      if (profile?.account_type === 'creator' && profile?.id) {
        const { data, error } = await supabase
          .from('creator_subscriptions')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('payment_status', 'completed')
          .maybeSingle();

        if (!error && data) {
          setSubscription(data);
        }
        setSubscriptionLoading(false);
      } else {
        setSubscriptionLoading(false);
      }
    }
    fetchSubscription();
  }, [profile?.id, profile?.account_type, supabase]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    setIsSubmitting(true);

    const cleanLink = (link: string) => {
      if (!link) return null;
      return link.replace(/^https?:\/\//, '').trim() || null;
    };

    const result = await updateProfile({
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      bio: formData.bio || null,
      twitter: cleanLink(formData.twitter),
      instagram: cleanLink(formData.instagram),
      youtube: cleanLink(formData.youtube),
      facebook: cleanLink(formData.facebook),
      other_link: cleanLink(formData.other_link)
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved!",
        description: "Your settings have been updated.",
      });
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-4xl py-8 px-4 flex-1">
        {/* Back to Dashboard button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-display font-bold mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 md:w-48 flex-shrink-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${currentTab === tab.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {currentTab === 'profile' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>

                {/* Username display with update guide */}
                <div className="p-4 bg-secondary/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">Username: {profile?.username || 'Not set'}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your username is managed through your account settings. To update it:
                      </p>

                      {isMobile ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="username-guide" className="border-0">
                            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                              How to update your username (Mobile)
                            </AccordionTrigger>
                            <AccordionContent>
                              <Carousel className="w-full max-w-xs mx-auto">
                                <CarouselContent>
                              {[
                                    'https://openpaste.vercel.app/i/e49c46b3',
                                    'https://openpaste.vercel.app/i/4ce9f165',
                                    'https://openpaste.vercel.app/i/c0a9268f',
                                    'https://openpaste.vercel.app/i/90be317c',
                                    'https://openpaste.vercel.app/i/ef19b7b9',
                                  ].map((url, index) => (
                                    <CarouselItem key={index}>
                                      <div className="p-1">
                                        <div className="rounded-lg overflow-hidden border border-border">
                                          <img src={url} alt={`Step ${index + 1}`} className="w-full h-auto" />
                                        </div>
                                        <p className="text-center text-sm font-medium mt-2 text-accent">
                                          Step {index + 1} of 5
                                        </p>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-0" />
                                <CarouselNext className="right-0" />
                              </Carousel>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="username-guide" className="border-0">
                            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                              How to update your username (Desktop)
                            </AccordionTrigger>
                            <AccordionContent>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Click on your profile picture in the top right corner</li>
                                <li>Select "Manage account"</li>
                                <li>Go to "Username" section</li>
                                <li>Click "Edit" and enter your new username</li>
                                <li>Save your changes</li>
                              </ol>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="tipkoro-label">First Name</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Last Name</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="tipkoro-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="tipkoro-label">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="tipkoro-input min-h-[100px]"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/300</p>
                </div>

                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {currentTab === 'links' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Social Links</h2>
                <p className="text-sm text-muted-foreground">
                  Add your social media links. You don't need to include "https://".
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="tipkoro-label">Twitter/X</label>
                    <Input
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="twitter.com/username"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Instagram</label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="instagram.com/username"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">YouTube</label>
                    <Input
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="youtube.com/@channel"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Facebook</label>
                    <Input
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="facebook.com/page"
                      className="tipkoro-input"
                    />
                  </div>
                  <div>
                    <label className="tipkoro-label">Other Link</label>
                    <Input
                      value={formData.other_link}
                      onChange={(e) => setFormData({ ...formData, other_link: e.target.value })}
                      placeholder="yourwebsite.com"
                      className="tipkoro-input"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {currentTab === 'notifications' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Manage how you receive email notifications from TipKoro.
                </p>

                {/* Email Notification Status */}
                <div className="p-4 border rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        We'll send you email updates based on your preferences below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notification Type Toggles */}
                <div className="space-y-4">
                  <h3 className="font-medium text-muted-foreground text-sm">Email Types</h3>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <MailOpen className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Tip Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.account_type === 'creator'
                            ? 'Get an email when you receive a tip'
                            : 'Get an email when your tip is received'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.tips_enabled}
                      onCheckedChange={(checked) => updateSettings({ tips_enabled: checked })}
                      disabled={notificationsLoading}
                    />
                  </div>

                  {profile?.account_type === 'creator' && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <MailOpen className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Withdrawal Updates</p>
                          <p className="text-sm text-muted-foreground">Get an email when your withdrawal is processed</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.withdrawals_enabled}
                        onCheckedChange={(checked) => updateSettings({ withdrawals_enabled: checked })}
                        disabled={notificationsLoading}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <MailOpen className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Promotions & Updates</p>
                        <p className="text-sm text-muted-foreground">Receive news about new features and offers</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.promotions_enabled}
                      onCheckedChange={(checked) => updateSettings({ promotions_enabled: checked })}
                      disabled={notificationsLoading}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Your notification preferences are saved automatically.
                </p>
              </div>
            )}

            {currentTab === 'security' && (
              <div className="tipkoro-card">
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                <p className="text-muted-foreground">Manage your account security through Clerk settings.</p>
              </div>
            )}

            {currentTab === 'verification' && profile?.account_type === 'creator' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5" />
                  Account Verification
                </h2>
                <VerificationForm />
              </div>
            )}

            {currentTab === 'billing' && (
              <div className="tipkoro-card space-y-6">
                <h2 className="text-xl font-semibold">Billing & Subscription</h2>

                {profile?.account_type === 'creator' ? (
                  <div className="space-y-6">
                    {/* Plan Info */}
                    <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="font-semibold">Creator Plan Active</span>
                      </div>
                      <p className="text-2xl font-bold font-display">৳150<span className="text-base font-normal text-muted-foreground">/month</span></p>
                    </div>

                    {/* Subscription Details */}
                    {subscriptionLoading ? (
                      <div className="animate-pulse bg-secondary/50 rounded-xl p-4 h-32" />
                    ) : subscription ? (
                      <div className="space-y-4">
                        <h3 className="font-medium">Subscription Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-secondary/50 rounded-xl">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Billing Started</span>
                            </div>
                            <p className="font-medium">{formatDate(subscription.billing_start)}</p>
                          </div>
                          <div className="p-4 bg-secondary/50 rounded-xl">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Active Until</span>
                            </div>
                            <p className="font-medium">{formatDate(subscription.active_until)}</p>
                          </div>
                        </div>

                        {subscription.promo && (
                          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                            <p className="text-sm text-success font-medium">
                              🎉 You're on the Early Creator Offer! Enjoy 2 free months.
                            </p>
                          </div>
                        )}

                        <div className="p-4 bg-secondary/30 rounded-xl">
                          <p className="text-sm text-muted-foreground mb-2">Payment Method Used</p>
                          <p className="font-medium capitalize">{subscription.payment_method || 'Mobile Payment'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-secondary/30 rounded-xl">
                        <p className="text-sm text-muted-foreground">
                          Your Creator Account Fee (৳150/month) will be deducted from your first earnings.
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <h3 className="font-medium mb-2">How Billing Works</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• A ৳150/month Creator Account Fee is deducted from your earnings</li>
                        <li>• No fee on tips — supporters pay zero, you receive 100%</li>
                        <li>• Withdraw your full available balance anytime (no minimum)</li>
                        <li>• Withdrawals are processed within 3-5 business days</li>
                        <li>• View your earnings and request withdrawals in the Finance section</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You're on the free Supporter plan.</p>
                    <p className="text-sm text-muted-foreground">
                      As a supporter, you can tip your favorite creators for free.
                      Want to receive tips? Upgrade to a Creator account!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
