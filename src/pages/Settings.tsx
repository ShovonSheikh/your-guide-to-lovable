import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useTickets } from "@/hooks/useTickets";
import { TopNavbar } from "@/components/TopNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Link as LinkIcon, Shield, CreditCard, ArrowLeft, Info, Calendar, CheckCircle, Clock, BadgeCheck, Lock, ShieldCheck, Bell, Video, MessageSquare, Check, Sparkles, TicketIcon, Search, ExternalLink, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { VerificationForm } from "@/components/VerificationForm";
import { WithdrawalPinSetup } from "@/components/WithdrawalPinSetup";
import { ChangePinDialog } from "@/components/ChangePinDialog";
import { StreamerSettings } from "@/components/StreamerSettings";
import { createCreatorCheckout, PLATFORM_FEE } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'links', label: 'Social Links', icon: LinkIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'my-tickets', label: 'My Tickets', icon: MessageSquare },
  { id: 'streamer', label: 'Streamer Mode', icon: Video, creatorOnly: true },
  { id: 'verification', label: 'Verification', icon: BadgeCheck, creatorOnly: true },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

// Security Tab Component
function SecurityTab({ profile }: { profile: any }) {
  const [changePinOpen, setChangePinOpen] = useState(false);
  const { refetch } = useProfile();

  const isCreator = profile?.account_type === 'creator';
  const hasPin = profile?.has_withdrawal_pin;
  const pinSetAt = profile?.withdrawal_pin_set_at;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="tipkoro-card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Settings
        </h2>
        
        {/* Account Security via Clerk */}
        <div className="p-4 bg-secondary/50 rounded-xl mb-6">
          <h3 className="font-medium mb-2">Account Security</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Manage your password, two-factor authentication, and connected accounts through Clerk.
          </p>
          <p className="text-xs text-muted-foreground">
            Click on your profile picture in the top right corner → "Manage account" to access security settings.
          </p>
        </div>

        {/* Withdrawal PIN Section - Only for Creators */}
        {isCreator && (
          <div className="border-t border-border pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Withdrawal PIN
            </h3>
            
            {hasPin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-success/10 rounded-xl border border-success/20">
                  <ShieldCheck className="w-8 h-8 text-success" />
                  <div className="flex-1">
                    <p className="font-medium text-success">Withdrawal PIN Active</p>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {formatDate(pinSetAt)}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setChangePinOpen(true)}
                >
                  <Lock className="w-4 h-4" />
                  Change PIN
                </Button>
                
                <ChangePinDialog 
                  open={changePinOpen} 
                  onOpenChange={setChangePinOpen} 
                />
              </div>
            ) : (
              <WithdrawalPinSetup onSuccess={refetch} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Notifications Tab Component
function NotificationsTab({ profile }: { profile: any }) {
  const supabase = useSupabaseWithAuth();
  const [settings, setSettings] = useState({
    tips_enabled: true,
    withdrawals_enabled: true,
    promotions_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!profile?.id) return;
      
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (data) {
        setSettings({
          tips_enabled: data.tips_enabled ?? true,
          withdrawals_enabled: data.withdrawals_enabled ?? true,
          promotions_enabled: data.promotions_enabled ?? false,
        });
      }
      setLoading(false);
    };
    
    fetchSettings();
  }, [profile?.id, supabase]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        profile_id: profile.id,
        tips_enabled: settings.tips_enabled,
        withdrawals_enabled: settings.withdrawals_enabled,
        promotions_enabled: settings.promotions_enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
    
    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save notification settings", 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Saved!", 
        description: "Notification preferences updated" 
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="tipkoro-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3" />
          <div className="h-16 bg-secondary rounded" />
          <div className="h-16 bg-secondary rounded" />
          <div className="h-16 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tipkoro-card">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Email Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex-1 pr-4">
              <p className="font-medium">Tip Notifications</p>
              <p className="text-sm text-muted-foreground">Receive emails when you receive or send tips</p>
            </div>
            <Switch 
              checked={settings.tips_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, tips_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex-1 pr-4">
              <p className="font-medium">Withdrawal Notifications</p>
              <p className="text-sm text-muted-foreground">Updates on withdrawal requests and OTP codes</p>
            </div>
            <Switch 
              checked={settings.withdrawals_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, withdrawals_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex-1 pr-4">
              <p className="font-medium">Promotional Emails</p>
              <p className="text-sm text-muted-foreground">News, tips, and platform updates from TipKoro</p>
            </div>
            <Switch 
              checked={settings.promotions_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, promotions_enabled: checked }))}
            />
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="mt-6">
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

// My Tickets Tab Component
function MyTicketsTab() {
  const navigate = useNavigate();
  const { tickets, loading } = useTickets();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesSearch = !searchQuery || 
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'waiting_reply': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="tipkoro-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3" />
          <div className="h-12 bg-secondary rounded" />
          <div className="h-24 bg-secondary rounded" />
          <div className="h-24 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tipkoro-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TicketIcon className="w-5 h-5" />
            My Support Tickets
          </h2>
          <Button onClick={() => navigate('/support')} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            New Ticket
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_reply">Awaiting Reply</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ticket List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <TicketIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {tickets.length === 0 
                ? "You haven't submitted any support tickets yet." 
                : "No tickets match your filters."}
            </p>
            {tickets.length === 0 && (
              <Button onClick={() => navigate('/support')} variant="outline">
                Create Your First Ticket
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/support/ticket/${ticket.id}`)}
                className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-accent/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {formatStatus(ticket.status)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Billing Tab Component  
function BillingTab({ profile, subscription, subscriptionLoading, formatDate, supabase, refetchProfile }: { 
  profile: any; 
  subscription: any; 
  subscriptionLoading: boolean;
  formatDate: (date: string | null) => string;
  supabase: any;
  refetchProfile: () => void;
}) {
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [downgradeConfirmText, setDowngradeConfirmText] = useState('');
  const [downgrading, setDowngrading] = useState(false);

  const creatorBenefits = [
    'Custom creator page (tipkoro.com/username)',
    'Receive unlimited tips',
    'Earnings dashboard with analytics',
    'Withdraw to bKash, Nagad, or Rocket',
    'Create funding goals',
    'Streamer Mode with OBS alerts',
  ];

  const handleUpgrade = async () => {
    if (!profile) return;
    
    setUpgrading(true);
    try {
      // Create pending subscription
      await supabase.from('creator_subscriptions').insert({
        profile_id: profile.id,
        amount: PLATFORM_FEE,
        payment_status: 'pending',
      });

      // Redirect to payment
      const result = await createCreatorCheckout({
        fullname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        email: profile.email,
        reference_id: profile.id,
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start upgrade process",
        variant: "destructive",
      });
    }
    setUpgrading(false);
  };

  const handleDowngrade = async () => {
    if (downgradeConfirmText !== 'DOWNGRADE') {
      toast({
        title: "Error",
        description: 'Please type "DOWNGRADE" to confirm',
        variant: "destructive",
      });
      return;
    }

    setDowngrading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: 'supporter' })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Account Downgraded",
        description: "You've been switched to a Supporter account. You can upgrade again anytime.",
      });
      
      setDowngradeDialogOpen(false);
      refetchProfile();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to downgrade account",
        variant: "destructive",
      });
    }
    setDowngrading(false);
  };

  return (
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

          {/* Downgrade Section */}
          <div className="pt-6 border-t border-border">
            <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20">
              <h4 className="font-medium mb-2 text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Downgrade Account
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Switch back to a free Supporter account. You will lose:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>• Your creator page (tipkoro.com/{profile?.username})</li>
                <li>• Ability to receive tips</li>
                <li>• Access to earnings dashboard</li>
                <li>• Streamer Mode features</li>
              </ul>
              <p className="text-xs text-muted-foreground mb-4">
                Your tip history and withdrawal records will be preserved. You can upgrade again anytime.
              </p>
              <Button 
                variant="outline" 
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setDowngradeDialogOpen(true)}
              >
                Downgrade to Supporter
              </Button>
            </div>
          </div>

          {/* Downgrade Confirmation Dialog */}
          <AlertDialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Confirm Downgrade
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <p>
                      This will switch your account to a free Supporter account. This action is reversible — you can upgrade again later.
                    </p>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Type "DOWNGRADE" to confirm:</p>
                      <Input
                        value={downgradeConfirmText}
                        onChange={(e) => setDowngradeConfirmText(e.target.value.toUpperCase())}
                        placeholder="DOWNGRADE"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDowngradeConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDowngrade}
                  disabled={downgradeConfirmText !== 'DOWNGRADE' || downgrading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {downgrading ? "Processing..." : "Confirm Downgrade"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
            <p className="text-xl font-bold">Supporter (Free)</p>
          </div>

          {/* Upgrade CTA */}
          <div className="p-6 bg-gradient-to-br from-accent/10 to-primary/5 rounded-xl border border-accent/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-accent/20">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xl font-bold">Upgrade to Creator</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Start receiving tips from your supporters and unlock all creator features.
            </p>
            <Button 
              onClick={handleUpgrade} 
              disabled={upgrading}
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover font-semibold"
            >
              {upgrading ? "Processing..." : `Upgrade for ৳${PLATFORM_FEE}/month`}
            </Button>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Creator Benefits</h3>
            <ul className="space-y-2">
              {creatorBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Info */}
          <div className="p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-medium mb-2">Pricing</h4>
            <p className="text-sm text-muted-foreground">
              ৳150/month flat fee. No percentage taken from tips — your supporters pay zero, you receive 100%.
              TipKoro commits to never exceeding 20% if we ever change to percentage-based pricing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  usePageTitle("Settings");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading, updateProfile, refetch } = useProfile();
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

      <main className="container max-w-4xl py-8 px-4 pb-16 flex-1">
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
              <NotificationsTab profile={profile} />
            )}

            {currentTab === 'my-tickets' && (
              <MyTicketsTab />
            )}

            {currentTab === 'streamer' && profile?.account_type === 'creator' && (
              <StreamerSettings />
            )}

            {currentTab === 'security' && (
              <SecurityTab profile={profile} />
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
              <BillingTab 
                profile={profile} 
                subscription={subscription} 
                subscriptionLoading={subscriptionLoading}
                formatDate={formatDate}
                supabase={supabase}
                refetchProfile={refetch}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
