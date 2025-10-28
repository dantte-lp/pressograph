// ═══════════════════════════════════════════════════════════════════
// Setup Controller
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { query, testConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const getSetupStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if any users exist
    const result = await query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);

    // Get PostgreSQL version and connection info
    const versionResult = await query('SELECT version()');
    const postgresVersion = versionResult.rows[0].version;

    // Get database name and user
    const dbInfoResult = await query('SELECT current_database(), current_user');
    const dbName = dbInfoResult.rows[0].current_database;
    const dbUser = dbInfoResult.rows[0].current_user;

    // Parse DATABASE_URL properly
    let dbHost = 'localhost';
    let dbPort = '5432';
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbHost = url.hostname;
        dbPort = url.port || '5432';
      } catch (e) {
        // If parsing fails, keep defaults
      }
    }

    // Get schema information
    const schemaResult = await query(`
      SELECT
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = schemaResult.rows.map(row => row.tablename);

    // Get total rows count across all tables
    let totalRows = 0;
    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) FROM ${table}`);
        totalRows += parseInt(countResult.rows[0].count);
      } catch (e) {
        // Skip tables we can't count
      }
    }

    // Get database size
    const dbSizeResult = await query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
    const dbSize = dbSizeResult.rows[0].size;

    // Get schema version (from app_settings or migrations table if exists)
    let schemaVersion = 'initial';
    try {
      const versionResult = await query(`SELECT value FROM app_settings WHERE key = 'schema_version'`);
      if (versionResult.rows.length > 0) {
        schemaVersion = JSON.parse(versionResult.rows[0].value);
      }
    } catch (e) {
      // If no version found, keep 'initial'
    }

    res.json({
      success: true,
      initialized: userCount > 0,
      userCount,
      database: {
        version: postgresVersion,
        name: dbName,
        user: dbUser,
        host: dbHost,
        port: dbPort,
      },
      schema: {
        tables: tables,
        tableCount: tables.length,
        totalRows: totalRows,
        size: dbSize,
        version: schemaVersion,
      }
    });
  } catch (error) {
    // If table doesn't exist, not initialized
    try {
      // Still try to get database info even if tables don't exist
      const versionResult = await query('SELECT version()');
      const postgresVersion = versionResult.rows[0].version;

      const dbInfoResult = await query('SELECT current_database(), current_user');
      const dbName = dbInfoResult.rows[0].current_database;
      const dbUser = dbInfoResult.rows[0].current_user;

      // Parse DATABASE_URL properly
      let dbHost = 'localhost';
      let dbPort = '5432';
      if (process.env.DATABASE_URL) {
        try {
          const url = new URL(process.env.DATABASE_URL);
          dbHost = url.hostname;
          dbPort = url.port || '5432';
        } catch (e) {
          // If parsing fails, keep defaults
        }
      }

      res.json({
        success: true,
        initialized: false,
        userCount: 0,
        database: {
          version: postgresVersion,
          name: dbName,
          user: dbUser,
          host: dbHost,
          port: dbPort,
        },
        schema: {
          tables: [],
          tableCount: 0,
          totalRows: 0,
          size: '0 bytes',
          version: 'none',
        }
      });
    } catch (dbError) {
      res.json({
        success: true,
        initialized: false,
        userCount: 0,
        database: null,
        schema: null,
      });
    }
  }
};

export const initialize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { admin, application } = req.body;

    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new AppError('Cannot connect to database', 500);
    }

    // Check if users table exists and has any users
    const statusResult = await query('SELECT COUNT(*) FROM users').catch(() => null);
    if (statusResult && parseInt(statusResult.rows[0].count) > 0) {
      throw new AppError('Application already initialized', 400);
    }

    // Run migrations only if users table doesn't exist
    if (!statusResult) {
      const migrationsPath = path.join(__dirname, '../../migrations/1_initial_schema.sql');
      if (fs.existsSync(migrationsPath)) {
        const migrationSQL = fs.readFileSync(migrationsPath, 'utf8');
        await query(migrationSQL);
        logger.info('Database schema created');
      }
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(admin.password, 10);

    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, username, email, role`,
      [admin.username, admin.email, passwordHash]
    );

    const user = userResult.rows[0];

    // Insert application settings
    if (application) {
      const settings = {
        siteName: application.siteName || 'Pressure Test Visualizer',
        timezone: application.timezone || 'Europe/Moscow',
        defaultLanguage: application.defaultLanguage || 'ru',
      };

      for (const [key, value] of Object.entries(settings)) {
        await query(
          'INSERT INTO app_settings (key, value) VALUES ($1, $2)',
          [key, JSON.stringify(value)]
        );
      }
    }

    // Generate admin token
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    };

    // @ts-ignore - JWT expiresIn type mismatch with string
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Log setup
    await query(
      'INSERT INTO audit_log (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'app_initialized', JSON.stringify({ admin: admin.username }), req.ip]
    );

    logger.info(`Application initialized by ${admin.username}`);

    res.json({
      success: true,
      message: 'Application successfully initialized',
      adminToken: token,
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
