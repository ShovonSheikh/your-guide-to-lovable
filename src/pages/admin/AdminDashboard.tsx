import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Users, Wallet, Receipt, TrendingUp, Clock, BadgeCheck } from "lucide-react";
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
}

interface RecentActivity {
  id: string;
  type: 'tip' | 'withdrawal' | 'signup';
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const supabase = useSupabaseWithAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('account_type');

      const totalUsers = profiles?.length || 0;
      const totalCreators = profiles?.filter(p => p.account_type === 'creator').length || 0;
      const totalSupporters = profiles?.filter(p => p.account_type === 'supporter').length || 0;

      // Fetch tips data
      const { data: tips } = await supabase
        .from('tips')
        .select('amount, created_at, payment_status')
        .eq('payment_status', 'completed');

      const totalTips = tips?.length || 0;
      const totalTipsAmount = tips?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // This month's tips
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const thisMonthTips = tips?.filter(t => new Date(t.created_at) >= startOfMonth).length || 0;
      const thisMonthAmount = tips?.filter(t => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Fetch pending withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount, status')
        .eq('status', 'pending');

      const pendingWithdrawals = withdrawals?.length || 0;
      const pendingWithdrawalsAmount = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

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
      });

      // Fetch recent activity (latest tips and withdrawals)
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest transactions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {activity.type === 'tip' ? (
                        <Receipt className="h-4 w-4 text-green-500" />
                      ) : (
                        <Wallet className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm">{activity.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Platform Summary
            </CardTitle>
            <CardDescription>Key platform metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Creator Account Fee</span>
                <span className="font-medium">৳150/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tip Fee</span>
                <span className="font-medium text-green-600">0% (Free)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Creators</span>
                <span className="font-medium">{stats?.totalCreators || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Monthly Revenue</span>
                <span className="font-medium text-green-600">
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
