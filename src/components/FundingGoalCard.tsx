import { FundingGoal } from "@/hooks/useFundingGoals";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar } from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

interface FundingGoalCardProps {
  goal: FundingGoal;
  compact?: boolean;
}

export function FundingGoalCard({ goal, compact = false }: FundingGoalCardProps) {
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = goal.target_amount - goal.current_amount;
  const isComplete = goal.current_amount >= goal.target_amount;
  
  const hasEndDate = !!goal.end_date;
  const endDate = hasEndDate ? parseISO(goal.end_date!) : null;
  const isExpired = endDate ? isPast(endDate) : false;

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-foreground">{goal.title}</span>
          </div>
          <span className="text-xs font-medium text-amber-600">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>৳{goal.current_amount.toLocaleString()}</span>
          <span>৳{goal.target_amount.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{goal.title}</h4>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>
            )}
          </div>
        </div>
        {isComplete && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded-full">
            Complete! 🎉
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-amber-600">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">
            ৳{goal.current_amount.toLocaleString()} raised
          </span>
          <span className="text-muted-foreground">
            of ৳{goal.target_amount.toLocaleString()}
          </span>
        </div>

        {!isComplete && (
          <p className="text-xs text-muted-foreground">
            ৳{remaining.toLocaleString()} to go
          </p>
        )}

        {hasEndDate && endDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Calendar className="w-3.5 h-3.5" />
            {isExpired ? (
              <span className="text-red-500">Ended {formatDistanceToNow(endDate)} ago</span>
            ) : (
              <span>{formatDistanceToNow(endDate)} left</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
