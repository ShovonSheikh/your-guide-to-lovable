import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useCreatorStats } from "@/hooks/useCreatorStats";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { Onboarding } from "@/components/Onboarding";
import { RecentTipsList } from "@/components/RecentTipsList";
import { SupporterDashboard } from "@/components/SupporterDashboard";
import { 
  Heart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  Settings,
  Wallet,
  Copy,
  Check,
  ImageIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { stats, recentTips, loading: statsLoading } = useCreatorStats();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Redirect to complete-profile if onboarding not completed
  if (profile && profile.onboarding_status !== 'completed') {
    return <Navigate to="/complete-profile" replace />;
  }

  const profileUrl = profile?.username 
    ? `${window.location.origin}/${profile.username}` 
    : null;

  const copyProfileUrl = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Your profile URL has been copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCreator = profile?.account_type === 'creator';
  const growthPositive = (stats?.growthPercentage || 0) >= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-6xl py-8 px-4 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, {profile?.first_name || 'there'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCreator ? "Here's your creator dashboard" : "Manage your supporter account"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            {isCreator && (
              <Link to="/finance">
                <Button variant="outline" className="gap-2">
                  <Wallet className="w-4 h-4" />
                  Finance
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Creator Dashboard */}
        {isCreator && (
          <>
            {/* Profile URL Card */}
            {profileUrl && (
              <div className="tipkoro-card mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Your TipKoro Page</h3>
                    <p className="text-sm text-muted-foreground">{profileUrl}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={copyProfileUrl} className="gap-2">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Visit
                      </Button>
                    </a>
                    <Link to="/donation-image">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Create Image
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="tipkoro-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <DollarSign className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Received</span>
                </div>
                <p className="text-2xl font-display font-bold">
                  ৳{stats?.totalReceived || profile?.total_received || 0}
                </p>
              </div>
              
              <div className="tipkoro-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">Supporters</span>
                </div>
                <p className="text-2xl font-display font-bold">
                  {stats?.totalSupporters || profile?.total_supporters || 0}
                </p>
              </div>
              
              <div className="tipkoro-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">This Month</span>
                </div>
                <p className="text-2xl font-display font-bold">৳{stats?.thisMonth || 0}</p>
                {(stats?.lastMonth || 0) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last month: ৳{stats.lastMonth}
                  </p>
                )}
              </div>
              
              <div className="tipkoro-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${growthPositive ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {growthPositive ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Growth</span>
                </div>
                <p className={`text-2xl font-display font-bold ${growthPositive ? 'text-success' : 'text-destructive'}`}>
                  {growthPositive ? '+' : ''}{stats?.growthPercentage || 0}%
                </p>
              </div>
            </div>

            {/* Recent Tips */}
            <div className="tipkoro-card">
              <h3 className="text-lg font-semibold mb-4">Recent Tips</h3>
              <RecentTipsList tips={recentTips} loading={statsLoading} />
            </div>
          </>
        )}

        {/* Supporter Dashboard */}
        {!isCreator && <SupporterDashboard />}
      </main>

      <MainFooter />
    </div>
  );
}
