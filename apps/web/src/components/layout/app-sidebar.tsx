'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isNavActive,
  navGroups,
  roleFlags,
  visibleLink,
} from '@/components/layout/nav-config';

export function AppSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const { canStaff, canReports, canSettings } = roleFlags(role);

  return (
    <aside className="sticky top-0 z-30 hidden h-svh w-[15.5rem] shrink-0 flex-col border-r border-black/20 bg-sidebar text-sidebar-foreground print:hidden md:flex">
      <div className="shrink-0 px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-sm"
            aria-hidden
          >
            SL
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
              ShelfLedger
            </p>
            <p className="truncate text-[11px] text-[hsl(var(--sidebar-muted))]">
              Inventory & GST billing
            </p>
          </div>
        </div>
      </div>

      <nav className="scrollbar-sidebar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-3 py-4">
        {navGroups.map((group) => {
          const items = group.items.filter((link) =>
            visibleLink(link, role, canStaff, canReports, canSettings),
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--sidebar-muted))]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((link) => {
                  const Icon = link.icon;
                  const active = isNavActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[hsl(var(--sidebar-active))] font-medium text-white shadow-sm'
                          : 'text-white/75 hover:bg-[hsl(var(--sidebar-hover))] hover:text-white',
                      )}
                    >
                      {active ? (
                        <span
                          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[hsl(173_55%_55%)]"
                          aria-hidden
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-[hsl(173_55%_70%)]' : 'text-white/45 group-hover:text-white/70',
                        )}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-[hsl(173_48%_22%)] text-[11px] font-semibold tracking-wide text-primary-foreground shadow-sm"
              aria-hidden
            >
              {userName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('') || userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-white/95">
                {userName}
              </p>
              <span className="mt-1 inline-flex rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--sidebar-muted))]">
                {role}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 text-xs font-medium text-red-300/95 transition hover:border-red-400/35 hover:bg-red-500/15 hover:text-red-200 active:scale-[0.99]"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
