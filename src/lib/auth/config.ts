/**
 * NextAuth Configuration
 *
 * Authentication configuration using NextAuth v4 with Drizzle adapter.
 * Supports OAuth providers and database session storage.
 */

import { NextAuthOptions } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,

  providers: [
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Note: Credentials provider is intentionally not implemented.
    // This application uses OAuth-only authentication for enhanced security.
    // Password storage and management is avoided by design.
    // Supported: GitHub OAuth, Google OAuth
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },

  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },

    async signIn({ account }) {
      // Allow OAuth sign-ins
      if (account?.provider !== 'credentials') {
        return true;
      }

      // For credentials, we already validated in authorize
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    async signOut() {
      console.log(`User signed out`);
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
    async updateUser({ user }) {
      console.log(`User updated: ${user.email}`);
    },
    async linkAccount({ user }) {
      console.log(`Account linked for user: ${user.email}`);
    },
    async session() {
      // Session accessed
    },
  },

  debug: process.env.NODE_ENV === 'development',
};