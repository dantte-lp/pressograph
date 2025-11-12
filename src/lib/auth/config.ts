/**
 * NextAuth Configuration
 *
 * Authentication configuration using NextAuth v4 with Drizzle adapter.
 * Supports credentials-based authentication with bcrypt password hashing.
 * Keycloak SSO support available for future implementation.
 */

import { NextAuthOptions } from 'next-auth';
// import { DrizzleAdapter } from '@auth/drizzle-adapter'; // Not needed for JWT strategy
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      organizationId?: string | null;
      createdAt?: string | null;
      lastLoginAt?: string | null;
    };
  }

  interface User {
    username?: string | null;
    role: string;
    organizationId?: string | null;
    createdAt?: Date;
    lastLoginAt?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    role: string;
    organizationId?: string | null;
    createdAt?: string | null;
    lastLoginAt?: string | null;
  }
}

// Validate NEXTAUTH_URL environment variable
if (!process.env.NEXTAUTH_URL) {
  console.warn('[NextAuth Warning] NEXTAUTH_URL is not set. Using default value.');
}

// Validate NEXTAUTH_SECRET environment variable
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('[NextAuth Error] NEXTAUTH_SECRET environment variable is required but not set.');
}

export const authOptions: NextAuthOptions = {
  // Trust host header for NextAuth (fixes CLIENT_FETCH_ERROR in some environments)
  // This is safe when NEXTAUTH_URL is properly configured
  trustHost: true,

  // NOTE: Adapter is commented out because we're using JWT strategy
  // When using JWT strategy, database adapter is not needed for sessions
  // Uncomment if switching to database sessions (set strategy: 'database' below)
  // adapter: DrizzleAdapter(db) as any,

  providers: [
    // Credentials Provider - Username/Password Authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'username',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        try {
          // Find user in database by username
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, credentials.username.toLowerCase()))
            .limit(1);

          // Check if user exists and has a password
          if (!user || !user.password) {
            throw new Error('Invalid username or password');
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error('Account is disabled. Please contact support.');
          }

          // Verify password using bcrypt
          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid username or password');
          }

          // Update last login timestamp
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

          // Return user object (password excluded)
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          };
        } catch (error) {
          console.error('[Auth Error]', error);
          // Return null to show generic error to user (security best practice)
          return null;
        }
      },
    }),

    // FUTURE ENHANCEMENT: Keycloak SSO Integration
    // Uncomment and configure when ready to implement enterprise SSO
    /*
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER, // e.g., https://keycloak.example.com/realms/myrealm
    }),
    */
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },

  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username as string;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.createdAt = token.createdAt;
        session.user.lastLoginAt = token.lastLoginAt;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role || 'user';
        token.organizationId = user.organizationId;
        token.createdAt = user.createdAt?.toISOString();
        token.lastLoginAt = user.lastLoginAt?.toISOString();
      }
      return token;
    },

    async signIn({ account }) {
      // Credentials provider: validation already done in authorize()
      if (account?.provider === 'credentials') {
        return true;
      }

      // Future OAuth/SSO providers can add validation here
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Use environment variable or fallback to baseUrl
      const BASE_URL = process.env.NEXTAUTH_URL || baseUrl;

      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth Redirect]', {
          url,
          baseUrl,
          BASE_URL,
          nodeEnv: process.env.NODE_ENV,
        });
      }

      // If starts with /, make it absolute with base URL
      if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
      }

      // If it's a relative URL (no protocol), treat as path
      if (!url.includes('://')) {
        return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }

      // Allow redirects to the same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(BASE_URL);

        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[NextAuth Redirect] URL parsing error:', error);
        }
      }

      // For security, don't redirect to external domains
      // Default to dashboard
      return `${BASE_URL}/dashboard`;
    },
  },

  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    async signOut({ session, token }) {
      console.log('[NextAuth Event] User signed out', {
        session: session?.user?.email,
        token: token?.sub,
      });
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