'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { CommandPalette } from '@/features/search/command-palette';
import { ToastProvider } from '@/components/shared/toast';
import { readKioskMode, writeKioskMode } from '@/lib/ops-prefs';
import { cn } from '@/lib/utils';

type ShellCtx = {
  openSearch: () => void;
  kiosk: boolean;
  setKiosk: (on: boolean) => void;
};

const ShellContext = createContext<ShellCtx | null>(null);

export function useAppShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useAppShell must be used within AppShell');
  return ctx;
}

/** Safe on pages that may render outside shell during edge cases. */
export function useOptionalAppShell() {
  return useContext(ShellContext);
}

export function AppShell({
  role,
  userName,
  shopName,
  shopMonogram,
  children,
}: {
  role: string;
  userName: string;
  shopName: string;
  shopMonogram: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [kiosk, setKioskState] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  const setKiosk = useCallback((on: boolean) => {
    setKioskState(on);
    writeKioskMode(on);
  }, []);

  useEffect(() => {
    const onQuick = pathname.startsWith('/sales/quick');
    if (!onQuick) {
      setKioskState(false);
      return;
    }
    setKioskState(readKioskMode());
  }, [pathname]);

  useEffect(() => {
    const onEvt = (e: Event) => {
      const detail = (e as CustomEvent<{ on: boolean }>).detail;
      if (detail && typeof detail.on === 'boolean') setKioskState(detail.on);
    };
    window.addEventListener('shelfledger:kiosk', onEvt);
    return () => window.removeEventListener('shelfledger:kiosk', onEvt);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (kiosk) return;
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kiosk]);

  const value = useMemo(
    () => ({ openSearch, kiosk, setKiosk }),
    [openSearch, kiosk, setKiosk],
  );

  return (
    <ShellContext.Provider value={value}>
      <ToastProvider>
        <div className="flex h-svh overflow-hidden">
          {kiosk ? null : (
            <AppSidebar
              role={role}
              userName={userName}
              shopName={shopName}
              shopMonogram={shopMonogram}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {kiosk ? null : (
              <TopBar
                userName={userName}
                role={role}
                shopName={shopName}
                shopMonogram={shopMonogram}
                onSearchClick={openSearch}
              />
            )}
            <main
              className={cn(
                'scrollbar-app flex-1 overflow-y-auto overscroll-contain print:overflow-visible print:p-0',
                kiosk
                  ? 'px-3 pt-3 pb-[env(safe-area-inset-bottom)] md:px-6 md:pt-4'
                  : 'px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:pb-7 md:pt-7',
              )}
            >
              {children}
            </main>
          </div>
        </div>
        {kiosk ? null : <MobileBottomNav role={role} userName={userName} />}
        {kiosk ? null : (
          <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        )}
      </ToastProvider>
    </ShellContext.Provider>
  );
}
