import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// Card skeleton for tipkoro-card style containers
function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("tipkoro-card", className)} {...props}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Stats card skeleton for dashboard/finance stats
function StatsCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("tipkoro-card", className)} {...props}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="p-2 h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

// List item skeleton for tips, transactions, etc.
function ListItemSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-secondary/30", className)} {...props}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

// Creator card skeleton for explore grid
function CreatorCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("tipkoro-card flex flex-col items-center text-center", className)} {...props}>
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-5 w-28 mt-4" />
      <Skeleton className="h-4 w-20 mt-2" />
      <Skeleton className="h-12 w-full mt-4" />
      <Skeleton className="h-4 w-24 mt-4" />
    </div>
  );
}

// Page header skeleton
function PageHeaderSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-64" />
    </div>
  );
}

export { 
  Skeleton, 
  CardSkeleton, 
  StatsCardSkeleton, 
  ListItemSkeleton, 
  CreatorCardSkeleton,
  PageHeaderSkeleton 
};
