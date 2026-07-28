'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpinnerButton } from '@/components/shared/spinner-button';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const nextErrors: { email?: string; password?: string } = {};
        if (!email.trim()) nextErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          nextErrors.email = 'Enter a valid email';
        }
        if (!password) nextErrors.password = 'Password is required';
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        startTransition(async () => {
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });
          if (result?.error) {
            setError('Invalid email or password. Too many attempts? Wait a minute and retry.');
            return;
          }
          router.push(callbackUrl);
          router.refresh();
        });
      }}
    >
      <FormField id="email" label="Email" required error={fieldErrors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          aria-invalid={Boolean(fieldErrors.email)}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <FormField id="password" label="Password" required error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={Boolean(fieldErrors.password)}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <SpinnerButton
        type="submit"
        size="lg"
        className="w-full"
        pending={pending}
        pendingLabel="Signing in…"
      >
        Sign in
      </SpinnerButton>
    </form>
  );
}
