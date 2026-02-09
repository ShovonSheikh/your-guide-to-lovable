import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Search, Eye, User } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  account_type: string | null;
  is_verified: boolean | null;
  is_admin: boolean | null;
  total_received: number | null;
  total_supporters: number | null;
  created_at: string;
}

export default function AdminUsers() {
  usePageTitle("Admin - Users");
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      setUsers((data || []) as unknown as UserProfile[]);
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

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  });

  const openUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const UserDetailsContent = () => selectedUser && (
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
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium text-sm break-all">{selectedUser.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account Type</p>
          <Badge variant={selectedUser.account_type === 'creator' ? 'default' : 'secondary'}>
            {selectedUser.account_type}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="flex gap-1 flex-wrap">
            {selectedUser.is_verified && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                Verified
              </Badge>
            )}
            {selectedUser.is_admin && (
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            )}
          </div>
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
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Joined</p>
        <p className="font-medium">
          {format(new Date(selectedUser.created_at), 'MMMM d, yyyy \'at\' HH:mm')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage all platform users</p>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">All Users</CardTitle>
              <CardDescription className="text-xs md:text-sm">{users.length} total users</CardDescription>
            </div>
            <div className="relative">
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
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-3 space-y-2"
                  onClick={() => openUserDetails(user)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.is_admin && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {user.username && (
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={user.account_type === 'creator' ? 'default' : 'secondary'} className="text-[10px]">
                      {user.account_type}
                    </Badge>
                    {user.is_verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
                        Verified
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </span>
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
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
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
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={user.account_type === 'creator' ? 'default' : 'secondary'}>
                          {user.account_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {user.is_verified ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Unverified
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUserDetails(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Sheet for details */}
      {isMobile ? (
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Details
              </SheetTitle>
            </SheetHeader>
            <UserDetailsContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View complete user information</DialogDescription>
            </DialogHeader>
            <UserDetailsContent />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}