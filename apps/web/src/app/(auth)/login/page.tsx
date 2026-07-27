import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(210_25%_10%)] px-4">
      <div className="w-full max-w-md rounded-md border border-white/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">ShelfLedger</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Staff access for inventory & billing.</p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
