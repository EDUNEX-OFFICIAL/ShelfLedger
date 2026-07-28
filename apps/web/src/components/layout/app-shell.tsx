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
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { CommandPalette } from '@/features/search/command-palette';
import { ToastProvider } from '@/components/shared/toast';

type ShellCtx = {
  openSearch: () => void;
};

const ShellContext = createContext<ShellCtx | null>(null);

export function useAppShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useAppShell must be used within AppShell');
  return ctx;
}

export function AppShell({
  role,
  userName,
  children,
}: {
  role: string;
  userName: string;
  children: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <ShellContext.Provider value={value}>
      <ToastProvider>
        <div className="flex h-svh overflow-hidden">
          <AppSidebar role={role} userName={userName} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <TopBar userName={userName} role={role} onSearchClick={openSearch} />
            <main className="scrollbar-app flex-1 overflow-y-auto overscroll-contain px-4 pt-5 print:overflow-visible print:p-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:pb-7 md:pt-7">
              {children}
            </main>
          </div>
        </div>
        <MobileBottomNav role={role} userName={userName} />
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </ToastProvider>
    </ShellContext.Provider>
  );
}
