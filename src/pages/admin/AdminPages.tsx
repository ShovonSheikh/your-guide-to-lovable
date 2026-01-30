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
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Pencil, Eye, ExternalLink, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminPages() {
  usePageTitle('Admin - Pages');
  const navigate = useNavigate();
  const supabase = useSupabaseWithAuth();
  const { permissions, loading: permissionsLoading } = useAdminPermissions();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    is_published: true,
  });

  useEffect(() => {
    if (!permissionsLoading && !permissions.canManagePages) {
      navigate('/admin');
      toast({
        title: 'Access Denied',
        description: "You don't have permission to manage pages.",
        variant: 'destructive',
      });
    }
  }, [permissions, permissionsLoading, navigate]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canManagePages) {
      fetchPages();
    }
  }, [permissions.canManagePages]);

  const openCreateDialog = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      content: '',
      meta_description: '',
      is_published: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      meta_description: page.meta_description || '',
      is_published: page.is_published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Slug, title, and content are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        title: formData.title,
        content: formData.content,
        meta_description: formData.meta_description || null,
        is_published: formData.is_published,
      };

      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update(payload)
          .eq('id', editingPage.id);
        if (error) throw error;
        toast({ title: 'Page Updated', description: 'The page has been updated.' });
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) throw error;
        toast({ title: 'Page Created', description: 'The page has been created.' });
      }

      setDialogOpen(false);
      fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      if (error?.code === '23505') {
        toast({ title: 'Error', description: 'A page with this slug already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to save page', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
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
            <FileText className="h-6 w-6 text-primary" />
            Pages
          </h1>
          <p className="text-muted-foreground">Manage editable content pages</p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Page
        </Button>
      </div>

      {/* Pages List */}
      <div className="grid gap-4">
        {pages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pages yet</p>
            </CardContent>
          </Card>
        ) : (
          pages.map((page) => (
            <Card key={page.id} className={!page.is_published ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {page.title}
                      {!page.is_published && <Badge variant="secondary">Draft</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      /{page.slug} • Updated {format(new Date(page.updated_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(page)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {page.is_published && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {page.meta_description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.meta_description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create Page'}</DialogTitle>
            <DialogDescription>
              {editingPage ? 'Update the page content.' : 'Create a new content page.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-1">/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="page-slug"
                    disabled={!!editingPage}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Page title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="## Heading

Write your content here using Markdown..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description (SEO)</Label>
              <Input
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Brief description for search engines..."
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{formData.meta_description.length}/160</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="is_published">Published</Label>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingPage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
