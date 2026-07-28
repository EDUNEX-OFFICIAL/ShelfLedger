import { Button } from '@/components/ui/button';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
};

export function SpinnerButton({
  pending,
  pendingLabel = 'Saving…',
  children,
  disabled,
  ...props
}: Props) {
  return (
    <Button disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
