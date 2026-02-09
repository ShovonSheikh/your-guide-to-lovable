import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, Copy, User, Receipt, CreditCard, Calendar, MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface TipDetail {
  id: string;
  creator_id: string;
  supporter_name: string;
  supporter_email: string | null;
  supporter_id: string | null;
  amount: number;
  currency: string;
  message: string | null;
  is_anonymous: boolean;
  payment_status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
}

export default function AdminTipDetail() {
  const { tipId } = useParams<{ tipId: string }>();
  usePageTitle("Admin - Tip Details");
  const navigate = useNavigate();
  const supabase = useSupabaseWithAuth();
  const [tip, setTip] = useState<TipDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTip();
  }, [tipId]);

  const fetchTip = async () => {
    if (!tipId) return;

    try {
      const { data, error } = await supabase
        .from('tips')
        .select(`
          *,
          creator:profiles!tips_creator_id_fkey (
            first_name,
            last_name,
            username,
            email,
            avatar_url,
            is_verified
          )
        `)
        .eq('id', tipId)
        .single();

      if (error) throw error;
      setTip(data);
    } catch (error) {
      console.error('Error fetching tip:', error);
      toast({
        title: "Error",
        description: "Failed to load tip details",
        variant: "destructive",
      });
      navigate('/admin/tips');
    } finally {
      setLoading(false);
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
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!tip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tip not found</p>
        <Button variant="link" onClick={() => navigate('/admin/tips')}>
          Go back to tips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tips')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tip Details</h1>
          <p className="text-muted-foreground">Transaction #{tip.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-4xl font-bold text-primary">৳{tip.amount.toLocaleString()}</p>
                </div>
                {getStatusBadge(tip.payment_status)}
              </div>
            </CardContent>
          </Card>

          {/* Supporter & Creator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supporter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Supporter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{tip.is_anonymous ? 'Anonymous' : tip.supporter_name}</p>
                </div>
                {!tip.is_anonymous && tip.supporter_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{tip.supporter_email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Anonymous</p>
                  <Badge variant={tip.is_anonymous ? "default" : "secondary"}>
                    {tip.is_anonymous ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Creator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Creator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium flex items-center gap-2">
                    {tip.creator?.first_name} {tip.creator?.last_name}
                    {tip.creator?.is_verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">@{tip.creator?.username}</p>
                </div>
                {tip.creator?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{tip.creator?.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message */}
          {tip.message && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{tip.message}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Transaction Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Transaction Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                    {tip.id.slice(0, 8).toUpperCase()}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(tip.id, 'Transaction ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {tip.transaction_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Gateway ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-secondary px-2 py-1 rounded font-mono truncate max-w-[150px]">
                      {tip.transaction_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tip.transaction_id!, 'Gateway ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <Badge variant="secondary">{tip.payment_method || 'Unknown'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{tip.currency || 'BDT'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(tip.payment_status)}
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
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(tip.created_at), 'PPpp')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
