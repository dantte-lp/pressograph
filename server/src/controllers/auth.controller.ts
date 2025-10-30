// ═══════════════════════════════════════════════════════════════════
// Authentication Controller
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is disabled', 403);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    };

    // @ts-ignore - JWT expiresIn type mismatch with string
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    // @ts-ignore - JWT expiresIn type mismatch with string
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Log login
    await query(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', JSON.stringify({ username }), req.ip]
    );

    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number };

    // Check if token exists and not revoked
    const result = await query(
      `SELECT rt.*, u.username, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.user_id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > CURRENT_TIMESTAMP`,
      [payload.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid refresh token', 403);
    }

    const user = result.rows[0];

    // Generate new access token
    const newPayload: JWTPayload = {
      id: user.user_id,
      username: user.username,
      role: user.role,
      email: user.email,
    };

    // @ts-ignore - JWT expiresIn type mismatch with string
    const token = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      accessToken: token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Revoke all refresh tokens for this user
    await query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
      [req.user.id]
    );

    // Log logout
    await query(
      'INSERT INTO audit_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [req.user.id, 'logout', req.ip]
    );

    logger.info(`User logged out: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const result = await query(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
