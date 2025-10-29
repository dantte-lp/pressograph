// ═══════════════════════════════════════════════════════════════════
// Graph Generation Controller
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { validateTestSettings } from '../services/validation.service';
import { generatePressureData } from '../utils/graphGenerator';
import { logger } from '../utils/logger';
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

/**
 * Export pressure test graph as PNG image
 * POST /api/graph/export/png
 *
 * Generates a PNG image of the pressure test graph with specified settings.
 * Uses server-side canvas rendering for high-quality exports.
 *
 * @param req.body.settings - TestSettings object
 * @param req.body.theme - Theme ('light' or 'dark', default: 'light')
 * @param req.body.scale - Rendering scale (1-4, default: 2 for high quality)
 * @param req.body.width - Canvas width in pixels (default: 1200)
 * @param req.body.height - Canvas height in pixels (default: 800)
 * @returns PNG file download or filename for later retrieval
 * @throws AppError 400 if validation fails
 * @throws AppError 500 for rendering or storage errors
 */
export const exportPNG = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const { settings, theme = 'light', scale = 2, width = 1200, height = 800 } = req.body;

    // Validate settings
    const validation = validateTestSettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validation.errors,
      });
    }

    // Validate export parameters
    if (scale < 1 || scale > 4) {
      throw new AppError('Scale must be between 1 and 4', 400);
    }
    if (width < 400 || width > 4000) {
      throw new AppError('Width must be between 400 and 4000 pixels', 400);
    }
    if (height < 300 || height > 3000) {
      throw new AppError('Height must be between 300 and 3000 pixels', 400);
    }

    logger.info('PNG export started', {
      testNumber: settings.testNumber,
      theme,
      scale,
      dimensions: `${width}x${height}`,
    });

    // Generate graph data
    const graphData = generatePressureData(settings);

    // Render graph to PNG buffer
    const { renderGraph } = await import('../utils/canvasRenderer');
    const pngBuffer = renderGraph(graphData, settings, {
      width,
      height,
      scale,
      theme: theme as 'light' | 'dark',
    });

    // Save to storage
    const { storageService } = await import('../services/storage.service');
    const filename = await storageService.saveFile(
      pngBuffer,
      'png',
      `graph-${settings.testNumber}`
    );

    const generationTime = Date.now() - startTime;

    logger.info('PNG export completed', {
      testNumber: settings.testNumber,
      filename,
      fileSize: pngBuffer.length,
      generationTimeMs: generationTime,
    });

    // Return download response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pngBuffer.length.toString());
    res.setHeader('X-Generation-Time-Ms', generationTime.toString());
    res.setHeader('X-File-Size', pngBuffer.length.toString());

    res.send(pngBuffer);
  } catch (error) {
    logger.error('PNG export failed', { error });
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
