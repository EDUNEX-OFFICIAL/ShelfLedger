'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, ChevronDown, Layers, MoreHorizontal, Zap } from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';
import { SegmentedControl } from '@/components/shared/segmented-control';
import { cn } from '@/lib/utils';

export type DashboardRange = 'today' | '7d' | '30d';

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const PREFS_KEY = 'shelfledger.dashboard.prefs';

type DashboardPrefs = {
  showCharts: boolean;
  showMasters: boolean;
};

const DEFAULT_PREFS: DashboardPrefs = {
  showCharts: true,
  showMasters: false,
};

function readPrefs(): DashboardPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<DashboardPrefs>;
    return {
      showCharts: parsed.showCharts ?? true,
      showMasters: parsed.showMasters ?? false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function DashboardRangeFilter({ range }: { range: DashboardRange }) {
  const router = useRouter();
  return (
    <SegmentedControl
      ariaLabel="Dashboard period"
      value={range}
      options={RANGE_OPTIONS}
      size="sm"
      className="w-fit shrink-0"
      onChange={(value) => {
        const qs = new URLSearchParams({ range: value });
        router.push(`/dashboard?${qs.toString()}`);
      }}
    />
  );
}

export function DashboardQuickActions() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/sales/quick"
        className={buttonClassName({
          variant: 'primary',
          size: 'lg',
          className: 'min-w-[8.5rem]',
        })}
      >
        <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Quick Sale
      </Link>

      <div className="relative">
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-label="More actions"
          onClick={() => setMoreOpen((o) => !o)}
          className={buttonClassName({ variant: 'secondary', size: 'md' })}
        >
          More
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition', moreOpen && 'rotate-180')}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
        {moreOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close menu"
              onClick={() => setMoreOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-border/80 bg-card py-1 shadow-md"
            >
              {[
                { href: '/sales', label: 'Draft sale' },
                { href: '/purchases', label: 'New purchase' },
                { href: '/expenses', label: 'Expenses' },
                { href: '/reports', label: 'Reports' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DashboardCustomizeMenu({
  showCharts,
  showMasters,
  onToggleCharts,
  onToggleMasters,
}: {
  showCharts: boolean;
  showMasters: boolean;
  onToggleCharts: () => void;
  onToggleMasters: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName({
          variant: 'ghost',
          size: 'sm',
          className: 'text-muted-foreground',
        })}
      >
        <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        Customize
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close customize menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 z-50 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-lg border border-border/80 bg-card py-1 shadow-md sm:left-auto sm:right-0"
          >
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={showCharts}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={() => {
                onToggleCharts();
              }}
            >
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{showCharts ? 'Hide charts' : 'Show charts'}</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={showMasters}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={() => {
                onToggleMasters();
              }}
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{showMasters ? 'Hide catalog' : 'Show catalog'}</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Client shell: persist chart/catalog visibility; render optional panels. */
export function DashboardOptionalSections({
  charts,
  masters,
}: {
  charts: ReactNode;
  masters: ReactNode;
}) {
  const [prefs, setPrefs] = useState<DashboardPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DashboardCustomizeMenu
          showCharts={prefs.showCharts}
          showMasters={prefs.showMasters}
          onToggleCharts={() =>
            setPrefs((p) => ({ ...p, showCharts: !p.showCharts }))
          }
          onToggleMasters={() =>
            setPrefs((p) => ({ ...p, showMasters: !p.showMasters }))
          }
        />
      </div>

      {prefs.showCharts ? charts : null}
      {prefs.showMasters ? masters : null}
    </div>
  );
}
