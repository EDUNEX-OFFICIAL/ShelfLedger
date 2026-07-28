'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Rare inventory actions — collapsed until CTA / hash opens them. */
export function InventoryActionPanel({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hash = `#${id}`;

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === hash) setOpen(true);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [hash]);

  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            window.history.replaceState(null, '', hash);
          } else if (window.location.hash === hash) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search,
            );
          }
        }}
        className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-3.5 text-left shadow-card transition hover:border-primary/20"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition',
            open && 'rotate-180',
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      {open ? children : null}
    </section>
  );
}
