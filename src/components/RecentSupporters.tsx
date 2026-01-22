import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/Avatar";

interface RecentSupporter {
  id: string;
  supporter_name: string;
  amount: number;
  is_anonymous: boolean;
  created_at: string;
}

interface RecentSupportersProps {
  creatorId: string;
}

export function RecentSupporters({ creatorId }: RecentSupportersProps) {
  const [supporters, setSupporters] = useState<RecentSupporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSupporters();
  }, [creatorId]);

  const fetchRecentSupporters = async () => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('id, supporter_name, amount, is_anonymous, created_at')
        .eq('creator_id', creatorId)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSupporters(data || []);
    } catch (error) {
      console.error('Error fetching recent supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tipkoro-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Supporters</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-1" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (supporters.length === 0) {
    return (
      <div className="tipkoro-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Supporters</h3>
        <div className="text-center py-4">
          <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Be the first to support!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tipkoro-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Supporters</h3>
      <div className="space-y-3">
        {supporters.map((supporter) => {
          const displayName = supporter.is_anonymous ? 'Anonymous' : supporter.supporter_name;
          const initial = displayName[0]?.toUpperCase() || '?';
          
          return (
            <div key={supporter.id} className="flex items-center gap-3">
              <Avatar size="small">
                {initial}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(supporter.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="text-sm font-semibold text-accent-foreground">
                ৳{supporter.amount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}