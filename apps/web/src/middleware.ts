import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';
import { clientIpFromHeaders, rateLimitAllow } from '@/lib/rate-limit';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/auth');
  const isLoggedIn = !!req.auth;

  // Login / credentials callback: 5 attempts per IP per minute
  if (
    req.method === 'POST' &&
    (pathname.startsWith('/api/auth/callback/credentials') ||
      pathname.startsWith('/api/auth/signin') ||
      pathname.startsWith('/api/auth/callback/credentials/'))
  ) {
    const ip = clientIpFromHeaders(req.headers);
    const allowed = rateLimitAllow(`login:ip:${ip}`, 5, 60_000);
    if (!allowed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many login attempts. Try again shortly.',
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(allowed.retryAfterSec) },
        },
      );
    }
  }

  if (!isLoggedIn && !isPublic) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  if (isLoggedIn && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
