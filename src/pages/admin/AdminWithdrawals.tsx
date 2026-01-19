import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Helper function to format payout details from JSONB
const formatPayoutDetails = (details: unknown): string => {
  if (!details || typeof details !== 'object') return '-';
  const obj = details as Record<string, string>;
  // Common fields: number, phone, account_number
  if (obj.number) return obj.number;
  if (obj.phone) return obj.phone;
  if (obj.account_number) return obj.account_number;
  // Fallback to first value
  const values = Object.values(obj);
  return values[0] || '-';
};

interface Withdrawal {
  id: string;
  profile_id: string;
  amount: number;
  payout_method: string;
  payout_details: unknown;
  status: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email: string;
  };
}

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export default function AdminWithdrawals() {
  usePageTitle("Admin - Withdrawals");
  const supabase = useSupabaseWithAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WithdrawalStatus | 'all'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          creator:profiles!withdrawal_requests_profile_id_fkey (
            first_name,
            last_name,
            username,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (withdrawal: Withdrawal, action: 'approve' | 'reject' | 'complete') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setAdminNotes(withdrawal.notes || "");
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    setProcessing(true);
    try {
      let newStatus: WithdrawalStatus;
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
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      // When withdrawal is completed, decrement the creator's total_received
      if (newStatus === 'completed') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('total_received')
          .eq('id', selectedWithdrawal.profile_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          const currentTotal = profile?.total_received || 0;
          const newTotal = Math.max(0, currentTotal - selectedWithdrawal.amount);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ total_received: newTotal })
            .eq('id', selectedWithdrawal.profile_id);

          if (updateError) {
            console.error('Error updating total_received:', updateError);
          }
        }
      }

      // Send email notification to creator
      try {
        const notificationType = newStatus === 'processing' 
          ? 'withdrawal_processing' 
          : newStatus === 'completed' 
            ? 'withdrawal_completed' 
            : 'withdrawal_rejected';
        
        await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: selectedWithdrawal.profile_id,
            type: notificationType,
            data: {
              amount: selectedWithdrawal.amount,
              reason: adminNotes || undefined,
            },
          },
        });
      } catch (notifError) {
        console.log('Notification failed (non-critical):', notifError);
      }

      // Update local state
      setWithdrawals(withdrawals.map(w =>
        w.id === selectedWithdrawal.id
          ? { ...w, status: newStatus, notes: adminNotes, processed_at: new Date().toISOString() }
          : w
      ));

      toast({
        title: "Success",
        description: `Withdrawal ${actionType === 'approve' ? 'approved for processing' : actionType === 'complete' ? 'marked as completed' : 'rejected'}`,
      });

      setActionDialogOpen(false);
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes("");
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

  const filteredWithdrawals = activeTab === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === activeTab);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const processingCount = withdrawals.filter(w => w.status === 'processing').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground">Process creator withdrawal requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing" className="relative">
            Processing
            {processingCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5">
                {processingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                {filteredWithdrawals.length} {activeTab === 'all' ? 'total' : activeTab} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No withdrawal requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {withdrawal.creator?.first_name} {withdrawal.creator?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{withdrawal.creator?.username}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ৳{withdrawal.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{withdrawal.payout_method}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {formatPayoutDetails(withdrawal.payout_details)}
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'completed' || withdrawal.status === 'rejected' ? (
                              <span className="text-sm text-muted-foreground">-</span>
                            ) : (
                              <Select
                                value={withdrawal.status}
                                onValueChange={(value) => {
                                  if (value === 'processing' && withdrawal.status === 'pending') {
                                    handleAction(withdrawal, 'approve');
                                  } else if (value === 'completed' && withdrawal.status === 'processing') {
                                    handleAction(withdrawal, 'complete');
                                  } else if (value === 'rejected' && withdrawal.status === 'pending') {
                                    handleAction(withdrawal, 'reject');
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending" disabled={withdrawal.status !== 'pending'}>Pending</SelectItem>
                                  <SelectItem value="processing" disabled={withdrawal.status === 'processing'}>Processing</SelectItem>
                                  <SelectItem value="completed" disabled={withdrawal.status !== 'processing'}>Completed</SelectItem>
                                  {withdrawal.status === 'pending' && (
                                    <SelectItem value="rejected" className="text-destructive">Rejected</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Withdrawal'}
              {actionType === 'complete' && 'Complete Withdrawal'}
              {actionType === 'reject' && 'Reject Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will mark the withdrawal as processing.'}
              {actionType === 'complete' && 'Confirm that the payment has been sent.'}
              {actionType === 'reject' && 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Creator</p>
                  <p className="font-medium">
                    {selectedWithdrawal.creator?.first_name} {selectedWithdrawal.creator?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">৳{selectedWithdrawal.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium">{selectedWithdrawal.payout_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-medium font-mono">
                    {formatPayoutDetails(selectedWithdrawal.payout_details)}
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={processAction}
              disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' && 'Approve'}
              {actionType === 'complete' && 'Mark Complete'}
              {actionType === 'reject' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
