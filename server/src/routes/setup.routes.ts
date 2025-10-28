// ═══════════════════════════════════════════════════════════════════
// Setup/Installation Routes
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as setupController from '../controllers/setup.controller';

const router = Router();

// GET /api/v1/setup/status
router.get('/status', setupController.getSetupStatus);

// POST /api/v1/setup/initialize
router.post('/initialize',
  [
    body('admin.username').notEmpty().trim(),
    body('admin.email').isEmail().normalizeEmail(),
    body('admin.password').isLength({ min: 8 }),
    body('application.siteName').optional().trim(),
    body('application.timezone').optional(),
    body('application.defaultLanguage').optional(),
  ],
  validate,
  setupController.initialize
);

export default router;
