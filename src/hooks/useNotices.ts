import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  show_on_home: boolean;
  show_on_dashboard: boolean;
  priority: number;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

export function useNotices(location: 'home' | 'dashboard' | 'all' = 'all') {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        let query = supabase
          .from('notices')
          .select('*')
          .eq('is_active', true)
          .lte('starts_at', new Date().toISOString())
          .order('priority', { ascending: false });

        if (location === 'home') {
          query = query.eq('show_on_home', true);
        } else if (location === 'dashboard') {
          query = query.eq('show_on_dashboard', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter out expired notices
        const activeNotices = (data || []).filter(notice => 
          !notice.ends_at || new Date(notice.ends_at) > new Date()
        );

        setNotices(activeNotices as Notice[]);
      } catch (error) {
        console.error('Error fetching notices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [location]);

  return { notices, loading };
}
