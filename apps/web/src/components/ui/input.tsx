import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

/** Hide native number spinners (they clip values in tight counter columns). */
export const inputNoSpinnerClass =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-border/80 bg-card px-3 text-sm outline-none ring-ring focus:ring-2 disabled:opacity-50',
          'aria-[invalid=true]:border-destructive',
          type === 'number' && inputNoSpinnerClass,
          className,
        )}
        {...props}
      />
    );
  },
);
