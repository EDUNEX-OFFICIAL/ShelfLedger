'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

function initialsFromName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return initials || name.slice(0, 2).toUpperCase() || '?';
}

export function TopBar({
  userName,
  role,
  onSearchClick,
}: {
  userName: string;
  role: string;
  onSearchClick: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = initialsFromName(userName);
  const labelId = useId();

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2.5 border-b border-border/80 bg-card/85 px-3 backdrop-blur-md print:hidden sm:gap-3 md:px-8">
      {/* Mobile brand — desktop already has sidebar wordmark */}
      <Link
        href="/sales/quick"
        className="flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label="ShelfLedger home"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-tight text-primary-foreground shadow-sm">
          SL
        </span>
      </Link>

      <button
        type="button"
        onClick={onSearchClick}
        className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border/80 bg-muted/60 px-3 text-left text-sm text-muted-foreground shadow-sm transition hover:border-border hover:bg-muted md:max-w-xl"
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="truncate">Search invoices, customers, SKUs…</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
          Ctrl+K
        </kbd>
      </button>

      {/* Push profile to the far right on desktop */}
      <div className="ml-auto flex shrink-0 items-center">
        <PopoverPrimitive.Root open={profileOpen} onOpenChange={setProfileOpen} modal={false}>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-9 items-center gap-2 rounded-full border border-border/80 bg-card pl-1 pr-1 shadow-sm transition sm:pr-2.5',
                'hover:border-primary/30 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                profileOpen && 'border-primary/40 bg-accent ring-2 ring-ring/30',
              )}
              aria-label="Open profile menu"
              aria-haspopup="menu"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block max-w-[9rem] truncate text-xs font-semibold leading-tight text-foreground">
                  {userName}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {role}
                </span>
              </span>
              <ChevronDown
                className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground md:block"
                aria-hidden
              />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[16.5rem] overflow-hidden rounded-xl border border-border/80 bg-card shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="border-b border-border/70 px-3.5 py-3" id={labelId}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1.5" role="menu" aria-labelledby={labelId}>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
                  <span className="text-xs">Signed in as staff</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    setProfileOpen(false);
                    void signOut({ callbackUrl: '/login' });
                  }}
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    </header>
  );
}
