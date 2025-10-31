// ═══════════════════════════════════════════════════════════════════
// Graph Generation Routes
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as graphController from '../controllers/graph.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All graph routes require authentication
router.use(authenticateToken);

// POST /api/v1/graph/generate
router.post(
  '/generate',
  [
    body('testNumber').notEmpty(),
    body('startDate').isISO8601(),
    body('startTime').notEmpty(),
    body('testDuration').isNumeric(),
    body('workingPressure').isNumeric(),
  ],
  validate,
  graphController.generateGraph
);

// POST /api/v1/graph/export/png
router.post('/export/png', graphController.exportPNG);

// POST /api/v1/graph/export/pdf
router.post('/export/pdf', graphController.exportPDF);

// POST /api/v1/graph/export/json
router.post('/export/json', graphController.exportJSON);

// POST /api/v1/graph/validate
router.post('/validate', graphController.validateSettings);

// GET /api/v1/graph/history
router.get('/history', graphController.getHistory);

// DELETE /api/v1/graph/history/:id
router.delete('/history/:id', graphController.deleteGraph);

// PATCH /api/v1/graph/history/:id/comment
router.patch(
  '/history/:id/comment',
  [body('comment').isString()],
  validate,
  graphController.updateComment
);

// GET /api/v1/graph/history/:id/download
router.get('/history/:id/download', graphController.downloadGraph);

// POST /api/v1/graph/history/:id/regenerate
router.post('/history/:id/regenerate', graphController.regenerateGraph);

// POST /api/v1/graph/share
router.post(
  '/share',
  [
    body('graphId').isInt(),
    body('expiresIn').optional().isInt(),
    body('maxViews').optional().isInt(),
    body('allowDownload').optional().isBoolean(),
  ],
  validate,
  graphController.createShareLink
);

export default router;
