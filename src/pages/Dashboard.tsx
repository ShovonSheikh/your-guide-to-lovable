import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useCreatorStats } from "@/hooks/useCreatorStats";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { NoticeBar } from "@/components/NoticeBar";
import { useNotices } from "@/hooks/useNotices";
import { Button } from "@/components/ui/button";
import { RecentTipsList } from "@/components/RecentTipsList";
import { SupporterDashboard } from "@/components/SupporterDashboard";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { SetupChecklist } from "@/components/SetupChecklist";
import { 
  Heart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Wallet,
  ShieldAlert
} from "lucide-react";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { stats, recentTips, loading: statsLoading } = useCreatorStats();
  const { notices } = useNotices('dashboard');

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

  if (profile && profile.onboarding_status !== 'completed') {
    return <Navigate to="/complete-profile" replace />;
  }

  const isCreator = profile?.account_type === 'creator';
  const growthPositive = (stats?.growthPercentage || 0) >= 0;
  const hasSocialLinks = Boolean(profile?.twitter || profile?.instagram || profile?.youtube || profile?.facebook || profile?.other_link);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-6xl py-8 px-4 flex-1">
        {/* Notices */}
        <NoticeBar notices={notices} />

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
            {/* Withdrawal PIN Warning */}
            {!profile?.has_withdrawal_pin && (
              <div className="tipkoro-card mb-6 border-2 border-amber-400 bg-amber-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="p-3 rounded-full bg-amber-100">
                    <ShieldAlert className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900">Secure Your Withdrawals</h3>
                    <p className="text-sm text-amber-700">
                      Set up a 6-digit withdrawal PIN to protect your earnings before requesting withdrawals.
                    </p>
                  </div>
                  <Link to="/settings?tab=security">
                    <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 gap-2 whitespace-nowrap">
                      <ShieldAlert className="w-4 h-4" />
                      Set PIN Now
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Setup Checklist */}
            <SetupChecklist 
              hasWithdrawalPin={profile?.has_withdrawal_pin || false}
              isVerified={profile?.is_verified || false}
              hasSocialLinks={hasSocialLinks}
              hasAvatar={Boolean(profile?.avatar_url)}
            />

            {/* Quick Actions */}
            <DashboardQuickActions 
              username={profile?.username}
              profileId={profile?.id}
              displayName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
            />

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
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
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
    </div>
  );
}