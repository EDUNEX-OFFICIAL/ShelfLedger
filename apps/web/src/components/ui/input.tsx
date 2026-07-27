import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none ring-primary focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
