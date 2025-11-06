/**
 * NextAuth Configuration
 *
 * Authentication configuration using NextAuth v4 with Drizzle adapter.
 * Supports credentials-based authentication with bcrypt password hashing.
 * Keycloak SSO support available for future implementation.
 */

import { NextAuthOptions } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
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
      username?: string | null;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    username?: string | null;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,

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
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role || 'user';
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