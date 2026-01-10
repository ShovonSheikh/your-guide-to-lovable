import React from 'react';
import { Avatar } from '@/components/Avatar';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Tip {
  id: string;
  supporter_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

interface RecentTipsListProps {
  tips: Tip[];
  loading?: boolean;
  emptyMessage?: string;
}

export function RecentTipsList({ tips, loading, emptyMessage = "No tips yet" }: RecentTipsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{emptyMessage}</p>
        <p className="text-sm mt-1">Share your profile link to start receiving tips!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <div
          key={tip.id}
          className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Avatar size="small">
            {tip.supporter_name[0].toUpperCase()}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {tip.is_anonymous ? 'Anonymous' : tip.supporter_name}
              </span>
              <span className="text-sm text-muted-foreground">tipped</span>
              <span className="font-bold text-sm text-primary">৳{tip.amount}</span>
              {tip.message ? (
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
              )}
            </div>
            {tip.message && (
              <p className="text-xs text-muted-foreground mt-1 truncate">"{tip.message}"</p>
            )}
            <span className="text-xs text-muted-foreground/60">
              {formatDistanceToNow(new Date(tip.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
