import Link from 'next/link';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/stock-ledger', label: 'Stock Ledger' },
  { href: '/brands', label: 'Brands' },
  { href: '/categories', label: 'Categories' },
  { href: '/articles', label: 'Articles' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/staff', label: 'Staff', staffOnly: true },
] as const;

export function AppSidebar({
  role,
  userName,
}: {
  role: string;
  userName: string;
}) {
  const canStaff = role === 'OWNER' || role === 'MANAGER';

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-lg font-semibold tracking-tight">ShelfLedger</p>
        <p className="mt-1 text-xs text-white/60">Retail inventory ERP</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          if ('staffOnly' in link && link.staffOnly && !canStaff) return null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-white/65">
        <p className="truncate font-medium text-white/90">{userName}</p>
        <p className="mt-0.5 uppercase tracking-wide">{role}</p>
      </div>
    </aside>
  );
}
