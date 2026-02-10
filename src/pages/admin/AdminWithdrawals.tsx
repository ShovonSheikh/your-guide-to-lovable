import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CheckCircle, XCircle, Clock, Loader2, Wallet, Eye } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatPayoutDetails = (details: unknown): string => {
  if (!details || typeof details !== 'object') return '-';
  const obj = details as Record<string, string>;
  if (obj.number) return obj.number;
  if (obj.phone) return obj.phone;
  if (obj.account_number) return obj.account_number;
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
  const navigate = useNavigate();
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WithdrawalStatus | 'all'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
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
    setActionOpen(true);
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

      if (newStatus === 'completed') {
        // Deduct from total_received (legacy)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('total_received')
          .eq('id', selectedWithdrawal.profile_id)
          .single();

        if (!profileError && profile) {
          const currentTotal = profile.total_received || 0;
          const newTotal = Math.max(0, currentTotal - selectedWithdrawal.amount);

          await supabase
            .from('profiles')
            .update({ total_received: newTotal })
            .eq('id', selectedWithdrawal.profile_id);
        }

        // Also deduct from token balance if creator has one
        try {
          await supabase.rpc('process_token_withdrawal', {
            p_profile_id: selectedWithdrawal.profile_id,
            p_amount: selectedWithdrawal.amount,
            p_reference_id: `withdrawal_${selectedWithdrawal.id}`,
            p_description: `Withdrawal completed - ৳${selectedWithdrawal.amount}`,
          });
        } catch (tokenErr) {
          console.log('Token withdrawal deduction skipped (non-critical):', tokenErr);
        }
      }

      try {
        const notificationType = newStatus === 'processing'
          ? 'withdrawal_processing'
          : newStatus === 'completed'
            ? 'withdrawal_completed'
            : 'withdrawal_rejected';

        await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: selectedWithdrawal.profile_id,
            email: selectedWithdrawal.creator?.email, // Fallback email
            type: notificationType,
            data: {
              amount: selectedWithdrawal.amount,
              reason: adminNotes || undefined,
              first_name: selectedWithdrawal.creator?.first_name,
            },
          },
        });
      } catch (notifError) {
        console.log('Notification failed (non-critical):', notifError);
      }

      setWithdrawals(withdrawals.map(w =>
        w.id === selectedWithdrawal.id
          ? { ...w, status: newStatus, notes: adminNotes, processed_at: new Date().toISOString() }
          : w
      ));

      toast({
        title: "Success",
        description: `Withdrawal ${actionType === 'approve' ? 'approved for processing' : actionType === 'complete' ? 'marked as completed' : 'rejected'}`,
      });

      setActionOpen(false);
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
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] md:text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600 text-[10px] md:text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] md:text-xs"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] md:text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] md:text-xs">{status}</Badge>;
    }
  };

  const filteredWithdrawals = activeTab === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === activeTab);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const processingCount = withdrawals.filter(w => w.status === 'processing').length;

  const ActionDialogContent = () => (
    <>
      {selectedWithdrawal && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Creator</p>
              <p className="font-medium text-sm">
                {selectedWithdrawal.creator?.first_name} {selectedWithdrawal.creator?.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium text-sm">৳{selectedWithdrawal.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="font-medium text-sm">{selectedWithdrawal.payout_method}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="font-medium font-mono text-sm">
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
    </>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground text-sm md:text-base">Process creator withdrawal requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
            <TabsTrigger value="pending" className="relative text-xs md:text-sm">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-white text-[10px] rounded-full px-1.5">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="processing" className="relative text-xs md:text-sm">
              Processing
              {processingCount > 0 && (
                <span className="ml-1.5 bg-blue-500 text-white text-[10px] rounded-full px-1.5">
                  {processingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">Completed</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs md:text-sm">Rejected</TabsTrigger>
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Withdrawal Requests</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {filteredWithdrawals.length} {activeTab === 'all' ? 'total' : activeTab} requests
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {/* Mobile: Card Layout */}
              <div className="md:hidden space-y-3">
                {filteredWithdrawals.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No withdrawal requests found</p>
                  </div>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="border rounded-lg p-3 space-y-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/withdrawals/${withdrawal.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {withdrawal.creator?.first_name} {withdrawal.creator?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{withdrawal.creator?.username}
                          </p>
                        </div>
                        <p className="font-bold text-sm">৳{withdrawal.amount.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{withdrawal.payout_method}</Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatPayoutDetails(withdrawal.payout_details)}
                          </span>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                        </span>

                        <div className="flex items-center gap-2">
                          {withdrawal.status !== 'completed' && withdrawal.status !== 'rejected' && (
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
                              <SelectTrigger
                                className="w-[110px] h-8 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/withdrawals/${withdrawal.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Creator</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Method</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Details</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                          No withdrawal requests found
                        </td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map((withdrawal) => (
                        <tr
                          key={withdrawal.id}
                          className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/withdrawals/${withdrawal.id}`)}
                        >
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">
                                {withdrawal.creator?.first_name} {withdrawal.creator?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{withdrawal.creator?.username}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-medium">
                            ৳{withdrawal.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="secondary">{withdrawal.payout_method}</Badge>
                          </td>
                          <td className="py-3 px-2 text-sm font-mono">
                            {formatPayoutDetails(withdrawal.payout_details)}
                          </td>
                          <td className="py-3 px-2">{getStatusBadge(withdrawal.status)}</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
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
                                  <SelectTrigger
                                    className="w-[130px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/withdrawals/${withdrawal.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile: Sheet for action */}
      {isMobile ? (
        <Sheet open={actionOpen} onOpenChange={setActionOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {actionType === 'approve' && 'Approve Withdrawal'}
                {actionType === 'complete' && 'Complete Withdrawal'}
                {actionType === 'reject' && 'Reject Withdrawal'}
              </SheetTitle>
            </SheetHeader>
            <ActionDialogContent />
            <SheetFooter className="pt-4 flex-row gap-2">
              <Button variant="outline" onClick={() => setActionOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={processAction}
                disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
                className="flex-1"
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === 'approve' && 'Approve'}
                {actionType === 'complete' && 'Complete'}
                {actionType === 'reject' && 'Reject'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={actionOpen} onOpenChange={setActionOpen}>
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
            <ActionDialogContent />
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionOpen(false)}>
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
      )}
    </div>
  );
}