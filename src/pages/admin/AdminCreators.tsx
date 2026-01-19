import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Search, BadgeCheck, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Creator {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  is_verified: boolean | null;
  total_received: number | null;
  total_supporters: number | null;
  created_at: string;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
}

export default function AdminCreators() {
  const supabase = useSupabaseWithAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'creator')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreators((data || []) as unknown as Creator[]);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    const query = searchQuery.toLowerCase();
    return (
      creator.email?.toLowerCase().includes(query) ||
      creator.username?.toLowerCase().includes(query) ||
      creator.first_name?.toLowerCase().includes(query) ||
      creator.last_name?.toLowerCase().includes(query)
    );
  });

  const verifiedCount = creators.filter(c => c.is_verified).length;
  const unverifiedCount = creators.filter(c => !c.is_verified).length;

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
        <h1 className="text-2xl font-bold">Creators</h1>
        <p className="text-muted-foreground">Manage creator accounts and verification</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creators.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unverifiedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                All Creators
              </CardTitle>
              <CardDescription>{creators.length} total creators</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
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
                  <TableHead>Creator</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Supporters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No creators found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {creator.first_name} {creator.last_name}
                            {creator.is_verified && (
                              <BadgeCheck className="h-4 w-4 text-primary" />
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{creator.email}</p>
                          {creator.username && (
                            <p className="text-xs text-muted-foreground">@{creator.username}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{(creator.total_received || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{creator.total_supporters || 0}</TableCell>
                      <TableCell>
                        {creator.is_verified ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(creator.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {creator.username && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/${creator.username}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
