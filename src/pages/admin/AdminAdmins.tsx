import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSupabase } from "@/hooks/useSupabase";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  UserPlus, 
  Shield, 
  Trash2, 
  Search,
  Crown,
  LayoutDashboard,
  Users,
  BadgeCheck,
  ShieldCheck,
  Wallet,
  Receipt,
  Mail,
  Settings
} from "lucide-react";

interface AdminRole {
  id: string;
  user_id: string;
  can_view_dashboard: boolean;
  can_manage_users: boolean;
  can_manage_creators: boolean;
  can_manage_verifications: boolean;
  can_manage_withdrawals: boolean;
  can_view_tips: boolean;
  can_manage_mailbox: boolean;
  can_manage_settings: boolean;
  can_manage_admins: boolean;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface SearchResult {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  username: string | null;
}

const permissionLabels = [
  { key: 'can_view_dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'can_manage_users', label: 'Users', icon: Users },
  { key: 'can_manage_creators', label: 'Creators', icon: BadgeCheck },
  { key: 'can_manage_verifications', label: 'Verifications', icon: ShieldCheck },
  { key: 'can_manage_withdrawals', label: 'Withdrawals', icon: Wallet },
  { key: 'can_view_tips', label: 'Tips', icon: Receipt },
  { key: 'can_manage_mailbox', label: 'Mailbox', icon: Mail },
  { key: 'can_manage_settings', label: 'Settings', icon: Settings },
  { key: 'can_manage_admins', label: 'Admins', icon: Crown },
] as const;

export default function AdminAdmins() {
  usePageTitle("Admin - Manage Admins");
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { permissions, loading: permissionsLoading } = useAdminPermissions();
  
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRole | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if no permission to manage admins
  useEffect(() => {
    if (!permissionsLoading && !permissions.canManageAdmins) {
      navigate('/admin');
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage admins.",
        variant: "destructive",
      });
    }
  }, [permissions, permissionsLoading, navigate]);

  const fetchAdmins = async () => {
    try {
      const { data: adminRoles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profile info for each admin
      const adminsWithProfiles = await Promise.all(
        (adminRoles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, avatar_url')
            .eq('user_id', role.user_id)
            .single();
          
          return { ...role, profile };
        })
      );

      setAdmins(adminsWithProfiles);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to load admins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canManageAdmins) {
      fetchAdmins();
    }
  }, [permissions.canManageAdmins]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, username')
        .or(`email.ilike.%${query}%,username.ilike.%${query}%,first_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      
      // Filter out users who are already admins
      const existingAdminIds = admins.map(a => a.user_id);
      const filtered = (data || []).filter(u => !existingAdminIds.includes(u.user_id));
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const addAdmin = async (userId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_roles')
        .insert({
          user_id: userId,
          can_view_dashboard: true,
          can_manage_users: false,
          can_manage_creators: false,
          can_manage_verifications: false,
          can_manage_withdrawals: false,
          can_view_tips: false,
          can_manage_mailbox: false,
          can_manage_settings: false,
          can_manage_admins: false,
        });

      if (error) throw error;

      // Also set is_admin = true on their profile
      await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', userId);

      toast({
        title: "Admin Added",
        description: "New admin has been added successfully.",
      });
      
      setAddDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePermission = async (adminId: string, key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ [key]: value })
        .eq('id', adminId);

      if (error) throw error;

      setAdmins(prev => 
        prev.map(admin => 
          admin.id === adminId 
            ? { ...admin, [key]: value }
            : admin
        )
      );

      toast({
        title: "Permission Updated",
        description: "Admin permissions have been updated.",
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  const removeAdmin = async (admin: AdminRole) => {
    if (!confirm(`Are you sure you want to remove this admin?`)) return;

    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('id', admin.id);

      if (error) throw error;

      // Also remove is_admin flag
      await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('user_id', admin.user_id);

      toast({
        title: "Admin Removed",
        description: "Admin has been removed successfully.",
      });
      
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin",
        variant: "destructive",
      });
    }
  };

  const isSuperAdmin = (admin: AdminRole) => {
    return admin.can_manage_admins && 
           admin.can_manage_users && 
           admin.can_manage_creators && 
           admin.can_manage_verifications &&
           admin.can_manage_withdrawals &&
           admin.can_view_tips &&
           admin.can_manage_mailbox &&
           admin.can_manage_settings;
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Management
          </h1>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Search for a user by email or username to add them as an admin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-secondary/50 cursor-pointer"
                      onClick={() => addAdmin(user.user_id)}
                    >
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email} {user.username && `(@${user.username})`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" disabled={saving}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No users found
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin List */}
      <div className="space-y-4">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {admin.profile?.first_name?.[0] || '?'}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {admin.profile?.first_name} {admin.profile?.last_name}
                      {isSuperAdmin(admin) && (
                        <Badge variant="default" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Super Admin
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{admin.profile?.email}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeAdmin(admin)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {permissionLabels.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/30"
                  >
                    <Switch
                      checked={admin[key as keyof AdminRole] as boolean}
                      onCheckedChange={(checked) => updatePermission(admin.id, key, checked)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {admins.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No admins configured</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
