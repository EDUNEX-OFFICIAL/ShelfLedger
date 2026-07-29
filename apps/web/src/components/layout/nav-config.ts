import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Zap,
  RefreshCw,
  Users,
  PackagePlus,
  Package,
  ScrollText,
  Wallet,
  BarChart3,
  Tag,
  FolderTree,
  Layers,
  Truck,
  Settings,
  UserCog,
} from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  reportsOnly?: boolean;
  settingsOnly?: boolean;
  staffOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavLink[];
};

/** Full desktop sidebar groups (shop-ops ordered). */
export const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/sales/quick', label: 'Quick Sale', icon: Zap },
      { href: '/sales', label: 'Sales', icon: ShoppingCart },
      { href: '/exchanges', label: 'Exchanges', icon: RefreshCw },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/purchases', label: 'Purchases', icon: PackagePlus },
      { href: '/inventory', label: 'Inventory', icon: Package },
      { href: '/stock-ledger', label: 'Stock history', icon: ScrollText },
      { href: '/expenses', label: 'Expenses', icon: Wallet },
    ],
  },
  {
    label: 'Insights',
    items: [{ href: '/reports', label: 'Reports', icon: BarChart3, reportsOnly: true }],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/brands', label: 'Brands', icon: Tag },
      { href: '/categories', label: 'Categories', icon: FolderTree },
      { href: '/articles', label: 'Articles', icon: Layers },
      { href: '/vendors', label: 'Vendors', icon: Truck },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, settingsOnly: true },
      { href: '/staff', label: 'Staff', icon: UserCog, staffOnly: true },
    ],
  },
];

/**
 * Mobile primary tabs — most → least critical for floor staff:
 * punch bill → find invoice → check stock → exchange/return → More
 */
export const mobilePrimaryTabs: NavLink[] = [
  { href: '/sales/quick', label: 'Sell', icon: Zap },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/inventory', label: 'Stock', icon: Package },
  { href: '/exchanges', label: 'Exchange', icon: RefreshCw },
];

/** Frequent “More” destinations shown as a quick grid on mobile. */
export const mobileMoreShortcuts: NavLink[] = [
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/purchases', label: 'Purchases', icon: PackagePlus },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
];

/** Links that live only under More on mobile (not duplicated in primary tabs). */
export function moreNavGroups(): NavGroup[] {
  const primaryHrefs = new Set(mobilePrimaryTabs.map((t) => t.href));
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !primaryHrefs.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

/** More sheet list groups excluding shortcut tiles (avoid duplicates). */
export function moreListGroups(): NavGroup[] {
  const shortcutHrefs = new Set(mobileMoreShortcuts.map((t) => t.href));
  return moreNavGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !shortcutHrefs.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

export function visibleLink(
  link: NavLink,
  role: string,
  canStaff: boolean,
  canReports: boolean,
  canSettings: boolean,
) {
  if (link.staffOnly && !canStaff) return false;
  if (link.reportsOnly && !canReports) return false;
  if (link.settingsOnly && !canSettings) return false;
  if (link.href === '/settings' && role === 'CASHIER') return false;
  return true;
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/sales/quick') {
    return pathname === '/sales/quick' || pathname.startsWith('/sales/quick/');
  }
  if (href === '/sales') {
    if (pathname === '/sales/quick' || pathname.startsWith('/sales/quick/')) return false;
    return pathname === '/sales' || pathname.startsWith('/sales/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function roleFlags(role: string) {
  return {
    canStaff: role === 'OWNER' || role === 'MANAGER',
    canReports: role === 'OWNER' || role === 'MANAGER' || role === 'VIEWER',
    canSettings: role === 'OWNER' || role === 'MANAGER' || role === 'VIEWER',
  };
}
