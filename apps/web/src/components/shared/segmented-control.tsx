'use client';

import { cn } from '@/lib/utils';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

/** Compact 2–4 option control — prefer over Select for short fixed sets. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  size = 'sm',
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-fit max-w-full shrink-0 rounded-lg border border-border/80 bg-card p-0.5 shadow-sm',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md font-medium transition',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3 text-sm',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
