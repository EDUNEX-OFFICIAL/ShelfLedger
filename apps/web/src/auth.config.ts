import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config (no Node APIs / Prisma / bcrypt).
 * Full credentials provider lives in `auth.ts` (Node runtime).
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === '/login' ||
        pathname.startsWith('/api/health') ||
        pathname.startsWith('/api/auth');
      if (isPublic) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
