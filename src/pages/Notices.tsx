import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  starts_at: string;
}

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function Notices() {
  usePageTitle('Announcements');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicNotices = async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, content, type, created_at, starts_at')
          .eq('is_public', true)
          .eq('is_active', true)
          .lte('starts_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out expired notices client-side
        const activeNotices = (data || []).filter((notice: any) => 
          !notice.ends_at || new Date(notice.ends_at) > new Date()
        );

        setNotices(activeNotices as Notice[]);
      } catch (error) {
        console.error('Error fetching public notices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicNotices();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      
      <main className="flex-1 container max-w-3xl pt-24 pb-12 px-4 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Stay updated with the latest news and updates from TipKoro
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No announcements yet</h2>
            <p className="text-muted-foreground">
              Check back later for updates and news from TipKoro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => {
              const config = typeConfig[notice.type] || typeConfig.info;
              const Icon = config.icon;

              return (
                <article 
                  key={notice.id} 
                  className={`p-6 rounded-xl border ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold">{notice.title}</h2>
                        <Badge variant="outline" className="text-xs capitalize">
                          {notice.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap mb-3">
                        {DOMPurify.sanitize(notice.content)}
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(notice.starts_at || notice.created_at), 'MMMM d, yyyy')}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <MainFooter />
    </div>
  );
}
