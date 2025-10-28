// ═══════════════════════════════════════════════════════════════════
// JWT Authentication Middleware
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token required', 401);
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, secret) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { token: token?.substring(0, 20) });
    throw new AppError('Invalid or expired token', 403);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
