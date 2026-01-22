import { Heart, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CreatorStatsProps {
  totalSupporters: number;
  createdAt: string | null;
}

export function CreatorStats({ totalSupporters, createdAt }: CreatorStatsProps) {
  const memberSince = createdAt 
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: false })
    : null;

  return (
    <div className="tipkoro-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">{totalSupporters}</p>
            <p className="text-xs text-muted-foreground">Supporters</p>
          </div>
        </div>
        
        {memberSince && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Calendar className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{memberSince}</p>
              <p className="text-xs text-muted-foreground">Member for</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}