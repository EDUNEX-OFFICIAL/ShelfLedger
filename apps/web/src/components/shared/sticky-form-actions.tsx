import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Mobile sticky primary action bar (sits above bottom nav).
 * Desktop: in-flow, no sticky chrome.
 */
export function StickyFormActions({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 border-t border-border/80 bg-card/95 px-4 py-3 backdrop-blur-md print:hidden',
        'md:static md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none',
        className,
      )}
    >
      <div className={cn('mx-auto max-w-lg md:mx-0 md:max-w-none', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

/** Extra bottom padding so sticky CTA does not cover form fields on mobile. */
export const stickyFormPadClass =
  'pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0';

/** Taller sticky bar (e.g. Quick Sale mini total + Punch). */
export const stickyFormPadTallClass =
  'pb-[calc(9.75rem+env(safe-area-inset-bottom))] md:pb-0';
