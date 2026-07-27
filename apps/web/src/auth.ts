import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@shelfledger/validators';
import { userRepository, type UserRole } from '@shelfledger/db';
import { authConfig } from './auth.config';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    organizationId: string;
    branchId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId: string;
      branchId: string | null;
      emailVerified?: Date | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    organizationId?: string;
    branchId?: string | null;
  }
}

function readSessionFields(token: JWT): {
  role: UserRole;
  organizationId: string;
  branchId: string | null;
  email: string;
  name: string;
} | null {
  if (
    typeof token.role !== 'string' ||
    typeof token.organizationId !== 'string' ||
    typeof token.email !== 'string'
  ) {
    return null;
  }
  return {
    role: token.role as UserRole,
    organizationId: token.organizationId,
    branchId: typeof token.branchId === 'string' ? token.branchId : null,
    email: token.email,
    name: typeof token.name === 'string' ? token.name : '',
  };
}

export const { handlers, auth, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const user = await userRepository.findActiveByEmail(parsed.data.email);
        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        await userRepository.touchLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.branchId = user.branchId;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      const fields = readSessionFields(token);
      if (!token.sub || !fields) {
        return session;
      }
      session.user = {
        id: token.sub,
        email: fields.email,
        name: fields.name,
        role: fields.role,
        organizationId: fields.organizationId,
        branchId: fields.branchId,
        emailVerified: null,
      };
      return session;
    },
  },
});
