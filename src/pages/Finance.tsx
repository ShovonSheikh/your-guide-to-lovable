import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useCreatorStats } from "@/hooks/useCreatorStats";
import { useSupabase } from "@/hooks/useSupabase";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { EarningsChart } from "@/components/EarningsChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  Wallet,
  ArrowDownToLine,
  Calendar,
  Clock,
  AlertCircle,
  History,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { WithdrawalVerificationDialog } from "@/components/WithdrawalVerificationDialog";

interface WithdrawalRequest {
  id: string;
  amount: number;
  payout_method: string;
  payout_details: unknown;
  status: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function Finance() {
  usePageTitle("Finance");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { stats, loading: statsLoading } = useCreatorStats();
  const { config } = usePlatformConfig();
  const supabase = useSupabase();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [usingSavedMethod, setUsingSavedMethod] = useState(false);

  // Load saved payout method from localStorage
  useEffect(() => {
    const savedMethod = localStorage.getItem('lastPayoutMethod');
    const savedNumber = localStorage.getItem('lastPayoutNumber');
    
    if (savedMethod && savedNumber) {
      setPayoutMethod(savedMethod);
      setPayoutDetails(savedNumber);
      setUsingSavedMethod(true);
    }
  }, []);

  // Fetch withdrawal history
  useEffect(() => {
    async function fetchWithdrawals() {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWithdrawals(data || []);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      } finally {
        setWithdrawalsLoading(false);
      }
    }

    fetchWithdrawals();
  }, [profile?.id, supabase]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPayoutMethod = (method: string) => {
    const [provider, type] = method.split('-');
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const typeName = type ? ` (${type.charAt(0).toUpperCase() + type.slice(1)})` : '';
    return `${providerName}${typeName}`;
  };

  const openDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setDetailsDialogOpen(true);
  };

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />
        <main className="container max-w-4xl py-8 px-4 pb-16 animate-fade-in">
          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-6" />
          <div className="h-8 w-40 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="tipkoro-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 h-9 w-9 rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="tipkoro-card h-80 bg-muted/20 animate-pulse" />
            <div className="tipkoro-card h-80 bg-muted/20 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (profile?.account_type !== 'creator') {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate fee based on model (fixed or percentage)
  const totalReceived = stats?.totalReceived || profile?.total_received || 0;
  let creatorFee = 150; // Default fixed fee
  
  if (config.fee_model.type === 'percentage') {
    creatorFee = Math.max(
      config.percentage_fee.min_amount,
      Math.round(totalReceived * (config.percentage_fee.rate / 100))
    );
  } else {
    creatorFee = config.creator_account_fee.amount;
  }
  
  // Calculate pending/processing withdrawals total - prevents multiple withdrawal requests
  const pendingWithdrawalsTotal = withdrawals
    .filter(w => w.status === 'pending' || w.status === 'processing')
    .reduce((sum, w) => sum + w.amount, 0);
  
  // Available balance = Total - Fee - Pending Withdrawals
  const availableBalance = Math.max(0, totalReceived - creatorFee - pendingWithdrawalsTotal);
  const canWithdraw = availableBalance > 0;

  // CSV Export handler
  const handleExportCSV = async () => {
    if (!profile?.id) return;
    setExporting(true);
    
    try {
      const { data: tips, error } = await supabase
        .from('tips')
        .select('id, supporter_name, supporter_email, amount, currency, message, is_anonymous, payment_method, transaction_id, created_at')
        .eq('creator_id', profile.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!tips || tips.length === 0) {
        toast({ title: 'No Data', description: 'No tips to export yet.' });
        return;
      }
      
      // Build CSV
      const headers = ['Date', 'Supporter Name', 'Amount', 'Currency', 'Message', 'Payment Method', 'Transaction ID'];
      const rows = tips.map(tip => [
        format(new Date(tip.created_at), 'yyyy-MM-dd HH:mm:ss'),
        tip.is_anonymous ? 'Anonymous' : tip.supporter_name,
        tip.amount,
        tip.currency || 'BDT',
        `"${(tip.message || '').replace(/"/g, '""')}"`,
        tip.payment_method || '',
        tip.transaction_id || '',
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tipkoro-earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Exported!', description: `${tips.length} tips exported to CSV.` });
    } catch (err) {
      console.error('Export error:', err);
      toast({ title: 'Error', description: 'Failed to export data.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const initiateWithdraw = () => {
    if (!withdrawAmount || !payoutMethod || !payoutDetails) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is verified
    if (!profile?.is_verified) {
      toast({
        title: "Verification Required",
        description: "Please complete identity verification in Settings before requesting withdrawals.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has withdrawal PIN set
    if (!profile?.has_withdrawal_pin) {
      toast({
        title: "Set Withdrawal PIN First",
        description: "Please set up a withdrawal PIN in Settings before requesting a withdrawal.",
        variant: "destructive",
      });
      return;
    }

    // Open verification dialog
    setVerificationDialogOpen(true);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          profile_id: profile?.id,
          amount,
          payout_method: payoutMethod,
          payout_details: { number: payoutDetails }
        });

      if (error) throw error;

      // Save payout method to localStorage for next time
      localStorage.setItem('lastPayoutMethod', payoutMethod);
      localStorage.setItem('lastPayoutNumber', payoutDetails);

      // Refresh withdrawals list
      const { data: newWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('profile_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (newWithdrawals) setWithdrawals(newWithdrawals);

      // Send email notification
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: profile?.id,
            email: profile?.email, // Fallback email
            type: 'withdrawal_submitted',
            data: {
              amount,
              first_name: profile?.first_name,
            },
          },
        });
      } catch (notifError) {
        console.log('Notification failed (non-critical):', notifError);
      }

      toast({
        title: "Withdrawal Requested!",
        description: "Your withdrawal request has been submitted. It will be processed within 3-5 business days.",
      });

      // Clear only the amount, keep payout method for next time
      setWithdrawAmount('');
      setUsingSavedMethod(true);
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-4xl py-8 px-4 pb-16 animate-fade-in">
        {/* Back to Dashboard */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-display font-bold mb-2">Finance</h1>
        <p className="text-muted-foreground mb-6">Manage your earnings and withdrawals</p>

        {/* Verification Warning */}
        {!profile?.is_verified && (
          <div className="tipkoro-card mb-6 border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Verification Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Complete identity verification to enable withdrawals. This helps us keep your funds secure.
                </p>
              </div>
              <Link to="/settings?tab=verification">
                <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 gap-2 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4" />
                  Verify Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <DollarSign className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total Received</span>
            </div>
            <p className="text-2xl font-display font-bold">৳{totalReceived}</p>
          </div>
          
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Wallet className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-display font-bold">৳{availableBalance}</p>
            <p className="text-xs text-muted-foreground mt-1">After ৳{creatorFee} Creator Fee</p>
          </div>
          
          <div className="tipkoro-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-display font-bold">৳{stats?.thisMonth || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <div className="tipkoro-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5" />
              Request Withdrawal
            </h2>
            
            {canWithdraw ? (
              <div className="space-y-4">
                <div>
                  <label className="tipkoro-label">Amount (৳)</label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="tipkoro-input"
                    max={availableBalance}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum: ৳{availableBalance}
                  </p>
                </div>

                <div>
                  <label className="tipkoro-label">Payout Method</label>
                  <Select value={payoutMethod} onValueChange={(value) => {
                    setPayoutMethod(value);
                    setUsingSavedMethod(false);
                  }}>
                    <SelectTrigger className="tipkoro-input">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bkash-personal">bKash - Personal</SelectItem>
                      <SelectItem value="bkash-agent">bKash - Agent</SelectItem>
                      <SelectItem value="nagad-personal">Nagad - Personal</SelectItem>
                      <SelectItem value="nagad-agent">Nagad - Agent</SelectItem>
                      <SelectItem value="rocket-personal">Rocket - Personal</SelectItem>
                      <SelectItem value="rocket-agent">Rocket - Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  {usingSavedMethod && payoutMethod && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-success" /> Using your last payout method
                    </p>
                  )}
                </div>

                <div>
                  <label className="tipkoro-label">
                    {payoutMethod ? `${payoutMethod.split('-')[0].charAt(0).toUpperCase() + payoutMethod.split('-')[0].slice(1)} Number` : 'Account Number'}
                  </label>
                  <Input
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="tipkoro-input"
                  />
                </div>

                <Button 
                  onClick={initiateWithdraw}
                  disabled={isSubmitting}
                  className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
                >
                  {isSubmitting ? "Submitting..." : "Request Withdrawal"}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Withdrawals are processed within 3-5 business days</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No balance available for withdrawal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need to receive at least ৳{creatorFee} in tips to cover the Creator Fee.
                </p>
              </div>
            )}
          </div>

          {/* Earnings Chart */}
          <div className="tipkoro-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Earnings History
              </h2>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export CSV
              </Button>
            </div>
            
            <EarningsChart 
              data={stats?.monthlyEarnings || []} 
              loading={statsLoading} 
            />
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="tipkoro-card mt-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <History className="w-5 h-5" />
            Withdrawal History
          </h2>
          
          {withdrawalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No withdrawal requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your withdrawal history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div 
                  key={withdrawal.id} 
                  onClick={() => openDetails(withdrawal)}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <Wallet className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">৳{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPayoutMethod(withdrawal.payout_method)} • {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <div className="tipkoro-card mt-8">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Creator Fee</h3>
              <p className="text-sm text-muted-foreground">
                A ৳{creatorFee}/month Creator Fee is automatically deducted from your earnings. 
                This covers payment processing, hosting, and platform maintenance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Withdrawal Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="font-semibold text-lg">৳{selectedWithdrawal.amount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Payout Method</p>
                <p className="font-medium">{formatPayoutMethod(selectedWithdrawal.payout_method)}</p>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                <p className="font-medium font-mono">{(selectedWithdrawal.payout_details as { number?: string })?.number || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Requested On</p>
                  <p className="font-medium">{format(new Date(selectedWithdrawal.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                {selectedWithdrawal.processed_at && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Processed On</p>
                    <p className="font-medium">{format(new Date(selectedWithdrawal.processed_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
              </div>

              {selectedWithdrawal.notes && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm">{selectedWithdrawal.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Verification Dialog */}
      <WithdrawalVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        amount={parseFloat(withdrawAmount) || 0}
        payoutMethod={payoutMethod}
        payoutDetails={payoutDetails}
        onSuccess={() => {
          setVerificationDialogOpen(false);
          handleWithdraw();
        }}
      />
    </div>
  );
}
