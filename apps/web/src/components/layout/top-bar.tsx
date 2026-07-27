import { signOut } from '@/auth';
import { Button } from '@/components/ui/button';

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
      <p className="text-sm text-muted-foreground">{title ?? 'Internal workspace'}</p>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <Button type="submit" variant="secondary" size="sm">
          Sign out
        </Button>
      </form>
    </header>
  );
}
