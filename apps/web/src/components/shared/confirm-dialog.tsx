'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { isSkipConfirmToday, setSkipConfirmToday } from '@/lib/ops-prefs';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  pending,
  onConfirm,
  onCancel,
  children,
  skipConfirmKey,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  /** When set, shows “Don’t ask again today” and persists skip for this calendar day. */
  skipConfirmKey?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [dontAsk, setDontAsk] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDontAsk(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'w-full max-w-md rounded-xl border border-border/80 bg-card p-5 shadow-md outline-none',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        {children ? <div className="mt-4 space-y-3">{children}</div> : null}
        {skipConfirmKey ? (
          <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={dontAsk}
              onChange={(e) => setDontAsk(e.target.checked)}
            />
            Don&apos;t ask again today
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="md"
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              if (skipConfirmKey && dontAsk) setSkipConfirmToday(skipConfirmKey);
              onConfirm();
            }}
            disabled={pending}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if confirm should be skipped for this key today. */
export function shouldSkipConfirm(key: string): boolean {
  return isSkipConfirmToday(key);
}
