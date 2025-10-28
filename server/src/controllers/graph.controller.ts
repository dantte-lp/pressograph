// ═══════════════════════════════════════════════════════════════════
// Graph Generation Controller
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { validateTestSettings } from '../services/validation.service';
import { generatePressureData } from '../utils/graphGenerator';
import type { TestSettings } from '../types';

/**
 * Generate pressure test graph data
 * POST /api/graph/generate
 *
 * Validates test settings and generates complete graph data with
 * all calculated pressure points over time.
 *
 * @param req.body - TestSettings object
 * @returns GraphData with calculated points, start and end timestamps
 * @throws AppError 400 if validation fails
 * @throws AppError 500 for unexpected errors
 */
export const generateGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings: TestSettings = req.body;
    const user = req.user!;

    // Validate settings before generation
    const validation = validateTestSettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validation.errors,
      });
    }

    // Generate graph data
    const graphData = generatePressureData(settings);

    // TODO: Store graph generation in history table
    // await query(
    //   'INSERT INTO graph_history (user_id, test_number, settings, data) VALUES ($1, $2, $3, $4)',
    //   [user.id, settings.testNumber, JSON.stringify(settings), JSON.stringify(graphData)]
    // );

    res.json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    next(error);
  }
};

export const exportPNG = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement PNG export using node-canvas
    throw new AppError('PNG export not yet implemented', 501);
  } catch (error) {
    next(error);
  }
};

export const exportPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement PDF export using PDFKit
    throw new AppError('PDF export not yet implemented', 501);
  } catch (error) {
    next(error);
  }
};

/**
 * Validate test settings without generating graph
 * POST /api/graph/validate
 *
 * Performs comprehensive validation of test settings and returns
 * detailed error information for frontend display.
 *
 * @param req.body - TestSettings object to validate
 * @returns ValidationResult with valid flag and errors array
 */
export const validateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings: TestSettings = req.body;

    // Validate settings
    const validation = validateTestSettings(settings);

    res.json({
      success: true,
      ...validation,
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT id, test_number, export_format, file_size, generation_time_ms, status, created_at
       FROM graph_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM graph_history WHERE user_id = $1',
      [user.id]
    );

    res.json({
      success: true,
      graphs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
};

export const createShareLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { graphId, expiresIn, maxViews, allowDownload = true } = req.body;

    // Verify graph belongs to user
    const graphResult = await query(
      'SELECT id FROM graph_history WHERE id = $1 AND user_id = $2',
      [graphId, user.id]
    );

    if (graphResult.rows.length === 0) {
      throw new AppError('Graph not found', 404);
    }

    // Generate unique token
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // Create share link
    const result = await query(
      `INSERT INTO share_links (share_token, graph_id, created_by, expires_at, max_views, allow_download)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [shareToken, graphId, user.id, expiresAt, maxViews, allowDownload]
    );

    const shareLink = result.rows[0];

    // Log creation
    await query(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'share_link_created', JSON.stringify({ graphId, shareToken }), req.ip]
    );

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const publicUrl = `${baseUrl}/share/${shareToken}`;

    res.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareToken,
        url: publicUrl,
        expiresAt: shareLink.expires_at,
        maxViews: shareLink.max_views,
        allowDownload: shareLink.allow_download,
        createdAt: shareLink.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
