import { Skeleton } from "@/components/ui/skeleton";

export function WidgetSkeleton() {
  return (
    <div className="h-full min-h-[200px] rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-full min-h-[140px] w-full" />
    </div>
  );
}
