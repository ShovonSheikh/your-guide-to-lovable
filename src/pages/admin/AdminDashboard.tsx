import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Users, Wallet, Receipt, TrendingUp, Clock, BadgeCheck, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  totalSupporters: number;
  totalTips: number;
  totalTipsAmount: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  thisMonthTips: number;
  thisMonthAmount: number;
  unreadEmails: number;
}

interface RecentActivity {
  id: string;
  type: 'tip' | 'withdrawal' | 'signup';
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  usePageTitle("Admin - Dashboard");
  const supabase = useSupabaseWithAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('account_type');

      const totalUsers = profiles?.length || 0;
      const totalCreators = profiles?.filter(p => p.account_type === 'creator').length || 0;
      const totalSupporters = profiles?.filter(p => p.account_type === 'supporter').length || 0;

      const { data: tips } = await supabase
        .from('tips')
        .select('amount, created_at, payment_status')
        .eq('payment_status', 'completed');

      const totalTips = tips?.length || 0;
      const totalTipsAmount = tips?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthTips = tips?.filter(t => new Date(t.created_at) >= startOfMonth).length || 0;
      const thisMonthAmount = tips?.filter(t => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount, status')
        .eq('status', 'pending');

      const pendingWithdrawals = withdrawals?.length || 0;
      const pendingWithdrawalsAmount = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      // Fetch unread emails count
      const { count: unreadEmails } = await supabase
        .from('inbound_emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_deleted', false);

      setStats({
        totalUsers,
        totalCreators,
        totalSupporters,
        totalTips,
        totalTipsAmount,
        pendingWithdrawals,
        pendingWithdrawalsAmount,
        thisMonthTips,
        thisMonthAmount,
        unreadEmails: unreadEmails || 0,
      });

      const { data: recentTips } = await supabase
        .from('tips')
        .select('id, supporter_name, amount, created_at')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('id, amount, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      const activity: RecentActivity[] = [
        ...(recentTips?.map(t => ({
          id: t.id,
          type: 'tip' as const,
          message: `${t.supporter_name} sent ৳${t.amount} tip`,
          created_at: t.created_at,
        })) || []),
        ...(recentWithdrawals?.map(w => ({
          id: w.id,
          type: 'withdrawal' as const,
          message: `Withdrawal request: ৳${w.amount} (${w.status})`,
          created_at: w.created_at,
        })) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: `${stats?.totalCreators} creators, ${stats?.totalSupporters} supporters`,
      color: "text-blue-500"
    },
    {
      title: "Total Tips",
      value: `৳${(stats?.totalTipsAmount || 0).toLocaleString()}`,
      icon: Receipt,
      description: `${stats?.totalTips} transactions`,
      color: "text-green-500"
    },
    {
      title: "This Month",
      value: `৳${(stats?.thisMonthAmount || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: `${stats?.thisMonthTips} tips this month`,
      color: "text-purple-500"
    },
    {
      title: "Pending Withdrawals",
      value: stats?.pendingWithdrawals || 0,
      icon: Wallet,
      description: `৳${(stats?.pendingWithdrawalsAmount || 0).toLocaleString()} total`,
      color: "text-orange-500"
    },
    {
      title: "Unread Emails",
      value: stats?.unreadEmails || 0,
      icon: Mail,
      description: "Inbox messages",
      color: "text-pink-500"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">Overview of your platform</p>
      </div>

      {/* Stats Grid - Mobile responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats - Mobile stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Latest transactions and events</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="space-y-2 md:space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {activity.type === 'tip' ? (
                        <Receipt className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Wallet className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="text-xs md:text-sm truncate">{activity.message}</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(activity.created_at), 'MMM d')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BadgeCheck className="h-4 w-4 md:h-5 md:w-5" />
              Platform Summary
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Key platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-muted-foreground">Creator Fee</span>
                <span className="font-medium text-sm md:text-base">৳150/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-muted-foreground">Tip Fee</span>
                <span className="font-medium text-green-600 text-sm md:text-base">0% (Free)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-muted-foreground">Active Creators</span>
                <span className="font-medium text-sm md:text-base">{stats?.totalCreators || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-muted-foreground">Est. Monthly Revenue</span>
                <span className="font-medium text-green-600 text-sm md:text-base">
                  ৳{((stats?.totalCreators || 0) * 150).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}