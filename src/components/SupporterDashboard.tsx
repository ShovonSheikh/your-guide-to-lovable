import React from 'react';
import { Link } from 'react-router-dom';
import { useSupporterDonations } from '@/hooks/useSupporterDonations';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, DollarSign, ExternalLink, TrendingUp, Calendar, Settings, Gift, Sparkles } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function SupporterDashboard() {
  const { data, loading } = useSupporterDonations();

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="tipkoro-card animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Activity Skeleton */}
        <div className="tipkoro-card animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTips = data?.donations.length || 0;
  const totalDonated = data?.totalDonated || 0;
  const creatorsSupported = data?.creatorsSupported || 0;

  // Get unique creators for "Recent Creators Supported"
  const recentCreators = data?.donations.reduce((acc: any[], donation) => {
    const existing = acc.find(c => c.creator_username === donation.creator_username);
    if (!existing) {
      acc.push({
        creator_username: donation.creator_username,
        creator_name: donation.creator_name,
        creator_avatar: donation.creator_avatar,
        last_tip_amount: donation.amount,
        last_tip_date: donation.created_at,
      });
    }
    return acc;
  }, []).slice(0, 5) || [];

  if (!data || data.donations.length === 0) {
    return (
      <div className="space-y-8">
        {/* Empty Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Tips Sent</span>
            </div>
            <p className="text-2xl font-display font-bold">0</p>
          </div>
          
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <DollarSign className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total Donated</span>
            </div>
            <p className="text-2xl font-display font-bold">৳0</p>
          </div>
          
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Users className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Creators Supported</span>
            </div>
            <p className="text-2xl font-display font-bold">0</p>
          </div>
        </div>

        {/* Empty State CTA */}
        <div className="tipkoro-card text-center py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-semibold mb-2">Start Supporting Creators!</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Discover amazing creators on TipKoro and show them your appreciation with tips. 
            Every tip helps them continue creating awesome content.
          </p>
          <Link to="/explore">
            <Button className="gap-2 bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover">
              <Users className="w-4 h-4" />
              Explore Creators
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/settings" className="tipkoro-card hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Account Settings</h4>
                <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
              </div>
            </div>
          </Link>
          
          <Link to="/explore" className="tipkoro-card hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Trending Creators</h4>
                <p className="text-sm text-muted-foreground">Discover popular creators to support</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Become a Creator CTA */}
        <Card className="border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 rounded-full bg-accent/20">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Become a Creator</h3>
                <p className="text-sm text-muted-foreground">
                  Start receiving tips from your supporters. Only ৳150/month Creator Account Fee.
                </p>
              </div>
            <Link to="/settings?tab=billing">
              <Button className="bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tipkoro-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Tips Sent</span>
          </div>
          <p className="text-2xl font-display font-bold">{totalTips}</p>
        </div>
        
        <div className="tipkoro-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <DollarSign className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Total Donated</span>
          </div>
          <p className="text-2xl font-display font-bold">৳{totalDonated.toLocaleString()}</p>
        </div>
        
        <div className="tipkoro-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/20">
              <Users className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Creators Supported</span>
          </div>
          <p className="text-2xl font-display font-bold">{creatorsSupported}</p>
        </div>
      </div>

      {/* Recent Creators Supported */}
      {recentCreators.length > 0 && (
        <div className="tipkoro-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Recent Creators Supported
          </h3>
          <div className="grid gap-3">
            {recentCreators.map((creator) => (
              <Link
                key={creator.creator_username}
                to={`/${creator.creator_username}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar size="small" image={creator.creator_avatar || undefined}>
                  {creator.creator_name[0]?.toUpperCase() || '?'}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{creator.creator_name}</p>
                  <p className="text-xs text-muted-foreground">@{creator.creator_username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-primary">৳{creator.last_tip_amount}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(creator.last_tip_date), { addSuffix: true })}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Donation History */}
      <div className="tipkoro-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Your Donation History
        </h3>
        <div className="space-y-3">
          {data.donations.slice(0, 10).map((donation) => (
            <div
              key={donation.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Avatar size="small" image={donation.creator_avatar || undefined}>
                {donation.creator_name[0]?.toUpperCase() || '?'}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">You tipped</span>
                  <Link 
                    to={`/${donation.creator_username}`}
                    className="font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {donation.creator_name}
                  </Link>
                  <span className="font-bold text-sm text-primary">৳{donation.amount}</span>
                </div>
                {donation.message && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">"{donation.message}"</p>
                )}
                <span className="text-xs text-muted-foreground/60">
                  {format(new Date(donation.created_at), 'PPp')}
                </span>
              </div>
              <Link to={`/${donation.creator_username}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/explore">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Discover More Creators
            </Button>
          </Link>
          
          <Link to="/settings">
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              <Settings className="w-4 h-4" />
              Account Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Become a Creator CTA */}
      <Card className="border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-full bg-accent/20">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Become a Creator</h3>
              <p className="text-sm text-muted-foreground">
                Start receiving tips from your supporters. Only ৳150/month Creator Account Fee.
              </p>
            </div>
            <Link to="/settings?tab=billing">
              <Button className="bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
