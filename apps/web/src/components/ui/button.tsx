import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50',
    size === 'sm' && 'h-8 px-3 text-sm',
    size === 'md' && 'h-10 px-4 text-sm',
    size === 'lg' && 'h-11 px-4 text-sm',
    variant === 'primary' &&
      'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
    variant === 'secondary' &&
      'border border-border/80 bg-card text-foreground shadow-sm hover:bg-muted',
    variant === 'ghost' && 'text-foreground hover:bg-muted',
    variant === 'danger' &&
      'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button className={buttonClassName({ variant, size, className })} {...props} />
  );
}
