import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserCheck, UserX, Eye } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  account_type: string;
  is_verified: boolean;
  is_admin: boolean;
  total_received: number;
  total_supporters: number;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_verified: !currentStatus } : u
      ));

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  });

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
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all platform users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{users.length} total users</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                            {user.is_admin && (
                              <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.account_type === 'creator' ? 'default' : 'secondary'}>
                          {user.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVerification(user.id, user.is_verified)}
                          >
                            {user.is_verified ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">@{selectedUser.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <Badge variant={selectedUser.account_type === 'creator' ? 'default' : 'secondary'}>
                    {selectedUser.account_type}
                  </Badge>
                </div>
                {selectedUser.account_type === 'creator' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Received</p>
                      <p className="font-medium">৳{selectedUser.total_received?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supporters</p>
                      <p className="font-medium">{selectedUser.total_supporters || 0}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="font-medium">{selectedUser.is_verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admin</p>
                  <p className="font-medium">{selectedUser.is_admin ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {format(new Date(selectedUser.created_at), 'MMMM d, yyyy \'at\' HH:mm')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
