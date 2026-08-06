import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DataListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn(className)} aria-busy="true" aria-label="Loading list">
      {/* Mobile chips */}
      <ul className="space-y-2.5 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl border border-border/80 bg-card p-3.5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-[58%]" />
                <Skeleton className="h-3 w-[72%]" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-card md:block">
        <div className="flex gap-4 border-b border-border bg-muted/40 px-3 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        <ul className="divide-y divide-border/80">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-3 py-3.5">
              <Skeleton className="h-3.5 w-[18%]" />
              <Skeleton className="h-3.5 w-[22%]" />
              <Skeleton className="h-3.5 w-[14%]" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
