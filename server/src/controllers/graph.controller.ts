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
    const { settings, theme = 'light', scale = 2, width = 1200, height = 800, comment } = req.body;

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

    // Save to graph history database
    const user = req.user!;
    await query(
      `INSERT INTO graph_history (user_id, test_number, settings, export_format, file_path, file_size, generation_time_ms, status, ip_address, user_agent, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user.id,
        settings.testNumber,
        JSON.stringify(settings),
        'png',
        filename,
        pngBuffer.length,
        generationTime,
        'success',
        req.ip,
        req.get('user-agent') || null,
        comment || null,
      ]
    );

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

/**
 * Export pressure test graph as PDF document
 * POST /api/graph/export/pdf
 *
 * Generates a PDF document with embedded PNG image of the graph.
 * Supports custom metadata and page sizing.
 *
 * @param req.body.settings - TestSettings object
 * @param req.body.theme - Theme ('light' or 'dark', default: 'light')
 * @param req.body.scale - Rendering scale (1-4, default: 2)
 * @param req.body.width - Canvas width in pixels (default: 1200)
 * @param req.body.height - Canvas height in pixels (default: 800)
 * @param req.body.pageSize - PDF page size ('A4', 'A3', 'Letter', default: 'A4')
 * @param req.body.metadata - PDF metadata (title, author, subject, keywords)
 * @returns PDF file download
 * @throws AppError 400 if validation fails
 * @throws AppError 500 for rendering or storage errors
 */
export const exportPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const {
      settings,
      theme = 'light',
      scale = 2,
      width = 1200,
      height = 800,
      pageSize = 'A4',
      metadata = {},
      comment,
    } = req.body;

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

    const validPageSizes = ['A4', 'A3', 'Letter', 'Legal'];
    if (!validPageSizes.includes(pageSize)) {
      throw new AppError(`Invalid page size. Must be one of: ${validPageSizes.join(', ')}`, 400);
    }

    logger.info('PDF export started', {
      testNumber: settings.testNumber,
      theme,
      scale,
      dimensions: `${width}x${height}`,
      pageSize,
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

    // Create PDF document with landscape orientation
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({
      size: pageSize,
      layout: 'landscape',
      margin: 50,
      info: {
        Title: metadata.title || `Pressure Test Graph - ${settings.testNumber}`,
        Author: metadata.author || 'Pressograph',
        Subject:
          metadata.subject || `Pressure Test ${settings.testNumber} - ${settings.graphTitle}`,
        Keywords: metadata.keywords || `pressure test, ${settings.testNumber}, graph`,
        Creator: 'Pressograph - Pressure Test Visualizer',
        Producer: 'Pressograph PDF Export',
        CreationDate: new Date(),
      },
    });

    // Collect PDF buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Get page dimensions
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

    // Calculate image dimensions to fit page while maintaining aspect ratio
    const imageAspectRatio = width / height;
    let imageWidth = pageWidth;
    let imageHeight = pageWidth / imageAspectRatio;

    if (imageHeight > pageHeight) {
      imageHeight = pageHeight;
      imageWidth = pageHeight * imageAspectRatio;
    }

    // Center image on page
    const x = doc.page.margins.left + (pageWidth - imageWidth) / 2;
    const y = doc.page.margins.top + (pageHeight - imageHeight) / 2;

    // Embed PNG image
    doc.image(pngBuffer, x, y, {
      width: imageWidth,
      height: imageHeight,
    });

    // Finalize PDF (footer removed per user request)
    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await pdfPromise;

    // Save to storage
    const { storageService } = await import('../services/storage.service');
    const filename = await storageService.saveFile(
      pdfBuffer,
      'pdf',
      `graph-${settings.testNumber}`
    );

    const generationTime = Date.now() - startTime;

    // Save to graph history database
    const user = req.user!;
    await query(
      `INSERT INTO graph_history (user_id, test_number, settings, export_format, file_path, file_size, generation_time_ms, status, ip_address, user_agent, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user.id,
        settings.testNumber,
        JSON.stringify(settings),
        'pdf',
        filename,
        pdfBuffer.length,
        generationTime,
        'success',
        req.ip,
        req.get('user-agent') || null,
        comment || null,
      ]
    );

    logger.info('PDF export completed', {
      testNumber: settings.testNumber,
      filename,
      fileSize: pdfBuffer.length,
      generationTimeMs: generationTime,
      pageSize,
    });

    // Return download response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('X-Generation-Time-Ms', generationTime.toString());
    res.setHeader('X-File-Size', pdfBuffer.length.toString());

    res.send(pdfBuffer);
  } catch (error) {
    logger.error('PDF export failed', { error });
    next(error);
  }
};

/**
 * Export pressure test graph as JSON data
 * POST /api/graph/export/json
 *
 * Exports the graph settings and generated data as a JSON file.
 * Useful for data analysis, archiving, or importing into other tools.
 *
 * @param req.body.settings - TestSettings object
 * @param req.body.comment - Optional comment to save with the graph
 * @returns JSON file download
 * @throws AppError 400 if validation fails
 * @throws AppError 500 for unexpected errors
 */
export const exportJSON = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const { settings, comment } = req.body;

    // Validate settings
    const validation = validateTestSettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validation.errors,
      });
    }

    logger.info('JSON export started', {
      testNumber: settings.testNumber,
    });

    // Generate graph data
    const graphData = generatePressureData(settings);

    // Create JSON export object
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      graphData,
      comment: comment || null,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');

    // Save to storage
    const { storageService } = await import('../services/storage.service');
    const filename = await storageService.saveFile(
      jsonBuffer,
      'json',
      `graph-${settings.testNumber}`
    );

    const generationTime = Date.now() - startTime;

    // Save to graph history database
    const user = req.user!;
    await query(
      `INSERT INTO graph_history (user_id, test_number, settings, export_format, file_path, file_size, generation_time_ms, status, ip_address, user_agent, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user.id,
        settings.testNumber,
        JSON.stringify(settings),
        'json',
        filename,
        jsonBuffer.length,
        generationTime,
        'success',
        req.ip,
        req.get('user-agent') || null,
        comment || null,
      ]
    );

    logger.info('JSON export completed', {
      testNumber: settings.testNumber,
      filename,
      fileSize: jsonBuffer.length,
      generationTimeMs: generationTime,
    });

    // Return download response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', jsonBuffer.length.toString());
    res.setHeader('X-Generation-Time-Ms', generationTime.toString());
    res.setHeader('X-File-Size', jsonBuffer.length.toString());

    res.send(jsonBuffer);
  } catch (error) {
    logger.error('JSON export failed', { error });
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
    const search = (req.query.search as string) || '';
    const format = (req.query.format as string) || '';
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build WHERE clause with filters
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [user.id];
    let paramIndex = 2;

    // Search filter (by ID, test_number or comment)
    if (search) {
      // Strip leading "#" for ID search (users often type #9 instead of 9)
      const cleanSearch = search.replace(/^#/, '');
      const searchParam = `%${search}%`;

      // If search looks like a number (with or without #), try exact ID match first
      if (/^\d+$/.test(cleanSearch)) {
        conditions.push(
          `(id = $${paramIndex} OR test_number ILIKE $${paramIndex + 1} OR comment ILIKE $${paramIndex + 1})`
        );
        params.push(parseInt(cleanSearch, 10));
        params.push(searchParam);
        paramIndex += 2;
      } else {
        // Text search only
        conditions.push(`(test_number ILIKE $${paramIndex} OR comment ILIKE $${paramIndex})`);
        params.push(searchParam);
        paramIndex++;
      }
    }

    // Format filter
    if (format && format !== 'all') {
      conditions.push(`export_format = $${paramIndex}`);
      params.push(format);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Validate sort column
    const validSortColumns = ['created_at', 'test_number', 'export_format', 'file_size'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Query with filters and sorting
    const result = await query(
      `SELECT id, test_number, settings, export_format, file_path, file_size, generation_time_ms, status, created_at, comment
       FROM graph_history
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Count with same filters
    const countResult = await query(
      `SELECT COUNT(*) FROM graph_history WHERE ${whereClause}`,
      params
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
    const graphResult = await query('SELECT id FROM graph_history WHERE id = $1 AND user_id = $2', [
      graphId,
      user.id,
    ]);

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

/**
 * Delete a graph from history
 * DELETE /api/v1/graph/history/:id
 *
 * Deletes the graph record and associated file from storage.
 * Verifies ownership before deletion.
 *
 * @param req.params.id - Graph ID to delete
 * @throws AppError 404 if graph not found or not owned by user
 * @throws AppError 500 for unexpected errors
 */
export const deleteGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const graphId = parseInt(req.params.id);

    if (isNaN(graphId)) {
      throw new AppError('Invalid graph ID', 400);
    }

    // Verify graph belongs to user and get file path
    const graphResult = await query(
      'SELECT id, file_path, test_number FROM graph_history WHERE id = $1 AND user_id = $2',
      [graphId, user.id]
    );

    if (graphResult.rows.length === 0) {
      throw new AppError('Graph not found', 404);
    }

    const graph = graphResult.rows[0];

    // Delete file from storage if it exists
    if (graph.file_path) {
      try {
        const { storageService } = await import('../services/storage.service');
        await storageService.deleteFile(graph.file_path);
        logger.info(`Deleted file: ${graph.file_path}`);
      } catch (error) {
        logger.warn(`Failed to delete file: ${graph.file_path}`, error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await query('DELETE FROM graph_history WHERE id = $1', [graphId]);

    // Log deletion
    await query(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'graph_deleted', JSON.stringify({ graphId, testNumber: graph.test_number }), req.ip]
    );

    logger.info(`Graph deleted`, { graphId, testNumber: graph.test_number, userId: user.id });

    res.json({
      success: true,
      message: 'Graph deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update comment for a graph
 * PATCH /api/v1/graph/history/:id/comment
 *
 * Updates the comment field for a graph in history.
 * Verifies ownership before updating.
 *
 * @param req.params.id - Graph ID to update
 * @param req.body.comment - New comment text
 * @throws AppError 404 if graph not found or not owned by user
 * @throws AppError 500 for unexpected errors
 */
export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const graphId = parseInt(req.params.id);
    const { comment } = req.body;

    if (isNaN(graphId)) {
      throw new AppError('Invalid graph ID', 400);
    }

    // Verify graph belongs to user
    const graphResult = await query(
      'SELECT id, test_number FROM graph_history WHERE id = $1 AND user_id = $2',
      [graphId, user.id]
    );

    if (graphResult.rows.length === 0) {
      throw new AppError('Graph not found', 404);
    }

    // Update comment
    await query('UPDATE graph_history SET comment = $1 WHERE id = $2', [comment, graphId]);

    logger.info(`Comment updated`, { graphId, userId: user.id });

    res.json({
      success: true,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a graph file from history
 * GET /api/v1/graph/history/:id/download
 *
 * Serves the graph file for download. Verifies ownership and logs the action.
 *
 * @param req.params.id - Graph ID to download
 * @throws AppError 404 if graph not found or not owned by user
 * @throws AppError 404 if file not found in storage
 * @throws AppError 500 for unexpected errors
 */
export const downloadGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const graphId = parseInt(req.params.id);

    if (isNaN(graphId)) {
      throw new AppError('Invalid graph ID', 400);
    }

    // Verify graph belongs to user
    const graphResult = await query(
      `SELECT id, file_path, export_format, test_number, file_size
       FROM graph_history
       WHERE id = $1 AND user_id = $2`,
      [graphId, user.id]
    );

    if (graphResult.rows.length === 0) {
      throw new AppError('Graph not found', 404);
    }

    const graph = graphResult.rows[0];

    if (!graph.file_path) {
      throw new AppError('File not available for this graph', 404);
    }

    // Read file from storage
    const { storageService } = await import('../services/storage.service');
    const fileBuffer = await storageService.readFile(graph.file_path);

    // Log download
    await query(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [
        user.id,
        'graph_downloaded',
        JSON.stringify({ graphId, testNumber: graph.test_number }),
        req.ip,
      ]
    );

    logger.info(`Graph downloaded`, { graphId, testNumber: graph.test_number, userId: user.id });

    // Set appropriate content type
    const contentType =
      graph.export_format === 'png'
        ? 'image/png'
        : graph.export_format === 'pdf'
          ? 'application/pdf'
          : graph.export_format === 'json'
            ? 'application/json'
            : 'application/octet-stream';

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${graph.file_path}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());

    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate a graph from history with new format or theme
 * POST /api/v1/graph/history/:id/regenerate
 *
 * Re-exports an existing graph with updated settings (format, theme).
 * Useful for applying font fixes to old graphs or exporting in different formats.
 *
 * @param req.params.id - Graph ID to regenerate
 * @param req.body.format - Export format ('png', 'pdf', 'json')
 * @param req.body.theme - Theme ('light' or 'dark', optional, default from original)
 * @param req.body.scale - Rendering scale (optional, default: 4)
 * @throws AppError 404 if graph not found or not owned by user
 * @throws AppError 400 if invalid format or parameters
 * @throws AppError 500 for unexpected errors
 */
export const regenerateGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const user = req.user!;
    const graphId = parseInt(req.params.id);
    const { format = 'png', theme = 'light', scale = 4, width = 1200, height = 800 } = req.body;

    if (isNaN(graphId)) {
      throw new AppError('Invalid graph ID', 400);
    }

    // Validate format
    const validFormats = ['png', 'pdf', 'json'];
    if (!validFormats.includes(format)) {
      throw new AppError(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400);
    }

    // Verify graph belongs to user and get original settings
    const graphResult = await query(
      `SELECT id, settings, test_number, comment
       FROM graph_history
       WHERE id = $1 AND user_id = $2`,
      [graphId, user.id]
    );

    if (graphResult.rows.length === 0) {
      throw new AppError('Graph not found', 404);
    }

    const originalGraph = graphResult.rows[0];
    const settings: TestSettings = originalGraph.settings;

    logger.info('Graph regeneration started', {
      graphId,
      testNumber: settings.testNumber,
      format,
      theme,
    });

    // Validate settings
    const validation = validateTestSettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validation.errors,
      });
    }

    let buffer: Buffer;
    let filename: string;
    const { storageService } = await import('../services/storage.service');

    // Generate based on format
    if (format === 'png') {
      // Generate graph data and render PNG
      const graphData = generatePressureData(settings);
      const { renderGraph } = await import('../utils/canvasRenderer');
      buffer = renderGraph(graphData, settings, {
        width,
        height,
        scale,
        theme: theme as 'light' | 'dark',
      });
      filename = await storageService.saveFile(buffer, 'png', `graph-${settings.testNumber}`);
    } else if (format === 'pdf') {
      // Generate graph data and render PDF
      const graphData = generatePressureData(settings);
      const { renderGraph } = await import('../utils/canvasRenderer');
      const pngBuffer = renderGraph(graphData, settings, {
        width,
        height,
        scale,
        theme: theme as 'light' | 'dark',
      });

      // Create PDF with embedded PNG
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
        info: {
          Title: `Pressure Test Graph - ${settings.testNumber}`,
          Author: 'Pressograph',
          Subject: `Pressure Test ${settings.testNumber} - ${settings.graphTitle}`,
          Creator: 'Pressograph - Pressure Test Visualizer',
          Producer: 'Pressograph PDF Export',
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

      const imageAspectRatio = width / height;
      let imageWidth = pageWidth;
      let imageHeight = pageWidth / imageAspectRatio;

      if (imageHeight > pageHeight) {
        imageHeight = pageHeight;
        imageWidth = pageHeight * imageAspectRatio;
      }

      const x = doc.page.margins.left + (pageWidth - imageWidth) / 2;
      const y = doc.page.margins.top + (pageHeight - imageHeight) / 2;

      doc.image(pngBuffer, x, y, { width: imageWidth, height: imageHeight });
      doc.end();

      buffer = await pdfPromise;
      filename = await storageService.saveFile(buffer, 'pdf', `graph-${settings.testNumber}`);
    } else {
      // JSON export
      const graphData = generatePressureData(settings);
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        graphData,
        comment: originalGraph.comment || null,
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      buffer = Buffer.from(jsonString, 'utf-8');
      filename = await storageService.saveFile(buffer, 'json', `graph-${settings.testNumber}`);
    }

    const generationTime = Date.now() - startTime;

    // Save new version to graph history
    await query(
      `INSERT INTO graph_history (user_id, test_number, settings, export_format, file_path, file_size, generation_time_ms, status, ip_address, user_agent, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user.id,
        settings.testNumber,
        JSON.stringify(settings),
        format,
        filename,
        buffer.length,
        generationTime,
        'success',
        req.ip,
        req.get('user-agent') || null,
        originalGraph.comment || null,
      ]
    );

    logger.info('Graph regeneration completed', {
      graphId,
      testNumber: settings.testNumber,
      format,
      filename,
      fileSize: buffer.length,
      generationTimeMs: generationTime,
    });

    // Set appropriate content type
    const contentType =
      format === 'png' ? 'image/png' : format === 'pdf' ? 'application/pdf' : 'application/json';

    // Return download response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('X-Generation-Time-Ms', generationTime.toString());
    res.setHeader('X-File-Size', buffer.length.toString());

    res.send(buffer);
  } catch (error) {
    logger.error('Graph regeneration failed', { error });
    next(error);
  }
};
