import { cn } from '@/lib/utils';
import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-primary focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
