import React, { useState, useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useRealtimeTips, RealtimeTip } from "@/hooks/useRealtimeTips";
import { formatDistanceToNow } from "date-fns";

interface LiveTipsFeedProps {
  creatorId?: string;
}

export function LiveTipsFeed({ creatorId }: LiveTipsFeedProps) {
  const { tips, loading } = useRealtimeTips({ creatorId, limit: 5 });
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [prevTipIds, setPrevTipIds] = useState<Set<string>>(new Set());

  // Detect new tips and animate them
  useEffect(() => {
    const currentIds = new Set(tips.map(t => t.id));
    const newTips = tips.filter(t => !prevTipIds.has(t.id));
    
    if (newTips.length > 0 && prevTipIds.size > 0) {
      // Animate the newest tip
      setAnimatingId(newTips[0].id);
      setTimeout(() => setAnimatingId(null), 500);
    }
    
    setPrevTipIds(currentIds);
  }, [tips]);

  if (loading) {
    return (
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Loading...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-background p-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-sm font-medium text-muted-foreground">Live Tips</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tips yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">Live Tips</span>
      </div>
      <div className="flex flex-col gap-3 overflow-hidden">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className={`flex items-start gap-3 rounded-xl bg-background p-3 shadow-sm transition-all duration-500 ease-out ${
              animatingId === tip.id 
                ? "animate-fade-in opacity-100" 
                : "opacity-100"
            }`}
          >
            <Avatar size="small">
              {tip.supporter_name[0].toUpperCase()}
            </Avatar>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{tip.supporter_name}</span>
                <span className="text-sm text-muted-foreground">tipped</span>
                <span className="font-bold text-sm text-primary">৳{tip.amount}</span>
                {tip.message ? (
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
                )}
              </div>
              {tip.message && (
                <p className="text-xs text-muted-foreground truncate">"{tip.message}"</p>
              )}
              <span className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(new Date(tip.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
