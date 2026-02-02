import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSupabaseWithAuth } from '@/hooks/useSupabaseWithAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Home,
  LayoutDashboard,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  is_public: boolean;
  show_on_home: boolean;
  show_on_dashboard: boolean;
  priority: number;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

const typeOptions = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-500' },
  { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-500' },
];

export default function AdminNotices() {
  usePageTitle('Admin - Notices');
  const navigate = useNavigate();
  const supabase = useSupabaseWithAuth();
  const { permissions, loading: permissionsLoading } = useAdminPermissions();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_active: true,
    is_public: false,
    show_on_home: false,
    show_on_dashboard: false,
    priority: 0,
    ends_at: '',
  });

  useEffect(() => {
    if (!permissionsLoading && !permissions.canManageNotices) {
      navigate('/admin');
      toast({
        title: 'Access Denied',
        description: "You don't have permission to manage notices.",
        variant: 'destructive',
      });
    }
  }, [permissions, permissionsLoading, navigate]);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast({ title: 'Error', description: 'Failed to load notices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canManageNotices) {
      fetchNotices();
    }
  }, [permissions.canManageNotices]);

  const openCreateDialog = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      type: 'info',
      is_active: true,
      is_public: false,
      show_on_home: false,
      show_on_dashboard: false,
      priority: 0,
      ends_at: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      is_active: notice.is_active,
      is_public: notice.is_public ?? false,
      show_on_home: notice.show_on_home,
      show_on_dashboard: notice.show_on_dashboard,
      priority: notice.priority,
      ends_at: notice.ends_at ? notice.ends_at.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        is_active: formData.is_active,
        is_public: formData.is_public,
        show_on_home: formData.show_on_home,
        show_on_dashboard: formData.show_on_dashboard,
        priority: formData.priority,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      };

      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update(payload)
          .eq('id', editingNotice.id);
        if (error) throw error;
        toast({ title: 'Notice Updated', description: 'The notice has been updated.' });
      } else {
        const { error } = await supabase.from('notices').insert(payload);
        if (error) throw error;
        toast({ title: 'Notice Created', description: 'The notice has been created.' });
      }

      setDialogOpen(false);
      fetchNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      toast({ title: 'Error', description: 'Failed to save notice', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Notice Deleted', description: 'The notice has been deleted.' });
      fetchNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast({ title: 'Error', description: 'Failed to delete notice', variant: 'destructive' });
    }
  };

  const getTypeIcon = (type: string) => {
    const opt = typeOptions.find(t => t.value === type);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon className={`w-4 h-4 ${opt.color}`} />;
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
            <Bell className="h-6 w-6 text-primary" />
            Noticeboard
          </h1>
          <p className="text-muted-foreground">Manage announcements shown across the platform</p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Notice
        </Button>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notices yet</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create your first notice
              </Button>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} className={!notice.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(notice.type)}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {notice.title}
                        {!notice.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{notice.content}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(notice)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-xs">
                  {notice.is_public && (
                    <Badge variant="outline" className="gap-1 bg-primary/10 border-primary/20">
                      <Globe className="h-3 w-3" /> Public
                    </Badge>
                  )}
                  {notice.show_on_home && (
                    <Badge variant="outline" className="gap-1">
                      <Home className="h-3 w-3" /> Home
                    </Badge>
                  )}
                  {notice.show_on_dashboard && (
                    <Badge variant="outline" className="gap-1">
                      <LayoutDashboard className="h-3 w-3" /> Dashboard
                    </Badge>
                  )}
                  <Badge variant="outline">Priority: {notice.priority}</Badge>
                  {notice.ends_at && (
                    <Badge variant="outline">Ends: {format(new Date(notice.ends_at), 'MMM d, yyyy')}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
            <DialogDescription>
              {editingNotice ? 'Update the notice details.' : 'Create a new announcement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notice content..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className={`h-4 w-4 ${opt.color}`} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">End Date (optional)</Label>
              <Input
                id="ends_at"
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_public">Show on Public Notices Page</Label>
                  <p className="text-xs text-muted-foreground">Visible at /notices</p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(v) => setFormData({ ...formData, is_public: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_on_home">Show on Home Page</Label>
                <Switch
                  id="show_on_home"
                  checked={formData.show_on_home}
                  onCheckedChange={(v) => setFormData({ ...formData, show_on_home: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_on_dashboard">Show on Dashboard</Label>
                <Switch
                  id="show_on_dashboard"
                  checked={formData.show_on_dashboard}
                  onCheckedChange={(v) => setFormData({ ...formData, show_on_dashboard: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingNotice ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
