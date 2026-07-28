import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';
import { getShopBranding } from '@/server/branding';
import { SHOP_TAGLINE } from '@/lib/shop-branding';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShopBranding();
  return {
    title: `Sign in · ${shop.name}`,
    description: `${shop.name} — staff sign in`,
  };
}

export default async function LoginPage() {
  const shop = await getShopBranding();

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-sidebar" aria-hidden />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 20% 20%, hsl(173 40% 28% / 0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, hsl(220 40% 30% / 0.4), transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-xl border border-border/80 bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-sm">
            {shop.monogram}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-foreground">
              {shop.name}
            </p>
            <p className="text-xs text-muted-foreground">{SHOP_TAGLINE}</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Staff access for counter &amp; back office.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
