import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  BadgeCheck, 
  User, 
  ImageIcon, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";

interface VerificationRequest {
  id: string;
  profile_id: string;
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export default function AdminVerifications() {
  usePageTitle("Admin - Verifications");
  
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profile:profiles!verification_requests_profile_id_fkey (
            id,
            first_name,
            last_name,
            username,
            email,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as VerificationRequest[]);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: VerificationRequest, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedRequest || !action) return;

    setProcessing(true);
    try {
      // Update verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      // If approved, update the profile's is_verified status
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', selectedRequest.profile_id);

        if (profileError) throw profileError;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            profile_id: selectedRequest.profile_id,
            type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
            data: {
              reason: adminNotes || undefined
            }
          }
        });
      } catch (emailError) {
        console.log('Email notification failed (non-critical):', emailError);
      }

      toast({
        title: action === 'approve' ? "Verification Approved" : "Verification Rejected",
        description: `The creator has been ${action === 'approve' ? 'verified' : 'rejected'}.`
      });

      setActionDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        title: "Error",
        description: "Failed to process verification request",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BadgeCheck className="h-6 w-6" />
          Verification Requests
        </h1>
        <p className="text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} pending requests` : 'Review creator verification requests'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pendingCount > 0 && <Badge className="ml-2" variant="secondary">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BadgeCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">No {activeTab} verification requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {request.profile?.avatar_url ? (
                            <img src={request.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {request.profile?.first_name} {request.profile?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.profile?.username || 'unknown'} • {request.profile?.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {format(new Date(request.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(request.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Documents
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(request, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Documents Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Verification Documents</DialogTitle>
            <DialogDescription>
              {selectedRequest?.profile?.first_name} {selectedRequest?.profile?.last_name} (@{selectedRequest?.profile?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium mb-2">ID Card Front</p>
              <div 
                className="aspect-[4/3] bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => setImagePreview(selectedRequest?.id_front_url || null)}
              >
                {selectedRequest?.id_front_url ? (
                  <img src={selectedRequest.id_front_url} alt="ID Front" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">ID Card Back</p>
              <div 
                className="aspect-[4/3] bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => setImagePreview(selectedRequest?.id_back_url || null)}
              >
                {selectedRequest?.id_back_url ? (
                  <img src={selectedRequest.id_back_url} alt="ID Back" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Selfie</p>
              <div 
                className="aspect-[4/3] bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => setImagePreview(selectedRequest?.selfie_url || null)}
              >
                {selectedRequest?.selfie_url ? (
                  <img src={selectedRequest.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? 'This will mark the creator as verified. This action cannot be undone.'
                : 'Please provide a reason for rejecting this verification request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Admin Notes {action === 'reject' && <span className="text-destructive">*</span>}</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={action === 'approve' ? 'Optional notes...' : 'Reason for rejection...'}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={processAction}
              disabled={processing || (action === 'reject' && !adminNotes.trim())}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl p-0">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
