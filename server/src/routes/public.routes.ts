// ═══════════════════════════════════════════════════════════════════
// Public Routes (No Authentication Required)
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

// GET /api/v1/public/share/:token - View shared graph
router.get('/share/:token', publicController.viewSharedGraph);

// GET /api/v1/public/share/:token/download - Download shared graph
router.get('/share/:token/download', publicController.downloadSharedGraph);

// GET /api/v1/public/share/:token/info - Get share info
router.get('/share/:token/info', publicController.getShareInfo);

export default router;
