'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ChevronRight, Ellipsis, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isNavActive,
  moreListGroups,
  mobileMoreShortcuts,
  mobilePrimaryTabs,
  roleFlags,
  visibleLink,
  type NavLink,
} from '@/components/layout/nav-config';

export function MobileBottomNav({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { canStaff, canReports, canSettings } = roleFlags(role);

  const primaryActive = mobilePrimaryTabs.some((t) => isNavActive(pathname, t.href));
  const moreActive = moreOpen || !primaryActive;

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const shortcuts = mobileMoreShortcuts.filter((link) =>
    visibleLink(link, role, canStaff, canReports, canSettings),
  );

  const groups = moreListGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((link) =>
        visibleLink(link, role, canStaff, canReports, canSettings),
      ),
    }))
    .filter((g) => g.items.length > 0);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 print:hidden md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[3px] transition-opacity"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
          />

          <div
            className="absolute inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 flex max-h-[min(78svh,34rem)] flex-col overflow-hidden rounded-t-2xl border border-border/80 border-b-0 bg-card shadow-[0_-8px_40px_hsl(222_30%_12%/0.18)]"
            role="dialog"
            aria-modal="true"
            aria-label="More"
          >
            <div className="flex shrink-0 flex-col items-center pt-2.5">
              <span
                className="h-1 w-10 rounded-full bg-border"
                aria-hidden
              />
            </div>

            <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4 pb-3.5 pt-2">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm"
                aria-hidden
              >
                {initials || userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                  {userName}
                </p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {role}
                </p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:bg-border"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {shortcuts.length > 0 ? (
                <section className="mb-4">
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Quick access
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {shortcuts.map((link) => (
                      <ShortcutTile
                        key={link.href}
                        link={link}
                        active={isNavActive(pathname, link.href)}
                        onNavigate={() => setMoreOpen(false)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {groups.map((group) => (
                <section key={group.label} className="mb-3">
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-background/60">
                    {group.items.map((link, index) => {
                      const Icon = link.icon;
                      const active = isNavActive(pathname, link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex min-h-12 items-center gap-3 px-3 transition active:bg-muted',
                            index > 0 && 'border-t border-border/60',
                            active ? 'bg-accent/70' : 'bg-card',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              active
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate text-sm',
                              active ? 'font-semibold text-foreground' : 'font-medium text-foreground',
                            )}
                          >
                            {link.label}
                          </span>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-muted-foreground/70"
                            aria-hidden
                          />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="shrink-0 border-t border-border/70 bg-card px-3 py-2.5">
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50 text-sm font-medium text-red-600 transition active:bg-red-100"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md print:hidden md:hidden"
        aria-label="Primary"
      >
        <div className="grid h-[3.75rem] grid-cols-5">
          {mobilePrimaryTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isNavActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-primary/80"
                    aria-hidden
                  />
                ) : null}
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
                <span className="truncate px-0.5">{tab.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              moreActive ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-expanded={moreOpen}
            aria-label="More"
            onClick={() => setMoreOpen((o) => !o)}
          >
            {moreActive ? (
              <span
                className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-primary/80"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition',
                moreOpen ? 'bg-primary/15' : '',
              )}
            >
              <Ellipsis className="h-5 w-5" strokeWidth={moreActive ? 2 : 1.75} />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function ShortcutTile({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-center transition active:scale-[0.98]',
        active
          ? 'border-primary/30 bg-accent text-accent-foreground shadow-sm'
          : 'border-border/70 bg-background/80 text-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="w-full truncate text-[10px] font-medium leading-tight">{link.label}</span>
    </Link>
  );
}
