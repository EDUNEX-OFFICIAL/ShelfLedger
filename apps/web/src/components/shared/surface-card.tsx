import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClass: Record<SurfacePadding, string> = {
  none: '',
  sm: 'px-4 py-3.5',
  md: 'p-5',
  lg: 'p-5 md:p-6',
};

/** Shared card chrome — use instead of one-off border/shadow stacks. */
export function SurfaceCard({
  padding = 'md',
  interactive = false,
  className,
  children,
}: {
  padding?: SurfacePadding;
  /** Soft hover elevation (links / clickable cards). */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card shadow-card',
        paddingClass[padding],
        interactive &&
          'transition hover:border-primary/20 hover:shadow-md motion-safe:hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
