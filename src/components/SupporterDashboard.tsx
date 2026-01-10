import React from 'react';
import { Link } from 'react-router-dom';
import { useSupporterDonations } from '@/hooks/useSupporterDonations';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { Heart, Users, DollarSign, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SupporterDashboard() {
  const { data, loading } = useSupporterDonations();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="tipkoro-card animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
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

  if (!data || data.donations.length === 0) {
    return (
      <div className="tipkoro-card text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-accent" />
        <h3 className="text-xl font-semibold mb-2">You're a Supporter!</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Browse creators on TipKoro and show them your support with tips.
        </p>
        <Link to="/explore">
          <Button className="gap-2">
            <Users className="w-4 h-4" />
            Explore Creators
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="tipkoro-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Donated</span>
          </div>
          <p className="text-2xl font-display font-bold">৳{data.totalDonated}</p>
        </div>
        
        <div className="tipkoro-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/20">
              <Users className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Creators Supported</span>
          </div>
          <p className="text-2xl font-display font-bold">{data.creatorsSupported}</p>
        </div>
      </div>

      {/* Donation History */}
      <div className="tipkoro-card">
        <h3 className="text-lg font-semibold mb-4">Your Donation History</h3>
        <div className="space-y-3">
          {data.donations.map((donation) => (
            <div
              key={donation.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Avatar size="small" image={donation.creator_avatar || undefined}>
                {donation.creator_name[0].toUpperCase()}
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
                  {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
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
        
        <div className="mt-6 text-center">
          <Link to="/explore">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Discover More Creators
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
