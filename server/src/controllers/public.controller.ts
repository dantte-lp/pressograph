// ═══════════════════════════════════════════════════════════════════
// Public Controller (No Auth Required)
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const viewSharedGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    // Find share link
    const result = await query(
      `SELECT sl.*, gh.settings, gh.test_number, gh.export_format, gh.file_path, gh.created_at as graph_created_at
       FROM share_links sl
       JOIN graph_history gh ON sl.graph_id = gh.id
       WHERE sl.share_token = $1
         AND (sl.expires_at IS NULL OR sl.expires_at > CURRENT_TIMESTAMP)
         AND (sl.max_views IS NULL OR sl.view_count < sl.max_views)`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Share link not found or expired', 404);
    }

    const share = result.rows[0];

    // Increment view count
    await query(
      'UPDATE share_links SET view_count = view_count + 1 WHERE share_token = $1',
      [token]
    );

    // Log access
    await query(
      'INSERT INTO audit_log (action, details, ip_address) VALUES ($1, $2, $3)',
      ['public_graph_view', JSON.stringify({ token, graph_id: share.graph_id }), req.ip]
    );

    logger.info(`Public graph viewed via share link: ${token}`);

    res.json({
      success: true,
      graph: {
        id: share.graph_id,
        testNumber: share.test_number,
        settings: share.settings,
        createdAt: share.graph_created_at,
      },
      share: {
        viewCount: share.view_count + 1,
        maxViews: share.max_views,
        expiresAt: share.expires_at,
        allowDownload: share.allow_download,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadSharedGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    // Find share link
    const result = await query(
      `SELECT sl.*, gh.file_path, gh.export_format, gh.test_number
       FROM share_links sl
       JOIN graph_history gh ON sl.graph_id = gh.id
       WHERE sl.share_token = $1
         AND sl.allow_download = true
         AND (sl.expires_at IS NULL OR sl.expires_at > CURRENT_TIMESTAMP)
         AND (sl.max_views IS NULL OR sl.view_count < sl.max_views)`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Share link not found, expired, or download not allowed', 404);
    }

    const share = result.rows[0];

    // Log download
    await query(
      'INSERT INTO audit_log (action, details, ip_address) VALUES ($1, $2, $3)',
      ['public_graph_download', JSON.stringify({ token, graph_id: share.graph_id }), req.ip]
    );

    logger.info(`Public graph downloaded via share link: ${token}`);

    // TODO: Implement actual file download
    res.json({
      success: true,
      message: 'Download not yet implemented',
      filePath: share.file_path,
      format: share.export_format,
      testNumber: share.test_number,
    });
  } catch (error) {
    next(error);
  }
};

export const getShareInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT sl.view_count, sl.max_views, sl.expires_at, sl.allow_download, sl.created_at,
              gh.test_number, gh.export_format
       FROM share_links sl
       JOIN graph_history gh ON sl.graph_id = gh.id
       WHERE sl.share_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Share link not found', 404);
    }

    const info = result.rows[0];
    const isExpired = info.expires_at && new Date(info.expires_at) < new Date();
    const isMaxViewsReached = info.max_views && info.view_count >= info.max_views;

    res.json({
      success: true,
      info: {
        testNumber: info.test_number,
        format: info.export_format,
        viewCount: info.view_count,
        maxViews: info.max_views,
        expiresAt: info.expires_at,
        allowDownload: info.allow_download,
        createdAt: info.created_at,
        isExpired,
        isMaxViewsReached,
        isValid: !isExpired && !isMaxViewsReached,
      },
    });
  } catch (error) {
    next(error);
  }
};
