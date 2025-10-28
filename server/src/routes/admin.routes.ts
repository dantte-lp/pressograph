// ═══════════════════════════════════════════════════════════════════
// Admin Routes
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Graph History
router.get('/graphs', adminController.getGraphs);
router.get('/graphs/:id', adminController.getGraphById);
router.delete('/graphs/:id', adminController.deleteGraph);

// Analytics
router.get('/analytics/usage', adminController.getUsageAnalytics);
router.get('/analytics/performance', adminController.getPerformanceAnalytics);

// System
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', adminController.getSystemLogs);

export default router;
