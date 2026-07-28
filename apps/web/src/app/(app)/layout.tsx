import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AppShell } from '@/components/layout/app-shell';
import { getShopBranding } from '@/server/branding';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const shop = await getShopBranding(session?.user?.organizationId);
  return {
    title: {
      default: shop.name,
      template: `%s · ${shop.name}`,
    },
    description: `${shop.name} — retail inventory and GST billing`,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const shop = await getShopBranding(session.user.organizationId);

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name}
      shopName={shop.name}
      shopMonogram={shop.monogram}
    >
      {children}
    </AppShell>
  );
}
