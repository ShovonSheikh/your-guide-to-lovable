import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, Copy, User, Wallet, CreditCard, Calendar, CheckCircle, Clock, XCircle, Loader2, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WithdrawalDetail {
  id: string;
  profile_id: string;
  amount: number;
  currency: string | null;
  payout_method: string;
  payout_details: unknown;
  status: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  updated_at: string | null;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
}

const formatPayoutDetails = (details: unknown): string => {
  if (!details || typeof details !== 'object') return '-';
  const obj = details as Record<string, string>;
  if (obj.number) return obj.number;
  if (obj.phone) return obj.phone;
  if (obj.account_number) return obj.account_number;
  const values = Object.values(obj);
  return values[0] || '-';
};

export default function AdminWithdrawalDetail() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  usePageTitle("Admin - Withdrawal Details");
  const navigate = useNavigate();
  const supabase = useSupabaseWithAuth();
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawal();
  }, [withdrawalId]);

  const fetchWithdrawal = async () => {
    if (!withdrawalId) return;

    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          creator:profiles!withdrawal_requests_profile_id_fkey (
            first_name,
            last_name,
            username,
            email,
            avatar_url,
            is_verified
          )
        `)
        .eq('id', withdrawalId)
        .single();

      if (error) throw error;
      setWithdrawal(data);
      setAdminNotes(data?.notes || "");
    } catch (error) {
      console.error('Error fetching withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal details",
        variant: "destructive",
      });
      navigate('/admin/withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'approve' | 'reject' | 'complete') => {
    setActionType(action);
    setActionOpen(true);
  };

  const processAction = async () => {
    if (!withdrawal || !actionType) return;

    setProcessing(true);
    try {
      let newStatus: string;
      switch (actionType) {
        case 'approve':
          newStatus = 'processing';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: newStatus,
          notes: adminNotes || null,
          processed_at: newStatus === 'completed' || newStatus === 'rejected' ? new Date().toISOString() : null,
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      // Deduct from total_received if completed (legacy)
      if (newStatus === 'completed') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('total_received')
          .eq('id', withdrawal.profile_id)
          .single();

        if (!profileError && profile) {
          const currentTotal = profile.total_received || 0;
          const newTotal = Math.max(0, currentTotal - withdrawal.amount);

          await supabase
            .from('profiles')
            .update({ total_received: newTotal })
            .eq('id', withdrawal.profile_id);
        }

        // Also deduct from token balance if creator has one
        try {
          await supabase.rpc('process_token_withdrawal', {
            p_profile_id: withdrawal.profile_id,
            p_amount: withdrawal.amount,
            p_reference_id: `withdrawal_${withdrawal.id}`,
            p_description: `Withdrawal completed - ৳${withdrawal.amount}`,
          });
        } catch (tokenErr) {
          console.log('Token withdrawal deduction skipped (non-critical):', tokenErr);
        }
      }

      // Send notification email
      try {
        const notificationType = newStatus === 'processing'
          ? 'withdrawal_processing'
          : newStatus === 'completed'
            ? 'withdrawal_completed'
            : 'withdrawal_rejected';

        await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: withdrawal.profile_id,
            email: withdrawal.creator?.email, // Fallback email
            type: notificationType,
            data: {
              amount: withdrawal.amount,
              reason: adminNotes || undefined,
              first_name: withdrawal.creator?.first_name,
            },
          },
        });
      } catch (notifError) {
        console.log('Notification failed (non-critical):', notifError);
      }

      setWithdrawal(prev => prev ? {
        ...prev,
        status: newStatus,
        notes: adminNotes,
        processed_at: new Date().toISOString()
      } : null);

      toast({
        title: "Success",
        description: `Withdrawal ${actionType === 'approve' ? 'approved for processing' : actionType === 'complete' ? 'marked as completed' : 'rejected'}`,
      });

      setActionOpen(false);
      setActionType(null);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!withdrawal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Withdrawal not found</p>
        <Button variant="link" onClick={() => navigate('/admin/withdrawals')}>
          Go back to withdrawals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/withdrawals')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Withdrawal Details</h1>
            <p className="text-muted-foreground">Request #{withdrawal.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {withdrawal.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleAction('reject')}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => handleAction('approve')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
        {withdrawal.status === 'processing' && (
          <Button onClick={() => handleAction('complete')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawal Amount</p>
                  <p className="text-4xl font-bold text-primary">৳{withdrawal.amount.toLocaleString()}</p>
                </div>
                {getStatusBadge(withdrawal.status)}
              </div>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium flex items-center gap-2">
                  {withdrawal.creator?.first_name} {withdrawal.creator?.last_name}
                  {withdrawal.creator?.is_verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">@{withdrawal.creator?.username}</p>
              </div>
              {withdrawal.creator?.email && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{withdrawal.creator?.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <Badge variant="secondary">{withdrawal.payout_method}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono bg-secondary px-2 py-1 rounded text-sm">
                      {formatPayoutDetails(withdrawal.payout_details)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(formatPayoutDetails(withdrawal.payout_details), 'Account number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {withdrawal.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{withdrawal.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Request Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Request Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Request ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                    {withdrawal.id.slice(0, 8).toUpperCase()}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(withdrawal.id, 'Request ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{withdrawal.currency || 'BDT'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Requested</p>
                <p className="font-medium">{format(new Date(withdrawal.created_at), 'PPpp')}</p>
              </div>
              {withdrawal.updated_at && withdrawal.updated_at !== withdrawal.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(withdrawal.updated_at), 'PPpp')}</p>
                </div>
              )}
              {withdrawal.processed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="font-medium">{format(new Date(withdrawal.processed_at), 'PPpp')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Withdrawal'}
              {actionType === 'complete' && 'Complete Withdrawal'}
              {actionType === 'reject' && 'Reject Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will move the withdrawal to processing status.'}
              {actionType === 'complete' && 'Confirm that the payment has been sent to the creator.'}
              {actionType === 'reject' && 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p className="font-medium text-sm">
                  {withdrawal.creator?.first_name} {withdrawal.creator?.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium text-sm">৳{withdrawal.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-medium text-sm">{withdrawal.payout_method}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium font-mono text-sm">
                  {formatPayoutDetails(withdrawal.payout_details)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes {actionType === 'reject' && '(Required)'}</Label>
              <Textarea
                id="notes"
                placeholder={actionType === 'reject' ? 'Reason for rejection...' : 'Add notes (optional)...'}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              onClick={processAction}
              disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Spinner className="h-4 w-4 mr-2" />}
              {actionType === 'approve' && 'Approve'}
              {actionType === 'complete' && 'Complete'}
              {actionType === 'reject' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
