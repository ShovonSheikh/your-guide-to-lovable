import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Search, Receipt } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  creator_id: string;
  supporter_name: string;
  supporter_email: string | null;
  amount: number;
  currency: string;
  message: string | null;
  is_anonymous: boolean;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  };
}

export default function AdminTips() {
  usePageTitle("Admin - Tips");
  const supabase = useSupabaseWithAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select(`
          *,
          creator:profiles!tips_creator_id_fkey (
            first_name,
            last_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-600">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTips = tips.filter(tip => {
    const query = searchQuery.toLowerCase();
    return (
      tip.supporter_name?.toLowerCase().includes(query) ||
      tip.supporter_email?.toLowerCase().includes(query) ||
      tip.creator?.username?.toLowerCase().includes(query) ||
      tip.creator?.first_name?.toLowerCase().includes(query)
    );
  });

  const totalAmount = tips.filter(t => t.payment_status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const completedTipsCount = tips.filter(t => t.payment_status === 'completed').length;

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
        <h1 className="text-2xl font-bold">Tips</h1>
        <p className="text-muted-foreground">All platform transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{tips.filter(t => t.payment_status === 'completed').length} completed transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTipsCount}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tip Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0%</div>
            <p className="text-xs text-muted-foreground">No fee on tips (free)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                All Tips
              </CardTitle>
              <CardDescription>{tips.length} total transactions</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supporter</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No tips found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTips.map((tip) => (
                    <TableRow key={tip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {tip.is_anonymous ? 'Anonymous' : tip.supporter_name}
                          </p>
                          {!tip.is_anonymous && tip.supporter_email && (
                            <p className="text-sm text-muted-foreground">{tip.supporter_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {tip.creator?.first_name} {tip.creator?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">@{tip.creator?.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{tip.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {tip.payment_method ? (
                          <Badge variant="secondary">{tip.payment_method}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(tip.payment_status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {tip.message || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tip.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
