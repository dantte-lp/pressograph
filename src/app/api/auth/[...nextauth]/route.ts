/**
 * NextAuth API Route Handler
 *
 * This file handles all authentication API routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/[provider]
 * - /api/auth/session
 * - /api/auth/csrf
 * - /api/auth/providers
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };