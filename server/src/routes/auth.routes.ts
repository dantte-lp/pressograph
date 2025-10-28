// ═══════════════════════════════════════════════════════════════════
// Authentication Routes
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user and returns JWT tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login',
  [
    body('username').notEmpty().trim(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// POST /api/v1/auth/refresh
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refreshToken
);

// POST /api/v1/auth/logout
router.post('/logout',
  authenticateToken,
  authController.logout
);

// GET /api/v1/auth/me
router.get('/me',
  authenticateToken,
  authController.getCurrentUser
);

export default router;
